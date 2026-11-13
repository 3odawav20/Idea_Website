# IDEA — Owner Master Directives (authoritative, 2026-11-12)

> **READ FIRST.** This document consolidates owner requests from the available ChatGPT project conversations and `docs/owner-requirements-20261108.txt`, `docs/execution-reference-20261112.md`, and later owner's explicit corrections. It is a durable execution specification, **not a certificate that features are finished**. The latest explicit owner decision overrides older, conflicting descriptions. Preserve this document and update the companion `docs/IDEA_EXECUTION_STATUS_20261112.md` with proof after every bounded change. Where source imagery/credentials are inaccessible, record `BLOCKED`, not `DONE`.

## Project identity, authorized source and safety

- Project: **IDEA** marketplace, repository https://github.com/3odawav20/Idea_Website ; production https://idea-dh.com ; hosting **InMotion cPanel** document root `/home/lsenet5/idea-dh.com`.
- **Production source of truth: PHP + the EXISTING cPanel MySQL database**, not Supabase, Firestore, generated JSON, Vercel edge storage or a new parallel user store. Preserve existing real accounts, company memberships, products, quotations, media, orders, passwords, provider mappings, private prices and all existing application data. Do not wipe, reinitialize, move or recreate a database to hide an integration problem.
- GitHub is source version/history. Vercel is **one integrated preview website**, not three separate links. Preview from the exact intended branch/commit; Vercel can be rate limited and its READY state does **not** mean PHP/MySQL is live.
- End state: compatible, verified release deployed to `idea-dh.com` after backup, review, test and rollback plan. No untested production overwrite. No automatic production merge or deployment on a documentation-only change.
- Never print, commit, log or expose secrets. Use only authorized sessions, private PHP configuration **outside the webroot**, authenticated remote channels and least privilege. Never copy production personal data to GitHub.
- Remote Windows temporary work goes ONLY into `C:\Users\rakan\Desktop\_AI_REMOTE_WORK`, never Desktop root. Preserve pre-existing remote files, including untracked work, and do not restart/kill unrelated processes. Use local working copies for tests without overwriting user changes.
- **Do not report a feature as "done" merely because code or tests exist.** Meaningful statuses: `SOURCE_ONLY` / `IMPLEMENTED_UNTESTED` / `TESTED_LOCAL` / `TESTED_STAGING` / `VERIFIED_PRODUCTION` / `BLOCKED`. Give commit + test output + deployment URL/branch + post-deploy evidence when applicable.
- Stop on destructive migration, missing backup, missing approval image or incompatible PHP contract. Isolate the defect, continue other independent safe work, and report blockers together rather than forgetting remaining goals.

## Owner-locked designs: customer, company, admin

- Owner supplied **three specific screenshots** as final visual references: the customer registration/account entry, company account registration/entry, and admin login/entry. **No arbitrary redesign**: preserve exact words, structure, image selection, geometry, dark background/materials, balanced whitespace, alignment and legible labels. Do not substitute a white-background login. Screenshots of final references take priority over generic UI components and old PR mockups. Reuse the actual approved source images and verify visual parity; do not generate replacements without explicit authorization.
- Every page has a coherent **Arabic-only RTL** and **English-only LTR** variant; never mix interface language, not even for validation, placeholders, notices, buttons or social login. Adapt imagery and light/dark treatment to each mode without altering manufacturer texture photographs. English UX text may need an accurate translation while preserving the approved design.
- Day mode uses the **authentic orange of the approved IDEA logo**, white logo appearance when orange is behind it, and controlled subtle shadow, not a solid black logo block. Night mode dark. Different orange shades are not acceptable brand accents. Verify color from the actual approved logo source rather than trusting an unverified hex code.
- **Most recent header decision:** thin, transparent, colorless **Liquid Glass** (backdrop blur + subtle specular/reflection), **no dark/orange opaque tint** on the glass itself. No return to the fat banner/side decorative orange strip or outdated opaque header. Menu links live inside a responsive hamburger drawer.
- Home opens on a full-viewport **cinematic hero** at mobile/tablet/desktop, with existing approved film/images, smooth film-to-image transitions and word-by-word hero title placed in free/legible areas, using logo colors and fine shadows. Avoid autoplay audio and avoid overlapping/covering valuable content. Respect reduced motion.
- Respect owner's Ubuntu typography request where used, hierarchy, font metrics, symmetric tiles, safe wrapping, touch targets, no overflow, consistent transitions and elegant native mobile navigation. Provide quick access back to Home on mobile. Logo cursor should be subtle, small and transparent if implemented. No fake buttons or invented dynamic behavior.
- **Do not claim exact screenshot parity** until visual before/after comparison at requested desktop and multiple mobile widths in both locales/themes. The user must see ALL account entry routes from the **single site navigation**.

