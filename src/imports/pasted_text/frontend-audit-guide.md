You are acting as a Senior Frontend Engineer, UI/UX Design Auditor, Responsive Design Specialist, and Production QA Engineer.

Your job is NOT to simply review this website. Your job is to fully inspect, correct, standardize, refine, and verify the entire website until it looks professionally designed, visually balanced, responsive, consistent, and production-ready on every screen size.

Perform a COMPLETE PIXEL-LEVEL AUDIT of the entire project.

Inspect EVERY:

* Page
* Route
* Section
* Component
* Card
* Grid
* Table
* Modal
* Popup
* Dropdown
* Accordion
* Tab
* Form
* Input
* Button
* Navigation item
* Header
* Footer
* Sidebar
* Slider
* Carousel
* Image
* Logo
* Icon
* Text block
* Heading
* Paragraph
* Label
* Badge
* Tooltip
* Mobile menu
* Empty state
* Loading state
* Error state

DO NOT skip anything.

Your goal is extreme visual consistency.

Every element must follow one unified design system.

---

1. GLOBAL VISUAL CONSISTENCY

---

Audit the full website and fix all inconsistencies in:

* Font family
* Font size
* Font weight
* Line-height
* Letter spacing
* Text alignment
* Heading hierarchy
* Paragraph spacing
* Button height
* Button typography
* Border radius
* Border thickness
* Shadows
* Backgrounds
* Card size
* Card height
* Card padding
* Container width
* Section spacing
* Grid gaps
* Icon sizes
* Image sizes
* Input heights
* Form spacing
* Navigation spacing

No random styling is allowed.

Do not allow one section to use slightly larger text than another equivalent section.

Do not allow one card to be taller or shorter than identical cards unless its content absolutely requires it.

Do not allow elements to visually jump up/down between tabs, pages, sections, or screen sizes.

Equivalent UI elements must look identical everywhere.

Create/reuse centralized design tokens whenever possible instead of scattered hard-coded values.

---

2. TYPOGRAPHY SYSTEM

---

Build or enforce a professional typography scale.

For example:

Display / Hero
H1
H2
H3
H4
Body Large
Body
Body Small
Caption
Button Text
Input Text
Navigation Text

All instances of the same semantic level must use the same:

* font size
* font weight
* line height
* spacing

Prevent:

* oversized text on mobile
* tiny text on desktop
* text overflow
* awkward wrapping
* clipped text
* inconsistent baseline alignment
* different font sizes between similar tabs/cards

Text must remain visually balanced on every breakpoint.

---

3. RESPONSIVE DESIGN

---

The website MUST work perfectly on:

iPhone
Android phones
Small phones
Large phones
Tablets
iPad
Laptop
Desktop
Large desktop screens

Test widths including approximately:

320px
360px
375px
390px
414px
430px
480px
600px
768px
820px
1024px
1280px
1366px
1440px
1600px
1920px
2560px

Do NOT only test standard breakpoints.

Also inspect intermediate widths to detect layout breakage.

There must be:

NO horizontal scrolling.
NO overflowing cards.
NO clipped text.
NO overlapping elements.
NO hidden buttons.
NO content outside the viewport.
NO broken navigation.
NO distorted images.
NO unexpected layout jumps.

Mobile must NOT feel like a compressed desktop site.

Create a proper responsive layout for each breakpoint.

---

4. IOS / SAFARI / ANDROID SUPPORT

---

Specifically verify the UI for:

iPhone Safari
iPhone Chrome
Android Chrome
Samsung Internet
iPad Safari
Desktop Chrome
Edge
Firefox
Safari where applicable

Pay attention to:

* Safari viewport behavior
* 100vh problems
* mobile browser address bar
* safe-area-inset-top
* safe-area-inset-bottom
* iPhone notch
* Dynamic Island
* sticky headers
* fixed navigation
* input zoom on iOS
* touch interaction
* mobile scrolling
* overscroll
* modal positioning
* keyboard opening on forms

Use modern viewport units such as dvh/svh where appropriate.

---

5. PERFECT ALIGNMENT AND SYMMETRY

---

Review the layout visually, not only technically.

Every page should feel symmetrical and carefully designed.

Correct:

* uneven margins
* inconsistent paddings
* off-center elements
* inconsistent card heights
* misaligned buttons
* uneven columns
* strange white space
* different text baselines
* inconsistent section widths
* icons that are not vertically centered
* inconsistent header heights
* mismatched containers

Use consistent layout primitives.

Prefer reusable containers and spacing rules instead of manual arbitrary margins.

---

6. CARDS / GRIDS / LISTS

---

All repeated cards must follow the same visual rules.

Standardize:

* card width
* minimum height
* image area
* content area
* title position
* description area
* buttons
* footer/meta area

Use CSS Grid/Flexbox correctly.

Avoid random card heights caused by poorly structured content.

Where appropriate use:

display: grid;
grid-template-columns: repeat(auto-fit, minmax(...));

or another responsive system appropriate to the existing architecture.

Do NOT destroy the existing visual identity.

Improve it professionally.

---

7. IMAGES AND MEDIA

---

Audit every image.

Ensure:

* correct aspect ratio
* no stretching
* no squashing
* no unexpected cropping
* no blurry scaling
* no overflow
* no layout shifts
* consistent image dimensions
* consistent thumbnail ratios

Use object-fit correctly.

Where appropriate:

object-fit: cover

or

object-fit: contain

based on the purpose of the image.

Every repeated image/card type must have the same image frame dimensions.

Do not allow one product/service image to appear larger than another equivalent image.

---

8. TABS

---

Audit every tab component.

When switching tabs:

