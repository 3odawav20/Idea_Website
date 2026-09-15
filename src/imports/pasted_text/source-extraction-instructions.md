# CONTINUE EXECUTION — DO NOT STOP AT THE REGISTRY

The source registry is now successfully created.

The current verified state is:

* 40 original sources registered
* 32 accessible
* 4 blocked by 403/429
* 3 failed with 404/521
* 1 redirected with 301
* Art Ceramic: 475 currently imported products
* Art Ceramic: 3,964 image references
* Art Ceramic: 3,434 unique image URLs
* Art Ceramic image verification: 3,265 successful / 169 failed at the previous check
* raw/original source values are now preserved
* normalized dimensions are preserved separately
* pnpm build succeeds

## NOW CONTINUE — DO NOT STOP

The remaining task is to ACTUALLY EXTRACT the accessible sources.

Do NOT create another registry.

Do NOT ask for the URLs again.

Do NOT just report that the sources are accessible.

START CRAWLING AND IMPORTING THEM.

---

## 1. PROCESS ALL 32 ACCESSIBLE SOURCES

Process every source currently marked accessible.

For each source:

1. resolve the final URL
2. open the site
3. identify catalog/product pages
4. identify categories
5. identify pagination
6. identify product detail pages
7. identify dynamically loaded content
8. extract all available data
9. extract all available images
10. preserve source provenance
11. save raw source data
12. normalize data separately
13. validate the imported records

Do not stop at the homepage.

Do not stop at the first category.

Do not stop at the first page.

Follow pagination and load-more mechanisms.

---

## 2. USE BROWSER AUTOMATION WHEN NECESSARY

If a website requires JavaScript rendering:

USE PLAYWRIGHT / BROWSER AUTOMATION.

Examples:

* dynamic product grids
* AJAX product loading
* load more
* infinite scrolling
* JavaScript filters
* product galleries
* hidden specification tabs
* dynamically loaded prices
* dynamically loaded dimensions

Do not mark a source NOT_PROCESSED simply because simple HTTP extraction failed.

Try the appropriate browser-based extraction first.

---

## 3. EXTRACT COMPLETE PRODUCT DATA

For every product, capture all fields actually available:

* Arabic name
* English name
* brand
* category
* subcategory
* collection
* SKU
* product code
* reference
* product URL
* main image
* gallery images
* price
* old price
* discount
* currency
* availability
* color
* material
* finish
* usage
* description
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

If the source does not contain a field:

KEEP IT EMPTY.

DO NOT INVENT IT.

---

## 4. PRESERVE ORIGINAL DATA

For every extracted field preserve the source value.

Especially dimensions.

Example:

SOURCE:
60x120 cm

Store:

originalSourceValue = "60x120 cm"

normalizedDisplayValue = "60 × 120 cm"

widthMm = 600
heightMm/lengthMm = 1200 only when the orientation is safely known

Never replace the original source value.

---

## 5. IMAGE EXTRACTION

Extract:

* main product image
* gallery images
* thumbnails when they represent actual product images
* technical/specification images when relevant
* product-specific image URLs

Do not attach images globally to a category.

Every image must have:

source_id
source_url
product_id/product reference
product_page_url

---

## 6. IMAGE VALIDATION

For every extracted image:

* verify response
* verify content type
* detect broken URL
* detect redirects
* detect HTML responses
* detect duplicate URLs
* preserve association

A URL existing in HTML is NOT enough to mark it valid.

---

## 7. DEDUPLICATION

Within each source:

deduplicate using:

1. SKU
2. product code
3. source product ID
4. canonical product URL
5. validated identity

Across different sources:

DO NOT blindly merge products.

Keep source provenance.

If two sources appear to represent the same physical product, preserve both source records unless identity is certain.

---

## 8. COMPANY INFORMATION

For each source, also inspect relevant:

* About pages
* Contact pages
* Branch pages
* showroom pages
* store pages
* location pages
* footer contact information
* social links

Extract:

* company name
* Arabic name
* English name
* headquarters
* branches
* showrooms
* full address
* city
* governorate
* phone
* WhatsApp
* email
* opening hours
* maps
* official website
* Facebook
* Instagram
* TikTok
* YouTube

Do not invent missing information.

---

## 9. DO NOT CHANGE SOURCE STATUS PREMATURELY

Only change a source to PASS after:

CRAWL
+
EXTRACTION
+
VALIDATION
+
IMAGE CHECK
+
DATA RECONCILIATION

Otherwise use:

PARTIAL
BLOCKED
FAILED
NOT_PROCESSED

---

## 10. SPECIAL HANDLING FOR 403 / 429

For the 4 sources currently returning 403/429:

Do not repeatedly hammer them.

Use reasonable browser rendering / retry strategy.

Respect rate limits.

Try:

* browser navigation
* normal browser headers
* reasonable delay
* limited retries

