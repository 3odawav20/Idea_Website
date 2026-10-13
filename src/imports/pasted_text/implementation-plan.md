CONTINUE IMPLEMENTATION — CONNECT THE EXISTING UI TO THE NEW PRODUCTION DATA MODEL

The Marketplace foundation migration has now been committed to main:

Commit: 2bf271d

The database schema, relationships, constraints and RLS foundation now exist in version-controlled code.

DO NOT stop here.
DO NOT perform another audit.
DO NOT create another checklist.

NOW CONNECT THE EXISTING APPLICATION TO THIS NEW BACKEND ARCHITECTURE.

==================================================
1. AUTHENTICATION
==================================================

Replace the current localStorage authentication implementation.

Find every authentication-related module.

Create the real application authentication layer.

The UI must use the authenticated user/session abstraction instead of trusting localStorage.

Implement:

register
login
logout
session persistence
session restore
password reset
auth state listener
protected routes

A newly registered public user must default to BUYER.

The browser must NEVER be able to promote itself to ADMIN.

==================================================
2. ROLE RESOLUTION
==================================================

Connect the existing UI to the profiles/roles/memberships model from:

supabase/migrations/20260915190000_marketplace_foundation.sql

Create a single source of truth for:

current user
current role
current company
supplier membership

Remove duplicated role logic.

==================================================
3. SUPPLIER DASHBOARD
==================================================

Connect the supplier UI to the actual backend tables.

Supplier must be able to:

view company
edit company
manage owned listings
manage product information
manage availability
manage price
view assigned RFQs
create quotations
view quotation history

All queries must enforce supplier ownership.

==================================================
4. BUYER DASHBOARD
==================================================

Connect buyer account pages to real backend data:

profile
favorites
RFQs
quotes
notifications
account settings

No fake counters.
No hardcoded request data.
No mock quotes.

==================================================
5. REAL RFQ
==================================================

Replace the localStorage RFQ workflow.

Buyer:

open product
→ choose quantity
→ upload reference image where supported
→ enter notes
→ submit request

Persist to:

buyer_requests
RFQ items
request recipients
request images

Use actual database records.

==================================================
6. REMOVE seedOffersFor
==================================================

Find every reference to:

seedOffersFor

Remove it from the production application flow.

Do not generate fake supplier quotes.

Development fixtures must be isolated from production.

==================================================
7. REAL SUPPLIER MATCHING
==================================================

Implement actual supplier matching using existing supplier/listing/catalog relationships.

The system should identify suppliers that can realistically respond to the requested product/category.

Create request recipient records.

==================================================
8. REAL QUOTATIONS
==================================================

Supplier:

open assigned RFQ
→ enter unit price
→ enter quantity
→ enter availability
→ enter MOQ
→ enter lead time
→ add notes
→ submit quotation

Persist quote and quote items.

Calculate/validate totals through trusted backend logic.

Do not trust totals supplied only by the browser.

==================================================
9. REAL NOTIFICATIONS
==================================================

Connect notifications UI to the notifications table.

When:

RFQ is created
supplier is assigned
quote is created
quote changes
request status changes

create the corresponding notification.

The notification center must display real records.

==================================================
10. FAVORITES
==================================================

Replace localStorage favorites with persisted favorites.

Add:

add favorite
remove favorite
list favorites

Make them user-specific.

==================================================
11. PRODUCT DEEP LINKS
==================================================

Preserve the existing product URLs.

Verify direct product routes continue to work with the new data layer.

Product links must survive:

refresh
new tab
mobile
shared URL

==================================================
12. STORAGE ABSTRACTION
==================================================

Do not leave image upload as fake local-only behavior.

Create a storage service abstraction.

The current temporary provider can be configured later.

The application code must expose a clean interface for:

upload
delete
get URL
validate ownership

Do not expose private files publicly by accident.

==================================================
13. ADMIN
==================================================

Replace the current demo Admin session.

Admin must resolve from backend role data.

The admin UI must use real records.

Remove any frontend mechanism that grants Admin merely by selecting a role.

==================================================
14. ERROR HANDLING
==================================================

When backend/auth/database is unavailable:

show a real error state.

DO NOT silently fall back to localStorage.

DO NOT show fake success.

==================================================
15. TYPES
==================================================

Align frontend types with the new backend schema.

Avoid duplicate conflicting models.

Prefer one canonical domain model.

==================================================
16. TESTING
==================================================

Add/update tests for:

login
session restore
role resolution
supplier ownership
buyer RFQ creation
supplier RFQ access
quote creation
quote calculations
notifications
favorites
authorization

==================================================
17. BROWSER VERIFICATION
==================================================

Use the real application UI.

Test:

BUYER:
signup
login
browse
open product
favorite
create RFQ
submit

SUPPLIER:
login
open assigned RFQ
submit quote

BUYER:
see quote
open notification

ADMIN:
login
access admin
manage authorized data

Also verify:

back navigation
deep links
refresh
mobile layout
RTL

==================================================
18. PRODUCTION ACCEPTANCE
==================================================

Update:

docs/feature-acceptance-matrix.md

Only mark a feature PASS after real verification.

Do not mark:

Auth
RFQ
Quotes
Admin
Storage

as PASS merely because code exists.

==================================================
19. BUILD
==================================================

Run:

pnpm build

Run all tests.

Run:

git diff --check

==================================================
20. GIT
==================================================

Commit the actual implementation changes to:

https://github.com/3odawav20/Idea_Website

main

Do not rewrite or remove the existing migration commit.

==================================================
FINAL REPORT
==================================================

Return:

FILES IMPLEMENTED
DATABASE INTEGRATION
AUTH STATUS
BUYER STATUS
SUPPLIER STATUS
RFQ STATUS
QUOTE STATUS
NOTIFICATION STATUS
FAVORITES STATUS
ADMIN STATUS
STORAGE STATUS
TESTS
BROWSER QA
BUILD
COMMIT SHA
REMOTE VERIFICATION
REMAINING CONFIGURATION_REQUIRED ITEMS

Do not say production-ready yet unless the real critical user flows have actually been verified.