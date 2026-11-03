from __future__ import annotations

import json
import time
from pathlib import Path
from urllib.parse import urljoin

import requests

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "src" / "app" / "data" / "sourceRegistry.json"
OUTDIR = ROOT / "hosting" / "catalog-backend" / "imports"
OUTDIR.mkdir(parents=True, exist_ok=True)

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0 Safari/537.36"
H = {"User-Agent": UA, "Accept": "application/json,text/html;q=0.8,*/*;q=0.5"}

def get(url, timeout=30):
    try:
        return requests.get(url, headers=H, timeout=timeout, allow_redirects=True)
    except Exception:
        return None

def root_url(url: str) -> str:
    from urllib.parse import urlparse
    p = urlparse(url)
    return f"{p.scheme}://{p.netloc}/"

def fetch_shopify(base: str):
    products = []
    page = 1
    while page <= 100:
        url = urljoin(base, f"products.json?limit=250&page={page}")
        r = get(url)
        if not r or r.status_code != 200:
            break
        try:
            data = r.json()
        except Exception:
            break
        batch = data.get("products") if isinstance(data, dict) else None
        if not isinstance(batch, list) or not batch:
            break
        products.extend(batch)
        print(" shopify page", page, len(batch), flush=True)
        if len(batch) < 250:
            break
        page += 1
        time.sleep(.15)
    return products

def fetch_woo(base: str):
    products = []
    page = 1
    while page <= 100:
        url = urljoin(base, f"wp-json/wc/store/v1/products?per_page=100&page={page}")
        r = get(url)
        if not r or r.status_code != 200:
            break
        try:
            batch = r.json()
        except Exception:
            break
        if not isinstance(batch, list) or not batch:
            break
        products.extend(batch)
        total_pages = int(r.headers.get("X-WP-TotalPages") or 0)
        print(" woo page", page, len(batch), "of", total_pages or "?", flush=True)
        if total_pages and page >= total_pages:
            break
        if len(batch) < 100 and not total_pages:
            break
        page += 1
        time.sleep(.15)
    return products

def norm_shopify(source, p):
    variants = p.get("variants") or []
    images = p.get("images") or []
    prices = [v.get("price") for v in variants if v.get("price") not in (None, "")]
    compare = [v.get("compare_at_price") for v in variants if v.get("compare_at_price") not in (None, "")]
    return {
        "source_id": source["source_id"],
        "source_company": source["source_name"],
        "source_url": source["resolved_url"],
        "source_record_id": str(p.get("id") or ""),
        "product_url": urljoin(root_url(source["resolved_url"]), "products/" + str(p.get("handle") or "")),
        "name": p.get("title"),
        "brand": p.get("vendor"),
        "category": p.get("product_type"),
        "tags": p.get("tags"),
        "description_html": p.get("body_html"),
        "price": min(prices) if prices else None,
        "old_price": min(compare) if compare else None,
        "images": [x.get("src") for x in images if x.get("src")],
        "variants": variants,
        "options": p.get("options") or [],
        "raw": p,
    }

def norm_woo(source, p):
    prices = p.get("prices") or {}
    images = p.get("images") or []
    categories = p.get("categories") or []
    return {
        "source_id": source["source_id"],
        "source_company": source["source_name"],
        "source_url": source["resolved_url"],
        "source_record_id": str(p.get("id") or ""),
        "product_url": p.get("permalink"),
        "name": p.get("name"),
        "brand": None,
        "category": categories[0].get("name") if categories else None,
        "categories": categories,
        "sku": p.get("sku"),
        "description_html": p.get("description"),
        "short_description_html": p.get("short_description"),
        "price": prices.get("price"),
        "regular_price": prices.get("regular_price"),
        "sale_price": prices.get("sale_price"),
        "currency": prices.get("currency_code"),
        "currency_minor_unit": prices.get("currency_minor_unit"),
        "images": [x.get("src") for x in images if x.get("src")],
        "attributes": p.get("attributes") or [],
        "variations": p.get("variations") or [],
        "is_in_stock": p.get("is_in_stock"),
        "raw": p,
    }

def main():
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    summary = []
    for source in registry["sources"]:
        base = root_url(source.get("resolved_url") or source["original_url"])
        shopify_test = get(urljoin(base, "products.json?limit=1"), 12)
        stack = None
        rows = []
        if shopify_test and shopify_test.status_code == 200:
            try:
                d = shopify_test.json()
                if isinstance(d, dict) and isinstance(d.get("products"), list):
                    stack = "shopify"
            except Exception:
                pass
        if stack == "shopify":
            print(source["source_id"], source["source_name"], "SHOPIFY", flush=True)
            raw = fetch_shopify(base)
            rows = [norm_shopify(source, p) for p in raw]
        else:
            woo_test = get(urljoin(base, "wp-json/wc/store/v1/products?per_page=1&page=1"), 12)
            if woo_test and woo_test.status_code == 200:
                try:
                    d = woo_test.json()
                    if isinstance(d, list):
                        stack = "woocommerce"
                except Exception:
                    pass
            if stack == "woocommerce":
                print(source["source_id"], source["source_name"], "WOO", flush=True)
                raw = fetch_woo(base)
                rows = [norm_woo(source, p) for p in raw]

        if not rows:
            continue
        payload = {
            "source_id": source["source_id"],
            "source_company": source["source_name"],
            "source_url": source["resolved_url"],
            "stack": stack,
            "extracted_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "product_count": len(rows),
            "products": rows,
        }
        outfile = OUTDIR / f"{source['source_id']}.json"
        outfile.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        summary.append({"source_id": source["source_id"], "name": source["source_name"], "stack": stack, "product_count": len(rows), "file": outfile.name})
        print(" SAVED", outfile.name, len(rows), flush=True)

    (OUTDIR / "structured-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print("DONE", sum(x["product_count"] for x in summary), "products", len(summary), "sources")

if __name__ == "__main__":
    main()
