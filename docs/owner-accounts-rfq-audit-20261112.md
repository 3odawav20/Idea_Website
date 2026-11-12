# IDEA Accounts — owner requirements audit, 2026-11-12

**Source of truth:** owner instructions in “مراجعة تحديثات الحسابات” and the currently checked-in source. This document is a gap analysis, **not** a live production acceptance report.

## Invariants

- Keep approved customer, business, and admin layouts and all supplied image assets unchanged.
- Existing cPanel PHP/MySQL accounts and data are authoritative; no parallel Supabase accounts. Frontend social login must not silently create separate users or assign roles.
- Marketplace RFQ: a customer selects a real catalogue product, quantity/sqm, delivery place, deadline and notes; server selects verified and subscribed **eligible suppliers** for the exact matching product and delivery region and persists one private invitation per company with deduplication and notifications. A supplier can see only its own invitations and offer.
- Customer compares offers by complete landed cost **(unit price × quantity + shipping + tax)**, estimated delivery and conditions, and chooses the winner. Never automatically award the cheapest bid without buyer approval. Persist decision, revision/version, notification trail, order and audit log.
- Company roles are strictly company-scoped (owner, manager, staff) in PHP/MySQL access checks, including staff, products, quotes, prices, documents and notifications.
- Admin controls legal company verification/suspension, listings and brands/SKUs, users and roles, RFQ and winner history, orders, payments and invoices, subscriptions, monthly *captured* sales, promotions/ad packages, bilingual ticker/hero content and assets, quotas, audit log and integrations.
- AI: anonymous users **zero**, customer accounts **five lifetime attempts**, companies **zero**, admin **unlimited at app layer**. Enforce this on backend, not React.
- Arabic pages remain fully RTL and English pages fully LTR; matching owner-approved dark/light images and responsive sizes are mandatory.

## Verified in the GitHub source

- `src/app/pages/AccountEntry.tsx`: distinct customer, business and admin sign-in/registration forms, mandatory business identity fields, file picker, local validation, multilingual copy.
- `src/app/components/AccountSocialMethods.tsx` (this branch): five correctly identifiable provider icon buttons, phone OTP UI, backend readiness checks, disabled until configured, no fake active OAuth buttons.
- `src/app/pages/Business.tsx` and `src/app/pages/Account.tsx`: RFQ request, supplier offer, offer comparison, account layouts **exist as source components**.
- `src/app/pages/Admin.tsx`, `src/app/pages/AdminStudio.tsx`, `src/app/pages/CompanyControlCenter.tsx`: administration UI **exists**.
- `server/cpanel/api/marketplace.php`: PHP/MySQL sidecar with company role guards, catalog, private price handling, sales reporting and advertising requests; it imports `platform-core.php` not verified to exist on production.
- `server/cpanel/migrations/20261103_idea_marketplace_mysql.sql`: additive schema candidate; not proof migration ran.

## Unverified or currently incomplete

| Area | Finding |
| --- | --- |
| Customer registration/login/password recovery | Entry UI exists; the required live `VITE_IDEA_ACCOUNT_API` and current PHP endpoints weren't verified, and the site also contains a separate Supabase-backed older UI. |
| Google/Apple/Facebook/X/Microsoft OAuth | Brand UI on this branch; no verified provider client IDs, callback URLs, secure `state`/`nonce`/PKCE or MySQL-account linking. The backend must implement `/auth/providers`, `/oauth/{provider}` and session callback. |
| Phone SMS sign-in | Form and start/verify requests are ready, but no verified SMS provider or protected server OTP implementation. |
| Admin MFA and RBAC | Admin OTP field exists; backend enforcement for real accounts and all admin actions not verified. |
| Company approval and RFQ eligibility | UI and partial SQL/PHP code exist; no verified production end-to-end supplier eligibility, unique invitations, subscriptions, isolation and notifications. |
| Customer offer comparison and winner acceptance | Partial UI/mock data exists; no real multi-company end-to-end test on production. |
| Products and 3D | Catalogue imagery and 3D pages exist; no claim every imported supplier record is approved or offline. |
| AI quotas and Runpod | Integration candidates exist; no verified server-side 5 / 0 / unlimited checks or compatible live masked Runpod worker. |
| Promotions, sales, payments, recovery emails | Candidate UI and PHP sidecar exist; captured-payment reconciliation, SMTP, production provider callbacks not verified. |
| Business day/night photos | Old files exist; new user-supplied two images in the current turn must be added as exact binary assets before claiming parity. |
| cPanel/Vercel | Vercel `READY` proves frontend deployment, not MySQL or PHP availability. cPanel release requires backup, safe migrations, live account testing and rollback. |

## Non-negotiable go-live checklist

1. Back up current `/home/lsenet5/idea-dh.com` plus MySQL and verify restoration.
2. Inspect actual deployed PHP/MySQL platform API, roles, sessions, schema and saved files. Do not overwrite with placeholders or migrations without data review.
3. Implement approved provider credentials server-side and register verified callback origins on providers. Return only truly available options from `GET /auth/providers`; no frontend secrets.
4. Exercise real customer/company/admin signup, sign-in, OTP, password recovery, role isolation, company approval, matching RFQ, multiple sealed offers, winner acceptance and audit.
5. Test desktop/mobile light/dark, Arabic RTL and English LTR, user-supplied artwork, OAuth failures, quotas and provider failure recovery.
6. Build and deploy to staging, compare with original domain, then promote with explicit verification and rollback.
