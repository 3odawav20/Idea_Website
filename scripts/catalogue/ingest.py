#!/usr/bin/env python3
"""IDEA source-led, fail-closed public catalogue ingestion preflight.
Public pages/API only. No bypasses, no credentials, no production mutations.
Source imagery is NOT licensed merely because its URL is public.
"""
from __future__ import annotations
import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from io import BytesIO
import hashlib
import json
from pathlib import Path
import re
import time
from urllib.parse import urlparse, urljoin, urlencode
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
CATALOGUE = ROOT / "docs" / "catalogue" / "supplier-qa-2026-11-03"
SOURCES = json.loads((Path(__file__).with_name("approved-sources.json")).read_text("utf-8"))["sources"]
BLOCKED_PLATFORM = {"instagram.com", "facebook.com"}
NON_MATERIAL_ENTRYPOINT = {"source-28", "source-31", "source-32", "source-34", "source-35", "source-39", "source-40"}
UA = "IDEA-Catalogue-QA/1.0 (+human-reviewed; no-login; limited-product-discovery)"
FETCH_LIMIT = 2_500_000
TIMEOUT = (5, 13)

def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")

def host(url):
    return urlparse(url).netloc.lower().removeprefix("www.")

def http_get(url, *, limit=FETCH_LIMIT, accept="text/html,application/json"):
    if not url.startswith(("http://", "https://")):
        raise ValueError("Only HTTP(S) URLs are allowed")
    response = requests.get(url, timeout=TIMEOUT, headers={"User-Agent":UA, "Accept":accept}, stream=True, allow_redirects=True)
    try:
        blob = bytearray()
        for chunk in response.iter_content(64 * 1024):
            blob.extend(chunk)
            if len(blob) > limit:
                raise ValueError("response_exceeds_limit")
        return response.status_code, response.url, response.headers.get("Content-Type",""), bytes(blob)
    finally:
        response.close()

def robots_check(url):
    # Fail closed when an explicitly disallowed path is reported.
    origin = urlparse(url)
    robot_url = f"{origin.scheme}://{origin.netloc}/robots.txt"
    try:
        status, _, _, data = http_get(robot_url,limit=200_000)
        if status == 200:
            rp = RobotFileParser()
            rp.parse(data.decode("utf-8","replace").splitlines())
            if not rp.can_fetch(UA, url):
                return False, "robots_disallow"
        return True, None
    except Exception:
        return None, "robots_unverifiable"

def discovery(entry):
    result = {"source_id":entry["source_id"],"name":entry["name"],
              "input_url":entry["url"],"checked_at":now(),"http_status":None,
              "final_url":None,"title":None,"adapter":None,"status":"unchecked",
              "reason":None,"claimed_products":0}
    if host(entry["url"]) in BLOCKED_PLATFORM:
        result.update(status="not_crawlable",reason="login/social source: no login or CAPTCHA bypass")
        return result
    if entry["source_id"] in NON_MATERIAL_ENTRYPOINT:
        result.update(status="out_of_scope_entrypoint",reason="supplied URL is for non-tile products or non-material service")
        return result
    can, why = robots_check(entry["url"])
    if can is False:
        result.update(status="blocked",reason=why)
        return result
    if can is None:
        result.update(status="needs_robots_review",reason=why)
        return result
    try:
        status,url,content_type,body = http_get(entry["url"],limit=5_000_000)
        result.update(http_status=status, final_url=url,content_type=content_type)
        if status in (401,403,429):
            result.update(status="blocked",reason=f"HTTP {status}; not bypassed")
        elif status >= 400:
            result.update(status="failed",reason=f"HTTP {status}")
        elif not ("html" in content_type or "json" in content_type):
            result.update(status="unsupported",reason=f"content type {content_type}")
        else:
            soup=BeautifulSoup(body,"html.parser")
            result["title"]=soup.title.get_text(" ",strip=True)[:160] if soup.title else None
            raw=body[:200_000].lower()
            if b"shopify" in raw or b"cdn.shopify.com" in raw:
                result["adapter"]="shopify"
            elif b"woocommerce" in raw or b"wp-content/" in raw or b"wp-json" in raw:
                result["adapter"]="woocommerce"
            elif b"application/ld+json" in raw:
                result["adapter"]="json-ld"
            else:
                result["adapter"]="html/browser-review"
            result["status"]="accessible"
            if host(url)!=host(entry["url"]):
                result["reason"]="redirected_to_different_host_review"
    except Exception as exc:
        result.update(status="failed",reason=type(exc).__name__ + ": " + str(exc)[:140])
    return result

