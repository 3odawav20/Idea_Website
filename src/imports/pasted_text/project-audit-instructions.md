MASTER PROJECT AUDIT + FULL IMPLEMENTATION + QA + MARKETPLACE COMPLETION

ROLE
You are the lead product engineer, senior frontend/backend architect, UX engineer, QA engineer, data integrity auditor, security reviewer, and deployment engineer for this entire project.

Your mission is NOT to make a superficial review.
Your mission is to reconstruct the COMPLETE intended product from ALL available conversation context, uploaded files, source files, project documentation, previous requirements, existing implementation, and repository history — then audit every requirement, implement every missing part, repair every broken part, and verify every user-facing feature end-to-end.

THIS IS AN EXECUTION TASK, NOT A COMMENTARY TASK.

You must NOT assume that something is complete merely because:
- a component exists
- a button exists
- a route exists
- a database table exists
- a placeholder exists
- a mock exists
- a menu item exists
- a visual design exists
- a function is named correctly
- a build succeeds

A feature is considered COMPLETE only when:
1. The UI exists.
2. The user can actually interact with it.
3. The action produces the intended result.
4. Data is correctly stored/retrieved.
5. Navigation works.
6. Error states work.
7. Loading states work.
8. Empty states work.
9. Mobile behavior works.
10. The feature survives refresh/navigation where appropriate.
11. Authentication/authorization is enforced where required.
12. Links/deep links work.
13. The feature is verified in a real browser.
14. There are no obvious console/runtime errors.
15. The implementation matches the intended product requirements and source data.

==================================================
PHASE 0 — READ EVERYTHING FIRST
==================================================

Before changing code, inspect EVERYTHING available to you.

Read and use:
- the entire current conversation/context available to you
- every relevant previous requirement
- every uploaded file
- every text file
- every specification
- every markdown file
- every project document
- every source/data file
- every source registry
- every existing implementation
- every configuration file
- every existing route/page/component
- every existing backend/API/database integration
- recent Git history
- current GitHub branch state
- deployment configuration
- Vercel configuration
- environment variable references
- package.json
- build scripts
- database/schema/migrations
- authentication setup
- storage setup
- product import pipelines

Do NOT skim only the obvious files.

Search the repository systematically.

Create a complete requirement inventory from the conversation and source materials.

For every requirement, record:

REQUIREMENT
SOURCE
CURRENT STATUS
CURRENT IMPLEMENTATION
MISSING PIECES
BUGS
SECURITY CONCERNS
DATA CONCERNS
MOBILE CONCERNS
TEST STATUS
FINAL STATUS

Statuses must be one of:

- COMPLETE
- PARTIAL
- BROKEN
- MISSING
- BLOCKED
- NEEDS VERIFICATION

Do NOT mark anything COMPLETE merely because it looks visually present.

==================================================
PHASE 1 — SOURCE OF TRUTH / REQUIREMENT RECONSTRUCTION
==================================================

Reconstruct the complete intended IDEA marketplace.

Treat previous conversation requirements and uploaded source files as authoritative project requirements.

DO NOT invent product data.

DO NOT silently change:
- product names
- SKUs
- dimensions
- prices
- image relationships
- supplier identities
- source references
- product IDs
- variant information
- descriptions

Where source data exists, preserve it exactly unless there is explicit evidence that it is incorrect.

Where conflicting sources exist:
- identify the conflict
- preserve provenance
- do not silently overwrite data
- implement a safe resolution strategy
- report the conflict

Where data is missing:
- represent it as missing
- do not fabricate values

==================================================
PHASE 2 — COMPLETE MARKETPLACE PRODUCT MODEL
==================================================

The site is a serious ceramic/sanitary-ware marketplace.

Audit and implement the complete marketplace data model.

Products must support, where provided by source:

- product name
- product ID
- SKU
- supplier
- manufacturer/brand
- category
- subcategory
- dimensions
- variants
- size
- color
- finish
- material
- description
- images
- image gallery
- price
- compare-at price where available
- availability
- stock status
- attributes
- source reference
- source URL
- product URL
- supplier relationship
- minimum order information where applicable

Product information must never be visually attractive but factually wrong.

Every product page must expose the correct available data.

==================================================
PHASE 3 — USER TYPES
==================================================

