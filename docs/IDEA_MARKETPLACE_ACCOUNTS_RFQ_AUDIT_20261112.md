# IDEA Marketplace — Account/RFQ Acceptance Audit (2026-11-12)

Source baseline: `main@741cc66f99bf1b1d8eb5270499758a4945c86ce8`. Reviewed source on GitHub and the original owner requirements. This document is **not a production certification** and must not be interpreted as one.

## Approved owner contract

- Exactly three account entry experiences, matching the owner-provided customer, company and admin visual references. No unauthorized redesign, no white-background substitution, and correct Arabic-only RTL / English-only LTR plus consistent day/night variants.
- **Customer:** authentic account/login/recovery; catalogue by maker, SKU, size and finish; private RFQ; all verified active *subscribed* suppliers carrying the exact canonical product/variant receive the same RFQ; buyer compares offers and **chooses** a supplier. No automatic auction winner. Orders, invoices, notification history, favorites and saved 3D designs.
- **Supplier:** approved company identity, company-only catalog/SKUs/stock/private prices, RFQ inbox and private offer response, staff/manager permission grants, monthly paid-sales metrics, and ads/media requests requiring admin approval. Absolutely no customer AI generation privilege.
- **Super Admin:** unrestricted application-level AI generation; all company/product/price/customer/RFQ/order and subscription controls, marketing approvals, announcements, staff permissions, analytics, audit logs and system policy settings. The admin dashboard is **not fully privileged** simply because its menu renders.
- AI: 5 lifetime attempts per real customer; none for suppliers; unlimited application-level admin attempts, server-side atomic reservation, idempotency and failure refunds; Runpod/Qwen worker (not Gemini); edit only masked walls/floors with true product dimensions, protect original scene.
- **Production database:** existing PHP/MySQL on cPanel, retaining all users, supplier companies, RFQs, catalog, orders, assets and backups. GitHub source; Vercel previews; no Supabase parallel identity store. No destructive migration.

## Source audit table

| Area | Evidence in repository | Status / missing acceptance |
|---|---|---|
| Customer registration and three approved scenes | `src/app/pages/AccountEntry.tsx`, `AccountEntry.css`, `Auth.tsx`; dedicated account routes | **UI source exists**; exact visual parity on phones/day-night and PHP/MySQL identity/session persistence not certified |
| Six requested sign-in methods | `src/app/components/SocialAuth.tsx`; open draft PR #101 `feat/idea-six-auth-providers-20261112` | **Not certified live**; provider credentials, callbacks, cookie/session bridge, Apple, Google, Microsoft, Meta, X and SMS require provider-specific verification; never claim enabled from icons |
| Customer catalog/search/3D | Product/search pages, 3D studio, original material assets | **Code exists**; per-product source/variant correctness, cold offline caching and persistence still require complete live testing |
| Customer RFQ creation | `RequestQuote.tsx`, `src/app/backend/db.tsx`; server function `create_buyer_request` returns UUID | **Important defect fixed in this branch**: no more fire-and-forget save plus premature basket clear; real persistence still calls Supabase in candidate source |
| Distribution to matching subscribed suppliers | `supabase/migrations/20260915193000_auth_workflows_and_storage.sql` function `match_request_suppliers` | **BLOCKER**: legacy matcher accepts `l.catalog_product_id IS NULL` (over-broad fallback), and does not enforce paid/active subscription or exact code/manufacturer/size/finish. Replace with PHP/MySQL canonical, approved and subscription-eligible matching; no deployment of old rule |
| Company RFQ quotation | `Business.tsx`, `submit_supplier_quote` Supabase RPC | **This branch fixes server-confirmed save and visible errors**, but current RPC only saves item price/quantity plus partial availability/lead time; shipping, tax and payment terms entered by suppliers are not persisted; server chooses member company implicitly for multi-company logins |
| Customer quote comparison and selection | `Account.tsx` | **Partially repaired**: sort offers by quoted subtotal and preserve manual choice; `api.acceptOffer` remains **unavailable**. No completed server-side selection, order, or production payment; UI now reports the gap rather than silently failing |
| Customer invoices, payment and delivery | `Account.tsx`, `Checkout.tsx`; `db.tsx` payment methods unavailable | **BLOCKED**: no verified Paymob/payment webhook, COD/CAPTURE, invoices, Bosta delivery or refunds. Never show fabricated paid revenue |
| Company admin / staff / private prices | `CompanyControlCenter.tsx`, `BusinessGrowth.tsx` | **Code exists**, still uses `requireSupabase` and Supabase RPC/storage for company/prices/media/sales; cPanel `marketplace.php` contains session/CSRF and company scoping but the React clients are not migrated or live acceptance tested |
| Admin full controls | `AdminStudio.tsx`, `Admin.tsx`, `BusinessGrowth.tsx` | **NOT complete**: dashboards/menus are source-only; product prices/metadata, sales, announcements and ads depend on Supabase. API `updateBusinessStatus`, payment settings and other actions in `db.tsx` are explicitly unavailable. Admin's 26-section specification is not production-verified |
| AI quotas and scene safety | PHP `visualize.php` / `platform-ai.php`; role/mask tests | **Source tests only**; live authenticated Qwen/Runpod generation, server quota atomicity, failed-job refund and output isolation not certified; prior production audit reported Runpod unavailable |
| PHP/MySQL cPanel | `server/cpanel/api/marketplace.php`, additive `20261103_idea_marketplace_mysql.sql` | **Backend candidate exists**, but schema, live deployed routes, authenticated sessions, CSRF and cross-company authorization must be checked against the actual production database before replacing anything |
| Language/responsiveness/themes | App locale, theme CSS, reference screenshots, UI tests | **Partially tested**; complete AR-only/EN-only, RTL/LTR, iPhone Safari, Android, desktop and actual visual reference parity still unverified |