def sizes_from(title, description):
    text=BeautifulSoup(description or "", "html.parser").get_text(" ",strip=True) if description else ""
    match = re.search(r"(?<!\d)(\d{2,3}(?:\.\d+)?)\s*(?:x|×|\*)\s*(\d{2,3}(?:\.\d+)?)\s*(?:cm|سم|سنتيمتر)?(?!\d)", title+" "+text,flags=re.I)
    if not match:
        return None
    a,b=float(match[1]),float(match[2])
    if a>320 or b>320 or a<5 or b<5:
        return None
    return {"width_cm":a,"height_cm":b,"label":f"{a:g} × {b:g} cm","original_match":match[0]}

def material_from(product_type,tags,body,title):
    # Material category must come from supplier *classification*, never from looks/style.
    declared = " ".join([product_type or "", " ".join(tags or [])]).lower()
    if re.search(r"\b(?:toilet|basin|sink|bathtub|bath tub|faucet|shower|tap)\b|مغسلة|خلاط|بانيو|حوض",product_type or "",flags=re.I):
        return None
    if re.search(r"porcelain|porcelane|بورسلين",declared):
        return "porcelain"
    if re.search(r"ceramic|سيراميك",declared):
        return "ceramics"
    # Natural marble requires affirmative material proof, not "marble effect".
    if re.search(r"natural marble|رخام طبيعي",declared) and not re.search(r"effect|look|imitation|شكل",declared):
        return "natural_marble"
    if re.search(r"tile|بلاط", declared):
        return "tiles"
    return None

def product_from_shopify(raw, source):
    title=(raw.get("title") or "").strip()
    handle=(raw.get("handle") or "").strip()
    tags=raw.get("tags",[])
    if isinstance(tags,str): tags=[v.strip() for v in tags.split(",")]
    variants=raw.get("variants") or []
    # Vendor can be retailer: do not infer manufacturer.
    material=material_from(raw.get("product_type",""),tags,raw.get("body_html"),title)
    images=[x.get("src") for x in raw.get("images",[]) if isinstance(x,dict) and x.get("src")]
    size=sizes_from(title,raw.get("body_html"))
    sku=next((v.get("sku") for v in variants if v.get("sku")),None)
    page=urljoin("https://"+host(source["url"])+"/","products/"+handle) if handle else None
    flags=[]
    if not title or not material or not size or not sku or not images or not page:
        flags.append("missing_required_product_evidence")
    if raw.get("vendor"): flags.append("vendor_is_not_manufacturer_proof")
    flags.extend(["image_requires_face_only_review","image_rights_unconfirmed","product_page_not_yet_http_verified"])
    unique=hashlib.sha256((source["source_id"]+"|"+str(raw.get("id"))).encode()).hexdigest()[:14]
    return {"idea_staging_id":"IDEA-QA-"+unique,"source_id":source["source_id"],
        "source_url":source["url"],"product_url":page,"source_product_id":str(raw.get("id") or ""),
        "name":title,"retailer_vendor":raw.get("vendor") or None,
        "manufacturer":None,"supplier_category":raw.get("product_type") or None,
        "material":material,"size":size,"sku":sku,"source_image_urls":list(dict.fromkeys(images)),
        "variant_count":len(variants),"flags":flags,"stage":"QUARANTINE","approved":False,
        "publicly_live":False,"price":None}
