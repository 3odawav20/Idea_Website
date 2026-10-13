PRODUCTION MARKETPLACE TRANSFORMATION
PHASE 2 — TURN THE CURRENT PROTOTYPE INTO A REAL SECURE MARKETPLACE

You have completed the full audit.

The audit confirmed that the current application is visually developed but the business/backend layer is still a prototype.

DO NOT continue cosmetic work as the primary task.

From this point forward, your mission is to transform the existing application into a REAL production-capable ceramic/sanitary marketplace while preserving the existing UI, brand identity, product data, and working frontend flows.

Do not destroy the current frontend.
Do not replace the current design with a generic template.
Do not invent product data.

==================================================
CURRENT VERIFIED BLOCKERS
==================================================

The current system has:

- localStorage-based backend state
- client-controlled roles
- demo Admin access
- simulated RFQ
- simulated offers
- seed-generated offers/prices
- simulated notifications
- sandbox-only payment
- no real server authentication
- no real RBAC enforcement
- no RLS
- no real OAuth
- no production email
- no secure file storage
- no production test suite
- incomplete source ingestion
- 30 unprocessed sources
- 4 blocked sources
- 4 failed sources
- 2 partial sources
- source-08 still PARTIAL
- build currently passes

This is NOT production-ready.

Fix these systematically.

==================================================
ARCHITECTURAL GOAL
==================================================

Use Supabase as the real application backend unless an existing project architecture clearly requires something else.

Use:

- Supabase Auth
- Supabase PostgreSQL
- Row Level Security (RLS)
- Supabase Storage
- server-side / edge functions where appropriate
- secure environment variables
- proper relational data model
- real authorization
- real business workflows

Do not use localStorage as the source of truth for business-critical data.

localStorage may remain only for harmless client preferences/cache where appropriate.

==================================================
PHASE 1 — DATABASE ARCHITECTURE
==================================================

Design and implement a normalized production database.

At minimum, evaluate and implement tables/entities for:

profiles
roles
companies
suppliers
supplier_users
addresses
products
product_variants
product_images
categories
product_categories
favorites
buyer_requests
buyer_request_items
request_images
request_recipients
supplier_quotes
supplier_quote_items
orders
order_items
payments
notifications
messages/conversations where needed
audit_logs
source_registry
source_imports where needed

Use proper primary keys, foreign keys, indexes, timestamps, statuses, constraints, and ownership relationships.

Do not blindly create every table if an existing schema already provides the correct structure.

Reuse existing good architecture.

==================================================
PHASE 2 — AUTHENTICATION
==================================================

Replace client-controlled authentication with real Supabase Auth.

Implement:

- email/password signup
- login
- logout
- session persistence
- password reset
- email verification when configured
- secure session handling
- authenticated route protection

Users must never be able to choose:

role = admin

from a public form.

The server/database must determine the user's role.

==================================================
PHASE 3 — RBAC
==================================================

Implement real role-based access control.

Roles:

BUYER
SUPPLIER
ADMIN

Potentially support additional staff roles later if useful.

Permissions must be enforced at database/RLS level.

Frontend route hiding is NOT sufficient.

Test:

Buyer cannot access supplier-owned records.

Supplier cannot access another supplier's records.

Supplier cannot access admin records.

Buyer cannot become admin.

Anonymous users cannot access private account/business data.

Admin can manage authorized platform data.

==================================================
PHASE 4 — RLS
==================================================

Implement Row Level Security carefully.

Every sensitive table must have explicit policies.

Examples:

A buyer can read/create/update their own requests according to workflow rules.

A supplier can only access requests routed to that supplier.

A supplier can only manage products owned by their company.

A supplier cannot modify another supplier's products.

A user can read their own notifications.

A user cannot read another user's private account data.

Admin access must be explicit and secure.

Test RLS with different identities.

Do not consider RBAC complete until database-level enforcement works.

==================================================
PHASE 5 — SUPPLIER / COMPANY SYSTEM
==================================================

Turn supplier accounts into real business entities.

Implement:

company registration
company profile
company logo
business information
contact information
supplier status
verification state
company users
supplier-owned products
supplier dashboard
incoming RFQs
quotation management
quotation history

Support multiple users belonging to the same supplier company where architecture allows it.

Ownership must be database enforced.

==================================================
PHASE 6 — PRODUCT OWNERSHIP
==================================================

Separate:

catalog/source products
supplier-owned marketplace listings

Do not corrupt source-imported catalog data.

A source product must preserve:

source
source ID
name
SKU
dimensions
images
variants
source URL
supplier/source relationship
provenance

Where a supplier marketplace listing references a catalog product, use relationships instead of duplicating or mutating the authoritative source information unnecessarily.

==================================================
PHASE 7 — REAL RFQ SYSTEM
==================================================

Remove seedOffersFor and all fake quote generation from the production path.