## Correct workflow (buyer chooses; not an auction)

1. Signed-in buyer chooses the exact product, original manufacturer/brand, SKU, size/finish, needed square meters or pieces, delivery destination, notes and response deadline.
2. The **server** saves a unique, idempotent RFQ and normalized items in one transaction. Server identifies **every** active, approved, subscribed supplier whose approved SKU/variant is the same canonical material; no null-ID wildcard.
3. Server creates one recipient record and one private inbox/notification per eligible supplier, plus a visible admin audit event. Ineligible, unverified, unsubscribed and mismatched suppliers receive nothing.
4. Suppliers reply with their own available quantity, unit price, delivery fee, VAT/tax, lead time, terms, expiry and documents; each supplier cannot see a competitor's offer or personal buyer information beyond the permitted request.
5. Buyer compares **delivered total = quantity × unit price + tax + shipping**, stock fit, delivery and warranty. Display a low-price indicator, but the **buyer makes the final selection**. Never auto-accept an auction winner.
6. Selection is **one server-side atomic action**, with authorization, quote expiry and quantity checks. Create order once with stable totals, notify selected and unselected suppliers appropriately, and keep an audit trail.
7. Payment/fulfilment status is driven exclusively by authenticated payment/logistics webhooks or verified staff action; monthly paid-sales reports exclude unpaid/phantom orders and handle refunds.

## Suggested customer-friendly features (not automatically approved scope)

- Show "lowest delivered cost", "fastest delivery", "stock confirmed", and "best matching exact SKU" as separate **filters**, not a forced winning bid.
- Allow one-click customer RFQ from each product card and optional multi-product lists while keeping each variant's size and manufacturer exact.
- Supplier response reminders, explicit quotation deadlines, clear unavailable/expired states, user notifications and private attachments.
- Admin RFQ funnel: matched suppliers, notified, replies, selected, delivered, paid, dispute/refund; each stage sourced from real DB events with tenant-safe access.

## Release gates — do not merge into live PHP/MySQL until verified

1. Inspect actual cPanel tables, live account/session contract and API routes; take a tested restorable backup and pin `main`, assets and database snapshot.
2. Implement one PHP/MySQL identity and RBAC API for all three roles; preserve existing accounts, rotate no secrets, and avoid parallel Supabase identity.
3. Implement the exact matching and private bid/selection workflow in additive migrations; use canonical product/variant and active subscription checks.
4. Test with **one buyer, two eligible suppliers, one ineligible supplier, one suspended supplier and one admin**, verifying recipients, cross-company denial, privacy, admin actions, double-click idempotency and no data leaks.
5. Verify provider OAuth/SMS per callback on the real cPanel domain, user recovery and CSRF/cookie flags.
6. Test AI fifth/sixth attempt, admin unlimited, supplier blocked, concurrent job idempotency, cancellation/refund and masked furniture preservation.
7. Run Node/PHP/database tests, real browser tests for both locales and themes, mobile widths (390px+) and Vercel preview. Static/CI GREEN is **not** proof of live database operation.
8. Only then merge reviewed compatible changes and deploy to `idea-dh.com` with rollback and post-deploy checks.

## Changes in this branch

- Customer RFQ basket is cleared **per item only after a confirmed server-issued UUID**. Failed items remain, errors visible, no phantom success.
- Supplier quotations wait for a saved UUID before navigation, errors remain visible, incorrect company assignment is refused in the UI; fake defaults removed.
- Buyer comparison sorted by currently returned item subtotal, **not** a fabricated delivered total; selection remains manual and blocked with explicit message pending secure server acceptance.
- Added static regression tests for the above; they do **not** certify live PHP/MySQL integration.

**Explicit non-achievements:** No production MySQL migration, no verified multi-company RFQ broadcast, no paid order, no completed three-role security audit, and no cPanel deployment were performed by this branch.
