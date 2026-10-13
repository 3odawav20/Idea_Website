MASTER FINAL VISUAL SYSTEM + DEEP QA + HERO PREMIUM MOTION + RESPONSIVE NORMALIZATION
FULL-SITE PROFESSIONALIZATION + ZERO-KNOWN-VISUAL-DEFECT PASS

EXECUTE EVERYTHING.
DO NOT STOP AT AUDIT.
DO NOT STOP AT BUILD SUCCESS.
DO NOT ONLY REPORT PROBLEMS.
FIND THEM → FIX THEM → RETEST THEM → COMMIT THEM.

==================================================
CURRENT BASELINE
==================================================

Latest known commit:

e9b1214443ad3af1f5da4a6854b5a85621bbec8a

Known recent improvements:

- Hero backgrounds are local and included in dist/assets
- Hero has depth/overlay
- Hero has restrained Ken Burns motion
- Hero has staggered text/button entrance
- Hero has background fallback
- prefers-reduced-motion disables unnecessary motion
- Mobile header locks background scrolling when menu opens
- Mobile menu restores scrolling after closing/navigation
- Approved fonts remain:
  Oswald
  Jost
  Cairo

Do NOT destroy these improvements.

Do NOT reintroduce external Hero dependency.

Do NOT introduce unauthorized fonts.

==================================================
PRIMARY OBJECTIVE
==================================================

Make the entire website feel like ONE professionally engineered premium product.

The final website must have:

- consistent dimensions
- consistent proportions
- consistent typography
- consistent spacing
- consistent section rhythm
- consistent containers
- consistent grids
- consistent cards
- consistent buttons
- consistent forms
- consistent image behavior
- consistent shadows
- consistent radii
- consistent colors
- consistent gradients
- consistent responsive behavior
- perfect visual symmetry
- clean line balancing
- intentional text wrapping
- professional hierarchy
- premium visual weight

The website must NOT look like separate pages created with different CSS rules.

==================================================
HARD RULE
==================================================

Do NOT fix every problem with random one-off CSS.

Do NOT solve a shared problem with many local overrides.

Whenever multiple components have the same issue:

FIX THE SHARED SYSTEM.

The goal is to leave the codebase MORE CONSISTENT and easier to maintain.

==================================================
PHASE 1 — COMPLETE DESIGN SYSTEM AUDIT
==================================================

Inspect the entire frontend.

Audit:

- global CSS
- CSS variables
- theme system
- typography tokens
- spacing tokens
- container system
- breakpoints
- grid system
- card system
- buttons
- form controls
- shadows
- border radius
- borders
- colors
- gradients
- animations
- image rules
- headers
- footers
- modals
- drawers
- mobile navigation
- RTL behavior

Locate:

- duplicated values
- conflicting values
- arbitrary values
- inconsistent font sizes
- inconsistent line heights
- inconsistent spacing
- inconsistent widths
- inconsistent heights
- inconsistent radii
- inconsistent shadows
- inconsistent image dimensions

==================================================
PHASE 2 — COLOR SYSTEM
==================================================

Use the EXISTING WEBSITE COLORS as the source of truth.

Do NOT introduce unrelated colors.

Create a coherent system for:

Primary
Primary Hover
Primary Active
Secondary
Accent
Background
Surface
Surface Elevated
Border
Muted
Text
Text Secondary
Success
Warning
Error
Overlay

Use gradients only when they fit the current visual identity.

Gradients must be:

premium
subtle
cinematic
balanced
brand-compatible

NO:

cheap neon effects
random rainbow gradients
excessive saturation
unrelated accent colors
high-contrast text backgrounds

==================================================
PHASE 3 — TYPOGRAPHY SYSTEM
==================================================

Use ONLY:

Oswald
Jost
Cairo

Create a single responsive typographic scale.

Define:

Display XL
Display L
H1
H2
H3
H4
Body XL
Body L
Body
Body Small
Caption
Overline
Button
Label

Every typography level must define:

font family
font size
font weight
line height
letter spacing

Use responsive sizing with clamp() where appropriate.

==================================================
PHASE 4 — TYPOGRAPHIC BALANCE
==================================================

This is a HIGH PRIORITY requirement.

Pay special attention to:

