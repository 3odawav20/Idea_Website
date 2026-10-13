FINAL GAP-CLOSURE PASS — DO NOT STOP

The latest QA confirmed:

PASS:
- Chromium rendering at 320, 360, 375, 390, 393, 414, 430
- Home
- Products
- Login
- Register
- RFQ route
- Favorites
- direct Art Ceramic product route
- pnpm build
- git diff --check

NOT YET CLOSED:
- external image/font reliability
- Room Designer complete functional flow
- real iOS/Android device verification
- exhaustive interaction verification

Do NOT produce another general audit.

Fix and verify the remaining gaps now.

==================================================
A. EXTERNAL IMAGES / FONTS
==================================================

Investigate every failed external asset.

Especially:

Google Fonts
i.ibb.co
Art Ceramic image URLs
AbaElMozahem image URLs

For each:

1. identify the exact failure
2. determine whether it is environment-only or production-relevant
3. test direct loading where possible
4. implement a resilient fallback for critical UI assets
5. ensure failed external assets do not break layout
6. ensure product images never silently become the wrong product image
7. ensure broken images have a proper fallback state

Do NOT replace factual catalog images with invented images.

If an external source cannot be verified from the current environment because of TLS/network restrictions:

mark it NEEDS_VERIFICATION and document the exact reason.

Do not mark it PASS.

==================================================
B. ROOM DESIGNER — FULL REAL TEST
==================================================

Test the actual Room Designer route and complete the entire user journey.

FLOW 1:

Room Designer
→ Upload a Room Photo
→ choose a valid image
→ preview
→ continue to editor
→ apply floor
→ apply wall
→ change product
→ save
→ reload
→ reopen
→ exit

FLOW 2:

Room Designer
→ Create a Measured Room
→ length
→ width
→ height
→ units
→ add door
→ add window
→ create room
→ edit room
→ apply surfaces/products
→ save
→ reload
→ reopen
→ exit

FLOW 3:

Room Designer
→ Photo Guide
→ open
→ inspect
→ close
→ return normally

Test EVERY visible control inside the editor.

No fake interactions.

No dead buttons.

==================================================
C. MOBILE ROOM DESIGNER
==================================================

Repeat the Room Designer flows at:

320
360
375
390
393
414
430

Check:

keyboard
numeric inputs
file upload
dialogs
drawers
editor controls
touch targets
scrolling
sticky actions
image preview
back navigation

NO horizontal overflow.

==================================================
D. RTL ROOM DESIGNER
==================================================

Switch to Arabic RTL.

Repeat the primary Room Designer flows.

Verify:

labels
forms
buttons
icons
arrows
dialogs
navigation
editor controls
spacing

==================================================
E. FULL INTERACTION SWEEP
==================================================

On every major page:

Home
Products
Product Detail
Login
Register
RFQ
Favorites
Room Designer
Account
Supplier
Admin

find every visible:

button
link
tab
dropdown
filter
icon
modal trigger
drawer trigger
form submission
upload
share
back
close

Interact with every one that is supposed to work.

A URL change alone is NOT proof.

Verify destination/rendered state.

==================================================
F. NAVIGATION / ESCAPE
==================================================

For every important route:

open
→ interact
→ browser Back
→ Forward
→ refresh
→ reopen

Verify no trapped state.

Test:

modal close
drawer close
editor exit
browser Back
in-app Back

==================================================
G. REAL DEVICE CLAIMS
==================================================

You must explicitly distinguish:

RESPONSIVE CHROMIUM EMULATION
from
REAL iOS DEVICE
from
REAL ANDROID DEVICE

If real iOS hardware/browser is unavailable:

IOS_REAL_DEVICE_TEST = NOT_AVAILABLE

If real Android hardware/browser is unavailable:

ANDROID_REAL_DEVICE_TEST = NOT_AVAILABLE

Do not claim otherwise.

==================================================
H. CONSOLE / NETWORK
==================================================

Collect:

console errors
console warnings
failed requests
404
500
uncaught exceptions
unhandled promise rejections
asset load failures

Fix application-caused errors.

Do not hide errors.

==================================================
I. REGRESSION
==================================================

After fixes, rerun:

Home
Products
Search
Product detail
Login
Register
RFQ
Favorites
Room Designer
Account
Supplier
Admin

==================================================
J. ACCEPTANCE MATRIX
==================================================

Update:

docs/feature-acceptance-matrix.md

Use only:

PASS
FAIL
NEEDS_VERIFICATION
CONFIGURATION_REQUIRED
BLOCKED

No unexplained FAIL.

==================================================
K. FINAL RELEASE GATE
==================================================

Do NOT say the website is ready unless:

BUILD = PASS
CONSOLE = PASS
ROUTES = PASS
NAVIGATION = PASS
ROOM DESIGNER = PASS
PRODUCT DETAIL = PASS
SEARCH/FILTERS = PASS
AUTH UI = PASS or truthful CONFIGURATION_REQUIRED
MOBILE = PASS
RTL = PASS
EXTERNAL ASSETS = PASS or documented NEEDS_VERIFICATION
SECURITY = PASS
NO DEAD VISIBLE CONTROLS = PASS

==================================================
FINAL REPORT
==================================================

Return only:

TOTAL ROUTES TESTED
TOTAL INTERACTIONS TESTED
BUGS FOUND
BUGS FIXED

ROOM DESIGNER
PRODUCTS
PRODUCT DETAIL
AUTH
RFQ
FAVORITES
ACCOUNT
SUPPLIER
ADMIN
MOBILE
RTL
IMAGES
FONTS
CONSOLE
NETWORK
NAVIGATION
BUILD

IOS_REAL_DEVICE_TEST
ANDROID_REAL_DEVICE_TEST

FILES CHANGED
COMMIT SHA
REMOTE SHA

REMAINING BLOCKERS
REMAINING NEEDS_VERIFICATION

DO NOT CLAIM ZERO ERRORS UNLESS THE EVIDENCE SUPPORTS IT.