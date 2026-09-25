from __future__ import annotations

import concurrent.futures as cf
import json
import re
import time
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "src" / "app" / "data" / "sourceRegistry.json"
OUT = ROOT / "hosting" / "catalog-backend" / "source-probe.json"

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0 Safari/537.36"
HEADERS = {"User-Agent": UA, "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8"}

def get(url: str, timeout: int = 12):
    try:
        return requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
    except Exception:
        return None

def same_host(base: str, url: str) -> bool:
    try:
        return urllib.parse.urlparse(base).netloc.lower().removeprefix("www.") == urllib.parse.urlparse(url).netloc.lower().removeprefix("www.")
    except Exception:
        return False

def absolute(base: str, url: str) -> str:
    return urllib.parse.urljoin(base, url)

def sitemap_urls(base: str, max_urls: int = 5000):
    candidates = [
        absolute(base, "/sitemap.xml"),
        absolute(base, "/sitemap_index.xml"),
        absolute(base, "/product-sitemap.xml"),
        absolute(base, "/sitemap_products_1.xml"),
    ]
    seen, products = set(), []
    queue = list(candidates)
    while queue and len(seen) < 25 and len(products) < max_urls:
        sm = queue.pop(0)
        if sm in seen:
            continue
        seen.add(sm)
        r = get(sm, 10)
        if not r or r.status_code != 200 or "<" not in r.text[:200]:
            continue
        try:
            root = ET.fromstring(r.text)
        except Exception:
            continue
        locs = [el.text.strip() for el in root.iter() if el.tag.lower().endswith("loc") and el.text]
        for loc in locs:
            low = loc.lower()
            if low.endswith(".xml") and len(seen) + len(queue) < 25:
                queue.append(loc)
            elif same_host(base, loc):
                if any(k in low for k in ["/product/", "/products/", "/shop/", "/p/", "/item/", "/sanitary-", "/ceramic", "/porcelain", "/tiles", "/faucet", "/mixer", "/basin", "/toilet", "/bathtub", "/shower"]):
                    products.append(loc)
                    if len(products) >= max_urls:
                        break
    return list(dict.fromkeys(products))

def jsonld_products(html: str):
    blocks = re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, re.I | re.S)
    found = []
    for block in blocks:
        try:
            data = json.loads(block.strip())
        except Exception:
            continue
        stack = data if isinstance(data, list) else [data]
        while stack:
            item = stack.pop()
            if isinstance(item, list):
                stack.extend(item)
                continue
            if not isinstance(item, dict):
                continue
            graph = item.get("@graph")
            if isinstance(graph, list):
                stack.extend(graph)
            typ = item.get("@type")
            types = typ if isinstance(typ, list) else [typ]
            if any(str(t).lower() == "product" for t in types if t):
                found.append(item)
    return found

def probe(source: dict):
    base = source.get("resolved_url") or source.get("original_url")
    result = {
        "source_id": source.get("source_id"),
        "source_name": source.get("source_name"),
        "url": base,
        "domain": source.get("domain"),
        "registry_crawl_status": source.get("crawl_status"),
        "http_status": None,
        "final_url": None,
        "stack": [],
        "shopify_count": None,
        "woocommerce_count": None,
        "sitemap_product_urls": [],
        "jsonld_sample_products": [],
        "errors": [],
    }
    r = get(base, 15)
    if not r:
        result["errors"].append("homepage fetch failed")
        return result
    result["http_status"] = r.status_code
    result["final_url"] = r.url
    html = r.text
    low = html.lower()
    if "cdn.shopify.com" in low or "shopify-section" in low or "shopify.theme" in low:
        result["stack"].append("shopify")
    if "wp-content" in low or "woocommerce" in low:
        result["stack"].append("wordpress/woocommerce")
    if "prestashop" in low:
        result["stack"].append("prestashop")
    if "magento" in low or "mage/" in low or "static/version" in low:
        result["stack"].append("magento")

    # Shopify public catalog
    shopify = get(absolute(r.url, "/products.json?limit=250"), 15)
    if shopify and shopify.status_code == 200:
        try:
            data = shopify.json()
            if isinstance(data, dict) and isinstance(data.get("products"), list):
                result["shopify_count"] = len(data["products"])
                if "shopify" not in result["stack"]:
                    result["stack"].append("shopify")
        except Exception:
            pass

    # WooCommerce Store API
    woo = get(absolute(r.url, "/wp-json/wc/store/v1/products?per_page=100&page=1"), 15)
    if woo and woo.status_code == 200:
        try:
            data = woo.json()
            if isinstance(data, list):
                result["woocommerce_count"] = len(data)
                if "wordpress/woocommerce" not in result["stack"]:
                    result["stack"].append("wordpress/woocommerce")
        except Exception:
            pass

    urls = sitemap_urls(r.url, 1200)
    result["sitemap_product_urls"] = urls[:1200]

    sample_urls = urls[:3]
    if not sample_urls:
        hrefs = re.findall(r'href=["\']([^"\']+)["\']', html, re.I)
        sample_urls = [absolute(r.url, h) for h in hrefs if same_host(r.url, absolute(r.url, h)) and any(k in h.lower() for k in ["/product", "/products/", "/shop/"])][:3]
    for u in sample_urls:
        pr = get(u, 12)
        if pr and pr.status_code == 200:
            for obj in jsonld_products(pr.text)[:2]:
                result["jsonld_sample_products"].append({
                    "url": u,
                    "name": obj.get("name"),
                    "sku": obj.get("sku") or obj.get("mpn"),
                    "brand": obj.get("brand"),
                    "image": obj.get("image"),
                    "offers": obj.get("offers"),
                })
    return result

def main():
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    sources = registry["sources"]
    started = time.time()
    results = []
    with cf.ThreadPoolExecutor(max_workers=10) as ex:
        futures = {ex.submit(probe, s): s["source_id"] for s in sources}
        for fut in cf.as_completed(futures):
            sid = futures[fut]
            try:
                item = fut.result()
            except Exception as e:
                item = {"source_id": sid, "errors": [repr(e)]}
            results.append(item)
            print(sid, item.get("http_status"), item.get("stack"), len(item.get("sitemap_product_urls", [])), flush=True)
    results.sort(key=lambda x: x.get("source_id", ""))
    payload = {"generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "elapsed_seconds": round(time.time()-started, 1), "sources": results}
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print("WROTE", OUT, len(results))

if __name__ == "__main__":
    main()