headline width
line length
line wrapping
line height
heading spacing
paragraph spacing
CTA spacing
text-to-image spacing

Avoid:

single orphan words
awkward wrapping
huge gaps
crowded paragraphs
tiny labels next to huge headings
inconsistent heading sizes
headings touching edges

Use max-width controls to create deliberate line lengths.

Do NOT blindly insert <br> everywhere.

Typography must feel balanced across all viewports.

==================================================
PHASE 5 — SYMMETRY
==================================================

Everything must feel geometrically aligned.

Check:

left/right margins
text alignment
image alignment
grid alignment
card alignment
CTA alignment
section boundaries
vertical rhythm

Especially inspect:

Hero
Products
Product Detail
Room Designer
Account
Supplier
Admin
Forms

No "almost aligned" components.

==================================================
PHASE 6 — CONTAINER SYSTEM
==================================================

Create a consistent content container system.

Major sections should align to the same page grid.

Use controlled:

max-width
horizontal padding
gutter
grid gap

Do not let every page invent a different max-width.

Ultra-wide screens must not stretch content excessively.

==================================================
PHASE 7 — SPACING SYSTEM
==================================================

Create a consistent spacing scale.

Normalize:

micro spacing
small spacing
component spacing
card spacing
section spacing
hero spacing

Avoid unnecessary arbitrary values such as:

13px
17px
23px
29px

unless there is a legitimate design reason.

Do NOT force every measurement to be identical.

Hierarchy still matters.

==================================================
PHASE 8 — SECTION RHYTHM
==================================================

Every section must transition naturally into the next.

Audit:

Hero → section heading
heading → content
content → CTA
CTA → next section

No:

huge empty sections
compressed sections
random padding
abrupt scale changes
inconsistent vertical rhythm

==================================================
PHASE 9 — GRID SYSTEM
==================================================

Standardize grids across:

products
categories
features
supplier cards
dashboard widgets
lists

Use predictable responsive behavior.

Cards must maintain consistent visual structure.

==================================================
PHASE 10 — PRODUCT CARD SYSTEM
==================================================

Create ONE canonical product card system.

Normalize:

card width
card height behavior
image area
image ratio
padding
title area
metadata area
CTA area
favorite action
supplier information

Different text lengths must not destroy grid alignment.

==================================================
PHASE 11 — IMAGE SYSTEM
==================================================

Use modern responsive image techniques where appropriate:

srcset
sizes
lazy loading
priority for above-the-fold
intrinsic dimensions
aspect-ratio
object-fit
object-position

Prevent:

layout shifts
stretching
wrong cropping
overflow
blurry scaling

Do NOT alter factual product imagery.

==================================================
PHASE 12 — HERO PREMIUM SYSTEM
==================================================

Preserve the existing local Hero images.

Build a premium cinematic layered composition:

background
+
depth
+
controlled overlay
+
content
+
motion

Hero should feel:

premium
architectural
luxurious
modern
calm
expensive
professional

==================================================
HERO MOTION
==================================================

Keep motion restrained.

Use:

Ken Burns
subtle parallax
soft depth
controlled light movement
text entrance
CTA entrance

Use performant properties:

transform
opacity

Avoid excessive animation.

No:

spinning
bouncing
flashing
cheap particles
aggressive zoom
over-animation

==================================================
REDUCED MOTION
==================================================

Respect:

prefers-reduced-motion

When enabled:

disable Ken Burns
disable unnecessary parallax
minimize entrance motion
keep content fully visible

==================================================
MOBILE HERO
==================================================

Optimize specifically for:

320x844
360x800
375x812
390x844
393x852
414x896
430x932

Do NOT simply shrink desktop.

Adjust intentionally:

image position
focal point
content width
headline size
line height
CTA
vertical spacing
Hero height

No:

cropped focal point
text collision
CTA clipping
excessive hero height
horizontal overflow

==================================================
PHASE 13 — BUTTON SYSTEM
==================================================

Normalize:

height
padding
radius
font
weight
icon gap
hover
active
focus
disabled
loading

Every primary CTA should feel like the same product.

Touch targets must be comfortable.

==================================================
PHASE 14 — FORM SYSTEM
==================================================

Normalize:

label
input
select
textarea
helper text
error text
focus state
padding
height
radius

Mobile forms must be easy to use.