def verify_image(url, max_size=8_000_000):
    try:
        code, final, ct, data=http_get(url,limit=max_size,accept="image/avif,image/webp,image/png,image/jpeg")
        if code!=200: return {"ok":False,"reason":f"HTTP {code}"}
        if not ct.lower().startswith("image/"):return {"ok":False,"reason":"not_image_content_type"}
        with Image.open(BytesIO(data)) as im:
            im.verify()
        with Image.open(BytesIO(data)) as im:
            width,height=im.size
            fmt=im.format
        area=width*height
        is_good=width>=500 and height>=500 and area>=400_000 and 0.25<=width/height<=4.0
        return {"ok":is_good,"reason":None if is_good else "low_resolution_or_bad_aspect",
            "width":width,"height":height,"bytes":len(data),
            "media_type":ct,"format":fmt,"sha256":hashlib.sha256(data).hexdigest(),"url":final}
    except Exception as exc:
        return {"ok":False,"reason":type(exc).__name__+":"+str(exc)[:80]}

def extract_shopify(source, max_pages=2, limit=250, verify_count=6):
    # Only collection-scoped public JSON endpoint, never private Storefront/admin API.
    if source["source_id"]=="source-08":
        base="https://abaelmozahem.com/collections/ceramic/products.json"
    else:
        base="https://"+host(source["url"])+"/products.json"
    entries=[];errors=[];seen=set()
    allowed,why=robots_check(base)
    if allowed is not True:
        return [],[why or "robots_approval_missing"]
    for page in range(1,max_pages+1):
        url=base+"?"+urlencode({"limit":min(limit,250),"page":page})
        try:
            status,_,ct,body=http_get(url,limit=5_000_000,accept="application/json")
            if status!=200: errors.append(f"page={page}:HTTP_{status}");break
            raw=json.loads(body)
            batch=raw.get("products",[])
            if not isinstance(batch,list):errors.append("products_not_array");break
            for row in batch:
                pid=str(row.get("id") or "")
                if not pid or pid in seen: continue
                seen.add(pid);entries.append(product_from_shopify(row,source))
            if len(batch)<min(limit,250):break
            time.sleep(.3)
        except Exception as exc:
            errors.append(f"page={page}:{type(exc).__name__}:{str(exc)[:100]}")
            break
    for row in entries[:verify_count]:
        if row["source_image_urls"]:
            row["image_technical_qa"]=verify_image(row["source_image_urls"][0])
            if not row["image_technical_qa"]["ok"]:
                row["flags"].append("image_technical_qa_failed")
    return entries,errors

