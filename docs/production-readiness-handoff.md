# IDEA production-readiness handoff

**Audit date:** 2026-11-24
**Repository ref inspected:** `main` at `7d6d47a`
**Audit branch:** `v0/idea-production-readiness`
**Production target:** `https://idea-dh.com` / cPanel document root `/home/lsenet5/idea-dh.com`

## Decision

**Not approved for production promotion.** The frontend production bundle builds, but this checkout does not contain the PHP account/platform services required by the dashboard workflows. The existing cPanel release script correctly requires the default `main` branch, a clean checkout, green regression/PHP checks, live PHP/MySQL health, per-commit approval, and a compatible live HTML shell. None of the live-site, database, authenticated-account, or Runpod acceptance checks were run. Do not treat this audit or a successful Vite build as production acceptance.

No production server, cPanel path, live database, credentials, or provider request was accessed or mutated. No migration was applied. Existing user changes to `pnpm-lock.yaml` were preserved. Existing `.cpanel.yml` and `scripts/cpanel-safe-release.sh` were not changed. The browser verification was against the local preview only.

## Repository and deployment findings

- The UI is a Vite/React app. `npm run build:cpanel` succeeded and generated `dist/` (Vite 6.4.6, 2,149 modules). The main JS chunk is 1.68 MB minified (407 KB gzip); Vite emitted its >500 KB chunk advisory.
- `scripts/build-cpanel.mjs` packages `dist/api/visualize.php`, `ask-idea.php`, `social-auth.php`, `marketplace.php`, `tile-dimensions.php`, `api/.htaccess`, the root `.htaccess`, and `data/idea-catalogue.json`.
- Of the account/platform backend files referenced by the frontend, this checkout does **not** contain `api/accounts.php`, `api/platform.php`, `api/quotes-api.php`, or `platform-core.php`. `dashboardApi.ts` calls account actions for `mailbox`, `request-quotes`, `price-quote`, `accept-quote`, `reject-quote`, and `admin-overview`, and platform actions for AI quota and company verification. Their production contracts therefore cannot be established from this repository. `/api/quotes-api.php?action=supplier-rfqs` is attempted first and has a documented fallback to `accounts.php?action=mailbox`; neither endpoint implementation is present here. No unsupported action was invented.
- `server/cpanel/api/marketplace.php` requires `server/cpanel/api/platform-core.php`, which is not present in the checkout or in the current cPanel bundle. As generated, that endpoint cannot be confirmed runnable from the bundle alone. The independent `idea-accounts-api/platform-ai.php` is not included by the cPanel build script; the public `api/visualize.php` is a separate implementation. Confirm the production include/layout before deploying either.
- The MySQL migrations in this repository are additive sidecar schemas: `server/cpanel/migrations/20261103_idea_marketplace_mysql.sql` and `20261122_social_auth_mysql.sql`. No schema was inspected on the live database, and no migration was run. The supplied `supabase/migrations/20261103130000_company_control_center.sql` is a separate Supabase path and is not evidence for the requested PHP/MySQL production source of truth.
- `server/cpanel/api/marketplace.php` implements marketplace catalogue, company staff, sales reporting, ticker, ad packages, and ad requests/review. It does not implement customer RFQ/quote/order lifecycle actions; those are delegated to the absent accounts API.
- Social sign-in buttons fail closed when providers are not configured. Source-level wiring/tests do not establish production provider registration or successful callback, OTP delivery, or session persistence.

## Verification record

| Check | Result | Evidence / limit |
| --- | --- | --- |
| `npm run build:cpanel` | Pass | Vite build + cPanel package script completed; output is the local ignored `dist/` directory. |
| Browser local preview | Pass, limited | Local preview `http://localhost:3000`, homepage rendered in dark desktop at 1216×636. This does not exercise protected dashboards or live APIs. |
| `node --test tests/*.test.mjs` | **Fail: 120 pass, 11 fail** | 131 tests reported. Failures include legacy assertions expecting Supabase-era names/schema or older JSX, and one test cannot resolve `esbuild`. No tests were removed. See the console/test output from this run. |
| `npx tsc --noEmit` | **Blocked/fail** | TypeScript reports missing `@types/node` and deprecated `baseUrl` under the installed TypeScript version. |
| PHP lint/tests | **Not run** | PHP CLI is unavailable in the workspace (`php: command not found`). |
| Mobile/tablet, RTL, and light-theme browser matrix | **Not completed** | Only the dark desktop homepage was visually inspected. |
| MySQL/auth/RFQ/quote/order persistence | **Not verified** | No DB/API credentials or backend implementation in checkout; no mock/intercepted response was used as persistence evidence. |
| Production AI image generation | **Not verified** | No authenticated production account or Runpod call was made. |

The regression suite has stale expectations that need reconciliation against the intended MySQL implementation; its failures are not being waived. The unresolved dependency/test-runner issue and TypeScript configuration/dependency issues also need correction before the release gate can pass.

## Tracked PHP files requiring deployment review

