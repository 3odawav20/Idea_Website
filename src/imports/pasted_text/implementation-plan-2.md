CONTINUE — FINISH THE USER-FACING IMPLEMENTATION

The backend foundation and real authentication integration are now in the repository.

Commit:
3fc736ec32f05b4902f460cb96b068d4436c777a

Do NOT create another audit.
Do NOT stop at configuration_required.
Do NOT return a checklist without implementing the next layer.

Continue implementing the actual user-facing application against the backend architecture already committed.

==================================================
PRIORITY 1 — COMPLETE BUYER EXPERIENCE
==================================================

Connect all existing buyer/account pages to real backend data.

Implement:

profile
account data
favorites
notifications
RFQ history
quote history
request details
settings

No mock records.
No fake counters.
No localStorage business state.

==================================================
PRIORITY 2 — COMPLETE SUPPLIER EXPERIENCE
==================================================

The supplier/business UI must use real backend queries and mutations.

Implement:

supplier onboarding
company profile
company ownership
supplier dashboard
supplier listings
product management
product images
availability
pricing
RFQ inbox
RFQ details
quote creation
quote editing
quote history
notifications

Enforce ownership on every mutation.

==================================================
PRIORITY 3 — COMPLETE RFQ FLOW
==================================================

The currently implemented RPC foundation must now be connected to the real screens.

Buyer:

Product
→ Request Quote
→ quantity
→ reference image
→ notes
→ submit

Then:

request persisted
→ supplier matching
→ recipient records
→ notifications

Supplier:

login
→ RFQ inbox
→ open request
→ create quote
→ submit

Buyer:

open request
→ receive quotes
→ compare quotes
→ view supplier
→ accept/reject/continue

No fake quote generation.

==================================================
PRIORITY 4 — COMPLETE ADMIN
==================================================

Connect admin screens to actual backend data.

Admin must be able to:

view users
view suppliers
review suppliers
view RFQs
view quotes
view marketplace state
view source registry

No fake admin data.

Admin access must come only from backend-controlled role data.

==================================================
PRIORITY 5 — STORAGE
==================================================

Connect the existing private storage abstraction to all real upload flows.

At minimum:

RFQ images
supplier logo
profile image
supplier product images

The UI must:

upload
validate
persist
reload
display
handle failure

No browser-memory-only uploads.

==================================================
PRIORITY 6 — NOTIFICATIONS
==================================================

Connect the notification UI completely.

Real records only.

Implement:

list
unread count
open
mark read
mark all read where appropriate
deep link to referenced RFQ/quote/order

==================================================
PRIORITY 7 — OAUTH
==================================================

Implement actual provider flows where the project already exposes provider buttons.

Providers required by the existing product specification:

Facebook
Google
Apple
X/Twitter

When credentials are absent:

do NOT simulate success.

Show the existing truthful configuration state.

==================================================
PRIORITY 8 — PAYMENT
==================================================

Keep payment truthful.

Do not claim production payment is enabled.

Build the production payment interface and webhook-ready architecture inside the repository.

Until credentials/provider configuration exists:

CONFIGURATION_REQUIRED

No fake successful payment.

==================================================
PRIORITY 9 — PRODUCT DATA
==================================================

Keep all source data exact.

Never invent:

names
dimensions
SKU
product IDs
images
variants
prices

Keep source registry factual.

==================================================
PRIORITY 10 — REMOVE REMAINING MOCK BUSINESS LOGIC
==================================================

Search the entire codebase for:

localStorage
seedOffersFor
mock
demo
fake
placeholder
hardcoded quote
hardcoded supplier
hardcoded notification

Classify every result.

Remove production business mocks.

It is acceptable to keep explicit test fixtures in test-only code.

==================================================
PRIORITY 11 — TESTS
==================================================

The project currently has no test script.

Add a proper test setup.

Add tests for:

authentication
role resolution
authorization
supplier ownership
RFQ creation
supplier matching
quote calculations
notifications
favorites

Then add browser E2E tests for:

buyer
supplier
admin

==================================================
PRIORITY 12 — MOBILE / IPHONE
==================================================

Do a full browser verification pass.

Test:

320
360
375
390
393
414
430

Verify:

login
signup
product
gallery
share
RFQ
upload
account
supplier
notifications
back navigation
RTL

No horizontal overflow.
No clipped content.
No broken dialogs.
No keyboard overlap.

==================================================
PRIORITY 13 — ACCEPTANCE MATRIX
==================================================

Update:

docs/feature-acceptance-matrix.md

Use:

PASS
FAIL
NEEDS_VERIFICATION
CONFIGURATION_REQUIRED
BLOCKED

Only use PASS after actual verification.

==================================================
PRIORITY 14 — BUILD AND COMMIT
==================================================

Run:

pnpm build
tests
git diff --check

Commit all real implementation changes to:

https://github.com/3odawav20/Idea_Website

main

Do not alter or remove commit:

3fc736ec32f05b4902f460cb96b068d4436c777a

==================================================
FINAL RULE
==================================================

Keep going until the existing UI is actually connected to the backend foundation.

Do NOT stop merely because the migration exists.

Do NOT stop merely because Supabase client exists.

Do NOT stop merely because Login displays a configuration message.

The goal is:

REAL UI
+
REAL DATA
+
REAL AUTH
+
REAL RFQ
+
REAL SUPPLIER
+
REAL QUOTES
+
REAL NOTIFICATIONS
+
REAL STORAGE
+
REAL ADMIN
+
REAL SECURITY
+
REAL MOBILE UX

No fake production behavior.