Implement and verify a proper role system.

At minimum support:

1. STANDARD USER / BUYER
2. SUPPLIER / SELLER / COMPANY
3. ADMIN / SITE MANAGEMENT

Audit role permissions.

A standard user must NOT be able to access supplier/admin functionality.

A supplier must have supplier-specific functionality.

Admin must have management functionality.

Authorization must exist at the data/action level, not only by hiding UI buttons.

==================================================
PHASE 4 — USER ACCOUNT SYSTEM
==================================================

Implement a professional account system.

Users must be able to:

- sign up
- sign in
- sign out
- verify email where configured
- reset password
- change password
- edit profile
- upload/change profile image where supported
- manage contact details
- manage addresses
- view account dashboard
- view previous activity/orders/requests where applicable
- manage saved/favorite products
- manage notifications where applicable

Account state must survive page refresh.

Users must never get trapped inside an account screen.

Every account page must have:
- clear navigation
- back navigation
- dashboard navigation
- mobile-safe navigation
- working logout

==================================================
PHASE 5 — SOCIAL LOGIN / IDENTITY PROVIDERS
==================================================

Where social authentication has been specified or prepared in the project, implement it professionally.

Support the intended providers from the existing requirements/configuration, including where applicable:

- Facebook
- Apple
- X / Twitter
- Google
- other already-requested identity providers

DO NOT add fake social-login buttons that do nothing.

Every provider button must either:
1. perform real authentication, or
2. be clearly marked unavailable/configuration-required in a controlled way.

For real providers:
- use secure OAuth/OIDC flows
- protect redirect URLs
- correctly handle callback
- handle cancelled login
- handle provider errors
- handle existing-account linking
- handle duplicate identities
- preserve session state
- correctly map provider identity to the local account

Do not store provider secrets in source code.

Inspect current environment variables and configuration.

==================================================
PHASE 6 — SUPPLIER / SELLER SYSTEM
==================================================

Build a serious supplier experience.

Supplier/company users must be able to:

- create supplier account
- create/manage company profile
- company name
- business information
- contact information
- company logo
- business description
- verification status where supported
- manage products
- add products
- edit products
- manage product images
- manage pricing
- manage availability
- manage variants
- view incoming buyer requests
- respond to buyer requests
- send quotations
- view quotation history
- manage active/completed requests

Supplier data must be isolated by supplier ownership.

A supplier must NOT be able to edit another supplier's products or requests.

==================================================
PHASE 7 — CORE BUYER REQUEST / RFQ SYSTEM
==================================================

THIS IS A CORE BUSINESS FEATURE.

The marketplace must allow a normal buyer to request ceramic/sanitary products.

Required workflow:

USER:
1. Finds a product/type.
2. Selects or describes the required product.
3. Specifies quantity.
4. Can upload an image/reference where applicable.
5. Can add notes/specifications.
6. Submits the request.

SYSTEM:
1. Finds matching suppliers/products.
2. Routes the request to eligible suppliers.
3. Creates a request record.
4. Notifies eligible suppliers.

SUPPLIER:
1. Receives the request.
2. Reviews product requirements.
3. Reviews quantity.
4. Reviews image/reference.
5. Calculates quote.
6. Sends price/quotation.

USER:
1. Receives supplier responses.
2. Can compare supplier offers.
3. Can inspect supplier information.
4. Can contact/respond where supported.
5. Can select/continue with a supplier.
6. Can see request status/history.

Do NOT implement this as a fake static screen.

This must be a real functional data flow.

==================================================
PHASE 8 — QUANTITY-BASED QUOTATION
==================================================

Quotation logic must account for requested quantity.

A supplier quotation should support, where appropriate:

- requested quantity
- unit price
- total price
- currency
- minimum order quantity
- lead time
- availability
- notes
- quotation expiration where supported
- supplier identity

Total calculation must be correct.

Do not create hardcoded fake pricing.

==================================================
PHASE 9 — NOTIFICATIONS
==================================================

Implement proper notifications for important business events.

Examples:

BUYER:
- request submitted
- supplier responded
- quote received
- quote updated
- request status changed

SUPPLIER:
- new buyer request
- request updated
- quotation accepted/rejected
- important account events

Where email notifications are required:
- use real email integration/configuration
- do not fake successful delivery
- handle failures
- log useful non-sensitive information

