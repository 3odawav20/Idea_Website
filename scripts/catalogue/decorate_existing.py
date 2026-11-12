"""Refresh stable IDEA references / maker review metadata without supplier requests."""
import json
from pathlib import Path
from identity import decorate_for_review

ROOT=Path(__file__).resolve().parents[2]
TARGET=ROOT/"docs/catalogue/supplier-qa-2026-11-03/quarantine-products.json"

def run():
    products=json.loads(TARGET.read_text(encoding="utf-8"))
    existing_count=len(products)
    for record in products:
        decorate_for_review(record)
    codes=[p["idea_reference_code"] for p in products]
    assert len(set(codes))==existing_count, "IDEA internal reference collision"
    assert all(p.get("manufacturer") is None or p["manufacturer_review_status"]=="source_verified" for p in products)
    assert all(p["stage"]=="QUARANTINE" and p["approved"] is False for p in products)
    assert all(p.get("price") is None for p in products), "private price leaked"
    TARGET.write_text(json.dumps(products,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("IDEA_CODES",len(codes),"UNIQUE",len(set(codes)),"SOURCE_BRANDS_PROVISIONAL",
        sum(bool(p.get("brand_named_in_supplier_title")) for p in products),"NEW_APPROVED",0)

if __name__=="__main__":
    run()
