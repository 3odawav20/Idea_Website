# IDEA Supplier Catalogue QA — 2026-11-03

**Status:** Extraction completed into a private review queue only. Zero newly approved, rights-cleared, staging-live or production-live products.

## Source inventory

Exactly 40 user-provided source URLs: 25 accessible, 1 blocked, 2 robots-unverifiable, 3 duplicate providers, 2 social-login-only and 7 out-of-scope input URLs. See source-status.csv and the approved source list, which retains exact URL provenance. Repeated providers: Royal Group, Gemma and Remas.

## Measured local results

| Source | Retrieved records | Supplier-based provisional classification |
| --- | ---: | --- |
| AbaElMozahem | 223 | Supplier-labelled ceramic; models may include porcelain and require verification |
| Cleopatra Store | 90 | Material unclassified; SKU often absent |
| Elrwad Group | 51 | Supplier-labelled porcelain |
| Total | 364 | All quarantined / zero approved |

Among 364 candidates, 292 have parsed size, 152 have source SKU, 18 image samples were checked, 16 passed image size/type/decoding tests, 2 failed. No image was yet visually confirmed to be a standalone source tile face, rights-cleared or rehosted. Potential SKU collisions detected within this pilot: zero; this does not prove overall deduplication.

## Existing cataloguing is not new inventory

The already embedded Art Ceramic export contains 475 records, not independently certified by material. The legacy source registry records 691 previously extracted records; these are historical counts, not proof of newly verified unique or publicly live products. Many newly retrieved records may already be in the application.

## Material acceptance targets

| Material | Pilot extracted (unverified) | Newly approved | Newly live | Verified goal | Verified shortfall |
| --- | ---: | ---: | ---: | ---: | ---: |
| Ceramics | 223 | 0 | 0 | 2,000 | 2,000 |
| Porcelain | 51 | 0 | 0 | 2,000 | 2,000 |
| Tiles (otherwise unclassified) | 0 | 0 | 0 | 2,000 | 2,000 |
| Natural marble | 0 | 0 | 0 | 2,000 | 2,000 |

90 Cleopatra products are still material-unclassified; they have not been silently counted as a material class. Marble-look porcelain must not be labeled natural marble. No basins, taps, showers, baths or sanitaryware count toward the four targets.

## Technical implementation

scripts/catalogue/approved-sources.json preserves exact forty source URLs. ingest.py discovers public source capability and extracts bounded Shopify collection records, with robots checks and no login bypass. woo_adapter.py uses the public WooCommerce Store API and limited source product-page checks. report.py emits exact evidence files. sync_registry.py adds approved input links and dated discovery evidence into canonical sourceRegistry.json while preserving historical counts. All outputs are quarantine; public catalog.ts, IDEA website data and production were NOT modified.

Evidence files: source-diagnostics.json, source-status.csv, extraction-diagnostics.json, quarantine-products.json, admin-review-queue.csv, qa-errors.csv, possible-duplicates.csv, material-acceptance.csv, release-blocked-report.json and report.json. The admin review CSV has product URL, name, source category, size, SKU and image reference only. Public-repository output contains no actual product price and no secret keys.

## Operations, review and publication

Dependencies: python -m pip install -r scripts/catalogue/requirements.txt
Tests: python -m unittest discover -s tests -p test_supplier_ingest.py -v
Baseline: python scripts/catalogue/ingest.py --mode baseline
Re-scan: python scripts/catalogue/ingest.py --mode all --workers 5 --max-pages 2 --verify-count 6
Reports: python scripts/catalogue/report.py
Canonical metadata: python scripts/catalogue/sync_registry.py

Approval requires individual exact product/SKU/material/maker/dimensions evidence, original standalone tile-face images (no rooms, vehicles, facades or lifestyle mockups), verified supplier usage rights, technical + visual review, duplicate resolution and live local product URL proof. Source-image access alone is not a license to rehost. Keep every SKU/size variant grouped by actual model. Prices must remain admin-private; never export to public catalogue. After evidence and consent: staged deployment, route/image QA, full backup, explicit release approval, rollback. No live deploy was executed in this batch.
