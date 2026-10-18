#!/usr/bin/env python3
"""Join per-product source/online checks with only verified source image upgrades."""
import csv, json
from pathlib import Path
from collections import Counter

ROOT=Path(__file__).resolve().parent.parent
data=json.loads((ROOT/"src/app/data/artceramic.json").read_text(encoding="utf-8"))
upgrades=json.loads((ROOT/"src/app/data/artceramicPhotoUpgrades.json").read_text(encoding="utf-8"))
with (ROOT/"reports/catalogue-artceramic-per-product.csv").open(encoding="utf-8-sig",newline="") as f:
    old={row["id"]:row for row in csv.DictReader(f)}
rows=[]
for p in data:
    id_=str(p["id"])
    before=old[id_]
    photo=upgrades.get(id_,{})
    rows.append({
      "id":id_, "slug":p["slug"], "source_name":p["name"],
      "source_size":p["size"],"source_texture":p.get("texture") or "",
      "source_primary_status":before["image_status"],
      "source_width":before["image_width"], "source_height":before["image_height"],
      "photo_verified_upgrade":("large_and_original" if photo.get("original") else "large_only" if photo.get("large") else "source_medium_only"),
      "verified_display_card_url":photo.get("large") or p["image"],
      "verified_detail_first_image":photo.get("original") or photo.get("large") or p["image"],
      "catalogue_code_verified":"no",
      "catalogue_model_verified":"no",
      "arabic_french_name_verified":"no",
      "source_product_page_verified":"no",
      "needs_supplier_record_validation":"yes",
      "notes":"Human material, image-composition and supplier-catalogue verification required.",
    })
dest=ROOT/"reports/catalogue-postfix-per-product.csv"
with dest.open("w",newline="",encoding="utf-8-sig") as f:
    writer=csv.DictWriter(f,fieldnames=rows[0].keys());writer.writeheader();writer.writerows(rows)
states=Counter(r["photo_verified_upgrade"] for r in rows)
summary={"products_audited":len(rows),"source_primary_check":dict(Counter(r["source_primary_status"] for r in rows)),
         "photo_upgrade_states":dict(states),
         "code_model_translations_verifiable_from_current_export":False,
         "source_gallery_images_all_http_checked":False,
         "category_accuracy_verified_against_manufacturer":False,
         "manual_aesthetic_review_complete":False,
         "production_cpanel_release_verified":False,
         "browser_emulation_report":"reports/mobile-viewport-per-product.json",
         "mobile_layout_test_scope":"475 product routes each on Chrome mobile viewport emulations 390px, 360px, 320px, 768px. Direct route rechecks tracked separately."}
(ROOT/"reports/catalogue-postfix-summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps(summary,ensure_ascii=False,indent=2))