## Catalogue / suppliers / source integrity

- Preserve every legitimate source record. All published product photographs must depict the **actual tile/surface**, not buildings, bathrooms, furniture, vegetation, or synthetic room renders in material lists. No copied placeholder manufacturer faces, white borders, invented specs or altered product colours.
- Each product must preserve verified **brand, actual manufacturer, supplier/company, immutable source identity, mandatory SKU/code, model, collection, dimensions, finish, colour, variant, individual source faces and approved rights**. A brand, store and factory are not automatically the same entity.
- **No repeated visually identical tile/design cards from the SAME verified manufacturer** on storefront landing/listing; do not delete source rows, SKUs, price variations or valid size/finish choices. A visually similar item from a **DIFFERENT verified manufacturer** remains distinguishable and may appear. Apply safe display-only grouping after filters and preserve exact direct product/variant links.
- Every eligible material (ceramic, porcelain, tile, marble, etc.) has **AI Try** and **Offline 3D Try** actions with exact chosen product code, face texture, physical size and variant passed through. Category searches, manufacturer/brand/code lookup, recommendations and similar items must use real data.
- Supplier inventory is subject to company and admin approval. **Quarantine unverified product imports**. No arbitrary 2,000/8,000 catalogue counts, manufacturer claims, stock/prices or fictitious revenue.

## Three account capabilities and strict RBAC

### Customer / buyer

- Secure actual signup/login/reset, session and provider linking, user profile, saved items, orders/requests/invoices/notifications, product code and company search, favorites, and home/dashboard layout matching owner reference.
- Customer makes **private multi-supplier RFQ** for exact product/variant, quantity and units, region/destination, lead time/deadline and project notes; buyer can view competing private offers and **CHOOSES** a supplier personally. Show lowest **delivered** cost only when all components (line items, shipping and VAT/tax) are verified, plus stock confirmed, earliest delivery, warranty; never automatically award the lowest price.
- Customer AI: **5 lifetime attempts per authenticated customer**. Anonymous users cannot generate (must register); reservation, idempotency/concurrency, failures/refunds and final quota accounting enforced on server. Customer output private.
- Checkout, payment, invoice, refund, delivery and notification status must be real, server-backed and never fabricated.

### Supplier / company

- Verified supplier onboarding, approval/suspension, verified business identity and membership; owner/manager/staff roles with server-checked scope. Each company manages **ONLY** its own catalogue, mandatory SKUs, exact sizes/finishes, stock, private prices and own staff.
- Receive RFQs **only** for exact products/variants they actually sell **when approved and subscribed**, respond with private prices, quantity, stock, shipping, taxes, expiry, delivery and terms. Competitors never see other quotes or private buyer data. Company cannot access customer AI generation.
- Company dashboard: real paid monthly sales (refund-aware), quotation funnel, staff permissions, ads packages, banners/hero video upload with format/size specifications, promotions submitted for admin review; external Google/Meta ads only if genuinely authorized/connected and cost/commission confirmed. No pretend billing.
- Approved company can be suspended or blocked by authorized admin; no cross-tenant product, revenue or ads control.

### Super administrator

- Server-authenticated **all-platform** admin across company registration/verification, staff and memberships, brands, manufacturer/companies, catalogue products/prices/stock, product approvals, buyer accounts, RFQ/quotes, orders/refunds, legitimate revenue/analytics, ads/promotions/video approvals, announcements/news ticker, roles/audit logs, subscription/billing policies, AI quotas/worker settings and security.
- Complete owner's previously stated **26-section dashboard specification** before declaring complete. Admin UI menu presence **does not** prove permission or endpoint persistence.
- Admin's application-level AI generation is **unlimited**; must remain authenticated and within provider, legal and infrastructure constraints. No supplier AI. Secure role assignment via trusted admin action and MFA; no client-controlled admin role.
- Announcement bar is admin-managed, transparent elegant header-mounted, coherent AR/EN, mobile-safe. Admin search by exact company, brand, product code and pricing.

