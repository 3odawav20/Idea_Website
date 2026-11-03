# IDEA Supplier Catalogue QA — 2026-11-03

**Status:** Bounded public supplier extraction; all records remain in quarantine for administrator QA. No newly approved, staging-live or publicly live products.

## Exact source scope

40 user-provided URLs were preserved. Discovery from the source register: 25 accessible, 1 blocked, 2 robots-unverifiable, 3 duplicate providers, 2 social-login-only and 7 out-of-scope entrypoints. The same provider is not double-counted when the approved list repeats it.

## Measured extraction — not published stock

| Supplier | Source ID | Unapproved QA candidate records | Material evidence |
| --- | --- | ---: | --- |
| Aba El Mozahem | source-08 | 379 | 223 ceramics, 156 porcelain |
| Cleopatra Store | source-05 | 135 | Material unresolved |
| Elrwad Group | source-22 | 62 | 60 porcelain, 2 ceramics |
| El Sewify | source-04 | 53 | 30 porcelain, 23 ceramics |
| Alwan | source-06 | 14 | 9 porcelain, 5 ceramics |
| **Total** | | **643** | **253 ceramics, 255 porcelain, 135 unclassified** |

The source-08 porcelain-size Shopify section and source-04/source-06 public WooCommerce material-specific categories were added with per-product ID deduplication. The original supplier entrypoint is unchanged and retained in every record. No basins, taps, grout, adhesive or bath products count toward ceramic/porcelain targets.

## Four independently verified targets

| Material | Extracted candidates (NOT approved) | New approved | New publicly live | Required verified | Shortfall |
| --- | ---: | ---: | ---: | ---: | ---: |
| Ceramics | 253 | 0 | 0 | 2,000 | 2,000 |
| Porcelain | 255 | 0 | 0 | 2,000 | 2,000 |
| Tiles (otherwise unclassified material category) | 0 | 0 | 0 | 2,000 | 2,000 |
| Natural marble | 0 | 0 | 0 | 2,000 | 2,000 |

The 135 unclassified records do NOT contribute to material targets. The existing 475 embedded Art Ceramic records are separate historical source imports, not newly verified inventory or included in the 643 candidate count. Do not add legacy counts to this table or count marble-look porcelain as natural marble.

## Quality checks and gaps

- Exactly 643 distinct (source ID, source product ID) pairs were extracted.
- **126** candidates lack an extracted size, **340** lack a documented SKU, and **14** lack supplier image links.
- **8** first-image technical spot checks were performed in this run and **7** passed file/resolution tests. These results do not certify the other images.
- **Zero** standalone tile-face images, manufacturer identity claims or usage rights have been fully cleared for release.
- Duplicate SKU check returned zero potential conflicts within its limited key coverage, not proof that all candidates are unique across existing catalogues.
- Manufacturer vs retailer remains unresolved when suppliers do not state the maker. Size and material labels remain source-backed provisional evidence.
- The source catalogue is **not a promotion-price feed**. No guessed prices or unapproved promotions were put in public JSON.

## Admin/private finances

Existing public.catalogue_admin_prices policy already restricts price access to authenticated server-verified administrators. The new administrator-only promotions migration and form allow multiple supplier price/promotion drafts with source URLs, dates, private row-level security and no automatic storefront publication. The migration has not been applied to production by this batch. Financial offers are not exported in public catalogue data.

## Reproducible workflow

Run the bounded extractor from the repository root:

    python -m unittest discover -s tests -p test_supplier_ingest.py -v
    python scripts/catalogue/ingest.py --mode shopify --workers 3 --max-pages 3 --limit 250 --verify-count 2
    python scripts/catalogue/report.py

Use source-status.csv, extraction-diagnostics.json, admin-review-queue.csv, qa-errors.csv, possible-duplicates.csv, material-acceptance.csv and release-blocked-report.json for source-by-source QA. All records remain in EXTRACTED/QUARANTINE until verified at every gate: material, product identity, dimensions, exact SKU, standalone tile-face photos, rights, duplicates, internal IDEA link, and real browser checks. Record failures rather than silently filling fields.

Production release requires an approved staging build, actual image HTTP/media QA, backup and rollback and explicit approval. No production release performed.