These are the tracked PHP files in this repository (not a claim that all are safe or complete to upload):

- `server/cpanel/api/ask-idea.php`
- `server/cpanel/api/marketplace.php`
- `server/cpanel/api/social-auth.php`
- `server/cpanel/api/tile-dimensions.php`
- `server/cpanel/api/visualize.php`
- `server/cpanel/idea-accounts-api/platform-ai.php`
- `server/cpanel/idea-accounts-api/tile-dimensions.php`

Also review, without blindly overwriting production configuration: `server/cpanel/.htaccess` and `server/cpanel/api/.htaccess`. The current `build-cpanel.mjs` stages only the first five PHP files into `dist/api`; it does not include the two `idea-accounts-api` files, migration SQL files, `accounts.php`, `platform.php`, `quotes-api.php`, or `platform-core.php`. Establish the authorized production backend layout and dependencies before packaging/deployment.

## Migration safety

The two tracked MySQL migrations are additive (`CREATE TABLE IF NOT EXISTS` and `INSERT IGNORE`) and do not delete existing user/company/order data. This is only a source review, not proof of compatibility with the production MySQL/MariaDB version or existing indexes/constraints. Before application: take and verify a database backup; inspect current schema and migration history; run each migration against a disposable copy; inspect resulting indexes, constraints, collation, and seeded package rows; obtain explicit production approval; then apply using the established DB operator process. Do not run migrations through the frontend release script.

## Safe release / rollback

Keep the protected cPanel workflow unchanged. `scripts/cpanel-safe-release.sh` only stages from a **clean `main` checkout**, runs `npm ci`, the complete Node test suite, three PHP tests, PHP syntax checks, and `npm run build:cpanel`; it then stages a release and waits for a separately written per-commit approval before any frontend promotion. Promotion additionally checks the live PHP/MySQL health endpoint and existing HTML-shell compatibility. It preserves old hashed assets, backs up the current `index.html`, swaps only that entrypoint, verifies public routes and backend health, and restores the old `index.html` on promotion failure. It explicitly does not deploy PHP, write SQL, or replace live configuration.

Do not execute this release script from this audit branch or against production. First reconcile the required source/backend, dependencies, stale tests, and PHP checks; review and merge an approved commit to `main`; use the authorized cPanel process and review the exact SHA; then perform the production-only acceptance flow below. If frontend promotion fails, the script's rollback is to restore the backed-up `index.html` while retaining already-added hashed assets. For a successful promotion later found faulty, use the recorded backup/index and approved release procedure; do not delete assets or restore databases by guesswork.

## Remaining production acceptance checklist

1. Obtain the authoritative production PHP sources/includes (including the account API, platform API, quote API or explicit proof that it is only an internal include, `platform-core.php`, and the actual router/rewrite configuration). Map every frontend call to a real HTTP method, query/body contract, authorization rule, CSRF rule, status code, and JSON response. Confirm document upload path and private storage rules.
2. Confirm production PHP/MySQL versions, schema, indexes, transaction/isolation behavior, payment data semantics, backups, and migration history. Review/apply only the additive migrations through the approved database process.
3. Ensure quote/order backend operations enforce ownership/company scope, eligible supplier assignment, quote revision rules, uniqueness/idempotency, server-recomputed totals, atomic acceptance/order creation, and notification persistence. Exercise concurrent duplicate submissions and cross-tenant access-denial tests.
4. Configure test accounts and test email/OAuth/WhatsApp/payment providers safely. In an authorized production-like environment, verify registration, login/logout/session refresh, password recovery, profile edits, company verification uploads, admin moderation, role isolation, RFQ creation, supplier assignment and quote, buyer comparison/accept/reject, order/notifications, and persistence after refresh/logout/login. Use disposable test records and clean them only under an approved cleanup procedure.
5. Verify Runpod endpoint ID, `idea-qwen-mask-v1` worker contract, server-only key, callback/polling, image/mask output format, quotas, signed private inputs, storage limits, floors/walls/both, oversize mobile input normalization, and failure behavior using authorized test accounts. Do not declare image success without a provider result and valid verified edit mask.
6. Run the release gate in a clean `main` checkout with PHP CLI/extensions and dependencies installed; repair test expectations based on implemented behavior (do not delete tests), fix `esbuild` resolution and TypeScript dependency/config errors, run PHP lint and all PHP tests, and retain logs.
7. Complete browser checks for customer, business, and admin roles in Arabic RTL and English LTR; desktop/tablet/mobile; light/dark themes; keyboard/focus/error states; real server responses. Never use mocked responses to claim persistence.
8. Review exact cPanel staged files and production PHP include paths; take a verified backup; stage the approved SHA; independently review the staging report; record the exact SHA in the protected approval file only after explicit operator approval; promote frontend, verify public routes and PHP/MySQL health, then run the authenticated workflow checks.

Until these items pass, report the site as **not production-accepted**. The current local build and preview are useful validation, not a go-live signal.
