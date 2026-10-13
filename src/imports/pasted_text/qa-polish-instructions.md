FINAL DEEP QA + HERO PREMIUM MOTION + IPHONE-FIRST POLISH
EXECUTE EVERYTHING — FIND, FIX, VERIFY, COMMIT

This is an execution task.

DO NOT perform another report-only audit.
DO NOT stop after identifying issues.
DO NOT ask me to manually fix things that you can inspect and repair.

You must:

1. inspect the entire application
2. identify hidden defects
3. fix every safe defect you find
4. improve the Hero
5. make the mobile/iPhone experience exceptionally polished
6. retest everything
7. update the acceptance matrix
8. build
9. commit
10. verify the remote commit

==================================================
CURRENT KNOWN STATE
==================================================

Latest known successful commit:

ba917c67fe920772d2ea71d2f19ae19d6195fd0f

Known completed improvements:

- local Hero background images are included in build
- Room Designer upload validates JPEG/PNG/WebP
- upload size limit = 10MB
- dimension validation rejects invalid/zero/negative dimensions
- fake save success was removed
- pnpm build passes
- git diff --check passes

Known remaining limitations:

- real Room Designer project persistence still requires actual backend data path
- real iOS device testing is unavailable
- real Android device testing is unavailable

DO NOT falsely claim real iOS/Android device testing.

==================================================
PHASE 1 — COMPLETE SITE DEEP AUDIT
==================================================

Inspect the COMPLETE repository.

Do not limit yourself to the current known pages.

Discover every:

route
page
component
button
link
CTA
form
input
select
dropdown
tab
modal
drawer
tooltip
icon action
upload
share
favorite
navigation item
account action
supplier action
admin action
RFQ action
quote action
payment action
Room Designer action
language switch
theme switch
search
filter
sorting control
pagination
menu
breadcrumb

Trace what each element ACTUALLY does.

For every visible interactive element:

- exercise it
- verify its result
- inspect URL/state changes
- inspect console
- inspect network where useful
- verify the user can continue
- verify the user can escape/back out

Do not mark a button PASS because it exists.

==================================================
PHASE 2 — FIND HIDDEN BUGS
==================================================

Look specifically for:

- runtime exceptions
- undefined data
- null crashes
- race conditions
- stale state
- loading forever
- broken loading states
- fake success
- silent failures
- broken empty states
- broken error states
- invalid redirects
- broken deep links
- refresh failures
- back navigation failures
- modal traps
- drawer traps
- scroll traps
- broken fixed/sticky elements
- z-index problems
- layout shifts
- clipped content
- text overflow
- image overflow
- broken icons
- broken external links
- wrong hrefs
- wrong product routing
- state reset bugs
- auth state bugs
- responsive layout bugs
- RTL bugs
- keyboard overlap
- touch issues
- accessibility issues

Fix every real defect you find.

==================================================
PHASE 3 — HERO COMPLETE REDESIGN/POLISH
==================================================

The Hero must look PREMIUM.

Do NOT make it flashy for the sake of being flashy.

Target aesthetic:

premium
cinematic
architectural
high-end
modern
luxury
professional
calm
expensive-looking

Think premium architecture/interior design marketplace rather than generic SaaS.

==================================================
HERO STRUCTURE
==================================================

Keep the existing brand identity.

Use the existing local Hero imagery.

Build a layered Hero:

background image
+
subtle dark/gradient readability layer
+
soft depth layer
+
content layer
+
controlled motion

Do not reduce readability.

==================================================
HERO MOTION
==================================================

Implement high-quality subtle motion.

Possible effects:

- slow background parallax
- gentle scale/zoom
- foreground depth movement
- soft light movement
- staggered text entrance
- subtle CTA entrance
- restrained floating details
- smooth hover/touch micro-motion

Motion must be:

subtle
smooth
premium
non-distracting

Do NOT use:

- aggressive spinning
- excessive bouncing
- distracting zoom
- cheap glowing effects
- excessive particles
- seizure-inducing flashing
- huge motion on mobile

==================================================
MOTION PERFORMANCE
==================================================

Use performant animation techniques.

Prefer:

transform
opacity
will-change only where appropriate

Avoid expensive layout-triggering animations.

Respect:

prefers-reduced-motion

