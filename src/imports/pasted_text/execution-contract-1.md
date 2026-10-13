IMPORTANT — FULL TXT EXECUTION CONTRACT

You must treat the attached/current TXT specification as the authoritative execution specification for this project.

I am NOT asking for a summary.
I am NOT asking for an audit only.
I am NOT asking which items remain.

I am asking you to READ THE ENTIRE TXT FILE FROM BEGINNING TO END and EXECUTE EVERY REQUIREMENT INSIDE IT.

==================================================
ABSOLUTE RULE
==================================================

Every sentence, requirement, instruction, feature, condition, validation rule, design requirement, UX requirement, backend requirement, testing requirement, responsive requirement, data requirement, navigation requirement, security requirement, and acceptance condition contained in the TXT must be:

READ
→ UNDERSTOOD
→ MAPPED TO THE CODEBASE
→ IMPLEMENTED
→ TESTED
→ VERIFIED
→ MARKED WITH EVIDENCE

Do not skip any item because it is large.
Do not skip any item because it requires backend work.
Do not skip any item because it requires multiple files.
Do not silently downgrade requirements into suggestions.

==================================================
STEP 1 — READ THE ENTIRE FILE
==================================================

Read the TXT file completely.

Do not stop at the first section.
Do not skim.
Do not rely on previous summaries.

Create a requirement ledger containing EVERY requirement found in the TXT.

For each requirement record:

ID
EXACT REQUIREMENT
SOURCE SECTION
TARGET PAGE/FEATURE
TARGET FILE(S)
CURRENT STATE
IMPLEMENTATION NEEDED
TEST NEEDED
STATUS
EVIDENCE

==================================================
STEP 2 — TRACE EVERY REQUIREMENT INTO THE PROJECT
==================================================

For every TXT requirement:

find where it belongs in the current application.

Map it to:

route
component
page
backend
database
service
API
storage
authentication
authorization
test

If the feature does not exist:

IMPLEMENT IT.

If it exists partially:

FINISH IT.

If it exists incorrectly:

FIX IT.

If it exists visually but is not functional:

CONNECT IT TO REAL FUNCTIONALITY.

==================================================
STEP 3 — IMPLEMENT EVERYTHING
==================================================

Do not stop after analysis.

Actually modify the project.

This includes, wherever required by the TXT:

frontend
backend
database schema
migrations
auth
RBAC
RLS
RFQ
supplier workflows
quotes
notifications
uploads
storage
admin
payments
OAuth
email
Room Designer
product system
marketplace
navigation
responsive design
animations
Hero
typography
spacing
symmetry
mobile
iPhone
Android
tablet
desktop
RTL
accessibility
performance
tests
E2E
documentation

Use the exact requirements in the TXT as the source of truth.

==================================================
STEP 4 — NO FAKE IMPLEMENTATION
==================================================

A visible feature is NOT complete because:

- a button exists
- a route exists
- a component exists
- a modal opens
- a localStorage mock works
- a fake success appears
- a test fixture returns a value

The feature is complete only when the expected real behavior works.

Do not create fake production functionality to satisfy the checklist.

==================================================
STEP 5 — EXTERNAL CONFIGURATION
==================================================

When a requirement genuinely depends on an external production secret/provider:

implement the complete application-side integration in the repository.

Then clearly mark only the external configuration portion as:

CONFIGURATION_REQUIRED

Examples:

OAuth provider credentials
email provider credentials
payment provider credentials
production database credentials
production storage credentials

Do not pretend these are live when they are not.

However, do NOT use "configuration required" as an excuse to avoid implementing the application code.

==================================================
STEP 6 — DESIGN REQUIREMENTS
==================================================

Implement every visual requirement from the TXT.

Pay particular attention to:

- exact proportional sizing
- typography hierarchy
- line-height
- text wrapping
- balanced line lengths
- symmetry
- section rhythm
- container widths
- grid alignment
- consistent card geometry
- button sizing
- image aspect ratio
- spacing system
- color harmony
- gradients
- shadows
- border radii
- Hero composition
- animation consistency

Do not solve shared visual problems with random one-off CSS.

==================================================
STEP 7 — RESPONSIVE REQUIREMENTS
==================================================

Implement and verify the TXT requirements at:

320x844
360x800
375x812
390x844
393x852
414x896
430x932
768x1024
834x1194
1024x1366
1280x800
1440x900
1536x864
1920x1080

The layout must remain professional and proportional.

No:

horizontal overflow
clipping
overlap
broken wrapping
unreachable controls
broken sticky behavior
broken keyboard behavior
scroll traps

==================================================
STEP 8 — IOS / ANDROID
==================================================

Do NOT claim real-device verification unless an actual device/runtime exists.

If actual iOS is available:
TEST IT.

If actual Android is available:
TEST IT.

Otherwise:

IOS_REAL_DEVICE_TEST = NOT_AVAILABLE
ANDROID_REAL_DEVICE_TEST = NOT_AVAILABLE

Still perform the strongest available compatibility verification.

==================================================
STEP 9 — FUNCTIONAL TESTING
==================================================

Every user-facing feature mentioned in the TXT must be tested.

Test:

Home
Products
Search
Filters
Product Detail
Gallery
Share
Favorite
Login
Register
Account
RFQ
Supplier
Admin
Room Designer
Notifications
Uploads
Navigation
Back
Refresh
Deep Links
RTL
Mobile