## Private RFQ / Alibaba-like procurement acceptance contract

1. Authenticated buyer submits canonical SKU/variant, actual manufacturer, sizes, quantity, destination and desired deadline. Server saves idempotently in a transaction. **Only confirmed UUID is a success.**
2. Server identifies **all AND only** verified/approved, **active subscribed** suppliers with the exact canonical same factory product + dimensions/finish/variant. **Never use NULL-catalogue wildcard matching**, loose text similarity, self-reported subscription, or send to all companies indiscriminately. Notification and recipient records created transactionally.
3. Supplier responds only for assigned request/product, with real quantity, per-unit price, tax, freight, delivery, expiry, payment terms. Private by company. Prevent IDOR / cross-company access via server authorization.
4. Buyer compares authentic quotes. Recommend lowest **full landed cost**, fastest delivery and stock but buyer selects supplier. No automatic selection/acceptance.
5. Accepted supplier/offer and order are created atomically and once, with locking/idempotency, expiration/stock validation, audit, notifications. Payment only after verified merchant webhook or authenticated transaction, then invoice and logistics.
6. Test controlled buyer + two eligible companies + one unrelated + one suspended/unsubscribed + admin: exact dispatch count, no competitor pricing/IDOR, duplicate submission, accept once, payment states and tax/freight accuracy.

## AI and Offline 3D

- AI: Qwen Image Edit through **Runpod** with a validated IDEА-specific masked worker contract, not unsupported Gemini, generic incompatible public worker, simulated imagery or a phantom successful generation.
- Input: original user room, exact manufacturer tile material, verified physical tile sizes for floors/walls, optional independent floor/wall selectors. Output only targeted masked surfaces, preserving original furniture, people, fittings, ceiling, windows, geometry, colors and untouched pixels as far as technically verifiable. Tests must compare masked/outside pixels and honestly describe JPEG re-encoding limits.
- Separate floor, walls, both; robust async jobs/cancel/failure/retry, private storage, correct watermark per owner, quota enforcement server-side. Never expose Runpod/API tokens or security policy in frontend.
- **Offline 3D** stays manual/in-browser and materially distinct from AI. Load real tile faces and dimensions, bathroom/living/kitchen presets, controllable lighting/camera/surfaces, realistic PBR where available. Preserve existing valid models and UX, do not resurrect removed Tile Showroom or duplicate room designer routes. Verify a cold offline scenario before claiming fully offline.

## Language and account providers

- Provider sign-in requested: **Google, Apple, Microsoft, Facebook, X/Twitter, telephone OTP** (WhatsApp only if legitimately supported and authorized). Display authentic brands, enable buttons **only** after provider, account linking, signed PHP/MySQL session, callbacks, CSRF/state/nonce/PKCE, account verification, admin MFA and end-to-end tests are live. Do not fabricate credentials, enabled state, email/SMS, session or approvals.
- Admin gets no public admin self-registration. Existing PHP/MySQL account IDs, roles, password hashes and provider mappings must survive migration.

## Security, QA and no-destruction release policy

- Protect `main`: required reviews, passing status checks, no forced push/deletion, restrict secrets and production workflow. The previously observed `main.protected=false` and disabled tag-targeted ruleset are NOT protection.
- Fix `SECURITY.md` template to actual supported branch/reporting contacts (never fake incident response addresses). Review Code Scanning/Dependabot/Secret Scanning alerts under authorized security access; inaccessible alerts are **UNKNOWN**, never zero. Patch dependencies selectively, never uncontrolled `npm audit fix --force`.
- Account auth/RBAC + CSRF, SQL injection, XSS, tenancy/IDOR, media upload, OAuth state/PKCE/token validation, rate limiting, audit and admin MFA are blockers for live commerce.
- Run unit/build/PHP syntax, integration with actual PHP/MySQL test database, browser E2E (AR/EN, RTL/LTR, day/night, Safari iPhone, Android, desktop) and visual parity against approved screenshots. Record commit sha, test output, live endpoint response and rollback evidence.
- Before any production deployment: read current live code/schema, take **restorable verified backup** of SQL/files/media, validate migration safety, preserve data. Preview exactly same SHA as release, deploy compatible slices with rollback; smoke test real `idea-dh.com` after publishing. If external service or Vercel quota prevents preview, state blocker and don't pretend last Vercel link reflects new code.

