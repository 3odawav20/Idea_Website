"""Convert evidence-backed IDEA ingestion quarantine into inspectable CSV reports."""
from collections import Counter, defaultdict
from datetime import datetime, timezone
import csv
import hashlib
import json
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[2]
PATH=ROOT/"docs"/"catalogue"/"supplier-qa-2026-11-03"
sources=json.loads((PATH/"source-diagnostics.json").read_text("utf-8"))
products=json.loads((PATH/"quarantine-products.json").read_text("utf-8"))
baseline=json.loads((PATH/"baseline.json").read_text("utf-8"))

def save(name,fields,rows):
    with (PATH/name).open("w",newline="",encoding="utf-8-sig") as f:
        w=csv.DictWriter(f,fieldnames=fields,extrasaction="ignore")
        w.writeheader()
        for row in rows:
            w.writerow({k:(json.dumps(row[k],ensure_ascii=False) if isinstance(row.get(k),(list,dict)) else row.get(k)) for k in fields})

save("source-status.csv",["source_id","name","input_url","status","http_status","adapter","final_url","reason","canonical_source_id","checked_at"],sources)
issues=[]
for s in sources:
    if s.get("status")!="accessible":
        issues.append({"source_id":s["source_id"],"record_id":"","stage":"DISCOVERY",
                       "reason":s.get("reason") or s["status"],"source_url":s.get("input_url","")})
for p in products:
    for flag in p.get("flags",[]):
        issues.append({"source_id":p["source_id"],"record_id":p["source_product_id"],
                       "stage":"QUARANTINE","reason":flag,"source_url":p.get("product_url") or p["source_url"]})
    if p.get("image_technical_qa") and not p["image_technical_qa"].get("ok"):
        issues.append({"source_id":p["source_id"],"record_id":p["source_product_id"],
                       "stage":"IMAGE_TECHNICAL_QA","reason":p["image_technical_qa"].get("reason"),
                       "source_url":p.get("source_image_urls",[""])[0]})
save("qa-errors.csv",["source_id","record_id","stage","reason","source_url"],issues)
key_to_records=defaultdict(list)
for p in products:
    # Same known SKU + material only; not enough to auto-merge uncertain brands.
    if p.get("sku") and p.get("material"):
        key=(p["material"].lower(),re.sub(r"\W+","",p["sku"]).lower())
        key_to_records[key].append(p)
duplicate_flags=[]
for key,group in key_to_records.items():
    if len(group)>1:
        for p in group:
            duplicate_flags.append({"material":key[0],"sku_normalized":key[1],"source_id":p["source_id"],
                                    "name":p["name"],"product_url":p["product_url"],"duplicate_count":len(group)})
save("possible-duplicates.csv",["material","sku_normalized","source_id","name","product_url","duplicate_count"],duplicate_flags)
# Admin-only review queue: exact references and verified-or-missing specs.
# No prices or vendor secrets, no auto-publication, no live image rehosting.
review=[]
for p in products:
    review.append({
        "idea_staging_id":p["idea_staging_id"],
        "source_id":p["source_id"],
        "product_name":p["name"],
        "material_unverified":p.get("material") or "",
        "supplier_declared_category":p.get("supplier_category") or "",
        "retailer_vendor":p.get("retailer_vendor") or "",
        "manufacturer_verified":p.get("manufacturer") or "",
        "size_source_derived":p.get("size",{}).get("label","") if p.get("size") else "",
        "sku":p.get("sku") or "",
        "product_url":p.get("product_url") or "",
        "source_image_reference":(p.get("source_image_urls") or [""])[0],
        "review_stage":p.get("stage"),
        "review_flags":";".join(p.get("flags",[])),
    })
save("admin-review-queue.csv",list(review[0]) if review else
    ["idea_staging_id","source_id","product_name","material_unverified","supplier_declared_category",
    "retailer_vendor","manufacturer_verified","size_source_derived","sku","product_url",
    "source_image_reference","review_stage","review_flags"],review)


# Keep extracted, checked, visually approved, published separate; never add 475 embedded + 223 currently scraped to claim 698 distinct.
materials=["ceramics","porcelain","tiles","natural_marble"]
rows=[]
for cat in materials:
    subset=[p for p in products if p.get("material")==cat]
    rows.append({"material":cat,"extracted_candidates_this_run":len(subset),
       "images_technically_checked":sum("image_technical_qa" in p for p in subset),
       "images_passed_technical_check":sum(p.get("image_technical_qa",{}).get("ok",False) for p in subset),
       "verified_and_rights_cleared":0,"staging_live":0,"new_production_live":0,
       "target":2000,"verified_shortfall":2000})
save("material-acceptance.csv",list(rows[0]),rows)
snapshot={
    "generated_at":datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "registry_legacy_embedded_art":baseline["embedded_art_ceramic"],
    "registry_legacy_extracted_records":baseline["existing_registry_extracted_sum_not_verified"],
    "sources_total":len(sources),
    "source_status":dict(Counter(s["status"] for s in sources)),
    "quarantined_records":len(products),
    "quarantine_reason_events":len(issues),
    "technical_image_checks":sum("image_technical_qa" in p for p in products),
    "passed_technical_image_checks":sum(p.get("image_technical_qa",{}).get("ok",False) for p in products),
    "potential_duplicate_keys_flagged":len(duplicate_flags),
    "new_verified":0,"new_staging_live":0,"new_production_live":0,
    "new_product_images_hosted_on_idea":0,
    "publish_approval":"NOT_REQUESTED",
    "source_terms_rights":"NOT_GRANTED_BY_PUBLIC_VISIBILITY",
    "classification_risks":[
      "AbaElMozahem supplier labels may group porcelain under ceramic; manual model-level material checks required",
      "WooCommerce product pages may lack explicit material type or SKU; do not infer from visuals",
      "Tile images require face-only visual review; no lifestyle photos accepted as material swatches",
      "Product-level uniqueness across existing runtime/imported records remains unverified"
    ]}
(PATH/"release-blocked-report.json").write_text(json.dumps(snapshot,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(snapshot,ensure_ascii=False))
