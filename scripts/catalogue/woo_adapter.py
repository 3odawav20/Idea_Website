"""WooCommerce Store API public product records → IDEA quarantine only."""
import hashlib
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from html import unescape
from urllib.parse import urlencode
from bs4 import BeautifulSoup
from ingest import http_get, robots_check, verify_image, sizes_from, material_from

def from_woo(raw, source, detail=None):
    title=unescape((raw.get("name") or "").strip())
    page=raw.get("permalink")
    detail=detail or {}
    category_text=" ".join(unescape(cat.get("name") or "") for cat in raw.get("categories",[]) if isinstance(cat,dict))
    material=material_from(category_text,[],None,title) or detail.get("material")
    size=sizes_from(title,raw.get("description","")) or detail.get("size")
    sku=raw.get("sku") or None
    images=[img.get("src") for img in raw.get("images",[]) if isinstance(img,dict) and img.get("src")]
    flags=["image_requires_face_only_review","image_rights_unconfirmed"]
    if not all([title,page,material,size,sku,images]):
        flags.append("missing_required_product_evidence")
    if detail.get("error"):
        flags.append("product_page_qa_failed")
    key=hashlib.sha256((source["source_id"]+"|"+str(raw.get("id"))).encode()).hexdigest()[:14]
    return {
        "idea_staging_id":"IDEA-QA-"+key,"source_id":source["source_id"],
        "source_url":source["url"],"product_url":page,"source_product_id":str(raw.get("id") or ""),
        "name":title,"retailer_vendor":source["name"],"manufacturer":None,
        "supplier_category":category_text or detail.get("supplier_category"),"material":material,
        "size":size,"sku":sku,"source_image_urls":list(dict.fromkeys(images)),
        "variant_count":len(raw.get("variations") or []),"flags":flags,
        "product_page_qa":detail,"stage":"QUARANTINE","approved":False,"publicly_live":False,"price":None,
    }

def page_qa(item):
    page=item.get("permalink")
    if not page:
        return {"error":"missing_permalink"}
    allow,why=robots_check(page)
    if allow is not True:
        return {"error":why or "robots_unverified"}
    try:
        status, final, ct, body=http_get(page,limit=3_500_000)
        if status!=200 or "html" not in ct:
            return {"error":f"HTTP {status} type {ct}"}
        html=BeautifulSoup(body,"html.parser")
        for bad in html(["script","style","nav","footer","header"]):
            bad.decompose()
        text=html.get_text(" ",strip=True)
        # Capture only source page claims, without prices or broad inference.
        match=__import__("re").search(r"\b(?:Porcelain\s*stoneware|porcelain|ceramic\s*tiles?|natural\s*marble)\b|بورسلين|سيراميك|رخام طبيعي",text,__import__("re").I)
        material=None
        if match:
            declared=match.group()
            material=material_from(declared,[],None,item.get("name",""))
        size=sizes_from(item.get("name","")+" "+text[:4000],None)
        return {"http_status":status,"url":final,"material":material,
            "supplier_category":match.group() if match else None,"size":size,
            "content_bytes":len(body)}
    except Exception as exc:
        return {"error":type(exc).__name__+":"+str(exc)[:95]}

def extract(source, per_page=40, pages=1, details=20, verify_count=6):
    base="https://"+source["url"].split("/")[2]+"/wp-json/wc/store/v1/products"
    can,why=robots_check(base)
    if can is not True:
        return [],[why or "robots_not_approved"]
    products=[]; errors=[]; seen=set()
    for page in range(1, min(pages,4)+1):
        try:
            endpoint=base+"?"+urlencode({"per_page":min(per_page,100),"page":page})
            status,_,ct,body=http_get(endpoint,limit=4_000_000,accept="application/json")
            if status!=200:
                errors.append(f"Woo Store API HTTP {status} page {page}")
                break
            raw=json.loads(body)
            if not isinstance(raw,list):errors.append("not_array");break
            for item in raw:
                if item.get("id") not in seen:
                    seen.add(item.get("id"))
                    products.append(item)
            if len(raw)<per_page:break
        except Exception as exc:
            errors.append(type(exc).__name__+":"+str(exc)[:120]);break
    # Only budgeted product detail pages qualify for more evidence.
    details_for={}
    with ThreadPoolExecutor(max_workers=4) as pool:
        future={pool.submit(page_qa,item):item for item in products[:details]}
        for f in as_completed(future):
            item=future[f]
            details_for[item["id"]]=f.result()
    out=[from_woo(item,source,details_for.get(item["id"])) for item in products]
    # A mixed sanitaryware seller is not a tile source unless its own categories prove it.
    if source["source_id"]!="source-05":
        out=[item for item in out if item["material"] in ("ceramics","porcelain","tiles","natural_marble")]
    for row in out[:verify_count]:
        if row["source_image_urls"]:
            row["image_technical_qa"]=verify_image(row["source_image_urls"][0])
            if not row["image_technical_qa"]["ok"]:
                row["flags"].append("image_technical_qa_failed")
    return out,errors
