==================================================
FINAL VISUAL VERIFICATION — MANDATORY
=====================================

THIS IS A CRITICAL REQUIREMENT.

Do NOT consider a successful build, successful deployment, passing tests, or successful data import as proof that the website is visually correct.

You MUST inspect the ACTUAL rendered website after your changes and verify that what appears in the browser is exactly what was intended.

After every major implementation pass:

1. Run the production build.
2. Start the website.
3. Open the actual rendered website in a browser.
4. Inspect the real UI visually.
5. Navigate through the important pages.
6. Test interactions.
7. Detect visual or responsive problems.
8. Fix them.
9. Reload/rebuild.
10. Inspect again.

Continue until the rendered result is correct.

==================================================
HOME PAGE — DEEP VISUAL INSPECTION
==================================

Pay EXTRA attention to the HOME PAGE.

Inspect the entire page from top to bottom.

The HERO / MAIN SLIDER at the top of the homepage is especially important.

Visually inspect EVERY slide individually.

Check:

• Hero image quality
• Image loading
• Image cropping
• Image positioning
• Object positioning
• Desktop crop
• Mobile crop
• Image aspect ratio
• Image sharpness
• Overlay
• Gradient
• Text readability
• Text/image contrast
• Heading placement
• Subtitle placement
• Buttons
• CTA positioning
• Slider arrows
• Pagination indicators
• Auto-play behavior
• Swipe behavior
• Slide transitions
• Header overlapping the slider
• Text overflowing the image
• Important parts of images being cropped
• Empty/black areas
• Broken images
• Unexpected stretching
• Incorrect heights
• Layout shifts

If text appears ON TOP of hero/slider images, inspect it visually against EVERY slide.

Do not assume one text color or overlay works for every image.

If any slide makes the text difficult to read, intelligently fix the overlay, gradient, positioning, responsive typography, image positioning or other appropriate styling while preserving the premium design.

If an important subject/product in a hero image is being cropped on mobile, use responsive object-position/art direction instead of accepting a bad crop.

The hero must look intentionally designed on BOTH desktop and mobile.

==================================================
REAL BROWSER QA
===============

Do not inspect only source code.

Do not inspect only DOM structure.

Do not rely only on automated unit tests.

Actually render and visually inspect the pages.

Where browser/screenshot inspection tools are available, USE THEM.

Test real interactions:

• Navigation
• Dropdowns
• Mobile menu
• Search
• Filters
• Product cards
• Product pages
• Image galleries
• Sliders
• Carousels
• Buttons
• Forms
• Social links
• Contact actions
• Back navigation
• Footer links

Fix console errors and important browser warnings.

==================================================
IPHONE — MANDATORY
==================

The website MUST work exceptionally well on iPhone.

Treat iPhone compatibility as a release requirement, NOT an optional improvement.

Test representative iPhone viewport sizes, including approximately:

375 × 667
375 × 812
390 × 844
393 × 852
414 × 896
430 × 932

Test both narrow and larger modern iPhone layouts.

Verify:

• No horizontal scrolling
• No clipped content
• No text outside containers
• No overlapping sections
• Correct responsive typography
• Correct header height
• Working mobile navigation
• Proper logo sizing
• Hero/slider correctly fitted
• Hero text readable
• Hero images correctly cropped
• Buttons large enough to tap
• Forms usable
• Search usable
• Filters usable
• Product cards correctly sized
• Product galleries swipe correctly
• Modals fit the viewport
• Footer renders correctly
• Arabic RTL works correctly
• Long Arabic product names do not break layouts
• Prices remain readable
• Dimensions remain readable
• Social icons are tappable
• Phone links work correctly
• WhatsApp actions work correctly when present

Account for iPhone safe areas where relevant.

Use:

env(safe-area-inset-top)
env(safe-area-inset-bottom)

where technically appropriate.

Do not allow fixed/sticky elements to conflict with the iPhone browser UI or device safe areas.

==================================================
TOUCH EXPERIENCE
================

Do not design mobile as merely a smaller desktop.

Test touch behavior.

Interactive controls must have appropriate touch targets.

Sliders/carousels must support natural touch/swipe behavior.

Avoid hover-only functionality.

Dropdowns, filters, menus and product galleries must remain fully usable without a mouse.

Prevent accidental horizontal page movement caused by oversized elements.

==================================================
RESPONSIVE IMAGE QA
===================

Check images independently on desktop and mobile.

A technically valid image is NOT necessarily visually correct.

Detect:

• Wrong object-fit
• Wrong object-position
• Excessive crop
• Distortion
• Pixelation
• Wrong aspect ratio
• Product cut-offs
• Faces/subjects cut off
• Hero subjects hidden behind text
• Mobile hero images that no longer communicate the intended composition

