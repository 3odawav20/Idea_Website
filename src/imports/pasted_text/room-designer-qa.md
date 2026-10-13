ROOM DESIGNER — FULL FUNCTIONAL QA + BUG FIX + RESPONSIVE VALIDATION

TARGET PAGE:
Room Designer

PRIMARY GOAL:
I want this page fully operational, not merely visually correct.

Test the ENTIRE Room Designer experience as a real user would use it.

Do not stop at "page loads".
Do not stop at "button exists".
Do not claim PASS unless the actual interaction works and produces the expected result.

==================================================
1. START FROM THE ACTUAL PAGE
==================================================

Open the Room Designer page.

Verify:

- correct route
- page title/content
- header renders
- footer if applicable
- no blank space caused by broken components
- no framework error overlay
- no JavaScript/runtime error
- no broken images
- no console errors
- no unexpected network failures

Capture the initial screenshot.

==================================================
2. HEADER FUNCTIONALITY
==================================================

Test every visible header control from this page:

- IDEA logo
- COLLECTIONS
- ALL PRODUCTS
- ROOM DESIGNER
- SUBSCRIPTIONS
- HOW IT WORKS
- Search
- language controls
- theme toggle
- favorites
- document/requests icon
- account icon

For every control:

CLICK IT.

Verify it performs a real action.

Verify navigation URL.

Verify destination page actually renders.

Verify browser Back returns correctly to Room Designer.

Do not mark a control PASS just because it changes the URL.

==================================================
3. UPLOAD A ROOM PHOTO FLOW
==================================================

This is a PRIMARY CORE FLOW.

Click:

UPLOAD A PHOTO

Verify:

- file picker opens
- accepted file types are correct
- invalid file types are rejected appropriately
- large files are handled correctly
- image preview works
- orientation is preserved
- image is not distorted
- image can be replaced
- image can be cancelled
- error handling works

Then continue into the room designer/editor.

Verify the selected image actually reaches the next step.

Do NOT use a fake success state.

==================================================
4. PHOTO GUIDE
==================================================

Click:

PHOTO GUIDE

Verify:

- guide opens
- content renders correctly
- all instructions are readable
- close/back works
- modal/drawer does not trap scrolling
- mobile version works
- browser Back does not break the flow

Test both:

desktop
mobile

==================================================
5. CREATE A MEASURED ROOM
==================================================

Click:

CREATE A ROOM

This is the SECOND PRIMARY CORE FLOW.

Verify the form opens.

Test every field.

At minimum:

length
width
height
doors
windows
units

Test units:

m
cm
mm

Verify conversion logic.

Enter valid dimensions.

Verify:

- values are accepted
- invalid values are rejected
- negative values are rejected
- impossible zero values are rejected
- decimal values work where expected
- units are correctly reflected
- doors/windows are correctly represented

==================================================
6. DOORS AND WINDOWS
==================================================

Create at least one door and one window.

Test:

add
edit
remove
position
dimensions
validation

Verify that the generated room actually reflects them.

No fake controls.

No controls that do nothing.

==================================================
7. ROOM EDITOR
==================================================

Once a room is created, inspect the editor deeply.

Test every visible control and tool.

Look for:

- floor controls
- wall controls
- material/surface controls
- product selection
- image controls
- room dimensions
- doors
- windows
- rotate
- delete
- undo
- redo
- reset
- save
- exit/back
- zoom
- fullscreen
- navigation

Every visible control must work.

==================================================
8. APPLY FLOOR / WALL SURFACES
==================================================

Test the core visualization workflow.

Select a real available surface/product.

Apply it to:

- floor
- wall

Verify:

- selected product actually changes
- correct image/product is used
- selection persists
- no fake placeholder is shown
- dimensions/identity remain correct
- changing product updates the room
- removing/replacing the product works

==================================================
9. REAL PRODUCT DATA
==================================================

When products are shown in Room Designer:

Verify that the product identity matches the actual catalog.

Check:

name
image
dimensions
SKU where available
source/product identity

Do NOT allow incorrect product metadata to appear.

==================================================
10. SAVE / LOAD PROJECT
==================================================

Create a room.

Modify it.

Save it.

Reload the application.

Open the saved project.

Verify:

- project exists
- room dimensions persist
- image persists
- selected products persist
- doors/windows persist
- wall/floor selections persist

If save/load is not yet real:

do NOT fake success.

Implement the actual persistence mechanism appropriate to the current architecture.

==================================================
11. DEEP LINK
==================================================

Open the generated project route directly.

Refresh the browser.

Verify the project still loads.

Open it from a new tab.

Verify browser Back works.

Verify invalid project IDs produce a useful error state instead of a blank page.

==================================================
12. NAVIGATION / ESCAPE
==================================================

From EVERY Room Designer state verify:

- Back
- Home
- Room Designer
- close modal
- close drawer
- exit editor
- breadcrumb/back button
- browser Back

The user must NEVER become trapped.

Test:

Room Designer home
→ Upload Photo
→ Editor
→ Back

and:

Room Designer home
→ Create Room
→ Editor
→ Back

==================================================
13. ERROR STATES
==================================================

Intentionally test:

invalid image
oversized image
missing dimensions
invalid dimensions
missing required fields
failed save
invalid project
broken product/image
network failure where practical

Every error must produce:

- clear message
- recovery action
- no blank page
- no infinite spinner
- no fake success

==================================================
14. LOADING STATES
==================================================

Verify all async actions have proper:

loading
success
error
empty

states.

No UI freezing.

==================================================
15. MOBILE / IPHONE QA
==================================================

This is mandatory.

Test at:

320x844
360x800
375x812
390x844
393x852
414x896
430x932

Also tablet and desktop.

Pay special attention to:

- header
- navigation
- upload controls
- room form
- numeric inputs
- keyboard opening
- keyboard overlap
- modals
- drawers
- editor controls
- touch targets
- horizontal scrolling
- sticky controls
- image previews
- back buttons

There must be:

NO horizontal overflow
NO clipped content
NO overlapping controls
NO inaccessible buttons
NO tiny touch targets
NO broken dialogs

==================================================
16. RTL / ARABIC
==================================================

Switch to Arabic RTL.

Repeat the main flows.

Verify:

- labels
- fields
- icons
- arrows
- dialogs
- editor controls
- spacing
- alignment
- navigation
- text direction

No broken RTL layout.

==================================================
17. THEME
==================================================

Test light/dark theme if the header control is available.

Verify Room Designer remains readable and functional.

Check:

- contrast
- controls
- borders
- inputs
- dialogs
- images
- editor surfaces

==================================================
18. SEARCH / PRODUCT DISCOVERY INSIDE ROOM DESIGNER
==================================================

If Room Designer has product search or selection:

Test:

exact product search
partial search
no results
filters
selection
replacement
clear/reset

Verify the correct product is applied.

==================================================
19. PERFORMANCE
==================================================

Test:

initial load
image upload
editor opening
product selection
room manipulation
save/load

Look for:

lag
freezing
large blocking operations
unnecessary rerenders
broken lazy loading

Improve obvious performance issues without reducing visual quality.

==================================================
20. CONSOLE / NETWORK QA
==================================================

Inspect browser console.

There must be no unresolved application errors.

Classify warnings.

Inspect failed requests.

Fix application-caused errors.

Do not hide errors just to make the console look clean.

==================================================
21. ACCESSIBILITY
==================================================

Test:

keyboard navigation
tab order
focus visibility
labels
button accessibility
form labels
dialog accessibility

Check touch-target size.

==================================================
22. CROSS-BROWSER SANITY
==================================================

Test at least:

Chromium desktop
Chromium mobile viewport

And verify obvious Safari/iOS compatibility issues from the implementation.

==================================================
23. FEATURE MATRIX
==================================================

Update:

docs/feature-acceptance-matrix.md

Add a dedicated Room Designer section.

Every feature must have:

FEATURE
ROUTE
EXPECTED BEHAVIOR
TESTED
RESULT
EVIDENCE
NOTES

Statuses:

PASS
FAIL
CONFIGURATION_REQUIRED
NEEDS_VERIFICATION

==================================================
24. FIX EVERYTHING YOU FIND
==================================================

This is NOT a reporting-only task.

When you find a bug:

1. reproduce
2. identify root cause
3. fix it
4. rebuild
5. reload
6. reproduce the original flow
7. verify the fix

Do not just list the bug and stop.

==================================================
25. REGRESSION TEST
==================================================

After fixing Room Designer:

Verify that the following still work:

Home
Products
Product detail
Search
Login
Account
Supplier routes
Admin routes
Product deep links

Do not break unrelated application functionality.

==================================================
26. BUILD
==================================================

Run:

pnpm build

Then:

git diff --check

Run available tests.

If no test framework exists, create focused tests for the critical Room Designer logic where appropriate.

==================================================
27. FINAL ACCEPTANCE
==================================================

Room Designer is PASS only when a real user can complete:

FLOW A:

Room Designer
→ Upload Photo
→ select image
→ open editor
→ apply floor/wall
→ modify room
→ save
→ reload
→ reopen project
→ exit safely

FLOW B:

Room Designer
→ Create Measured Room
→ enter dimensions
→ add door
→ add window
→ create room
→ edit room
→ apply surfaces
→ save
→ reload
→ reopen
→ exit safely

FLOW C:

Room Designer
→ Photo Guide
→ read guide
→ close
→ continue normally

FLOW D:

Room Designer
→ mobile viewport
→ complete primary flow
→ browser Back
→ reopen page
→ no overflow/no trapped state

==================================================
FINAL REPORT
==================================================

Return:

ROOM DESIGNER STATUS:
...

UPLOAD PHOTO:
...

PHOTO GUIDE:
...

CREATE MEASURED ROOM:
...

DIMENSIONS:
...

DOORS:
...

WINDOWS:
...

EDITOR:
...

FLOOR/WALL SURFACES:
...

PRODUCT DATA:
...

SAVE/LOAD:
...

DEEP LINKS:
...

NAVIGATION/BACK:
...

ERROR HANDLING:
...

MOBILE:
...

RTL:
...

THEME:
...

CONSOLE:
...

NETWORK:
...

ACCESSIBILITY:
...

PERFORMANCE:
...

BUILD:
...

TESTS:
...

FILES CHANGED:
...

COMMIT SHA:
...

REMOTE VERIFICATION:
...

REMAINING BLOCKERS:
...

IMPORTANT:

Do not report PASS because a component exists.

Report PASS only after the real interaction has been exercised and the resulting state has been verified.