==================================================
STEP 10 — ROOM DESIGNER
==================================================

If required by the TXT, fully implement:

Upload Photo
Create Room
Dimensions
Units
Doors
Windows
Editor
Products
Surfaces
Save
Load
Reload
Deep Link
Exit
Back
Photo Guide

Persistence must be real.

Do not use fake success.

==================================================
STEP 11 — MARKETPLACE
==================================================

If required by the TXT, fully implement:

buyer accounts
supplier/company accounts
supplier products
supplier ownership
RFQ
supplier matching
quotes
quantity-based pricing
notifications
request history
quote history
admin management

Every critical business flow must persist correctly.

==================================================
STEP 12 — SECURITY
==================================================

Verify:

buyer isolation
supplier isolation
admin authorization
role assignment
file access
RFQ ownership
quote ownership
project ownership

No client-side privilege escalation.

==================================================
STEP 13 — TEST SUITE
==================================================

Create the automated test suite required by the TXT.

Add test scripts.

Create:

unit tests
integration tests
authorization tests
business logic tests
E2E tests

Do not merely create test files.

RUN THEM.

Fix failures.

==================================================
STEP 14 — BROWSER QA
==================================================

Use the strongest browser runtime available.

Test actual workflows.

Collect:

screenshots
DOM/state evidence
console logs
network failures
route results

Fix application-caused errors.

==================================================
STEP 15 — NO DEAD CONTROLS
==================================================

Scan every page for visible controls that do nothing.

For every one:

IMPLEMENT IT

or

REMOVE IT FROM THE PRODUCTION UI.

Never leave dead controls.

==================================================
STEP 16 — DATA INTEGRITY
==================================================

Preserve authoritative product data exactly.

Do not invent:

product names
SKUs
dimensions
IDs
images
variants
source relationships

Keep source registry statuses factual.

==================================================
STEP 17 — FINAL TXT COMPLIANCE MATRIX
==================================================

Create:

docs/txt-execution-matrix.md

For EVERY requirement in the TXT:

ID | Requirement | Implemented | Tested | Evidence | Status

Allowed statuses:

PASS
FAIL
NEEDS_VERIFICATION
CONFIGURATION_REQUIRED
BLOCKED

There must be NO requirement left unclassified.

==================================================
STEP 18 — ITERATIVE FIX LOOP
==================================================

For every failure:

REPRODUCE
→ IDENTIFY ROOT CAUSE
→ IMPLEMENT FIX
→ BUILD
→ TEST
→ BROWSER VERIFY
→ UPDATE MATRIX

Do not merely report the failure.

==================================================
STEP 19 — BUILD / QUALITY
==================================================

Run:

pnpm build

Run all automated tests.

Run E2E.

Run:

git diff --check

Resolve issues introduced by the work.

==================================================
STEP 20 — GIT
==================================================

Commit all actual implementation changes to:

https://github.com/3odawav20/Idea_Website

branch:

main

Do not commit secrets.

Do not commit:

.env
API keys
service-role keys
OAuth secrets
payment secrets
private certificates
node_modules
dist
temporary QA files

Verify the resulting remote commit.

==================================================
FINAL ACCEPTANCE RULE
==================================================

DO NOT SAY:

"the file was read"

unless the ENTIRE file was actually read.

DO NOT SAY:

"implemented"

unless the corresponding requirement was actually implemented.

DO NOT SAY:

"tested"

unless the actual behavior was exercised.

DO NOT SAY:

"PASS"

unless evidence exists.

DO NOT STOP because the task is large.

DO NOT STOP because the current architecture is incomplete.

DO NOT STOP at a partial integration.

DO NOT RETURN ANOTHER AUDIT AS THE FINAL RESULT.

The objective is to EXECUTE THE ENTIRE TXT SPECIFICATION.

==================================================
FINAL REPORT
==================================================

Return:

TXT REQUIREMENTS FOUND:
...

TXT REQUIREMENTS IMPLEMENTED:
...

TXT REQUIREMENTS TESTED:
...

TXT REQUIREMENTS PASS:
...

TXT REQUIREMENTS FAIL:
...

TXT REQUIREMENTS NEEDS_VERIFICATION:
...

TXT REQUIREMENTS CONFIGURATION_REQUIRED:
...

TXT REQUIREMENTS BLOCKED:
...

TOTAL BUGS FOUND:
...

TOTAL BUGS FIXED:
...

AUTOMATED TESTS:
...

E2E:
...

BROWSER QA:
...

MOBILE:
...

IPHONE:
...

ANDROID:
...

RTL:
...

ROOM DESIGNER:
...

MARKETPLACE:
...

AUTH:
...

SUPPLIER:
...

ADMIN:
...

RFQ:
...

QUOTES:
...

NOTIFICATIONS:
...

STORAGE:
...

PAYMENTS:
...

OAUTH:
...

EMAIL:
...

BUILD:
...

GIT COMMIT:
...

REMOTE SHA:
...

REMAINING ITEMS:
...

==================================================
MOST IMPORTANT
==================================================

I want the TXT file treated as an actual execution contract.

READ EVERYTHING.
EXECUTE EVERYTHING.
TEST EVERYTHING.
FIX EVERYTHING POSSIBLE.
DOCUMENT EVERYTHING.
DO NOT CLAIM SOMETHING IS DONE WHEN IT IS NOT.