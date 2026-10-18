# IDEA product-by-product QA — 2026-10-19

Scope: 475 source-approved Art Ceramic records in the committed src/app/data/artceramic.json, not staged/remote supplier feeds or unknown Supabase production records.

## Actual checks

- Checked all 475 JSON records individually for unique IDs, slugs, titles, original dimensions, image URLs, usage and provenance limitations.
- Downloaded and decoded 475 medium-size main product images: 227 met the working threshold 700x500 px, 226 were below at least one dimension, and 22 had transient network errors (not verified broken URLs).
- Verified manufacturer higher-resolution candidates with real HTTP and image-dimension checks. 474 records have a validated large variant and 472 also have an original-size image; one remains on the original medium URL. Original export fields have not been modified.
- Tested product page navigation at 390px, 360px, 320px and 768px Chrome mobile emulation: 1,900 checks in total, no horizontal page overflow. During accelerated single-page navigation 47 title delays occurred across 39 unique product slugs; direct navigation on 390px and 320px subsequently passed for all 39.
- Removed image colour filters, restored full image framing, corrected thumbnails, repeated tags and stale gallery index after route changes.
- Build passed and 12 Node tests passed.

## Machine-readable evidence

- catalogue-artceramic-per-product.csv: initial 475 individual image/network checks.
- catalogue-artceramic-summary.json: initial aggregate.
- catalogue-postfix-per-product.csv: verified improved display URLs for every product.
- catalogue-postfix-summary.json: result plus limitations.
- mobile-viewport-per-product.json: four 475-page accelerated mobile viewport passes.
- mobile-direct-route-recheck.json: independent direct-URL checks for the 39 delayed pages.
- mobile-product-390.png: sample screenshot before final thumbnail polish.

## Important limits

1. Source export has no independently verified per-product model/SKU code, Arabic/French translations, manufacturer product URL or manufacturer-certified category. Do not invent them.
2. The 3,434 unique main+supplementary gallery URLs were structurally inspected, but only main source images were fully downloaded and decoded one by one. Extra gallery images were not all individually loaded or visually reviewed.
3. Dimensional quality is NOT the same as manual artistic composition review. No claim that all 475 images were each art-directed by a person.
4. Chrome emulation is NOT real iPhone Safari hardware testing. This is NOT a verified cPanel live-domain deployment; images remain externally hosted.
5. Actual database-driven products cannot be verified without restoring the connected production Supabase.

## Repeat QA

Run Python scripts in scripts/: audit-catalogue-photos.py, validate-photo-upgrades.py, summarize-photo-qa.py, audit-mobile-products.py (Vite on 127.0.0.1:5174, Selenium and Chrome), and recheck-mobile-issues.py. Run node --test tests/*.test.mjs and npm run build.