## Execution discipline / scope priorities

P0: inventory current source, existing cPanel backend/schema, credentials path and restorable backup; prevent unauthorized overwrite; document and protect `main`.
P1: migrate frontend auth and all 3 roles to existing PHP/MySQL, server-enforced RBAC and real sessions; owner screenshot parity remains mandatory.
P2: exact maker/SKU subscription-aware RFQ matcher, supplier private bids, buyer selection, order/invoice and payments.
P3: admin 26 sections, supplier panels, social OAuth and company ads with real persistence and safe provider connections.
P4: Runpod Qwen worker, 5/unlimited/0 AI quota, masked edits, verified offline 3D materials and sizes.
P5: bilingual visuals, responsive QA, SEO/performance, final GitHub/Vercel/cPanel release. Work on independent safe tasks in parallel if possible; never silently substitute technology or invent finished results.

## PR hazards known at capture

- Avoid whole-branch merges of old broad platform candidates `#60 #67 #66 #65 #50 #44` into latest `main`; cherry-pick only reviewed, tested compatible patches.
- `#46` Gemini and `#43` Supabase-first roles conflict with latest owner architecture; do not merge as-is.
- Unverified supplier import `#74` must NOT auto-publish candidate catalogue rows.
- Related UI `#87 #89 #90` and merged `#88 #92` may overlap; diff current `main` first, not re-introduce stale header.
- `#101` is stacked on `#98`, not directly on `main`; provider buttons must fail-closed.
- Dependency updates `#56 #82 #59` require test-based evaluation; `.figma/backup` updates `#57 #58` are not production priority.
- `#103` fixes fire-and-forget RFQ UX on a **Supabase** adapter; PR is draft, not production-complete PHP/MySQL.

## Evidence, conflicts and maintenance

- Companion status and next action: `docs/IDEA_EXECUTION_STATUS_20261112.md`.
- Detailed RFQ/account acceptance research: `docs/IDEA_MARKETPLACE_ACCOUNTS_RFQ_AUDIT_20261112.md` (PR #103; not yet merged into main).
- Earlier owner transcripts: `docs/owner-requirements-20261108.txt`; earlier recovery `docs/execution-reference-20261112.md`. Do not silently treat historical claims (e.g. user counts, Runpod health) as current facts.
- All source screenshots/films approved by owner must be preserved by source file+hash and explicitly verified visually before replacing any image. Unavailable references are a blocker, not permission to reinterpret.
- Update this spec only on explicit owner decisions, with date and a short rationale. Mark original instructions superseded where conflicting; do not delete history. Always report verified / source-only / blocked separately.

## عربي — القرار التنفيذي النهائي

**المشروع PHP/MySQL على cPanel فقط؛ GitHub مرجع الأكواد وVercel معاينة واحدة؛ 3 واجهات يوزر وشركات وأدمن مطابقة للصور بدون تغيير؛ العربي كله عربي والإنجليزي كله إنجليزي؛ الهيدر زجاج شفاف من غير لون؛ البرتقاني مطابق للوجو؛ منع البلاطات المكررة من نفس المصنع في الواجهة دون حذف سجلات؛ طلب السعر يروح لكل الموردين المعتمدين والمشتركين المطابقين لنفس المنتج والمقاس؛ العميل هو اللي يختار العرض؛ الشركة لا تستخدم AI، اليوزر خمس محاولات مدى الحياة بعد تسجيل الحساب، الأدمن غير محدود؛ AI Runpod/Qwen و3D Offline؛ ممنوع نشر أو تعديل قاعدة الإنتاج من غير Backup وتجارب حقيقية. أي زر وهمي أو Data وهمية أو Merge لفرع قديم متعارض ممنوع.**