If still blocked:

keep BLOCKED.

Do not fabricate data from another source.

---

## 11. SPECIAL HANDLING FOR 404 / 521

For the 3 failed sources:

Verify the redirect chain and final URL once.

Check whether the original share.google link resolves correctly.

If the destination is genuinely unavailable:

keep FAILED.

Do not replace it with an unrelated website.

---

## 12. SPECIAL HANDLING FOR THE 301 SOURCE

Follow the redirect.

Store:

original_url
redirected_url
final_url

Then crawl the final destination.

---

# 13. UPDATE THE DATASET

Do NOT destroy:

src/app/data/artceramic.json

Do NOT overwrite the existing Art Ceramic raw data.

Create/extend the appropriate structured datasets using the existing architecture.

Prefer one consistent import pipeline rather than manually inserting hundreds/thousands of records.

The import must be repeatable.

---

# 14. VALIDATION AFTER EACH SOURCE

After each source finishes, calculate:

* products found
* products imported
* variants
* image references
* unique images
* valid images
* broken images
* missing names
* missing dimensions
* missing SKU
* missing images
* missing specifications

Update the source registry.

Do not wait until the end to discover which source failed.

---

# 15. RUN THE COMPLETE IMPORT

After all accessible sources have been processed:

recalculate:

TOTAL SOURCES
ACCESSIBLE
BLOCKED
FAILED
PARTIAL
PASS
NOT_PROCESSED

TOTAL RAW PRODUCTS
TOTAL UNIQUE PRODUCTS
TOTAL VARIANTS
TOTAL IMAGE REFERENCES
TOTAL UNIQUE IMAGES
TOTAL VALID IMAGES
TOTAL BROKEN IMAGES

---

# 16. THEN RECONCILE WITH THE WEBSITE

Only AFTER the extraction/import is complete:

verify that the actual application consumes the new datasets.

Check:

* product listing
* search
* categories
* filters
* product details
* dimensions
* SKU
* gallery
* specifications
* company information

The imported data must actually appear in the UI.

A JSON file sitting unused in the repository does NOT count as imported.

---

# 17. THEN DO VISUAL QA

Open the actual rendered application.

Inspect:

DESKTOP
MOBILE
iPHONE
RTL ARABIC

Check the homepage from the very top.

Inspect EVERY hero slide.

Check:

* logo
* header
* hero image
* image crop
* positioning
* text
* contrast
* buttons
* arrows
* pagination
* autoplay
* transitions
* spacing
* broken images
* overflow

---

# 18. iPHONE TEST

Test:

375×667
375×812
390×844
393×852
414×896
430×932

Verify:

* zero horizontal scrolling
* no clipped content
* no overflowing elements
* filter drawer completely hidden when closed
* menu works
* slider works
* touch/swipe works
* product gallery works
* buttons are usable
* Arabic RTL is correct

---

# 19. BUILD

Run:

pnpm build

Then inspect the actual result.

Do not stop at "build successful".

Check for:

* TypeScript errors
* module errors
* runtime errors
* missing assets
* failed imports
* broken data loading

---

# 20. DEPLOYED VERSION

After local verification:

OPEN THE ACTUAL PREVIEW/DEPLOYED VERSION.

Verify the real deployed application, not just source code.

Confirm:

* all imported data is present
* logo is correct
* homepage is correct
* hero is correct
* products work
* filters work
* images work
* mobile works
* iPhone layout works
* RTL works

---

# 21. FINAL REPORT

Do not stop after saying "implemented".

Return the actual results.

Include:

### SOURCE AUDIT

Exactly 40 rows.

### IMPORT RESULTS

For every source:

products
variants
images
valid images
broken images
status

### GLOBAL TOTALS

Actual calculated totals.

### BLOCKED SOURCES

Exact reason.

### FAILED SOURCES

Exact reason.

### PARTIAL SOURCES

Exact missing data/problem.

### UI RECONCILIATION

Imported records vs records actually displayed.

### DESKTOP QA

PASS/FAIL.

### MOBILE QA

PASS/FAIL.

### iPHONE QA

PASS/FAIL.

### RTL QA

PASS/FAIL.

### HOMEPAGE QA

PASS/FAIL.

### HERO SLIDES

Check every slide individually.

### DEPLOYED VERSION

PASS/FAIL.

### FILES CHANGED

Exact paths.

### COMMANDS EXECUTED

Exact commands.

### REMAINING ISSUES

Nothing hidden.

---

# ABSOLUTE RULE

The task is NOT complete merely because:

* sourceRegistry.json exists
* pnpm build succeeds
* Art Ceramic has 475 products
* 32 websites respond successfully

The task is complete only after the accessible sources have ACTUALLY BEEN EXTRACTED and their data is connected to the application and visually verified.

EXECUTE NOW.