When reduced motion is enabled:

- minimize parallax
- remove unnecessary animation
- preserve usability

==================================================
MOBILE HERO
==================================================

The mobile Hero is the highest visual priority.

Optimize specifically for:

390x844
393x852
414x896
430x932

Also verify:

320x844
360x800
375x812

On iPhone-sized screens:

- image composition must remain intentional
- subject/focal point must not be cropped incorrectly
- CTA must be easy to reach
- text must be readable
- no overlap
- no clipped buttons
- no excessive vertical height
- no horizontal scrolling
- no weird viewport jump
- no browser-address-bar layout problems

Use mobile-specific positioning where necessary.

Do not simply shrink desktop CSS.

==================================================
IPHONE-SPECIFIC VISUAL DETAILS
==================================================

Optimize:

safe-area insets
dynamic viewport units
100dvh / 100svh where appropriate
touch targets
sticky CTA behavior
input zoom prevention where appropriate
overscroll
scroll momentum
fixed positioning
header transitions
mobile menu behavior

Do not rely on obsolete 100vh assumptions.

==================================================
HERO CONTENT HIERARCHY
==================================================

Review:

headline
supporting text
CTA
secondary CTA if present
badges/labels if present

Ensure:

headline is strong
line breaks look intentional
text does not become tiny
CTA hierarchy is obvious
content remains readable against image

Do not rewrite brand copy unnecessarily unless the existing copy is clearly defective.

==================================================
PHASE 4 — HEADER / NAVIGATION PREMIUM MOBILE
==================================================

Make the mobile header feel production-grade.

Check:

logo
menu
search
favorites
account
navigation
language
theme

Ensure:

touch targets are comfortably tappable
icons are aligned
header does not jump
menu opens/closes cleanly
body scroll lock works
menu closes properly
back behavior works

==================================================
PHASE 5 — PRODUCT EXPERIENCE
==================================================

Deep-test:

Products
Search
Filters
Sorting
Product detail
Gallery
Zoom
Share
Favorite
Supplier information
Request quote

On mobile:

product cards
image ratio
text truncation
price/metadata
CTA
filter drawer
gallery controls
share controls

Everything must look intentional.

==================================================
PHASE 6 — ACCOUNT / AUTH UX
==================================================

Check:

Login
Register
Forgot password
Account
Settings
Favorites
Notifications

Focus on:

mobile forms
keyboard behavior
validation
error states
success states
back behavior

No fake authentication.

==================================================
PHASE 7 — RFQ UX
==================================================

Test:

product
→ request quote
→ quantity
→ image
→ notes
→ submit
→ confirmation/error

Make the form especially good on iPhone.

Numeric fields must be easy to use.

Upload input must be touch friendly.

Error messages must be visible and actionable.

==================================================
PHASE 8 — ROOM DESIGNER UX
==================================================

Retest:

Upload Photo
Create Room
Photo Guide
dimensions
doors
windows
editor
surface/product application
back
exit

Mobile editor must remain usable.

No tiny controls.

No horizontal overflow.

No trapped state.

==================================================
PHASE 9 — RTL
==================================================

Test Arabic RTL across:

Hero
Header
Products
Product detail
Account
RFQ
Room Designer
dialogs
drawers

Correct directional icons where necessary.

==================================================
PHASE 10 — RESPONSIVE MATRIX
==================================================

Test:

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

At every important size check:

overflow
clipping
spacing
cards
navigation
forms
dialogs
Hero
Room Designer
product gallery

==================================================
PHASE 11 — BROWSER QUALITY
==================================================

Use available browser tooling.

Inspect:

console
network
DOM
screenshots

No unresolved application errors.

No broken UI caused by:

404
500
uncaught exceptions
unhandled promise rejections

==================================================
PHASE 12 — EXTERNAL ASSETS
==================================================

Audit all external images/fonts/resources.

Where external failures are environment-specific, do not hide them.

For critical assets:

create reliable fallbacks.

For product images:

NEVER substitute incorrect/invented imagery.

Preserve source provenance.

==================================================
PHASE 13 — ACCESSIBILITY
==================================================

Check:

focus
tab order
labels
button names
dialogs
touch targets
contrast
keyboard behavior
reduced motion

