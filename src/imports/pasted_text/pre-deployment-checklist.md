FINAL PRE-DEPLOYMENT REQUIREMENT — EVERY USER-FACING FEATURE MUST ACTUALLY WORK

This is a HARD acceptance gate before the website is uploaded/published.

I do NOT care whether a feature looks implemented.

I do NOT care whether a button exists.

I do NOT care whether a page renders.

I care whether a real visitor can use every advertised service successfully.

==================================================
NON-NEGOTIABLE ACCEPTANCE RULE
==================================================

BEFORE DEPLOYMENT:

EVERY USER-FACING SERVICE THAT APPEARS IN THE WEBSITE MUST BE FUNCTIONAL.

If a feature is visible to visitors, it must work.

A visible button must perform its action.

A visible form must submit successfully.

A visible account flow must actually create/use an account.

A visible RFQ flow must actually create a request.

A visible supplier workflow must actually process supplier data.

A visible quotation flow must actually create and retrieve quotations.

A visible sharing option must actually share/copy the correct URL.

A visible notification must come from the real notification system.

No fake functionality.

No dead buttons.

No placeholder actions.

No demo-only production behavior.

No silent failures.

No "coming soon" functionality disguised as live functionality.

==================================================
1 — BUILD A COMPLETE FEATURE INVENTORY
==================================================

Scan the entire website.

Find every:

- page
- route
- button
- CTA
- form
- menu item
- dropdown
- tab
- filter
- search control
- product action
- sharing action
- account action
- supplier action
- admin action
- modal
- drawer
- upload
- navigation link
- notification action
- checkout/order action
- RFQ action
- quote action

Create:

docs/feature-acceptance-matrix.md

Every item must have:

FEATURE
LOCATION
VISIBLE TO USER
EXPECTED BEHAVIOR
BACKEND REQUIRED
CURRENT STATUS
TESTED
PASS/FAIL
NOTES

==================================================
2 — NO UNIMPLEMENTED VISIBLE FEATURES
==================================================

For EVERY visible feature:

Either:

A) Implement it fully

OR

B) Remove it from the production UI.

Do NOT leave non-functional controls visible.

Do NOT hide broken functionality behind fake success messages.

==================================================
3 — BUYER EXPERIENCE
==================================================

A visitor must be able to:

Browse products
Search products
Filter products
Sort products
Open product details
Open image gallery
Zoom product images
Share product
Copy product link
Register
Login
Logout
Manage account
Manage profile
Save favorites
Create RFQ
Enter quantity
Upload reference image
Add notes
Submit request
View submitted requests
Receive supplier responses
View quotations
Compare quotations
Accept/reject according to the implemented business flow
View notifications

Every step must actually work.

==================================================
4 — SUPPLIER EXPERIENCE
==================================================

A supplier must be able to:

Register/login
Create company profile
Manage company information
Upload logo
Manage products
Manage product images
Manage variants
Manage pricing
Manage availability
Receive RFQs
Open RFQs
View request details
Respond with quotation
Set quantity/pricing
Set lead time
Set availability
View quote history
View notifications

Every step must actually work.

==================================================
5 — ADMIN EXPERIENCE
==================================================

Admin functionality must be real and protected.

Admin must be able to perform the actual management functions exposed by the UI.

No client-side demo admin.

No URL trick.

No role manipulation from browser.

No fake admin dashboard statistics.

==================================================
6 — RFQ END-TO-END TEST
==================================================

This test is mandatory.

Use a real test buyer account.

Buyer:

login
→ open product
→ select quantity
→ attach image
→ add notes
→ submit RFQ

Then verify:

request exists in database
request item exists
image is stored
matching suppliers are determined
supplier receives request
supplier notification exists

Then:

supplier login
→ open RFQ
→ submit quotation

Then verify:

quotation exists in database
quotation belongs to correct supplier
quotation is visible to correct buyer
price is calculated correctly

Then:

buyer login
→ open request
→ see supplier quote
→ compare
→ continue/accept/reject

Verify the entire chain.

==================================================
7 — AUTHENTICATION TEST
==================================================

Test:

new registration
login
logout
refresh
session persistence
forgot password
reset password
email verification where configured
invalid password
invalid account
duplicate registration

No fake session.

No localStorage-only authentication in production.

==================================================
8 — SOCIAL LOGIN TEST
==================================================

For every visible provider:

Facebook
Google
Apple
X/Twitter

Either:

REAL WORKING LOGIN

or:

REMOVE THE BUTTON UNTIL CONFIGURED.

Never show a provider as active when it cannot actually work.

==================================================
9 — SEARCH TEST
==================================================

Search must return correct products.

Test exact product names.

Test partial names.

Test Arabic/RTL where supported.

Test zero results.

Test filters.

Test sorting.

Test pagination/loading.

==================================================
10 — PRODUCT TEST
==================================================

For random products from every important source:

Open product
→ verify correct identity
→ verify name
→ verify dimensions
→ verify SKU where available
→ verify images
→ verify variants
→ verify source relationship