Create a real RFQ lifecycle.

BUYER:

Create request
Select product/category
Enter quantity
Upload image/reference
Add notes
Submit request

DATABASE:

Create immutable/request history
Match eligible suppliers
Create request recipient records
Notify suppliers

SUPPLIER:

Receive request
Open request
Review product
Review quantity
Review image
Enter unit price
Enter total
Enter lead time
Enter availability
Add notes
Submit quotation

BUYER:

Receive real quotation
Compare quotations
View supplier
Review total
Review unit price
Review MOQ
Review lead time
Accept/reject/continue according to business flow

Every state transition must be stored.

No hardcoded quotes.

No fake offers.

No generated demo prices in production.

==================================================
PHASE 8 — QUANTITY PRICING
==================================================

The quotation model must support quantity-aware pricing.

At minimum:

requested_quantity
unit_price
total_price
currency
minimum_order_quantity
lead_time
availability
notes
expires_at if supported

Validate calculations server-side.

Never trust a total supplied only by the browser.

==================================================
PHASE 9 — REAL NOTIFICATIONS
==================================================

Replace local simulated notifications with database-backed notifications.

Events include:

new request
supplier matched
new quotation
quotation updated
request status changed
account events
admin events where applicable

Implement unread/read state.

Implement notification history.

==================================================
PHASE 10 — REAL EMAIL
==================================================

Set up a production email abstraction.

Use environment variables for credentials.

Never commit email credentials.

Implement email events for:

welcome/account verification
password reset if required by provider
new RFQ
new supplier quote
important status changes

Handle email failures gracefully.

Never claim email delivery merely because an API call was attempted.

Log safe operational information without exposing private data.

==================================================
PHASE 11 — REAL SOCIAL LOGIN
==================================================

Implement actual OAuth providers that are configured and usable.

Support the providers required by the current project specification, such as:

Facebook
Google
Apple
X/Twitter

Do not leave fake buttons.

If provider credentials/configuration are not available in the current environment:

- build the provider integration correctly
- make the UI state truthful
- expose an explicit CONFIGURATION_REQUIRED state
- document exactly which environment variables and provider settings are required

Never put provider secrets in Git.

==================================================
PHASE 12 — SECURE FILE STORAGE
==================================================

Replace unsafe/local-only upload behavior with Supabase Storage or equivalent secure storage.

Support:

profile images
company logos
RFQ reference images
product images where supplier uploads are allowed

Use appropriate buckets and access policies.

Prevent unauthorized file access.

Validate:
- file type
- file size
- ownership
- upload permissions

==================================================
PHASE 13 — PRODUCT SHARING
==================================================

Every product must have a permanent deep-linkable route.

Verify:

direct URL
browser refresh
mobile opening
social sharing
copy link

The correct product must load from a direct shared URL.

Implement native share when supported.

Implement graceful fallback where not supported.

==================================================
PHASE 14 — ACCOUNT / USER EXPERIENCE
==================================================

Connect all currently designed account screens to real backend data.

No fake dashboard statistics.

No fake request counts.

No fake quotes.

No demo notifications.

No fabricated supplier information.

Every displayed value must originate from actual application state/data.

==================================================
PHASE 15 — ADMIN
==================================================

Create a secure admin console.

Admin must be able to review/manage:

users
suppliers
supplier verification
products
catalog
RFQs
quotes
orders
notifications
content
source imports
source health
platform configuration

Remove any client-side "demo admin" login mechanism from production.

Admin creation/privilege elevation must happen through secure server/database-controlled processes.

==================================================
PHASE 16 — PAYMENT ARCHITECTURE
==================================================

Do not pretend Sandbox payment is production.

Audit the existing payment flow.

Create a clean payment abstraction that supports production gateway integration later/now according to the actual business requirements.

Where a real payment provider is configured:

- server-created payment intent/session
- webhook verification
- payment status persistence
- idempotency
- failure handling

Never trust client payment success.

If no production provider credentials exist yet, leave the integration structurally ready and clearly mark it CONFIGURATION_REQUIRED rather than fake-success.

==================================================
PHASE 17 — MARKETPLACE DISCOVERY
==================================================

Connect the marketplace UI to real data.

Search must query the real data layer.

Filters must query the real data layer.

Sorting must use real product values.

Supplier filtering must use real supplier relationships.

Favorites must persist per user.

Do not use static arrays for authenticated business functionality.

==================================================
PHASE 18 — SOURCE DATA
==================================================

Do not mix backend modernization with destructive data cleanup.

Preserve source provenance.

Continue source processing systematically.

Current known source state:

40 total sources
30 unprocessed
4 blocked
4 failed
2 partial

source-08:
216 products
929 variants
676 image references
54 failed/unverified images
PENDING UI proof

Art Ceramic:
475 products
475 unique IDs/slugs
name + image + size present in raw dataset