def write_json(path,obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--mode",choices=["baseline","discover","shopify","all"],default="all")
    parser.add_argument("--workers",type=int,default=5)
    parser.add_argument("--max-pages",type=int,default=2)
    parser.add_argument("--limit",type=int,default=250)
    parser.add_argument("--verify-count",type=int,default=8)
    args=parser.parse_args()
    existing=json.loads((ROOT/"src/app/data/sourceRegistry.json").read_text("utf-8"))
    old_counts={x["source_id"]:x.get("product_count",0) or 0 for x in existing["sources"]}
    art=json.loads((ROOT/"src/app/data/artceramic.json").read_text("utf-8"))
    baseline={"checked_at":now(),"source_count":len(SOURCES),"embedded_art_ceramic":len(art),
        "existing_registry_extracted_sum_not_verified":sum(old_counts.values()),
        "source_counts_from_old_registry":old_counts,"technical_qa_new":0,"approved_new":0,
        "production_live_new":0,"targets_each":{"ceramics":2000,"porcelain":2000,"tiles":2000,"natural_marble":2000},
        "note":"Old registry counts and on-page imports are not publication or materials certification. 4 target groups are mutually exclusive."}
    write_json(CATALOGUE/"baseline.json",baseline)
    print("BASELINE",{"art":len(art),"old_registry_extracted":sum(old_counts.values()),"40_sources":len(SOURCES)})
    if args.mode=="baseline":return
    # Duplicate canonical hosts do not trigger repeated site fetches.
    dedup={};results=[]
    for s in SOURCES:
        if s["source_id"] in ("source-19","source-30","source-38"):
            original={"source-19":"source-10","source-30":"source-24","source-38":"source-21"}[s["source_id"]]
            results.append({"source_id":s["source_id"],"name":s["name"],"input_url":s["url"],
                "status":"duplicate_provider","canonical_source_id":original,"checked_at":now()})
            continue
        dedup[s["source_id"]]=s
    if args.mode=="shopify" and (CATALOGUE/"source-diagnostics.json").exists():
        results=json.loads((CATALOGUE/"source-diagnostics.json").read_text("utf-8"))
        print("REUSE_SAVED_DISCOVERY",len(results))
    else:
        with ThreadPoolExecutor(max_workers=min(8,max(1,args.workers))) as pool:
            tasks={pool.submit(discovery,s):s for s in dedup.values()}
            for task in as_completed(tasks):
                results.append(task.result())
    results.sort(key=lambda x:x["source_id"])
    write_json(CATALOGUE/"source-diagnostics.json",results)
    status=Counter(x["status"] for x in results)
    print("DISCOVERY",dict(status))
    if args.mode=="discover":return
    products=[]; extraction_diagnostics=[]
    allowed_ids={"source-08","source-05","source-22"}
    for source in SOURCES:
        if source["source_id"] not in allowed_ids:continue
        diagnostic=next((r for r in results if r["source_id"]==source["source_id"]),{})
        if diagnostic.get("status")!="accessible":
            extraction_diagnostics.append({"source_id":source["source_id"],"status":"skipped", "reason":"source_not_accessible"})
            continue
        if source["source_id"] in ("source-05","source-22"):
            from woo_adapter import extract as extract_woo
            entries,errors=extract_woo(source,per_page=min(45,max(1,args.limit)),
                pages=min(2,max(1,args.max_pages)),details=18,verify_count=max(0,min(12,args.verify_count)))
        else:
            entries,errors=extract_shopify(source,max_pages=max(1,min(6,args.max_pages)),
                limit=max(1,min(250,args.limit)),verify_count=max(0,min(30,args.verify_count)))
        products.extend(entries)
        extraction_diagnostics.append({"source_id":source["source_id"],"status":"quarantined",
            "extracted":len(entries),"material_tally":dict(Counter(p["material"] for p in entries)),
            "photo_checks":sum(bool(p.get("image_technical_qa",{}).get("ok")) for p in entries),
            "errors":errors})
    # All extraction is staging/quarantine. No third-party images copied or republished.
    write_json(CATALOGUE/"quarantine-products.json",products)
    write_json(CATALOGUE/"extraction-diagnostics.json",extraction_diagnostics)
    tally=dict(Counter(str(x.get("material")) for x in products))
    summary={"generated_at":now(),"sources_exact":len(SOURCES),"new_extracted":len(products),
        "new_technically_image_checked":sum("image_technical_qa" in x for x in products),
        "new_images_passing_technical_only":sum(x.get("image_technical_qa",{}).get("ok",False) for x in products),
        "new_visually_approved":0,"new_rights_approved":0,"new_approved":0,
        "new_staging_live":0,"new_production_live":0,"new_material_tally_unapproved":tally,
        "claims_8000_goal_met":False,"status":"FAIL_CLOSED_QUARANTINE_NOT_PUBLIC"}
    write_json(CATALOGUE/"report.json",summary)
    print("EXTRACT",json.dumps(summary,ensure_ascii=False))

if __name__=="__main__":
    main()