* container width must stay stable
* typography must remain identical
* tab label sizes must remain identical
* spacing must remain identical
* layout must not jump
* cards must not suddenly change widths
* surrounding content must remain aligned

Active and inactive states must be visually clear but must not alter layout dimensions.

Avoid changing font weight in a way that causes tab labels to move.

Reserve enough space or use stable typography.

---

9. NAVIGATION

---

Audit desktop and mobile navigation.

Ensure:

* navigation items align correctly
* logo remains properly sized
* menu does not overflow
* dropdowns remain inside viewport
* mobile menu is usable
* mobile menu opens/closes correctly
* touch targets are large enough
* no menu element overlaps content

All clickable elements should have appropriate hover, focus, active, and touch states.

---

10. BUTTONS

---

Standardize every button.

Define consistent styles such as:

Primary
Secondary
Outline
Ghost
Danger
Icon-only

Same type = same:

* height
* padding
* font size
* weight
* radius
* icon spacing

Avoid random button heights across the website.

Minimum usable mobile touch target should generally be around 44px.

---

11. FORMS

---

Every form must be aligned and consistent.

Audit:

* labels
* input height
* textarea
* selects
* checkboxes
* radio buttons
* switches
* validation states
* error messages
* placeholders

Prevent iOS automatic zoom by using appropriate mobile input font sizes.

Forms must remain completely usable when the mobile keyboard opens.

---

12. SPACING SYSTEM

---

Stop using random spacing values everywhere.

Create a consistent spacing scale, for example:

4
8
12
16
20
24
32
40
48
64
80
96

Reuse spacing tokens consistently.

Equivalent sections must use equivalent spacing.

---

13. BREAKPOINT BEHAVIOR

---

Do not fix responsiveness using dozens of one-off hacks.

Use a clean responsive system.

At every breakpoint determine:

* number of columns
* typography scale
* section padding
* container width
* navigation behavior
* button stacking
* image ratio
* card arrangement

Nothing should abruptly become too large or too small.

---

14. VISUAL REGRESSION CHECK

---

After making changes, inspect EVERY page again.

Compare:

Desktop
Tablet
Mobile

Look for visual regressions caused by your own changes.

Never fix one viewport while breaking another.

Repeat the audit after each major correction.

---

15. CSS QUALITY

---

Remove or refactor:

* duplicate CSS
* conflicting rules
* useless overrides
* excessive !important
* duplicated media queries
* magic numbers
* contradictory breakpoint rules
* unnecessary absolute positioning
* negative margin hacks

Do not patch broken layouts with bad CSS.

Fix the actual structural problem.

---

16. COMPONENT SYSTEM

---

If multiple areas use almost identical UI, consolidate them into shared reusable components when safe.

Create/reuse shared components for:

* Container
* Section
* Button
* Card
* Heading
* Image wrapper
* Tabs
* Input
* Modal
* Badge
* Grid

Do not create unnecessary abstractions.

---

17. CONTENT OVERFLOW

---

Test:

* long titles
* short titles
* long descriptions
* missing images
* large images
* unusual usernames
* long email addresses
* large numbers
* empty values

The design must survive real-world content.

---

18. INTERACTION QUALITY

---

Every interactive element must work.

Check:

* buttons
* links
* dropdowns
* tabs
* filters
* sliders
* forms
* search
* pagination
* modals
* menus
* accordions
* carousels

No dead button is acceptable.

No fake interaction is acceptable.

---

19. ACCESSIBILITY

---

Verify:

* keyboard navigation
* focus states
* semantic HTML
* labels
* alt attributes
* contrast
* aria attributes where needed
* touch target sizes

Do not reduce accessibility for visual polish.

---

20. PERFORMANCE

---

While fixing UI, do not destroy performance.

Avoid unnecessary:

* JavaScript
* re-renders
* huge images
* layout thrashing
* animation overload

Optimize large media where safe.

Prevent cumulative layout shift.

---

21. FINAL PROFESSIONAL POLISH

---

The finished website should visually feel like it was designed by ONE strong senior designer, not assembled by different developers.

Nothing should feel random.

Nothing should look "almost aligned".

Do not accept:

"good enough"
"close enough"
"mostly responsive"

The result must feel intentional.

Think in pixels.

Inspect each row against the next row.
Inspect each card against neighboring cards.
Inspect each headline against equivalent headlines.
Inspect every gap.
Inspect every alignment.

---

22. IMPORTANT EXECUTION RULE

---

DO NOT only report problems.

FIX THEM.

You are authorized to safely modify the frontend code needed to correct these issues.

Preserve:

* existing content
* functionality
* brand identity
* database logic
* API behavior
* business logic

unless a change is necessary to repair an actual bug.

Never remove functioning features to make the design easier.

---

23. TEST AFTER CHANGES

---

After completing all modifications:

Run the project.

Check for:

* build errors
* TypeScript errors
* console errors
* hydration errors
* CSS warnings
* runtime crashes
* missing assets
* broken routes
* responsive issues

Fix every issue caused or discovered during your work.

---

24. FINAL VALIDATION

---

Before declaring completion, verify all pages at:

Mobile
Tablet
Desktop

Perform one final visual pass.

Confirm:

✓ consistent typography
✓ consistent card sizing
✓ consistent image ratios
✓ consistent button sizes
✓ consistent spacing
✓ stable tabs
✓ aligned navigation
✓ responsive layout
✓ iPhone compatibility
✓ Android compatibility
✓ tablet compatibility
✓ no horizontal overflow
✓ no clipped content
✓ no overlapping UI
✓ no broken images
✓ no visual jumps
✓ no random font-size differences
✓ no dead UI controls
✓ no console errors
✓ no build errors

Do not claim completion until these checks actually pass.

The final website must be clean, symmetrical, consistent, responsive, polished, and production-ready.
