# IDEA — Requirement-to-Evidence Matrix (2026-11-04)

Production domain: https://idea-dh.com/
Production document root: /home/lsenet5/idea-dh.com
Database: MySQL `lsenet5_idealive18`NaN returned HTTP 200; PHP 8.3 and MySQL connection verified | PARTIAL — newer React frontend still depends on Supabase, so do not deploy it over working MySQL UI unadapted |
| Buyer registration, login, reset, secure session | MySQL `idea_users`NaN returns 401 | PARTIAL — real login, reset and cross-account session persistence not exercised with credentials |
| Business onboarding and approval | MySQL `idea_companies` has 2 records | PARTIAL — create/verification/suspension and owner/manager isolation need real-account E2E |
| Admin rail and per-company access | cPanel marketplace and company role checking exists | PARTIAL — unauthed admin/sales endpoints 401; actual signed-in admin/supplier controls untested |
| Supplier products and permanent product code | `idea_supplier_products` and `idea_marketplace_product_meta` exist, each with **0** rows | PARTIAL — product-save/edit moderation flow not exercised with actual sellers |
| Private prices and competitor isolation | Public `/api/marketplace.php?action=search` hides private pricing; API selects scoped records | PARTIAL — no cross-supplier E2E test with real price rows |
| Product catalogue 40 supplier sources and target 2,000 each category | 475 raw Art Ceramic records in React JSON; supplier product MySQL count 0 | PARTIAL — 8,000 qualified public products NOT achieved, most sources not reconciled |
| Material swatches only beneath AI | React code filters for tile-face assets; manufacturer PDF swatches exist | PARTIAL — visual/media-rights review and per-product publication incomplete |
| Manufacturer distinction vs seller/site | Metadata fields present; catalogue source record preserved | PARTIAL — per-item provenance and maker verification pending |
| Product image crop, transparency, model/size variants | Manufacturer PDFs have several individual faces per page | PARTIAL — full extraction, no-white-border segmentation and human QA pending |
| Reference product pages like supplied Cleopatra layout | React product page and lightbox coded | PARTIAL — screenshot-level browser comparison not yet completed on cPanel |
| Product code/brand/company search | Public `/api/marketplace.php?action=search&q=MAZE`NaN HTTP 200 | PARTIAL — admin persistence, mobile visual and language isolation not logged in for testing |
| Admin advertising packages and video hero | Package/requests API code exists | PARTIAL — actual approval, media upload/validation and onsite video playback unverified |
| External Google/Meta ad campaigns | Proposed 15% management fee in separate review PR | BLOCKED — no verified advertiser OAuth, billing account, or live campaign integration |
| Social sign in: Google, Apple, Facebook, X, Microsoft, phone/WhatsApp | Config-aware React components exist | BLOCKED — no verified registered callbacks/active provider connection on this MySQL domain |
| Private RFQ and matching exact seller product | API support and 3 historical quote requests reported | PARTIAL — 10 m² matching-multiple-seller acceptance scenario not completed |
| Verified payment options in Egypt / subscriptions | Payment state tables and PHP routes exist | BLOCKED — no confirmed merchant checkout/webhook evidence; no live payment performed |
| Notifications/inbox/email/WhatsApp | Platform mail and inbox PHP modules exist | PARTIAL/BLOCKED — real-delivery and consent/approved WhatsApp sender not verified |
| Complaints tickets and configurable destination | Project specification captured | NOT TESTED — persistent complaint lifecycle and delivery not proven |
| AI image editing on Runpod | Server-side Runpod key exists and public Qwen endpoint previously accepted an `IN_QUEUE` job | BLOCKED — private masked worker endpoint ID and `idea-qwen-mask-v1`NaNNaNNaN **404** (not yet deployed).
- Live MySQL: 6 users, 2 companies, 0 supplier listings, 0 marketplace meta, 49 prior AI jobs, 0 orders. Runpod key set; endpoint ID/worker contract not set.
- Tests performed on real cPanel PHP/GD: size parser 10/10, real source products #28 and #48, exact synthetic normalized-room pixel comparison 61,560/61,560.
- Local React production build passed; Node test subset 32/32 passed; CI remains separately required for each new GitHub commit.

## Release gate

1. Confirm an authenticated, compatible Runpod mask worker and actual success with room + product + mask + output; do not use general public endpoint as though its response includes a segmentation mask.
2. Build/verify calibration-aware projected tile placement against manufacturer dimensions, then test object occlusions, edge geometry and JPEG/PNG exports.
3. Keep production backup; only promote tested PHP modules through authorized deployment path, with automatic rollback and real live HTTP smoke checks.
4. Test real buyer, admin and two supplier accounts, server-side authorization, one product listing/price, and RFQ/quote isolation in a controlled environment.
5. Complete social sign-in, external campaigns, payments and messaging only after verified provider credentials and user/merchant authorization.
6. Verify 40-source data ingestion and human QA before claiming any inventory target or manufacturing exactitude.