Fix obvious accessibility issues.

==================================================
PHASE 14 — PERFORMANCE
==================================================

Inspect:

Hero loading
Hero animation
images
route transitions
product lists
gallery
Room Designer

Fix obvious performance bottlenecks.

Do not sacrifice visual quality unnecessarily.

==================================================
PHASE 15 — NO DEAD CONTROLS
==================================================

Search for:

TODO
FIXME
Coming Soon
placeholder
demo
mock
fake
seed
localStorage
alert(
console.log

Classify every result.

Production-visible interactions must be real.

If a visible feature cannot currently work because backend/provider infrastructure is unavailable:

do NOT fake it.

Either:

- implement it
- or present an honest disabled/configuration state

==================================================
PHASE 16 — FINAL USER SIMULATION
==================================================

Pretend you are a completely new visitor.

Start at Home.

Do not use developer shortcuts.

Perform:

Home
→ Hero
→ Products
→ Search
→ Filter
→ Product
→ Gallery
→ Share
→ Favorite
→ Register
→ Login
→ Account
→ RFQ
→ Room Designer
→ Back
→ Home

Then inspect all visible controls you encounter.

==================================================
PHASE 17 — MOBILE USER SIMULATION
==================================================

Repeat the most important journey at:

390x844

and

393x852

The mobile experience should feel intentionally designed, not like desktop compressed into a phone.

==================================================
PHASE 18 — FINAL QA DOCUMENT
==================================================

Update:

docs/feature-acceptance-matrix.md

Add:

Hero
Hero motion
Hero mobile
Header mobile
Product mobile
Search
Filters
Gallery
Share
Auth
Account
RFQ
Room Designer
RTL
Accessibility
Performance
Console
Network

Use:

PASS
FAIL
NEEDS_VERIFICATION
CONFIGURATION_REQUIRED
BLOCKED

==================================================
PHASE 19 — BUILD AND REGRESSION
==================================================

Run:

pnpm build

Run all available tests.

Run:

git diff --check

Then rerun critical browser flows after the fixes.

==================================================
PHASE 20 — GIT
==================================================

Commit all actual fixes to:

https://github.com/3odawav20/Idea_Website

branch:

main

Do not commit:

.env
secrets
keys
node_modules
dist
temporary screenshots
temporary test artifacts

Verify the remote commit.

==================================================
FINAL REPORT
==================================================

Return:

TOTAL ROUTES TESTED
TOTAL INTERACTIONS TESTED
BUGS FOUND
BUGS FIXED

HERO:
PASS/FAIL
MOBILE HERO:
PASS/FAIL
HERO MOTION:
PASS/FAIL

HEADER:
PASS/FAIL
PRODUCTS:
PASS/FAIL
SEARCH:
PASS/FAIL
FILTERS:
PASS/FAIL
PRODUCT DETAIL:
PASS/FAIL
GALLERY:
PASS/FAIL
SHARE:
PASS/FAIL
AUTH:
PASS/FAIL
ACCOUNT:
PASS/FAIL
RFQ:
PASS/FAIL
ROOM DESIGNER:
PASS/FAIL
RTL:
PASS/FAIL
ACCESSIBILITY:
PASS/FAIL
PERFORMANCE:
PASS/FAIL
CONSOLE:
PASS/FAIL
NETWORK:
PASS/FAIL
BUILD:
PASS/FAIL

IOS_REAL_DEVICE_TEST:
AVAILABLE / NOT_AVAILABLE

ANDROID_REAL_DEVICE_TEST:
AVAILABLE / NOT_AVAILABLE

FILES CHANGED:
...

COMMIT SHA:
...

REMOTE SHA:
...

REMAINING CONFIGURATION_REQUIRED:
...

REMAINING NEEDS_VERIFICATION:
...

REMAINING BLOCKERS:
...

==================================================
ABSOLUTE RULE
==================================================

FIND IT.
FIX IT.
RETEST IT.

Do not merely report defects.

Do not claim real iPhone or Android testing without actual device/runtime access.

Do not trade factual product data for visual improvements.

Do not create fake functionality.

Do not stop at "build passed".

The goal is a website that feels extremely polished and professional on iPhone while remaining correct and functional across desktop, tablet, Android-sized viewports, and RTL.