Do not fabricate missing information.

For blocked/failed sources:
record the exact failure and keep them visibly PARTIAL/BLOCKED/FAILED until actually resolved.

==================================================
PHASE 19 — TESTING
==================================================

Add a real test framework.

At minimum create tests for:

authentication
RBAC
RLS
product access
supplier ownership
RFQ creation
supplier matching
quotation creation
quotation calculations
notification creation
shareable routes
permission boundaries

Add browser E2E tests for core user journeys.

==================================================
PHASE 20 — E2E BUSINESS JOURNEYS
==================================================

Test the complete real flows:

FLOW A — BUYER

Sign up
→ verify/login
→ browse
→ search
→ open product
→ specify quantity
→ upload reference image
→ submit RFQ
→ receive supplier responses
→ compare quotes
→ continue with supplier

FLOW B — SUPPLIER

Register
→ company profile
→ login
→ see incoming RFQ
→ open request
→ submit quotation
→ view quote history

FLOW C — ADMIN

Admin login
→ supplier management
→ user management
→ source status
→ RFQ monitoring
→ quote monitoring

FLOW D — MOBILE

Repeat critical buyer flow on iPhone-sized viewport.

==================================================
PHASE 21 — MOBILE / APPLE QA
==================================================

Do not sacrifice the existing Apple/mobile quality.

Verify:

320
360
375
390
393
414
430

and tablet/desktop sizes.

Pay particular attention to:

Safari
safe areas
keyboard
forms
sticky buttons
drawers
modals
image gallery
navigation
back button
deep links
share sheet

No horizontal overflow.

==================================================
PHASE 22 — ERROR / SECURITY TESTS
==================================================

Actively attempt:

buyer reading another buyer's request
supplier reading another supplier's request
supplier editing another supplier product
buyer accessing admin
anonymous access to private data
client changing role values
client changing prices
client spoofing supplier IDs
unauthorized file access
invalid RFQ IDs
invalid quote IDs

All must be denied appropriately.

==================================================
PHASE 23 — DEVELOPMENT / PRODUCTION SEPARATION
==================================================

Remove development-only shortcuts from production:

demo login
forced admin session
seedOffersFor
fake quote generators
fake notification generators
development shortcuts
mock business responses

If mocks are useful for development, isolate them explicitly behind development-only mechanisms.

==================================================
PHASE 24 — ENVIRONMENT VARIABLES
==================================================

Create/document the exact required environment variables.

Never hardcode secrets.

Separate:

development
preview
production

Do not commit actual secret values.

==================================================
PHASE 25 — DEPLOYMENT
==================================================

After implementation:

pnpm build

Run all automated tests.

Run browser tests.

Run git diff --check.

Verify Git status.

Commit meaningful changes.

Push to:

https://github.com/3odawav20/Idea_Website

main

Then verify the remote commit.

Then verify actual Vercel repository linkage.

IMPORTANT:

Do not deploy blindly to the old repository.

The intended GitHub repository is:

3odawav20/Idea_Website

NOT:

3odawav20/IDEA-Website

==================================================
FINAL ACCEPTANCE STANDARD
==================================================

The project is NOT "complete" simply because:

- build passes
- UI looks good
- routes exist
- buttons exist
- Supabase is connected
- database tables exist

It is complete only when the real critical business flows work.

At the end return:

1. DATABASE STATUS
2. AUTH STATUS
3. RBAC STATUS
4. RLS STATUS
5. SUPPLIER STATUS
6. RFQ STATUS
7. QUOTATION STATUS
8. NOTIFICATION STATUS
9. EMAIL STATUS
10. OAUTH STATUS
11. FILE STORAGE STATUS
12. PAYMENT STATUS
13. PRODUCT DATA STATUS
14. SOURCE IMPORT STATUS
15. MOBILE QA STATUS
16. BROWSER E2E STATUS
17. AUTOMATED TEST STATUS
18. SECURITY TEST STATUS
19. BUILD STATUS
20. GIT STATUS
21. REMOTE COMMIT SHA
22. VERCEL STATUS
23. CONFIGURATION REQUIRED
24. REMAINING BLOCKERS

Use only these statuses:

COMPLETE
PARTIAL
BROKEN
MISSING
BLOCKED
CONFIGURATION_REQUIRED
NEEDS_VERIFICATION

Never use "COMPLETE" without evidence.

==================================================
FINAL RULE
==================================================

Do not optimize for appearing finished.

Optimize for building a real marketplace that can safely handle:

BUYERS
SUPPLIERS
PRODUCTS
QUANTITIES
RFQs
SUPPLIER MATCHING
QUOTATIONS
ORDERS
NOTIFICATIONS
ACCOUNTS
ADMINISTRATION
AUTHENTICATION
PAYMENTS
SOURCE DATA

The existing frontend is the starting point.
The goal now is to make the business system REAL.