No product may display incorrect information.

==================================================
11 — PRODUCT SHARE TEST
==================================================

For several real products:

Copy URL.

Open URL in:

new tab
incognito/private session
mobile viewport

The exact product must open.

Native share must work where supported.

Fallback copy-link behavior must work.

==================================================
12 — IMAGE / UPLOAD TEST
==================================================

Test actual upload behavior.

Verify:

valid file
invalid file
oversized file
mobile upload
preview
save
persistence
authorization
access after refresh

No fake upload progress.

==================================================
13 — NOTIFICATIONS TEST
==================================================

Trigger real events.

Verify:

notification created
correct recipient
correct type
correct reference
unread state
read state
notification history

==================================================
14 — MOBILE TEST
==================================================

Test real user flows at:

320px
360px
375px
390px
393px
414px
430px
tablet
desktop

At minimum on the equivalent of iPhone Safari behavior.

Verify:

navigation
search
filters
product detail
gallery
share
register
login
forms
RFQ
uploads
supplier UI
account
notifications
back navigation

NO horizontal scrolling.

NO inaccessible buttons.

NO clipped modals.

NO keyboard overlap.

NO broken sticky elements.

==================================================
15 — BACK / ESCAPE TEST
==================================================

From every important screen:

The user must be able to leave safely.

Test:

browser Back
in-app Back
close buttons
modal close
drawer close
escape key where appropriate
breadcrumb navigation
home navigation

A user must never become trapped in a flow.

==================================================
16 — ERROR TEST
==================================================

Intentionally cause failures.

Examples:

network failure
invalid input
missing product
expired session
unauthorized action
invalid RFQ
invalid quote
failed upload

Verify:

useful error
clear recovery path
no blank page
no endless spinner
no fake success

==================================================
17 — LOADING / EMPTY STATES
==================================================

Every asynchronous feature must have:

loading state
success state
empty state
error state
retry where appropriate

==================================================
18 — PERFORMANCE
==================================================

Verify:

initial load
product list loading
search
image loading
mobile interaction

Fix obvious blocking performance problems.

Do not sacrifice functionality for artificial optimization.

==================================================
19 — SECURITY ACCEPTANCE
==================================================

Attempt:

buyer accessing another buyer's data
supplier accessing another supplier's data
supplier editing another supplier's product
buyer accessing admin
anonymous accessing private data
client assigning ADMIN role
client changing quote total
client spoofing supplier ID

All unauthorized actions must fail.

==================================================
20 — DEV/MOCK AUDIT
==================================================

Search the whole project for:

localStorage
seedOffersFor
demo
mock
fake
placeholder
test admin
hardcoded quote
fake notification
fake price

Every occurrence must be classified:

PRODUCTION
DEVELOPMENT
TEST
DOCUMENTATION

Nothing intended for development/testing may silently run in production.

==================================================
21 — PRODUCTION CONFIGURATION
==================================================

Before deployment verify:

environment variables
database connection
authentication
storage
email
OAuth
payment
server URLs
API URLs
allowed origins
redirect URLs
production domain configuration

Anything not configured must NOT be presented to visitors as working.

==================================================
22 — FINAL DEPLOYMENT BLOCKER
==================================================

DO NOT DEPLOY if any important visitor-facing feature is:

MISSING
BROKEN
FAKE
DEMO-ONLY
UNTESTED

The only acceptable exceptions are infrastructure features explicitly marked:

CONFIGURATION_REQUIRED

and hidden/disabled from users until configured.

==================================================
23 — FINAL ACCEPTANCE MATRIX
==================================================

Create a final report:

FEATURE | STATUS | TEST RESULT | EVIDENCE

Statuses:

PASS
FAIL
CONFIGURATION_REQUIRED
BLOCKED

There must be no unexplained visible FAIL items.

==================================================
24 — FINAL USER EXPERIENCE TEST
==================================================

Pretend you are a completely new visitor.

Start from the homepage.

Do NOT use developer shortcuts.

Do NOT directly manipulate the database.

Do NOT inject localStorage state.

Do NOT manually change roles.

Use only what a real customer sees.

Complete the entire customer journey.

Then repeat as:

real buyer
real supplier
real admin

If anything breaks, fix it before declaring acceptance.

==================================================
FINAL RULE
==================================================

THE WEBSITE WILL NOT BE CONSIDERED READY UNTIL A REAL VISITOR CAN ACTUALLY USE THE SERVICES SHOWN IN THE WEBSITE.

"Looks implemented" = FAIL.

"Button exists" = FAIL.

"Build passes" = FAIL.

"Page loads" = FAIL.

"Mock works" = FAIL.

"LocalStorage demo works" = FAIL.

"Configuration exists but was never tested" = FAIL.

REAL USER ACTION
+
REAL BACKEND RESULT
+
REAL PERSISTENCE
+
REAL SECURITY
+
REAL MOBILE FUNCTIONALITY
=
PASS