If email infrastructure is not configured, make that limitation explicit and build the system so configuration can be added cleanly.

==================================================
PHASE 10 — PRODUCT SHARING / DEEP LINKS
==================================================

Every product must have a real shareable URL.

When the user opens a product:
- URL must identify the product
- refreshing the page must still work
- direct/deep linking must work
- shared links must open the correct product

Implement professional sharing options where appropriate:

- copy link
- native device share when supported
- WhatsApp where appropriate
- Facebook where appropriate
- X where appropriate
- email/share options where appropriate

Do not create fake share buttons.

==================================================
PHASE 11 — IMAGE QUALITY / PRODUCT MEDIA
==================================================

Audit product images.

Detect:
- broken images
- missing images
- incorrect images
- duplicate images
- wrong aspect ratios where problematic
- poor display quality
- stretched images
- cropped product details
- missing zoom/lightbox behavior

Improve the visual presentation without altering the underlying factual product identity.

Implement professional:
- gallery
- thumbnails
- zoom
- full-screen view
- mobile swipe behavior
- lazy loading where appropriate
- responsive image handling
- fallback image behavior

Do not replace official source images with invented product images.

==================================================
PHASE 12 — SEARCH / FILTER / MARKET DISCOVERY
==================================================

The marketplace must use a modern discovery system.

Audit and improve:

- search
- category browsing
- filters
- sorting
- pagination/infinite loading where appropriate
- supplier filtering
- price filtering
- dimensions
- size
- color
- brand
- availability
- relevant attributes
- mobile filter experience

Search must return correct products.

No fake search results.

No placeholder filters that do nothing.

Every visible filter must either work or be removed/clearly unavailable.

==================================================
PHASE 13 — MODERN MARKETPLACE UX
==================================================

Use current professional marketplace patterns.

Implement where appropriate:

- clean product cards
- strong hierarchy
- optimized product images
- sticky mobile actions
- compact filter controls
- clear supplier information
- availability indicators
- fast navigation
- skeleton loading
- empty states
- useful error states
- breadcrumbs
- recently viewed where supported
- favorites
- comparison where appropriate
- request/quote CTA
- clear buyer journey

Avoid decorative complexity that makes the marketplace harder to use.

==================================================
PHASE 14 — NAVIGATION / BACK / ESCAPE / DEEP LINK QA
==================================================

THIS MUST BE EXHAUSTIVE.

From every important page, verify that users can return safely.

Test:

Home
→ Products
→ Product
→ Gallery
→ Share
→ Supplier
→ Request
→ Account
→ Login
→ Register
→ Dashboard
→ Quote
→ Notifications
→ Admin

Every route must have a predictable way back.

Browser Back must not create broken states.

Mobile back navigation must work.

Modal close buttons must work.

Drawers must close correctly.

Escape-key behavior should work where appropriate.

Deep links must work.

Refreshing any valid page must not break the app.

==================================================
PHASE 15 — iPHONE / iOS-FIRST QUALITY
==================================================

This site must be EXCELLENT on Apple mobile devices.

Prioritize:

- iPhone Safari
- iPhone Chrome
- iPad
- modern iOS viewport behavior
- safe areas
- bottom browser UI
- sticky headers
- sticky CTAs
- keyboard behavior
- touch targets
- scrolling
- modals
- drawers
- dropdowns
- image galleries
- forms
- account screens

Test at minimum:
- 320px
- 360px
- 375px
- 390px
- 393px
- 414px
- 430px
- tablet widths
- desktop widths

There must be:
- NO horizontal overflow
- NO clipped content
- NO unreachable buttons
- NO unusable dropdowns
- NO broken sticky elements
- NO keyboard-overlap form failures
- NO microscopic controls
- NO broken modals
- NO layout collapse

==================================================
PHASE 16 — ALL DEVICES
==================================================

Verify responsive behavior across:

- mobile
- tablet
- laptop
- large desktop
- touch devices

Pay special attention to:

navigation
search
product cards
product detail
filters
forms
checkout/request flows
supplier dashboard
admin dashboard
modals
tables
data-heavy views

==================================================
PHASE 17 — VISUAL QUALITY
==================================================

The website must look genuinely professional.

Audit:

- typography
- spacing
- hierarchy
- image treatment
- cards
- buttons
- forms
- dialogs
- navigation
- headers
- footers
- shadows
- borders
- loading states
- empty states
- error states
- responsive spacing
- RTL behavior

Do not redesign randomly.

Respect the existing visual direction and brand identity.

Where the current design is weak, improve it using modern production-quality UX patterns.

==================================================
PHASE 18 — RTL / ARABIC
==================================================

Verify Arabic RTL behavior.

Check:

- layouts
- icons
- arrows
- forms
- navigation
- breadcrumbs
- carousels
- product information
- tables
- dialogs
- notifications

Do not accidentally mirror elements that should remain directional.

==================================================
PHASE 19 — ADMIN / SITE MANAGEMENT
==================================================

Implement/repair the administration layer.

Admin must be able to manage, according to available architecture:

- users
- suppliers
- products
- categories
- product requests
- quotations
- platform settings
- moderation
- supplier verification
- content
- marketplace status
- relevant notifications
- source/import status

Admin-only pages must be protected.

Do not rely solely on frontend route hiding.

==================================================
PHASE 20 — DATA IMPORT + SOURCE INTEGRITY
==================================================

Audit every imported data source.

Preserve source provenance.

For every source determine:

- discovered
- extracted
- normalized
- validated
- imported
- displayed in UI
- verified in browser

Use the existing source registry.

IMPORTANT:

Do NOT claim that all 40 sources are complete unless they are actually complete and verified.

Do not convert PARTIAL/BLOCKED sources into COMPLETE without evidence.

For products from Art Ceramic and AbaElMozahem:
- preserve exact product identity
- preserve source relationship
- preserve IDs/SKUs where provided
- preserve product images
- preserve available dimensions
- do not invent missing values

==================================================
PHASE 21 — PRODUCT DATA QUALITY AUDIT
==================================================

Perform automated and manual checks for:

- duplicate IDs
- duplicate products
- broken references
- malformed product records
- wrong image associations
- invalid URLs
- missing required fields
- impossible dimensions
- inconsistent variant relationships
- mismatched supplier relationships

Generate a report.

Do NOT silently modify questionable data.

Flag it.

==================================================
PHASE 22 — PERFORMANCE
==================================================

Optimize without sacrificing quality.

Audit:

- bundle size
- code splitting
- lazy routes
- lazy images
- image loading
- expensive renders
- unnecessary requests
- repeated queries
- caching
- search performance
- mobile performance

Fix obvious performance problems.

Do not optimize blindly by removing required functionality.

==================================================
PHASE 23 — ACCESSIBILITY
==================================================

Audit:

- keyboard navigation
- labels
- focus states
- buttons
- dialogs
- forms
- semantic structure
- contrast
- alt text
- touch target size
- screen-reader behavior where appropriate

==================================================
PHASE 24 — SECURITY
==================================================

Audit for:

- authorization gaps
- client-only security
- exposed secrets
- insecure redirects
- unsafe URL handling
- unrestricted admin actions
- supplier data leakage
- user data leakage
- broken access control
- unsafe uploads
- injection risks
- insecure storage

Do not expose secrets in Git.

==================================================
PHASE 25 — ERROR / LOADING / EMPTY STATES
==================================================

Every important async operation needs:

- loading state
- success state
- error state
- retry behavior
- empty state

No dead-end screens.

No infinite spinners.

No buttons that appear clickable but fail silently.

==================================================
PHASE 26 — BROWSER QA
==================================================

Run the application in a real browser.

Do not rely only on build output.

Test actual user journeys.

At minimum verify:

1. Home → Products
2. Search → Product
3. Product → Gallery
4. Product → Share
5. Product → Supplier
6. Product → Request
7. Register
8. Login
9. Logout
10. Account navigation
11. Supplier login
12. Supplier dashboard
13. Supplier product management
14. Buyer request creation
15. Supplier request response
16. Buyer receives response/quote
17. Admin login
18. Admin dashboard
19. Mobile navigation
20. Mobile product detail
21. Mobile request form
22. Browser refresh on deep route
23. Back button behavior
24. Direct product URL
25. Broken/empty/error states

Capture evidence where possible.

==================================================
PHASE 27 — AUTOMATED TESTING
==================================================

