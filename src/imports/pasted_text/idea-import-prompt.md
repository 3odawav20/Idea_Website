# IDEA — MASTER PDF IMPORT, PRODUCT GALLERY AND HOMEPAGE HERO EXECUTION PROMPT

You are working inside the existing production project for the luxury ceramic, porcelain, sanitary ware, bathroom, and interior-finishing marketplace:

**IDEA**

Official tagline:

**“When you have an idea... We are the IDEA.”**

Your task is to implement a real, production-ready system that:

1. Reads every PDF catalogue I upload.
2. Extracts all real products, images, sizes, models, categories, and technical data.
3. Validates every extracted value against its original source.
4. Places approved products into the real IDEA online store and product gallery.
5. Builds a premium Black and Gold homepage with a functional cinematic hero carousel.
6. Connects every page, product, category, button, filter, and route correctly.
7. Repeatedly verifies the project during implementation instead of assuming that previous work is correct.

This is a real application-development and data-import task.

Do not generate a visual mockup.

Do not create a static Figma-style presentation.

Do not create fictional products.

Do not claim that a feature works unless it has been implemented, run, tested, and verified.

---

# 1. NON-NEGOTIABLE SOURCE-OF-TRUTH RULE

The uploaded PDFs are the authoritative source for:

* company information;
* product categories;
* product names;
* model numbers;
* product codes;
* brands;
* countries of origin;
* sizes;
* dimensions;
* colors;
* textures;
* finishes;
* product types;
* tile variants;
* sanitary ware;
* product images;
* technical specifications;
* order rules;
* user roles;
* payment methods;
* business workflow.

Never invent information that does not appear in an approved source.

Do not invent:

* product names;
* measurements;
* model codes;
* brands;
* prices;
* product specifications;
* phone numbers;
* addresses;
* email addresses;
* branch details;
* partner names;
* delivery charges;
* subscription prices;
* warranty policies.

If information is absent, create an editable admin field and leave its public value hidden.

If information is unclear, preserve the original wording and mark it:

`NEEDS_HUMAN_REVIEW`

If two sources conflict, create a conflict record and require admin approval.

---

# 2. MANDATORY CONTINUOUS VERIFICATION LOOP

You must perform the following verification loop after every meaningful implementation step.

Do not perform it only at the end.

## Verification Loop

After creating or changing any feature:

1. Re-read the relevant uploaded PDF pages.
2. Search the complete project codebase for:

   * existing components;
   * routes;
   * schemas;
   * duplicated functions;
   * unfinished placeholders;
   * conflicting logic;
   * old mock data;
   * hard-coded values.
3. Inspect the actual database schema.
4. Inspect the actual stored database records.
5. Compare the implementation against the source requirements.
6. Run the application.
7. open the affected page;
8. test all related buttons and links;
9. inspect browser console errors;
10. inspect server errors;
11. test desktop layout;
12. test mobile layout;
13. test Arabic RTL;
14. test English and French LTR;
15. test authentication and permissions;
16. verify database writes;
17. verify that private information is not exposed;
18. verify that no existing working feature was damaged;
19. fix every discovered issue;
20. repeat the verification loop until the feature passes.

Do not rely on memory.

Search for the relevant requirement again before implementing it.

Search for the relevant code again after implementing it.

Search for duplicate or conflicting code before creating new files.

Do not say:

* “completed”;
* “working”;
* “verified”;
* “successfully imported”;
* “production ready”;

unless you have direct evidence from the running application and database.

---

# 3. BUILD A REQUIREMENTS TRACEABILITY MATRIX

Create an internal admin-development document named:

`IDEA_REQUIREMENTS_TRACEABILITY.md`

For every requirement, record:

* requirement ID;
* source PDF;
* source page;
* original source wording;
* normalized interpretation;
* implementation file;
* database collection;
* route;
* test performed;
* current status;
* unresolved issue.

Available statuses:

* Not Started
* In Progress
* Implemented
* Testing
* Verified
* Blocked by Missing Data
* Needs Human Review

Update this document after every milestone.

Never mark a requirement verified without listing the test evidence.

---

# 4. INSPECT THE EXISTING IDEA PROJECT FIRST

Before writing new code:

1. Inspect all project folders.
2. identify the active framework;
3. inspect package dependencies;
4. inspect routing;
5. inspect authentication;
6. inspect database collections;
7. inspect storage;
8. inspect current product schemas;
9. inspect current homepage;
10. inspect the current hero implementation;
11. inspect product listing and details pages;
12. inspect admin routes;
13. inspect current PDF-processing code;
14. inspect current translations;
15. inspect existing mock or demonstration data.

Preserve working features.

Extend the existing architecture instead of replacing it unnecessarily.

Remove demo data only after real approved data is ready.

---

# 5. PDF CATALOGUE UPLOAD AND PROCESSING

Create or complete:

`/admin/imports/pdf`

Allow the administrator to upload multiple PDF catalogues.

Support:

* drag and drop;
* multiple-file upload;
* file-size validation;
* PDF validation;
* duplicate-file detection;
* upload progress;
* page count;
* detected languages;
* processing logs;
* retry;
* cancel;
* delete staged import;
* downloadable import report.

Use real processing states:

* Uploaded
* Queued
* Validating File
* Reading Native Text
* Running OCR
* Detecting Tables
* Extracting Images
* Detecting Products
* Detecting Sizes
* Detecting Variants
* Validating Source Data
* Checking Duplicates
* Checking Conflicts
* Needs Review
* Approved
* Importing
* Imported
* Failed

The progress indicator must reflect real processing.

Do not use a fake timer.

---

# 6. READ EVERY PAGE

For every uploaded PDF:

1. Read every page.
2. Extract native text.
3. Use OCR only when necessary.
4. detect tables;
5. preserve table rows and columns;
6. extract product images;
7. associate each image with the correct product;
8. preserve Arabic, English, and French;
9. extract captions and model codes;
10. store the exact source page for every field.

Do not silently skip difficult pages.

Create a page-processing report containing:

* processed;
* partially processed;
* OCR required;
* low confidence;
* failed;
* no product data detected.

If a page cannot be read reliably, send it to manual review.

---

# 7. PRODUCT IMAGE EXTRACTION

Extract the best original product images available inside every PDF.

For each image, store:

* source filename;
* source page;
* original image;
* optimized web image;
* image dimensions;
* image hash;
* associated product;
* association confidence.

Do not redraw the product.

Do not modify:

* ceramic pattern;
* marble veins;
* texture;
* color;
* proportions;
* gloss;
* finish.

Do not use AI-generated replacement images for catalogue products.

If the image-to-product relationship is uncertain, mark it:

`NEEDS_IMAGE_MAPPING_REVIEW`

---

# 8. PRODUCT DATA EXTRACTION

Extract only values found in the uploaded sources.

## Identification

* Product Name
* Arabic Name
* English Name
* French Name
* Collection
* Model Number
* Product Code
* Barcode
* Brand
* Manufacturer
* Country of Origin
* Description
* Technical Description

## Ceramic and porcelain classification

Support:

* Egyptian
* Chinese
* Indian
* Italian
* Spanish
* additional source-confirmed origins

Support:

* Indoor
* Outdoor
* Both
* Wall
* Floor
* Wall and Floor

Usage locations:

* Kitchen
* Bathroom
* Bedroom
* Living Room / Hall
* Facade
* Outdoor Area

Texture:

* Marble
* Wood
* Stone
* source-defined texture

Finish:

* Matte
* Glossy
* Semi-Matte
* Semi-Gloss
* source-defined finish

Product type:

* Laser Cut
* Ceramic
* Porcelain
* source-defined type

Tile variant:

* Light
* Dark
* Décor
* Skirting
* Base Tile
* source-defined variant

Keep texture and finish as separate fields.

Never classify marble as a finish.

Never classify matte as a texture.

---

# 9. SIZE AND MEASUREMENT ACCURACY

Every size must be extracted and stored as structured data.

Store:

* original source value;
* width;
* height;
* thickness when stated;
* source unit;
* normalized millimeter values;
* source page;
* confidence score.

Examples:

* 30 × 60 cm
* 60 × 60 cm
* 60 × 120 cm
* 80 × 160 cm
* 1200 × 2400 mm

Never change a size.

Never convert:

`60 × 120`

into:

`60 × 60`

Never assume the unit if it is not confirmed.

Never estimate a size from an image.

Every different size must be a separate variant.

Before approving a size:

1. compare it with the original PDF;
2. search the same product on other uploaded pages;
3. check whether the model number matches;
4. check whether the product image matches;
5. check whether another record contains a conflicting size;
6. send conflicts to review.

Critical measurements must never be auto-approved from low-confidence OCR.

---

# 10. PRODUCT FAMILY RELATIONSHIPS

When the source confirms that products belong to the same collection, create a product family.

Example:

**Product Family**

* Light Tile — 60 × 60 cm
* Dark Tile — 60 × 60 cm
* Décor Tile — 30 × 60 cm
* Skirting Tile — 10 × 60 cm

Do not group products based only on visual similarity.

Verify:

* collection;
* brand;
* model;
* source description;
* product code;
* size;
* source page.

---

# 11. SANITARY WARE

Create correct separate structures for:

## Faucets

Extract:

* brand;
* origin;
* model;
* control type;
* location;
* color;
* finish;
* size;
* images.

Locations may include:

* Bathroom
* Kitchen
* Bathtub
* Shower
* Bidet Sprayer
* Concealed Installation
* Shower Rail

Preserve unclear Arabic terms such as source-defined operating types without guessing their technical English meaning.

## Bathroom Sets

Extract:

* brand;
* origin;
* color;
* model;
* size;
* placement;
* product type;
* included pieces.

Placement may include:

* Drop-In Countertop
* Under-Counter
* Wall-Hung
* Pedestal

Types may include:

* Combination
* Basin
* Complete Set
* Bidet

## Bathroom Units

Extract:

* Vanity Unit
* Storage Cabinet
* colors
* dimensions
* materials
* included components

## Bathtubs

Extract:

* Standard
* Jacuzzi
* sizes
* brand
* origin
* colors
* shape
* model
* images

Shapes may include:

* Corner
* Rectangular
* Clawfoot
* original source-defined values

Do not guess the meaning of unclear terms such as “سيرف”.

## Shower Units

Extract:

* Standard
* Jacuzzi
* dimensions
* brand
* origin
* model
* accessories

## Bathroom Accessories

Extract:

* Glass
* Stainless Steel
* source-defined porcelain or ceramic type
* brand
* origin
* colors
* included pieces
* model

---

# 12. QUANTITY AND PRIVATE PRICING RULES

For ceramic and porcelain:

* order quantity is entered in square meters;
* box count is calculated only when confirmed box coverage exists.

For sanitary ware:

* quantity is entered in pieces.

The source requirements mention three price levels.

Create private fields:

* `internalPriceTier1`
* `internalPriceTier2`
* `internalPriceTier3`

Do not assign invented meanings to these levels.

Do not display prices publicly.

Do not expose private prices in client-side APIs.

The user selects the product and quantity, submits a request, and receives private supplier offers.

---

# 13. STAGING AND ADMIN REVIEW

Never import extracted data directly into the public store.

Create staged records first.

Create:

`/admin/imports/review/:importJobId`

Display the original PDF and extracted data side by side.

## Left side

* PDF page;
* detected table;
* highlighted source text;
* extracted images.

## Right side

* product name;
* model;
* code;
* category;
* brand;
* origin;
* sizes;
* colors;
* texture;
* finish;
* usage;
* tile variants;
* product images;
* confidence;
* warnings.

Admin actions:

* Approve
* Edit
* Reject
* Split Product
* Merge Product
* Connect Variants
* Create Product Family
* Change Image Mapping
* Re-run OCR
* Reprocess Page
* Save Draft
* Import Approved Products

---

# 14. DUPLICATE AND CONFLICT CHECKING

Before importing any product, search the entire staged database and live database.

Check:

* model number;
* product code;
* barcode;
* brand and model;
* collection;
* size;
* finish;
* color;
* image hash;
* existing source records.

Possible results:

* Exact Duplicate
* Probable Duplicate
* Existing Product With New Size
* Existing Product With New Color
* Existing Product With Conflicting Data
* Separate Product
* Needs Human Review

Do not merge probable duplicates automatically.

Create conflicts when sources disagree about:

* model;
* code;
* size;
* brand;
* origin;
* ceramic or porcelain classification;
* finish;
* texture;
* image;
* box coverage;
* product family.

---

# 15. REAL STORE IMPORT

After admin approval:

1. Create or connect the category.
2. Create or connect the brand.
3. Create or connect the country of origin.
4. Create the product family.
5. Create every size variant.
6. Create every approved color and finish.
7. attach the correct images;
8. attach the source PDF;
9. create a unique product slug;
10. index searchable fields;
11. connect related variants;
12. add the product to the correct collection page;
13. add real values to store filters;
14. verify the public product page.

Use transaction-safe writes.

If part of an import fails, roll it back rather than creating a broken partial product.

---

# 16. PRODUCT GALLERY

Build or update the real IDEA product gallery.

Routes:

* `/products`
* `/collections`
* `/collections/ceramics`
* `/collections/porcelain`
* `/collections/sanitary-ware`
* `/collections/faucets`
* `/collections/bathroom-sets`
* `/collections/bathroom-units`
* `/collections/bathtubs`
* `/collections/shower-units`
* `/collections/bathroom-accessories`
* `/product/:productSlug`

Each product card must show approved data only:

* product image;
* product name;
* brand;
* model;
* size;
* finish;
* product type;
* View Details;
* Favorite;
* Compare;
* Add to AI Visualizer;
* Request Best Price.

Do not display public prices unless the IDEA administrator explicitly enables them.

---

# 17. SEARCH AND FILTERS

Search must support:

* product name;
* model;
* code;
* brand;
* collection;
* size;
* color;
* origin.

Filters must support existing approved data for:

* Ceramic
* Porcelain
* Laser Cut
* Sanitary Ware
* Brand
* Origin
* Indoor
* Outdoor
* Wall
* Floor
* Kitchen
* Bathroom
* Bedroom
* Living Room
* Facade
* Marble
* Wood
* Stone
* Matte
* Glossy
* Semi-Matte
* Semi-Gloss
* Color
* Size
* Light
* Dark
* Décor
* Skirting

Do not display empty filters.

---

# 18. HOMEPAGE HERO CAROUSEL

Build a real homepage hero carousel.

Do not generate a mockup.

Create exactly four working slides.

Requirements:

* full-width cinematic display;
* desktop and mobile images;
* automatic transition every 6 seconds;
* pause on hover;
* previous and next buttons;
* pagination indicators;
* swipe support;
* keyboard accessibility;
* responsive image loading;
* reduced-motion support;
* text rendered in HTML;
* no text baked into images;
* working destination links.

## Slide 1 — Premium Bathroom

Headline:

**Define Your Space With Perfection**

Text:

**Discover premium ceramics, porcelain and complete bathroom solutions created for exceptional interiors.**

Buttons:

* Explore Collections → `/collections`
* Visualize Your Room → `/ai-room-visualizer`

Visual:

A dark luxury bathroom with black marble-effect porcelain, large wall slabs, freestanding bathtub, brushed-gold fixtures and cinematic lighting.

## Slide 2 — AI Room Visualizer

Headline:

**See It Inside Your Space Before You Buy**

Text:

**Upload your bathroom, kitchen or living room, select a real IDEA product and experience the finished result before installation.**

Buttons:

* Start AI Visualization → `/ai-room-visualizer/new`
* Browse Porcelain → `/collections/porcelain`

Visual:

A realistic luxury living room showing an IDEA porcelain surface applied with correct scale, perspective, shadows and reflections.

## Slide 3 — Private Supplier Offers

Headline:

**One Request. Multiple Qualified Offers.**

Text:

**Select the product and required quantity, then receive private offers from verified matching suppliers.**

Buttons:

* Request Best Price → `/request-quote/new`
* How It Works → `/how-it-works`

Visual:

A premium ceramic and porcelain showroom with large slabs, tile samples and project-scale presentation.

Do not show public prices.

## Slide 4 — Complete Bathroom Collections

Headline:

**Every Surface. Every Detail. One Destination.**

Text:

**Explore ceramic, porcelain, faucets, bathroom sets, units, bathtubs, shower systems and accessories in one curated marketplace.**

Buttons:

* Browse All Products → `/products`
* Bathroom Collections → `/collections/sanitary-ware`

Visual:

A complete luxury bathroom containing professionally arranged sanitary ware, vanity, shower, faucets, ceramic walls and porcelain flooring.

---

# 19. HERO IMAGE RULES

Images must be:

* photorealistic;
* cinematic;
* architecturally believable;
* Black and Gold;
* free from embedded text;
* free from logos;
* free from watermarks;
* suitable for 21:9 desktop cropping;
* suitable for separate mobile cropping.

Avoid:

* duplicate fixtures;
* warped bathtubs;
* floating objects;
* impossible plumbing;
* incorrect tile scale;
* random gold overload;
* white backgrounds;
* colorful cartoon styling;
* fake interface elements.

Create an admin hero manager that allows:

* uploading desktop image;
* uploading mobile image;
* editing text;
* editing buttons;
* changing order;
* enabling or disabling a slide;
* editing transition duration;
* previewing desktop and mobile crops.

---

# 20. HOMEPAGE CONTENT

The homepage must include:

* Hero Slider
* Partners
* Search
* Ceramic Collections
* Porcelain Collections
* Sanitary Ware
* Bathroom Products
* AI Room Visualizer
* Best Price Within 24 Hours
* Videos
* Favorites
* Cart
* User Account
* Arabic
* English
* French

Do not invent partner brands.

Hide the Partners section until approved partner information is imported.

---

# 21. ORDER WORKFLOW

Implement the real workflow:

1. Add to Cart
2. Select quantity:

   * square meters for ceramic and porcelain;
   * pieces for sanitary ware.
3. Login or register.
4. Select user type.
5. Submit order request.
6. Notify admin.
7. Notify the customer that offers are expected within 24 hours.
8. Collect available offers.
9. Admin may add manually obtained offers.
10. Admin stores private purchase and sale values.
11. Customer receives a notification that offers are available.
12. Customer confirms the preferred offer.
13. Customer pays online.
14. Customer confirms the order.
15. Order is prepared and delivered.
16. Customer confirms receipt.
17. Customer submits feedback.

Payment methods:

* Credit Card
* Fawry
* Vodafone Cash

Do not enable a payment method without real configured credentials.

The source states an expected delivery period of 3–7 business days.

Display that period only where confirmed and applicable.

---

# 22. FINAL AUTOMATED QUALITY GATE

Before reporting completion, perform a full audit.

Search the entire project for:

* Lorem Ipsum;
* placeholder;
* fake product;
* demo price;
* hard-coded product;
* broken link;
* missing route;
* TODO;
* FIXME;
* temporary data;
* unapproved records;
* duplicated schema;
* unused component;
* public internal-price field;
* insecure admin action;
* untranslated interface text.

Verify:

1. Every uploaded PDF page was processed.
2. Every imported field has a source.
3. All sizes match the PDF.
4. Different sizes remain separate variants.
5. Product images are correctly mapped.
6. Ceramic and porcelain are not confused.
7. Texture and finish are separate.
8. Light, dark, décor and skirting are connected correctly.
9. Public prices are hidden.
10. Admin-only data remains private.
11. Every product route works.
12. Every hero button works.
13. The carousel works automatically and manually.
14. Arabic is properly RTL.
15. English and French are properly LTR.
16. Mobile layouts are usable.
17. No console errors remain.
18. No database-write errors remain.
19. No broken images remain.
20. No working feature was damaged.

If any test fails:

* do not continue pretending the phase is complete;
* fix the error;
* run the test again;
* document the result.

---

# 23. FINAL FACTUAL REPORT

At the end, report only verified facts:

* PDFs uploaded;
* pages processed;
* pages requiring review;
* products detected;
* product families detected;
* size variants detected;
* images extracted;
* products approved;
* products imported;
* duplicates;
* conflicts;
* missing information;
* database records created;
* database records updated;
* routes created;
* routes tested;
* tests passed;
* unresolved issues.

Provide file names, record IDs, and routes where applicable.

Do not report success based only on generated code.

Report success only after the application has run and the data has been verified inside the actual store.

Begin by inspecting the existing IDEA project and uploaded PDF files, then build the requirements traceability matrix before modifying production data.