==================================================
PHASE 15 — HEADER
==================================================

Standardize desktop/tablet/mobile header behavior.

Check:

logo
navigation
search
favorites
account
language
theme
menu
sticky behavior
scroll behavior

Mobile menu must:

lock body scrolling while open
restore scrolling while closed
close after navigation
never trap the user

==================================================
PHASE 16 — FOOTER
==================================================

Normalize:

container
columns
links
spacing
logo
legal information
configured social links

Mobile footer must stack elegantly.

==================================================
PHASE 17 — CARDS / SURFACES
==================================================

Normalize:

radius
border
shadow
background
padding

Define a small number of intentional surface levels.

Do not use random shadows.

==================================================
PHASE 18 — MODALS / DRAWERS
==================================================

Standardize:

width
max height
padding
backdrop
radius
close button
header spacing
footer actions

Mobile modals must:

fit within viewport
scroll correctly
not trap scrolling
have accessible close behavior

==================================================
PHASE 19 — RESPONSIVE SYSTEM
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

Every major section must remain:

balanced
readable
aligned
usable
proportional

==================================================
PHASE 20 — IPHONE-FIRST
==================================================

Make the website feel deliberately designed for iPhone.

Pay attention to:

safe area
dvh
svh
lvh
browser chrome
sticky elements
touch targets
keyboard
input behavior
scrolling
fixed positioning
modal behavior
bottom spacing

No fixed desktop assumptions on mobile.

==================================================
PHASE 21 — ANDROID
==================================================

Check Android-style mobile behavior:

address bar changes
keyboard
touch
scroll
sticky controls
file uploads
viewport resizing

==================================================
PHASE 22 — TABLET
==================================================

Tablet should be an intentional layout.

Not:

large phone
small desktop

Optimize spacing, grids, navigation and content density.

==================================================
PHASE 23 — DESKTOP
==================================================

Desktop must have:

strong hierarchy
balanced whitespace
reasonable line length
comfortable content density
controlled maximum widths

Ultra-wide layouts must not look stretched.

==================================================
PHASE 24 — RTL
==================================================

Test Arabic RTL.

Check:

Hero
header
navigation
products
product details
RFQ
Room Designer
account
supplier
admin
modals
drawers

Ensure directional icons remain logically correct.

==================================================
PHASE 25 — ANIMATION SYSTEM
==================================================

Use ONE animation language.

Normalize:

duration
easing
distance
opacity

Animation should support hierarchy.

Not decoration.

==================================================
PHASE 26 — SHADOW SYSTEM
==================================================

Use a limited hierarchy:

subtle
card
elevated
modal

Do not use random shadows.

==================================================
PHASE 27 — BORDER / RADIUS
==================================================

Normalize:

border width
border color
radius

Do not create many almost-identical values.

==================================================
PHASE 28 — ICONOGRAPHY
==================================================

Use consistent icon sizing and visual weight.

Normalize:

size
stroke
alignment
spacing

==================================================
PHASE 29 — DATA-DENSE SCREENS
==================================================

Supplier/Admin pages must remain usable.

On mobile, use:

responsive cards
stacking
priority information
controlled scrolling

No accidental viewport overflow.

==================================================
PHASE 30 — COMPLETE SITE DEEP QA
==================================================

Now perform an exhaustive functional sweep.

Inspect every:

route
page
button
link
CTA
form
input
dropdown
filter
tab
modal
drawer
upload
share
favorite
account action
supplier action
admin action
RFQ action
quote action
Room Designer action

Actually interact with each important control.

A control is PASS only if:

action occurs
+
result is correct
+
user can continue
+
user can exit/back
+
no runtime error

==================================================
PHASE 31 — FULL ROUTE TEST
==================================================

Test every major route with:

direct navigation
refresh
browser Back
browser Forward
deep link
invalid route
mobile
desktop
RTL where relevant

No:

blank pages
endless loading
wrong redirects
broken refresh
trapped states

==================================================
PHASE 32 — BUYER FLOW
==================================================

Test:

Home
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
→ Quantity
→ Upload Image
→ Notes
→ Submit
→ Request
→ Quote
→ Notification

Verify every step.

==================================================
PHASE 33 — SUPPLIER FLOW
==================================================

Test:

Register/login
→ Company
→ Dashboard
→ Products
→ Images
→ Availability
→ Pricing
→ RFQ
→ Quote
→ Notifications

Verify ownership behavior.

==================================================
PHASE 34 — ADMIN FLOW
==================================================

Test:

Admin login
→ dashboard
→ users
→ suppliers
→ RFQs
→ quotes
→ source registry

No demo admin access.

==================================================
PHASE 35 — ROOM DESIGNER
==================================================

TEST FLOW A:

Room Designer
→ Upload Photo
→ image selection
→ preview
→ editor
→ floor
→ wall
→ product
→ modify
→ save
→ reload
→ reopen
→ exit

TEST FLOW B:

Room Designer
→ Create Measured Room
→ length
→ width
→ height
→ unit
→ door
→ window
→ editor
→ surfaces
→ products
→ save
→ reload
→ reopen
→ exit

TEST FLOW C:

Room Designer
→ Photo Guide
→ open
→ inspect
→ close

Every visible Room Designer control must work.

==================================================
PHASE 36 — IMAGE / ASSET QA
==================================================

Check:

Hero images
product images
gallery
supplier images
Room Designer images
fonts

Investigate:

404
failed loads
TLS errors
wrong image associations
layout shifts

For critical assets:

provide safe fallbacks.

Do NOT fabricate product images.

==================================================
PHASE 37 — CONSOLE / NETWORK
==================================================

Collect:

console errors
console warnings
404
500
uncaught exceptions
unhandled promise rejections
failed network requests
asset errors

Fix application-caused failures.

Do not suppress errors just to make logs appear clean.

==================================================
PHASE 38 — ACCESSIBILITY
==================================================

Check:

keyboard
focus
labels
tab order
button names
dialog semantics
touch target sizes
contrast
reduced motion

Fix obvious issues.

==================================================
PHASE 39 — PERFORMANCE
==================================================

Inspect:

Hero
images
animations
fonts
product lists
gallery
Room Designer
route transitions

Fix:

blocking resources
unnecessary rerenders
expensive effects
large unnecessary imports
image loading problems

Do not sacrifice the design.

==================================================
PHASE 40 — DEV / MOCK AUDIT
==================================================

Search for:

mock
demo
fake
seed
placeholder
TODO
FIXME
localStorage
seedOffersFor
hardcoded prices
hardcoded suppliers
fake notifications
fake login
test admin

Classify each occurrence.

Production business flows must not depend on mocks.

==================================================
PHASE 41 — NAVIGATION / ESCAPE
==================================================

For every important state:

open
→ interact
→ back
→ forward
→ refresh
→ exit

Test:

browser Back
in-app Back
modal Close
drawer Close
editor Exit
breadcrumbs
Home

The user must never become trapped.

==================================================
PHASE 42 — VISUAL SCREENSHOT QA
==================================================

Capture and inspect:

Home
Products
Product Detail
Room Designer
Login
Account
Supplier
Admin

at:

390x844
1440x900

Compare:

typography
spacing
alignment
symmetry
images
hierarchy
section rhythm
container widths
card proportions

==================================================
PHASE 43 — FIX LOOP
==================================================

For EVERY issue:

REPRODUCE
→ IDENTIFY ROOT CAUSE
→ FIX
→ BUILD
→ RELOAD
→ RETEST
→ REGRESSION TEST

Do not merely document bugs.

==================================================
PHASE 44 — REGRESSION
==================================================

After ALL visual/system changes, retest:

Home
Products
Search
Filters
Product Detail
Gallery
Share
Login
Register
Account
Favorites
RFQ
Room Designer
Supplier
Admin

Visual changes must never break functionality.

==================================================
PHASE 45 — BUILD
==================================================

Run:

pnpm build

Run all available tests.

Run:

git diff --check

Fix every issue introduced by the work.

==================================================
PHASE 46 — ACCEPTANCE MATRIX
==================================================

Update:

docs/feature-acceptance-matrix.md

Include:

Design System
Typography
Spacing
Containers
Grid
Cards
Images
Hero
Hero Motion
Header
Footer
Forms
Modals
Mobile
Tablet
Desktop
RTL
Accessibility
Performance
Console
Network
Room Designer
Buyer Flow
Supplier Flow
Admin Flow

