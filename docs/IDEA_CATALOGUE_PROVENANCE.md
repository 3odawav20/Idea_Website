# IDEA 2030 - Catalogue Provenance & Release Gate

This feature branch is isolated, NOT a production deployment.

## Source-backed IDs
- Source export src/app/data/artceramic.json contains 475 records.
- Each record gets a unique 10-digit IDEA catalogue ID from registry source 20 and zero-padded 8-digit source record, e.g. record 95 -> 2000000095.
- IDEA catalogue ID is NOT the manufacturer's SKU. Preserve the latter only if explicitly documented.
- Existing recorded dimensions and names are preserved; centimetres are assumed by the historical Art Ceramic parser. These are NOT independently factory certified.
- Source publisher Art Ceramic is not assumed to be manufacturer; real maker remains pending independent verification.
- Identical appearance is not proof two supplier listings share the exact physical manufacturer/model/specification.

## User experience and permissions
- Public catalogue: IDEA ID and real verified maker only; manufacturer pending otherwise. Size details gated to account session.
- No anonymous unit prices returned by PHP public variants endpoint. The authenticated admin has internal actual price fields.
- Adding RFQ items requires a user account. The existing buyer/supplier/admin backend permissions still need end-to-end review.
- The AI materials library uses source tile-face references, not ambient room photos. Sample decor assets are excluded from paid AI generation.
- Clicking a tile must not automatically spend Runpod credits.
- Area-to-tile count estimate uses source dimensions and 0/5/10/15% wastage. Factory verified box-packing coverage and real prices remain unavailable.

## Remaining verification blockers
- Actual manufacturer, original factory SKU, factory-certified dimensions, thickness, price, inventory, box tile count, reseller versus producer and licensing must be verified per product.
- Supplied data does not justify fabricating missing entries or automatically merging lookalike tiles from different manufacturers.
- Administrator manufacturer approval and confidential price editing require server-side PHP/MySQL integration, protected write APIs, audit and authenticated testing.
- Live Runpod generation and furniture/geometry preservation have NOT been proven by these frontend tests.
- No production cPanel migrations/deployments occurred.

## Actual local tests (2026-11-02)
- Four source-identity/calculation tests: PASS (node --experimental-strip-types --test tests/catalogue-identity.test.mjs).
- Four ceramic studio Playwright UI tests: PASS (npx playwright test tests/ceramic-studio/studio.spec.js --workers=1).
- Vite production build: PASS, with nonblocking large JS chunk warning.
- git diff --check: PASS.
- Local PHP test proxy 127.0.0.1:5180 was unavailable during Playwright, so backend integration was not tested.

Publish this code only to a feature branch, never main or live production without explicit approval.