Create or improve automated tests for critical business logic.

At minimum cover:

- authentication behavior
- role access
- product lookup
- search/filter behavior
- quantity calculations
- request creation
- supplier matching
- quotation calculations
- permissions
- shareable product URLs
- important navigation

==================================================
PHASE 28 — GIT / REPOSITORY SAFETY
==================================================

Work only against the intended repository:

https://github.com/3odawav20/Idea_Website

Branch:
main

Do NOT accidentally work against:

https://github.com/3odawav20/IDEA-Website

Do not commit:
- node_modules
- dist
- .env
- secrets
- certificates
- private keys
- local QA artifacts
- local deployment credentials

Before any commit:
- git status
- git diff --check
- inspect changed files
- run build
- run tests

Then commit meaningful changes.

Push to main.

Verify the remote commit afterwards.

==================================================
PHASE 29 — VERCEL
==================================================

Verify that deployment configuration matches the actual project.

Confirm:

- framework
- build command
- output directory
- SPA routing
- environment variables
- production build
- deep links
- asset paths

IMPORTANT:

The existing Vercel project may still be connected to the OLD repository.
Do NOT assume that GitHub repository migration automatically updates Vercel.

Verify the actual repository connection.

Do not claim production deployment is correct unless verified.

==================================================
PHASE 30 — FINAL ACCEPTANCE TEST
==================================================

At the end, create a final acceptance matrix.

Example:

FEATURE | STATUS | VERIFIED WHERE | NOTES

Include ALL major features, not only the ones you changed.

The final report must contain:

A. Requirements discovered
B. Files inspected
C. Files changed
D. Features implemented
E. Features repaired
F. Features still blocked
G. Data issues discovered
H. Security issues discovered
I. Mobile issues fixed
J. Browser QA results
K. Automated test results
L. Build result
M. Git status
N. Commit SHA
O. Remote verification
P. Vercel status
Q. Remaining blockers

==================================================
CRITICAL RULES
==================================================

RULE 1:
Do not guess.

RULE 2:
Do not invent product information.

RULE 3:
Do not fabricate functionality.

RULE 4:
Do not report a button as functional unless it actually works.

RULE 5:
Do not report authentication as functional unless the entire flow works.

RULE 6:
Do not report social login as functional unless the provider integration actually works.

RULE 7:
Do not report supplier functionality as complete if it is only a mock UI.

RULE 8:
Do not report the RFQ/quotation workflow as complete if requests do not actually travel from buyer to suppliers.

RULE 9:
Do not report email notifications as delivered unless the email integration actually sends them.

RULE 10:
Do not silently replace source data with invented data.

RULE 11:
Do not delete working functionality simply because it is inconvenient.

RULE 12:
Preserve the existing brand identity unless a change is required by the requirements.

RULE 13:
Prefer real production architecture over temporary hacks.

RULE 14:
Every important feature must work on mobile.

RULE 15:
Every important route must be reachable directly.

RULE 16:
Every important route must be escapable/back-navigable.

RULE 17:
Every major action must have clear success/error feedback.

RULE 18:
Do not stop at "build passes."

RULE 19:
Do not stop at "UI looks good."

RULE 20:
Do not stop until the acceptance matrix is completed.

==================================================
MOST IMPORTANT INSTRUCTION
==================================================

Treat ALL previous project instructions, uploaded files, source registries, requirements, product datasets, designs, and implementation notes as one unified specification.

Your job is to FIND EVERYTHING THAT WAS REQUESTED BEFORE, MAP IT TO THE CURRENT CODEBASE, IMPLEMENT WHAT IS MISSING, REPAIR WHAT IS BROKEN, VERIFY WHAT ALREADY EXISTS, and leave the repository in the strongest production-ready state realistically possible.

Do not optimize for speed.
Optimize for correctness, completeness, data integrity, security, UX, and real functionality.

When you encounter uncertainty:
- inspect the source
- inspect the code
- inspect the data
- inspect the existing implementation
- inspect the relevant project files
- make the smallest defensible assumption
- document it

Do NOT ask me to manually check obvious implementation details that you can inspect yourself.

Do NOT give me a long explanation before doing the work.

FIRST:
Read.
Inventory.
Audit.
Then implement.
Then test.
Then verify.
Then report exact evidence.