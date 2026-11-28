# PHP/MySQL API contract matrix (repository evidence only)

This document records contracts proven by files in this checkout. It does not describe or assume the contents of production-only APIs. The browser client uses same-origin requests, credentials, no-store caching, JSON, and a CSRF token for JSON mutations (see `src/app/backend/dashboardApi.ts`).

## Present and directly reviewable: `/api/marketplace.php`

Source: `server/cpanel/api/marketplace.php`; it includes `platform-core.php` and `tile-dimensions.php` from the same API directory. `platform-core.php` is absent from this checkout and the current cPanel build manifest, so the endpoint's runtime contract is **not complete/deployable from this repository alone** until the actual dependency is supplied.

| Method | `action` | Inputs | Response / behavior | Guard |
| --- | --- | --- | --- | --- |
| GET | `ticker` | — | `{announcements:[...]}` active published ticker rows, time-window filtered | Public |
| GET | `search` | `q` (max 100 chars) | `{products,similar,method}`; metadata similarity, explicitly not visual AI | Public catalogue; admin can see private catalog fields |
| GET | `bootstrap` | — | `{user,csrf,companies,announcements,packages,role}` | Authenticated session; announcement/package visibility varies by admin |
| GET | `products` | `company_id` (32 lowercase hex) | `{products:[...]}` (up to 500) | Company member or admin |
| GET | `staff` | `company_id` | `{staff:[...]}` | Company owner/admin |
| GET | `sales` | `month` (`YYYY-MM`, constrained to 2020–2099) and optional `company_id` | `{month,timezone,basis,rows,caveat}`; Africa/Cairo and captured payments only | Company access for scoped report; otherwise admin |
| GET | `ad-requests` | optional `company_id` | `{requests:[...]}` | Company access when scoped; admin when unscoped |
| POST | `product-save` | `company_id`, optional `id`, `sku`, `title`, `brand`, `manufacturer`, `category`, dimensions/size, optional finish/color/image/private price/description | `{saved:true,id,approval:"pending_platform_admin_review"}`; created/edited products are inactive and storefront approval resets | Company member; validates category, dimensions, image path and private price; CSRF |
| POST | `product-approval` | `id`, boolean `approved`, optional notes | `{saved:true}` | Admin; company must be verified to approve; CSRF/audit |
| POST | `product-active` | `company_id`, `id`, boolean `active` | `{saved:true}` | Company member; activation requires verified company and admin-approved listing; CSRF |
| POST | `staff-save` | `company_id`, email, boolean `active` | `{saved:true,scope:"this_company_only"}` | Company owner/admin; cannot add admin or revoke owner; CSRF |
| POST | `company-status` / `company-suspend` | `company_id`, and for status: `status`, `reviewed:true` to verify | `{saved:true,state,products_remain_disabled:true}` | Admin; CSRF/audit; suspending disables company products |
| POST | `ticker-save` | optional id, `text_ar`, `text_en`, optional same-origin `link_path`, state `draft|published|archived` | `{saved:true,id}` | Admin; CSRF; links must be local paths |
| POST | `package-save` | id, integer `price_cents`, integer `duration_days`, boolean `is_published` | `{saved:true}` | Admin; CSRF |
| POST | `ad-request` | company_id, published package_id, title, message, `media_kind:image|video` | `{saved:true,id,status:"pending",video_requires_admin_spec_review:true}` | Company member; CSRF |
| POST | `ad-review` | id, state `pending|needs_revision|approved|rejected`, notes | `{saved:true,publishing_separate:true}` | Admin; CSRF/audit; review does not itself publish media |

The endpoint sets JSON/no-store/nosniff headers, checks the session, limits POST body size, validates CSRF, uses parameterized SQL via `accountQuery`, and scopes company operations. Detailed account helper semantics depend on the missing `platform-core.php`.

## Frontend calls with no implementation in this checkout

| Frontend call | Endpoint/action used | Repository evidence / status |
| --- | --- | --- |
| Customer/supplier mailbox | `/api/accounts.php?action=mailbox` | `dashboardApi.ts`; `accounts.php` is absent. |
| Customer RFQ create | `/api/accounts.php?action=request-quotes` | Request fields: `product_id`, `product_title`, `variant_label`, `quantity`, `unit`, `governorate`, `destination`, `delivery_date`, `project_type`, `phased`, `notes`, `deadline_hours`; response expected as `{request:...}` or RFQ object with id. Server checks cannot be verified. |
| Supplier quote | `/api/accounts.php?action=price-quote` | Sends request id, price/quantity/tax/shipping and client-computed cents plus delivery/payment/product details; client-side total computation is not proof of server-side recomputation. PHP action is absent. |
| Buyer quote accept/reject | `/api/accounts.php?action=accept-quote` / `reject-quote` | Accept expects optional `order` in response. No idempotency/transaction/ownership behavior can be verified here. |
| Admin dashboard overview | `/api/accounts.php?action=admin-overview` | No server implementation present in this checkout. |
| Supplier RFQ route | `/api/quotes-api.php?action=supplier-rfqs` then fallback to accounts mailbox on 404/non-JSON/`UNKNOWN_ACTION` | `quotes-api.php` is absent. The fallback is client behavior, not evidence the mailbox endpoint exists. |
| AI quota, job, create/process/download, company verification, file upload, admin verification | `/api/platform.php?action=...` | `platform.php` is absent. `server/cpanel/idea-accounts-api/platform-ai.php` contains AI helper/action functions but is not a public standalone endpoint and not included in `dist/api`; its account core and route wiring are not here. |
| Account login/register/logout/session/profile/password reset/social providers | `/api/accounts.php` and `/api/social-auth.php` per client | Account handler is absent; `social-auth.php` is present but depends on host-side PHP setup/configuration. Source tests do not verify production callback or persistence. |

Do not route RFQ, quote, order, customer, or authentication actions through `marketplace.php`: its inspected dispatch table does not implement them. Do not infer an endpoint is a PHP include based only on the filename; obtain the authoritative server router and source from the production owner.

## PHP/MySQL migrations present

- `server/cpanel/migrations/20261103_idea_marketplace_mysql.sql` creates marketplace metadata, staff, announcements, package, and ad-request tables and seeds unpublished example packages via `INSERT IGNORE`.
- `server/cpanel/migrations/20261122_social_auth_mysql.sql` creates social identity, OAuth state, WhatsApp OTP, and rate-limit tables.

Both are source-reviewed only. No live schema was queried or changed. Validate them on a disposable database matching the production engine/version before operator-approved use.
