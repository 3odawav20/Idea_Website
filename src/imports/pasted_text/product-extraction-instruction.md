# NEXT STEP — START ACTUAL PRODUCT EXTRACTION

The discovery phase is now successful enough to proceed.

DO NOT stop at discovery.

DO NOT report discovered URLs as imported products.

Now move to the actual extraction phase.

## 1. PROCESS EVERY DISCOVERED PRODUCT URL

For every discovered product URL:

* open the actual product page
* wait for dynamic content
* extract the complete available product data
* save the original/raw record
* save source provenance
* verify the product images
* normalize the data separately
* validate the extracted record
* only then add it to the import dataset

Do not use category-page information as a substitute for product-page information when a product detail page exists.

---

## 2. FOLLOW ALL PAGINATION

For every discovered category:

* process page 1
* page 2
* page 3
* continue until there are no more products

Also process:

* Load More
* infinite scroll
* AJAX pagination
* dynamic category loading

Do not assume the first page contains the entire catalog.

---

## 3. EXTRACT ALL AVAILABLE FIELDS

For every product capture:

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
* gallery
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

Only store values that are actually supported by the source.

Never invent missing fields.

---

## 4. RAW DATA MUST BE PRESERVED

For every product store:

source_id
original_source_url
product_page_url
extraction_timestamp
raw_record

Then separately store normalized fields.

Do not modify the raw record.

---

## 5. DIMENSIONS

Keep:

originalSourceValue

and:

normalizedDisplayValue

and when safely possible:

widthMm
heightMm
lengthMm
thicknessMm

Never overwrite the source dimension.

If the source says:

"60x120"

preserve exactly:

"60x120"

and separately normalize it.

---

## 6. IMAGE VERIFICATION

For every product image:

* request the image
* verify response
* verify content type
* detect broken image
* detect redirect
* detect duplicate
* confirm association with the correct product

Do not count an image as valid merely because the URL exists.

---

## 7. PRODUCT IDENTITY

Deduplicate using:

1. SKU
2. product code
3. source product ID
4. canonical product URL
5. validated name + dimensions + variant

Do not merge uncertain products.

Keep source provenance when the same product appears on multiple websites.

---

## 8. UPDATE THE REGISTRY AFTER EACH SOURCE

Do not wait until all sources finish.

After each source update:

* product count
* variants
* image references
* unique images
* valid images
* broken images
* missing fields
* errors
* extraction status

Use:

PASS
PARTIAL
BLOCKED
FAILED
NOT_PROCESSED

Do not use PASS until extraction and validation are actually complete.

---

## 9. HANDLE SEBAKA CORRECTLY

Sebaka currently fails with SSL 525.

Do not fabricate data.

Try a reasonable browser-based request once the extraction system reaches this source.

If it remains unavailable:

keep:

FAILED

and document:

SSL 525

Do not replace it with another source.

---

## 10. PRIORITY ORDER

Process the sources that successfully exposed product/category URLs first.

Especially continue with the discovered sources:

* Ahmed El Sallab
* Mahgoub
* AbaElMozahem
* San George
* Royal Group
* Elrwad
* GROHE

Then continue with every other accessible source in sourceRegistry.json.

Do NOT process only these seven.

---

## 11. ART CERAMIC

Keep the existing Art Ceramic dataset.

Do not delete the 475 existing records.

Do not replace the raw data.

Revalidate it as part of the final reconciliation.

---

## 12. IMPORTANT — DATA MUST REACH THE WEBSITE

After extraction, make sure the application actually consumes the imported datasets.

A JSON file existing in the repository is NOT sufficient.

Verify:

source data
→ importer
→ normalized dataset
→ application store/backend
→ product listing
→ product details

The products must actually appear in the UI.

---

## 13. DO NOT START VISUAL QA YET

First finish the actual product extraction/import.

Then do:

DATA VALIDATION
→ UI RECONCILIATION
→ BUILD
→ RENDERED WEBSITE QA
→ DESKTOP
→ MOBILE
→ iPHONE
→ RTL
→ HOMEPAGE
→ EVERY HERO SLIDE
→ TOUCH
→ DEPLOYED VERSION

---

## 14. DO NOT STOP AFTER A FEW SOURCES

Continue automatically through all accessible sources.

Do not ask me to approve each source.

Do not pause after Ahmed El Sallab.

Do not pause after Mahgoub.

Do not pause after the first successful batch.

Continue until every accessible source has been processed or explicitly marked BLOCKED/FAILED.

---

## 15. FINAL REPORT AFTER EXTRACTION

Only after the actual extraction is finished, report:

### SOURCE-BY-SOURCE

Exactly 40 sources:

* source
* status
* discovered product URLs
* extracted products
* imported products
* variants
* image references
* valid images
* broken images
* missing data
* errors

### GLOBAL TOTALS

* raw products
* unique products
* variants
* image references
* unique images
* valid images
* broken images

### IMPORTANT

Clearly distinguish:

DISCOVERED

from:

EXTRACTED

from:

IMPORTED

from:

DISPLAYED IN UI

These four numbers must NOT be conflated.

Then continue automatically to validation and UI reconciliation.

EXECUTE THE EXTRACTION NOW.
