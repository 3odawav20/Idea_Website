# FINAL EXECUTION — FULL DATA IMPORT, SOURCE AUDIT & VISUAL QA

Do not give me another plan or explanation.

EXECUTE the work now.

The goal is NOT merely to have a successful build.

The goal is to have the website contain the correct data from ALL supplied sources, with verified provenance, correct product associations, correct images, correct dimensions, correct company information, and a visually verified production/deployed website.

---

## 1. FIRST — READ THE ENTIRE PROJECT

Before changing anything:

Inspect the complete repository.

Read:

* all source files
* all data files
* all configuration
* all existing importers
* all backend/store files
* all i18n files
* all theme files
* all text/instruction files
* package.json
* vite.config
* vercel configuration
* existing documentation

Do not rebuild the project from scratch.

Use the existing architecture.

---

# 2. THE 40 SUPPLIED SOURCES ARE MANDATORY

I supplied 40 important source URLs.

Every one of them must be treated as an independent source.

Do NOT assume that Art Ceramic represents the other sources.

Do NOT consider the project complete because Art Ceramic has 475 products.

Create or locate a permanent source registry containing all 40 original URLs.

For every source preserve:

* source_id
* original_url
* resolved_url
* source_name
* domain
* source_type
* crawl_status
* extraction_status
* product_count
* image_count
* missing_fields
* errors
* last_checked
* provenance

NEVER overwrite the original URL.

For share.google URLs:

original_url = exact supplied share.google URL

resolved_url = actual destination URL

---

# 3. IF THE 40 URLS ARE CURRENTLY MISSING

Do NOT invent URLs.

Do NOT substitute random Google search results.

Do NOT silently process only the sources already present in the repository.

Recover the exact 40 supplied URLs from the project instructions/context available to you.

Create the source registry from those exact URLs.

If a source cannot be resolved or accessed, record:

BLOCKED / FAILED / NOT_PROCESSED

rather than pretending it succeeded.

---

# 4. CRAWL AND EXTRACT ALL SOURCES

Process every source independently.

Use normal HTTP extraction where possible.

Use browser automation / Playwright when:

* JavaScript is required
* products are dynamically loaded
* pagination is dynamic
* images appear only after rendering
* filters/load-more require interaction
* content is hidden behind UI interactions

Follow pagination completely.

Do not stop after the first page.

Do not use a small sample.

---

# 5. EXTRACT COMPLETE PRODUCT DATA

For every product capture whatever the source actually provides, including:

* product name Arabic
* product name English
* brand
* category
* subcategory
* collection
* SKU
* product/reference code
* product URL
* gallery images
* main image
* price
* old price
* discount
* currency
* availability
* color
* material
* finish
* description
* usage
* dimensions
* width
* height
* length
* thickness
* technical specifications
* packaging
* pieces per box
* m² per box
* weight
* origin
* variants

Do NOT invent values.

If the source does not provide a field, leave it null/empty and report it as missing.

---

# 6. DIMENSIONS — CRITICAL

Never destroy the original source value.

For every dimension preserve:

originalSourceValue

AND separately:

normalizedDisplayValue

AND, when safely possible:

widthMm
heightMm
lengthMm
thicknessMm

Example:

source:
"60x120"

preserve:

originalSourceValue = "60x120"

normalizedDisplayValue = "60 × 120 cm"

widthMm = 600

lengthMm = 1200

Do not replace the original data with the normalized value.

---

# 7. RAW DATA / PROVENANCE

Every imported record must preserve the original source information.

Store:

* source_id
* original source URL
* product page URL
* extraction timestamp
* raw source record
* normalized record

The raw source record must remain untouched.

This allows later auditing and correction without losing the original information.

---

# 8. IMAGE VERIFICATION

Do not count an image merely because an image URL exists.

For every unique image URL:

* check accessibility
* verify HTTP response
* detect broken images
* detect redirects
* detect HTML returned instead of image
* detect duplicates
* preserve source association
* preserve product association

Most importantly:

VERIFY THAT THE IMAGE BELONGS TO THE CORRECT PRODUCT.

Do not accidentally attach an image from one product to another product.

---

# 9. PRODUCT DEDUPLICATION

Use this priority:

1. SKU
2. manufacturer reference
3. source product ID
4. canonical product URL
5. carefully validated product name + dimensions + variant

Never merge uncertain products.

If the same product appears on multiple sources, preserve source provenance.

Do not erase source-specific information.

---

# 10. ART CERAMIC — CURRENT 475 PRODUCTS

The current repository reports:

475 unique Art Ceramic products
3,434 unique image URLs
3,964 image references

Do NOT assume these numbers are final.

Revalidate them after the complete import.

Check every Art Ceramic record for:

* name
* dimensions
* image
* SKU/reference
* variants
* gallery
* source URL
* raw source record

If anything is missing, fix it or explicitly report it.

---

# 11. SOURCE-BY-SOURCE RECONCILIATION

Generate a complete audit containing EXACTLY 40 source rows.

Format:

SOURCE
ORIGINAL URL
RESOLVED URL
STATUS
PRODUCTS
VARIANTS
IMAGE REFERENCES
UNIQUE IMAGES
VALID IMAGES
BROKEN IMAGES
MISSING DATA
ERRORS
NOTES

Valid statuses:

PASS
PARTIAL
BLOCKED
FAILED
NOT_PROCESSED

Never convert PARTIAL/BLOCKED/FAILED into PASS.

---

# 12. GLOBAL DATA TOTALS

Calculate real totals after import:

* total sources
* accessible sources
* blocked sources
* failed sources
* successfully processed sources
* total raw products
* total unique products
* total variants
* total image references
* total unique image URLs
* valid images
* broken images
* products missing names
* products missing dimensions
* products missing images
* products missing SKU
* products missing technical specifications

These numbers must come from the actual resulting data.

---

# 13. COMPANY / BUSINESS INFORMATION

Also extract and reconcile company information from the supplied sources:

* company names
* Arabic/English names
* headquarters
* branches
* showrooms
* stores
* full addresses
* city
* governorate
* phones
* WhatsApp
* emails
* opening hours
* map/location information
* website
* Facebook
* Instagram
* TikTok
* YouTube
* other official social links

Never invent contact information.

---

# 14. WEBSITE DATA MODEL

Use structured entities where appropriate:

Product
ProductVariant
ProductImage
Brand
Category
Subcategory
Collection
Specification
Company
Branch
Address
Contact
SocialLink
Source

Do not create duplicated or contradictory representations of the same data unnecessarily.

---

# 15. LOGO / BRANDING

The new supplied logo must replace the old branding everywhere.

Search the entire project for:

* old "S" logo
* ADIA
* old logo imports
* placeholder logos
* old favicon
* old social preview image
* old metadata branding

The new logo must be used consistently in:

* header
* homepage
* footer
* mobile header
* loading states
* favicon
* metadata
* social preview where applicable
* any remaining branded component

Do not distort the logo.

Adapt the website color system to the actual logo.

---

# 16. HOMEPAGE — VERY IMPORTANT

After data work is finished, OPEN THE ACTUAL RENDERED WEBSITE.

Do not judge the homepage from source code alone.

Inspect the homepage from the very top to the bottom.

Pay special attention to everything ABOVE and AROUND the hero/slider images.

Check:

* header
* logo
* navigation
* announcement bars
* hero text
* hero image
* hero crop
* hero positioning
* aspect ratio
* overlay
* text contrast
* buttons
* arrows
* pagination dots
* autoplay
* transitions
* spacing
* header/hero overlap
* image loading
* broken images
* black/empty areas

---

# 17. INSPECT EVERY HERO SLIDE

Do NOT inspect only the first slide.

Open/check EVERY hero/slider slide individually.

For each slide verify:

* correct image
* correct crop
* correct positioning
* correct text
* readable text
* correct buttons
* correct contrast
* no clipping
* no unexpected empty space
* no broken image
* no overlay problem

If any slide is bad:

FIX IT.

Then rebuild and inspect again.

---

# 18. MOBILE / iPHONE — MANDATORY

The website must be tested as an actual mobile layout.

At minimum inspect:

375 × 667
375 × 812
390 × 844
393 × 852
414 × 896
430 × 932

Specifically verify iPhone-style layouts.

Check:

* no horizontal scrolling
* no content outside viewport
* no clipped text
* no clipped images
* no broken navigation
* mobile menu
* filter drawer
* product cards
* product gallery
* buttons
* touch targets
* sliders
* swipe gestures
* search
* forms
* footer
* RTL Arabic

The filter panel must be completely hidden when closed.

It must appear only after the user opens it.

---

# 19. TOUCH / SLIDER TESTING

Do not rely only on desktop mouse interaction.

Test:

* swipe
* touch
* slider arrows
* pagination
* autoplay
* opening/closing mobile menu
* opening/closing filters
* product gallery
* image navigation

No critical functionality may depend on hover.

---

# 20. RTL ARABIC

Test the actual rendered Arabic interface.

Verify:

* direction
* alignment
* navigation
* cards
* filters
* forms
* buttons
* icons
* slider arrows
* spacing
* typography
* mobile layout

No Arabic text may be clipped or positioned incorrectly.

---

# 21. BUILD / RUNTIME VERIFICATION

Run the real project commands.

Verify:

* no TypeScript errors
* no Vite errors
* no module resolution errors
* no runtime exceptions
* no broken imports
* no missing assets
* no failed API/data loading
* production build succeeds

Do not merely say "build successful".

Inspect the actual output.

---

# 22. IMPORTANT — [blocked] FILES

You previously reported:

artceramicImport.ts [blocked]
Products.tsx [blocked]

Investigate this immediately.

Determine exactly what "blocked" means.

Was the file actually modified?

Was the requested change prevented?

Did another process lock the file?

Did the edit fail?

Did the tool only report a status?

Do not assume.

Verify the actual file contents and git diff.

If the required changes are not present, make them now.

---

# 23. FINAL VERIFICATION LOOP

You must execute this complete loop:

IMPORT
→ VALIDATE
→ RECONCILE
→ TEST
→ BUILD
→ RUN
→ OPEN RENDERED SITE
→ INSPECT DESKTOP
→ INSPECT MOBILE
→ INSPECT iPHONE
→ INSPECT RTL
→ INSPECT HOMEPAGE
→ INSPECT EVERY HERO SLIDE
→ TEST TOUCH
→ FIX
→ REBUILD
→ RECHECK

Repeat until there are no fixable issues remaining.

---

# 24. DEPLOYED / PREVIEW VERSION

Do NOT assume localhost equals the deployed website.

Open the actual preview/deployed version.

Verify there:

* latest code
* latest data
* latest logo
* correct colors
* homepage
* every hero slide
* product listing
* product detail
* images
* dimensions
* filters
* search
* mobile
* iPhone-sized layout
* RTL

If the deployed version differs from localhost:

FIX THE ACTUAL PROJECT AND DEPLOY AGAIN.

---

# 25. FINAL REPORT

When everything is actually verified, give me a final report containing:

## A — 40 SOURCE AUDIT

Exactly 40 rows.

## B — DATA TOTALS

Actual calculated totals.

## C — BLOCKED / FAILED SOURCES

Exact source names and reasons.

## D — BROKEN IMAGES

Exact counts and affected products/sources.

## E — DATA VALIDATION

Names
SKUs
Dimensions
Images
Variants
Specifications
Company information

## F — UI RECONCILIATION

Imported data vs displayed data.

## G — DESKTOP QA

PASS / FAIL + issues.

## H — MOBILE QA

PASS / FAIL + issues.

## I — iPHONE QA

PASS / FAIL + issues.

## J — RTL QA

PASS / FAIL + issues.

## K — HOMEPAGE QA

PASS / FAIL + issues.

## L — HERO/SLIDER QA

Every slide individually.

## M — DEPLOYED VERSION QA

PASS / FAIL + URL/version checked.

## N — FILES CHANGED

Exact paths.

## O — COMMANDS EXECUTED

Exact commands.

## P — REMAINING ISSUES

Nothing hidden.

---

# FINAL RULE

Do NOT tell me:

"Everything is ready"

unless you have actually verified it.

Do NOT claim:

PASS

unless there is evidence.

If only Art Ceramic is verified, explicitly say:

"Only Art Ceramic is currently verified. The other 39 sources are not verified."

If some sources are blocked, say exactly which ones.

If something cannot be verified from the current environment, say:

"NOT VERIFIED"

rather than guessing.

Accuracy is more important than completion claims.
