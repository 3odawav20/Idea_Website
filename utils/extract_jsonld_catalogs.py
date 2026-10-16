from __future__ import annotations
import concurrent.futures as cf
import html as htmllib
import json, re, time
from pathlib import Path
import requests

ROOT=Path(__file__).resolve().parents[1]
PROBE=ROOT/"hosting"/"catalog-backend"/"source-probe.json"
OUTDIR=ROOT/"hosting"/"catalog-backend"/"imports"
OUTDIR.mkdir(parents=True,exist_ok=True)
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0 Safari/537.36"
H={"User-Agent":UA,"Accept":"text/html,application/xhtml+xml,*/*;q=0.8"}
TARGETS={"source-03","source-10","source-15","source-35"}

def get(url):
    try:return requests.get(url,headers=H,timeout=20,allow_redirects=True)
    except Exception:return None

def jsonlds(text):
    out=[]
    for block in re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',text,re.I|re.S):
        try:data=json.loads(block.strip())
        except Exception:continue
        stack=data if isinstance(data,list) else [data]
        while stack:
            x=stack.pop()
            if isinstance(x,list):stack.extend(x);continue
            if not isinstance(x,dict):continue
            if isinstance(x.get("@graph"),list):stack.extend(x["@graph"])
            out.append(x)
    return out

def brand_name(v):
    if isinstance(v,str):return v
    if isinstance(v,dict):return v.get("name")
    return None

def offer_data(v):
    offers=v if isinstance(v,list) else [v] if isinstance(v,dict) else []
    prices=[]; old=[]; currency=None; availability=None
    for o in offers:
        if not isinstance(o,dict):continue
        if o.get("price") not in (None,""):prices.append(str(o["price"]))
        if o.get("lowPrice") not in (None,""):prices.append(str(o["lowPrice"]))
        currency=currency or o.get("priceCurrency")
        availability=availability or o.get("availability")
        specs=o.get("priceSpecification")
        specs=specs if isinstance(specs,list) else [specs] if isinstance(specs,dict) else []
        for s in specs:
            if not isinstance(s,dict):continue
            p=s.get("price")
            if p in (None,""):continue
            if "listprice" in str(s.get("priceType","")).lower():old.append(str(p))
            else: prices.append(str(p))
            currency=currency or s.get("priceCurrency")
    def minnum(values):
        nums=[]
        for x in values:
            try:nums.append(float(x))
            except:pass
        return str(min(nums)) if nums else (values[0] if values else None)
    return minnum(prices),minnum(old),currency,availability

def textify(s):
    if not s:return ""
    s=re.sub(r'<[^>]+>',' ',str(s))
    s=htmllib.unescape(s)
    return re.sub(r'\s+',' ',s).strip()

def dimensions(text):
    pat=r'(?<!\d)(\d{1,4}(?:\.\d+)?)\s*[x×*]\s*(\d{1,4}(?:\.\d+)?)(?:\s*[x×*]\s*(\d{1,4}(?:\.\d+)?))?\s*(mm|cm|m)?\b'
    vals=[]
    for m in re.finditer(pat,text,re.I):
        parts=[m.group(1),m.group(2)]+([m.group(3)] if m.group(3) else [])
        vals.append(" × ".join(parts)+((" "+m.group(4)) if m.group(4) else ""))
    return list(dict.fromkeys(vals))[:20]

def extract_one(source,url):
    r=get(url)
    if not r or r.status_code!=200:return None
    objs=jsonlds(r.text)
    product=None; breadcrumbs=[]
    for o in objs:
        typ=o.get("@type")
        types=typ if isinstance(typ,list) else [typ]
        low=[str(x).lower() for x in types if x]
        if "product" in low and product is None:product=o
        if "breadcrumblist" in low:
            for it in o.get("itemListElement") or []:
                if not isinstance(it,dict):continue
                item=it.get("item")
                name=it.get("name") or (item.get("name") if isinstance(item,dict) else None)
                if name:breadcrumbs.append(str(name))
    if not product:return None
    name=textify(product.get("name"))
    if not name:return None
    imgs=product.get("image") or []
    if isinstance(imgs,str):imgs=[imgs]
    elif isinstance(imgs,dict):imgs=[imgs.get("url") or imgs.get("contentUrl")]
    imgs=[x for x in imgs if isinstance(x,str) and x.startswith("http")]
    if not imgs:
        og=re.findall(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)',r.text,re.I)
        imgs=og[:1]
    price,old,currency,availability=offer_data(product.get("offers"))
    desc=textify(product.get("description"))
    dims=dimensions(" ".join([name,desc,textify(r.text)]))
    attrs=[]
    if dims:attrs.append({"name":"Dimensions","terms":dims})
    category=breadcrumbs[-2] if len(breadcrumbs)>=2 else product.get("category")
    rid=str(product.get("sku") or product.get("mpn") or abs(hash(url)))
    return {
        "source_id":source["source_id"],"source_company":source["source_name"],"source_url":source["url"],
        "source_record_id":rid,"product_url":r.url,"name":name,"brand":brand_name(product.get("brand")),
        "category":category,"categories":[{"name":x} for x in breadcrumbs[:-1]],"sku":product.get("sku") or product.get("mpn"),
        "description_html":product.get("description"),"price":price,"regular_price":old,"sale_price":price,
        "currency":currency,"images":imgs,"attributes":attrs,"is_in_stock":None if not availability else "instock" in str(availability).lower(),
        "raw":{"jsonld":product,"breadcrumbs":breadcrumbs}
    }

def main():
    p=json.loads(PROBE.read_text(encoding="utf-8"))
    grand=0
    for source in p["sources"]:
        if source.get("source_id") not in TARGETS:continue
        urls=[u for u in source.get("sitemap_product_urls",[]) if "/product/" in u.lower() or "/products/" in u.lower()]
        urls=list(dict.fromkeys(urls))
        print(source["source_id"],source["source_name"],"urls",len(urls),flush=True)
        rows=[]
        with cf.ThreadPoolExecutor(max_workers=16) as ex:
            for i,row in enumerate(ex.map(lambda u:extract_one(source,u),urls),1):
                if row:rows.append(row)
                if i%100==0:print(" ",i,"->",len(rows),flush=True)
        payload={"source_id":source["source_id"],"source_company":source["source_name"],"source_url":source["url"],
                 "stack":"jsonld-sitemap","extracted_at":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),
                 "product_count":len(rows),"products":rows}
        out=OUTDIR/f"{source['source_id']}.json"
        out.write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding="utf-8")
        print(" SAVED",out.name,len(rows),flush=True)
        grand+=len(rows)
    print("DONE",grand,flush=True)
if __name__=="__main__":main()
