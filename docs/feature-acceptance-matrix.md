# IDEA pre-deployment feature acceptance matrix

This is an evidence-based gate for the current implementation. `PASS` means
the behavior was exercised in Chromium or derived from immutable local source
data; it does not mean that a simulated client-side workflow is production-safe.

| Feature | Location | Visible | Expected behavior | Backend required | Current status | Tested | PASS/FAIL | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Browse catalogue | Home, Products | Yes | Show imported catalogue products | No for static catalogue | Implemented | Chromium | PASS | Art Ceramic direct product route rendered. |
| Product deep link | `/product/:slug` | Yes | Open the referenced product after direct navigation | No for Art Ceramic | Implemented | Chromium | PASS | `/product/manila-95` rendered Manila. |
| Search | Header, Products | Yes | Search loaded catalogue values | No for static catalogue | Implemented | Chromium | NEEDS_VERIFICATION | Search route rendered; result relevance needs source-wide browser tests. |
| Product filters | Products | Yes | Filter loaded catalogue attributes | No for static catalogue | Implemented | Prior visual QA | NEEDS_VERIFICATION | Requires exhaustive value/zero-result tests. |
| Product gallery | Product detail | Yes | Show correct source gallery | No for static catalogue | Implemented | Source data audit | NEEDS_VERIFICATION | External image accessibility is not fully verified. |
| Production database/RLS foundation | `supabase/migrations/20260915190000_marketplace_foundation.sql` | No | Persist marketplace entities with database authorization | Yes | Version-controlled migration added | Static migration review | CONFIGURATION_REQUIRED | Must be applied to the connected Supabase project and tested with separate identities. |
| Favorites | Cards, account | Yes | Persist favorites per authenticated user | Yes | Supabase `favorites` query | Build/static review | CONFIGURATION_REQUIRED | No localStorage fallback; requires migration and configured browser keys for live verification. |
| Buyer registration/login | Auth pages | Yes | Real authenticated identity/session | Yes | Supabase Auth | Build/static review | CONFIGURATION_REQUIRED | Email/password signup, login, reset and session listener are implemented; new-user trigger assigns buyer server-side. |
| Social login | Auth pages | Yes | OAuth provider sign-in | Yes | Simulated provider value | Code audit | FAIL | No configured OAuth flow. |
| Account/profile | Account pages | Yes | Read/write own account data | Yes | localStorage mock | Code audit | FAIL | No server authorization or persistence. |
| Supplier onboarding | Business pages | Yes | Create and verify company ownership | Yes | localStorage mock | Code audit | FAIL | Upload/approval are simulated. |
| Supplier product management | Business pages | Yes | Manage supplier-owned listings | Yes | localStorage mock | Code audit | FAIL | No database ownership enforcement. |
| RFQ creation | Request quote | Yes | Persist request and route it to suppliers | Yes | Supabase `create_buyer_request` RPC | Build/static review | CONFIGURATION_REQUIRED | Browser invokes a transactional RPC; it cannot be called until migrations are applied. |
| Supplier quotes | Business, Account | Yes | Persist supplier quotation and calculate totals | Yes | Supabase `submit_supplier_quote` RPC | Static migration review | CONFIGURATION_REQUIRED | Trusted database total is generated; existing dashboard form still requires query integration and a live test. |
| Notifications | Account, Business | Yes | Persist events for correct recipients | Yes | Supabase `notifications` table | Build/static review | CONFIGURATION_REQUIRED | Session refresh reads records and mark-read writes `read_at`; RPCs create workflow notifications. |
| Checkout/payment | Checkout | Yes | Server-verified payment result | Yes | Sandbox simulation | Code audit | FAIL | No gateway/webhook/idempotency. |
| Admin | Admin pages | Yes | Securely manage platform state | Yes | Backend role gate | Build/static review | CONFIGURATION_REQUIRED | Demo sign-in/reset controls removed; RLS `is_admin()` is the role source. Admin data queries remain to be implemented. |
| File uploads | Business/RFQ | Yes | Validate, store, authorize and persist files | Yes | Private Storage abstraction | Static migration review | CONFIGURATION_REQUIRED | Private bucket, owner-path policies and signed URL API are versioned; RFQ file control remains to be wired. |
| Source registry | Admin/data | Yes | Preserve authoritative source status | Yes for operations | Static registry | JSON audit | PASS | 40 sources: 30 not processed, 4 blocked, 4 failed, 2 partial. |
| AbaElMozahem data | Store import | Indirect | Load verified products/media into catalogue | Yes for reliable import | Runtime source fetch | Browser/data audit | FAIL | Source-08 remains PARTIAL, with 54 failed/unverified images. |
| RTL and mobile | All UI | Yes | Layout works at mobile widths and Arabic RTL | No | Implemented | Partial Chromium QA | NEEDS_VERIFICATION | Full iPhone matrix and console test not complete. |

## Deployment gate

**FAIL — do not present this build as a production marketplace.** Visible
identity, supplier, RFQ, quote, upload, notification, admin, and payment
services require a real Supabase implementation with Auth, PostgreSQL, RLS,
Storage and provider configuration before they can pass.