Statuses:

PASS
FAIL
NEEDS_VERIFICATION
CONFIGURATION_REQUIRED
BLOCKED

Only mark PASS after actual verification.

==================================================
PHASE 47 — REAL DEVICE CLAIMS
==================================================

Explicitly distinguish:

Chromium responsive emulation
real iPhone
real Android device

If real iOS testing is unavailable:

IOS_REAL_DEVICE_TEST = NOT_AVAILABLE

If real Android testing is unavailable:

ANDROID_REAL_DEVICE_TEST = NOT_AVAILABLE

Never claim actual-device testing without actual device/runtime access.

==================================================
PHASE 48 — GIT
==================================================

Commit all actual changes to:

https://github.com/3odawav20/Idea_Website

Branch:

main

Do not commit:

.env
secrets
API keys
service-role keys
private keys
certificates
node_modules
dist
temporary screenshots
temporary test artifacts

Verify remote SHA after commit.

==================================================
FINAL RELEASE GATE
==================================================

Do NOT claim the site is perfect merely because:

build passes
pages render
responsive widths render
buttons exist

The final result must satisfy:

TYPOGRAPHY = CONSISTENT
SPACING = CONSISTENT
CONTAINERS = CONSISTENT
GRID = CONSISTENT
CARDS = CONSISTENT
IMAGES = CORRECT
BUTTONS = CONSISTENT
FORMS = CONSISTENT
SECTIONS = BALANCED
COLORS = HARMONIZED
GRADIENTS = HARMONIZED
HERO = PREMIUM
HERO MOBILE = PREMIUM
HEADER = PREMIUM
NAVIGATION = STABLE
RTL = CORRECT
IPHONE = PROFESSIONAL
ANDROID = PROFESSIONAL
TABLET = PROFESSIONAL
DESKTOP = PROFESSIONAL
NO HORIZONTAL OVERFLOW
NO CLIPPING
NO ACCIDENTAL OVERLAP
NO BROKEN WRAPPING
NO DEAD VISIBLE CONTROLS
NO FAKE SUCCESS
NO UNEXPECTED RUNTIME ERROR
NO NEW REGRESSION

==================================================
FINAL REPORT
==================================================

Return:

TOTAL ROUTES TESTED:
...

TOTAL INTERACTIONS TESTED:
...

BUGS FOUND:
...

BUGS FIXED:
...

DESIGN SYSTEM:
...

TYPOGRAPHY:
...

SPACING:
...

CONTAINERS:
...

GRID:
...

PRODUCT CARDS:
...

IMAGES:
...

HERO:
...

HERO MOTION:
...

HEADER:
...

FOOTER:
...

FORMS:
...

MODALS:
...

BUYER:
...

SUPPLIER:
...

ADMIN:
...

RFQ:
...

ROOM DESIGNER:
...

RTL:
...

IPHONE:
...

ANDROID:
...

TABLET:
...

DESKTOP:
...

ACCESSIBILITY:
...

PERFORMANCE:
...

CONSOLE:
...

NETWORK:
...

BUILD:
...

AUTOMATED TESTS:
...

IOS_REAL_DEVICE_TEST:
...

ANDROID_REAL_DEVICE_TEST:
...

TOTAL VISUAL ISSUES FOUND:
...

TOTAL VISUAL ISSUES FIXED:
...

FILES CHANGED:
...

COMMIT SHA:
...

REMOTE SHA:
...

REMAINING NEEDS_VERIFICATION:
...

REMAINING CONFIGURATION_REQUIRED:
...

REMAINING BLOCKERS:
...

==================================================
ABSOLUTE FINAL RULE
==================================================

The entire website must look and behave as if ONE senior design and engineering team built the whole product using ONE disciplined system.

Do not optimize one viewport at the expense of another.

Do not use arbitrary one-off CSS patches.

Do not distort images.

Do not introduce unrelated colors.

Do not introduce unauthorized fonts.

Do not break RTL.

Do not fake functionality.

Do not hide errors.

Do not claim real iPhone/Android testing without real devices.

FIND.
FIX.
NORMALIZE.
VERIFY.
REGRESS.
BUILD.
COMMIT.

The target is an exceptionally polished, realistic, premium, symmetrical and professional website on iPhone, Android, tablet and desktop.