Fix each issue appropriately.

Do NOT solve every image problem by blindly applying object-fit: cover.

==================================================
VISUAL REGRESSION CHECK
=======================

After fixes, revisit previously working pages.

Make sure solving mobile did not break desktop.

Make sure solving desktop did not break iPhone.

Make sure changing the new logo did not break:

• Header height
• Navigation spacing
• Mobile navigation
• Footer
• Hero alignment

Make sure new imported data did not break cards because of:

• Long names
• Long Arabic text
• Unusual dimensions
• Multiple sizes
• Missing price
• Many variants
• Different image ratios

Test REAL imported records, not convenient dummy records.

==================================================
DEPLOYED VERSION — FINAL TRUTH
==============================

If the project has a deployed Preview/Production URL, the DEPLOYED rendered version is the final source of truth.

After deployment:

OPEN THE DEPLOYED WEBSITE.

Do not assume that because localhost works, deployment works.

Verify that the deployed version actually contains the changes.

Check:

• New official logo is visible
• Old logo/branding is gone
• Correct colors are deployed
• Imported products are visible
• Product images load
• Exact dimensions display correctly
• Categories work
• Search works
• Filters work
• Company addresses appear correctly
• Facebook link is correct
• Instagram link is correct
• Contact information is correct
• Homepage hero works
• Every important hero slide renders correctly
• Mobile/iPhone layout works
• No deployment-only errors exist

Compare the deployed result against the local verified result.

If deployment differs from localhost, investigate and FIX the deployment issue.

Do NOT report completion while the deployed version is stale, broken, missing data, or visually incorrect.

==================================================
FINAL RELEASE LOOP
==================

Perform this exact release loop:

IMPLEMENT
→ IMPORT ALL DATA
→ RECONCILE SOURCE DATA
→ VALIDATE NAMES/SIZES/DIMENSIONS
→ RUN TESTS
→ PRODUCTION BUILD
→ START SITE
→ VISUAL DESKTOP QA
→ HOME PAGE QA
→ CHECK EVERY HERO SLIDE
→ MOBILE QA
→ IPHONE QA
→ ARABIC RTL QA
→ TOUCH/INTERACTION QA
→ FIX ALL DISCOVERED ISSUES
→ REBUILD
→ RECHECK
→ DEPLOY/PREVIEW
→ OPEN DEPLOYED VERSION
→ VISUALLY VERIFY DEPLOYED VERSION
→ TEST DEPLOYED MOBILE/IPHONE
→ FIX ANY DEPLOYMENT DIFFERENCES
→ FINAL RECHECK.

Repeat the loop whenever a fix introduces a regression.

DO NOT STOP simply because the code compiles.

DO NOT STOP simply because tests pass.

DO NOT STOP simply because deployment succeeds.

The task is complete ONLY when the REAL rendered and deployed website has been visually inspected and verified to work correctly.

==================================================
FINAL ACCEPTANCE ADDITIONS
==========================

Before declaring DONE, explicitly verify:

✓ The deployed version contains the latest changes.
✓ The deployed version visually matches the intended result.
✓ The homepage has been visually inspected.
✓ Every hero/slider image has been inspected.
✓ Hero text is readable over every slide.
✓ No broken, badly cropped or stretched hero images remain.
✓ Header and hero do not overlap incorrectly.
✓ New official logo displays correctly.
✓ No old branding remains.
✓ Real imported products render correctly.
✓ Real product names do not break layouts.
✓ Exact product dimensions display correctly.
✓ Product images correspond to the correct products.
✓ Desktop experience is polished.
✓ Mobile experience is polished.
✓ Multiple iPhone viewport sizes have been tested.
✓ No horizontal scrolling exists on iPhone.
✓ Navigation works correctly by touch.
✓ Hero slider works correctly by touch/swipe.
✓ Search and filters work on iPhone.
✓ Product pages work on iPhone.
✓ Arabic RTL works on iPhone.
✓ Contact/social actions work on iPhone.
✓ No critical browser console errors remain.
✓ No known visual regression remains.

In your final report, include a separate section:

VISUAL QA:
Desktop: PASS / FAIL
Mobile: PASS / FAIL
iPhone: PASS / FAIL
Arabic RTL: PASS / FAIL
Homepage: PASS / FAIL
Hero Slider: PASS / FAIL
Touch Interactions: PASS / FAIL
Deployed Version: PASS / FAIL

List every viewport tested and every unresolved visual issue.

Never write PASS unless you actually rendered, inspected and tested that item.
