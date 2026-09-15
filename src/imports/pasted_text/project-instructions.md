## STOP — DO NOT DECLARE COMPLETION YET

The current audit is good, but I need you to resolve one critical issue before doing anything else:

### 1. PROVE THE 40 SOURCES EXIST IN THE PROJECT

I originally supplied 40 important source URLs.

You currently report that the repository contains one auditable JSON export with Art Ceramic data and 3,434 unique image URLs.

That does NOT prove that all 40 supplied sources were processed.

Find exactly where the original 40 source URLs are stored in the repository, imported configuration, text file, JSON, database, source registry, or any other project artifact.

If the 40 URLs are NOT present anywhere in the repository:

* DO NOT invent them.
* DO NOT replace them with search results.
* DO NOT claim they were processed.
* Clearly report that the repository currently lacks the 40-source registry.
* Then recover the exact source list from the project instructions/context if it is available to you.
* Create a permanent machine-readable source registry containing all 40 exact URLs.

### 2. CREATE A SOURCE REGISTRY

Create a structured source registry such as:

sources.json

For every source store:

* source_id
* original_url
* resolved_url
* source_name
* source_type
* domain
* status
* crawl_status
* extraction_status
* product_count
* image_count
* missing_fields
* errors
* last_checked
* provenance

The original URL must never be overwritten.

For share.google URLs, preserve the exact original URL and separately store the resolved destination.

### 3. PROCESS EVERY SOURCE INDEPENDENTLY

Do not treat Art Ceramic as representative of the other sources.

Run the extraction/audit independently for ALL 40 sources.

For every source determine:

* accessible / inaccessible
* redirect destination
* website structure
* catalog/product pages found
* products extracted
* variants extracted
* images extracted
* brands
* categories
* collections
* SKUs/product codes
* Arabic names
* English names
* prices
* old prices
* discounts
* colors
* materials
* finishes
* descriptions
* availability
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
* company information
* branches
* addresses
* cities/governorates
* phones
* WhatsApp
* email
* opening hours
* maps
* social links

Do not mark a source complete merely because products were found.

### 4. PRESERVE RAW DATA

For every imported record preserve:

* exact original source values
* normalized values
* source URL
* source page URL
* extraction timestamp
* raw/original record

For dimensions specifically preserve both:

originalSourceValue

and

normalizedDisplayValue

and, when possible:

widthMm
heightMm
lengthMm
thicknessMm

Never replace the original value with a normalized value.

### 5. IMAGE VERIFICATION

For every unique image URL:

* verify HTTP accessibility
* detect broken responses
* detect redirects
* detect HTML returned instead of an image
* detect duplicates
* preserve source/product association
* ensure the image actually belongs to the correct product
* record failed image URLs separately

Do not count an image as valid merely because a URL exists.

### 6. PRODUCT DEDUPLICATION

Deduplicate using reliable identifiers in this priority:

1. SKU/product code
2. manufacturer reference
3. exact source product ID
4. canonical product URL
5. carefully validated name + dimensions + variant

Never merge products when identity is uncertain.

If the same product appears on multiple sources, preserve source provenance instead of destroying the source-specific record.

### 7. GENERATE AN AUDIT TABLE

Create a machine-readable and human-readable audit report:

SOURCE | ORIGINAL URL | RESOLVED URL | STATUS | PRODUCTS | VARIANTS | IMAGES | VALID IMAGES | BROKEN IMAGES | MISSING DATA | NOTES

I need exactly 40 source rows.

Also provide totals:

* total sources
* accessible sources
* inaccessible sources
* sources successfully extracted
* total raw products
* total unique products
* total variants
* total image references
* unique image URLs
* valid images
* broken images
* products missing names
* products missing dimensions
* products missing images
* products missing SKU
* products missing technical specifications

### 8. DO NOT HIDE FAILURES

Use explicit statuses:

PASS
PARTIAL
BLOCKED
FAILED
NOT_PROCESSED

Never convert PARTIAL/BLOCKED/FAILED into PASS.

If a website blocks crawling, report it.

If a source requires browser rendering, use Playwright/browser automation.

If pagination exists, process all relevant pages.

If products are loaded dynamically, wait for the data before extraction.

### 9. UI RECONCILIATION

After importing the data, verify that the website actually displays the imported records.

Check:

* product listing
* search
* filters
* categories
* collections
* product detail page
* dimensions
* SKU
* images/gallery
* Arabic RTL
* English
* prices
* discounts
* availability
* specifications

The number displayed in the UI must reconcile with the database/import dataset.

### 10. FINAL RELEASE VERIFICATION

After the data audit:

IMPORT
→ VALIDATE
→ RECONCILE
→ TEST
→ BUILD
→ RUN
→ OPEN THE ACTUAL RENDERED WEBSITE
→ VISUAL INSPECTION
→ FIX
→ REBUILD
→ RECHECK

Then inspect:

DESKTOP
MOBILE
iPhone-sized viewports
RTL Arabic
homepage
header
hero/slider
every slider image individually
product cards
product details
filters
menus
search
galleries
footer

Specifically test approximately:

375×667
375×812
390×844
393×852
414×896
430×932

There must be:

* no horizontal scrolling
* no clipped content
* no overflowing filter drawer
* no broken images
* no incorrect hero cropping
* no unreadable hero text
* no slider overlap
* no broken touch/swipe behavior
* no hover-only critical interaction
* no RTL layout problems

### 11. DEPLOYED VERSION

Do not assume the deployed version equals localhost.

Open the actual deployed/preview URL and verify it visually and functionally.

Confirm:

* latest build is deployed
* latest data is present
* latest logo is present
* colors are correct
* homepage is correct
* hero images are correct
* products are correct
* mobile/iPhone is correct
* no console/runtime errors affecting functionality

### 12. FINAL ANSWER FORMAT

At the end give me:

A. 40-source audit table

B. Data totals

C. Missing/blocked sources

D. Broken images

E. Data validation results

F. UI reconciliation results

G. Desktop QA

H. Mobile QA

I. iPhone QA

J. RTL QA

K. Homepage/Hero QA

L. Deployed-version QA

M. Exact files changed

N. Exact tests/build commands executed

O. Remaining problems

Most importantly:

DO NOT SAY "COMPLETE", "PASS", OR "READY" UNLESS YOU CAN PROVE IT FROM THE AUDIT.

If only Art Ceramic has actually been processed, explicitly say:

"Only Art Ceramic is currently verified; the other 39 sources are not yet verified."

No assumptions. No invented counts. No invented source data.
