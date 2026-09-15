# IDEA — FIGMA MAKE EXECUTION, COMPLETE COMPANY DASHBOARD, MATERIAL UPLOADS, SUBSCRIPTIONS, PAYMENTS AND SETTLEMENTS

This entire project is being created and refined inside **Figma**.

Use the correct Figma product for each part:

* Use **Figma Design** for the visual design system, components, responsive layouts, variants, prototypes and developer handoff.
* Use **Figma Make** for the functional web application, real interactions, live data, authentication, backend connection, file uploads, dashboards and testing.
* Use **Figma Sites** only for suitable public marketing pages when appropriate.
* Use GitHub export or synchronization when the application requires production deployment, advanced backend services, custom payment integrations or development outside Figma.

Do not treat the project as a static Figma presentation.

Do not create screens that only look functional.

Create the actual workflows in Figma Make and connect them to a real backend.

---

# 1. FIGMA PROJECT STRUCTURE

Organize the Figma workspace professionally.

Create the following Figma Design pages:

1. `00 — Cover`
2. `01 — Foundations`
3. `02 — Design Tokens`
4. `03 — Components`
5. `04 — Public Website`
6. `05 — Customer Account`
7. `06 — Business Dashboard`
8. `07 — Marketplace and Quotations`
9. `08 — Subscriptions and Billing`
10. `09 — Checkout and Payments`
11. `10 — Room Designer`
12. `11 — Admin Dashboard`
13. `12 — Mobile Application`
14. `13 — Responsive States`
15. `14 — Empty, Loading and Error States`
16. `15 — Prototype Flows`
17. `16 — Developer Handoff`
18. `17 — Test Results`

Create one shared IDEA design library containing:

* colors;
* typography;
* spacing;
* grid;
* shadows;
* borders;
* icons;
* buttons;
* inputs;
* tables;
* cards;
* navigation;
* sidebars;
* dialogs;
* notifications;
* charts;
* file-upload elements;
* product cards;
* quotation cards;
* subscription cards;
* payment-method cards;
* room-material selectors.

Use:

* Auto Layout;
* reusable components;
* component properties;
* variants;
* variables;
* semantic color tokens;
* responsive constraints;
* desktop, tablet and mobile breakpoints.

Do not create disconnected duplicated frames.

---

# 2. FIGMA MAKE FUNCTIONAL APPLICATION

Build the functional application in Figma Make.

The functional version must include:

* authentication;
* database connection;
* customer accounts;
* company accounts;
* company verification;
* file uploads;
* product and material management;
* supplier-product connections;
* quotation requests;
* private supplier offers;
* inboxes;
* subscriptions;
* payments;
* order management;
* invoices;
* settlement tracking;
* room-design projects;
* notifications;
* admin control;
* role-based permissions.

Use a real backend connection.

Use secure server-side operations for:

* authentication;
* file-storage permissions;
* offer confidentiality;
* payment initiation;
* payment verification;
* subscriptions;
* supplier settlements;
* administrative approval.

Do not expose secrets in the Figma Make client code.

If the native Figma Make backend is insufficient for any production requirement:

1. Preserve the Figma interface and design system.
2. Export or push the generated application to GitHub.
3. Connect a production backend.
4. Continue using Figma as the design and product reference.
5. Do not replace real functionality with fake local state.

---

# 3. COMPLETE COMPANY ACCOUNT

Every verified company must receive its own complete private dashboard.

Public account type:

**Business Account**

Arabic:

**حساب شركة أو مورد**

Each company must have:

* independent company profile;
* private dashboard;
* private inbox;
* material and catalogue library;
* quotation-request center;
* offer-management center;
* order center;
* payment center;
* settlement center;
* invoice center;
* subscription center;
* team-management center;
* reports;
* notifications;
* settings;
* verification center.

Main route:

`/business`

Required business routes:

* `/business/dashboard`
* `/business/profile`
* `/business/verification`
* `/business/inbox`
* `/business/materials`
* `/business/materials/upload`
* `/business/materials/:materialId`
* `/business/catalog`
* `/business/catalog/new`
* `/business/catalog/:productId`
* `/business/product-mappings`
* `/business/requests`
* `/business/requests/:requestId`
* `/business/offers`
* `/business/offers/new/:requestId`
* `/business/offers/:offerId`
* `/business/orders`
* `/business/orders/:orderId`
* `/business/payments`
* `/business/settlements`
* `/business/invoices`
* `/business/subscription`
* `/business/team`
* `/business/reports`
* `/business/notifications`
* `/business/settings`

Every route must load directly and work after browser refresh.

---

# 4. COMPANY DASHBOARD HOME

Create a premium Black and Gold business dashboard.

Display real company-specific data only:

* company verification state;
* active subscription;
* subscription expiry;
* unread inbox messages;
* matching quotation requests;
* requests approaching deadline;
* offers submitted;
* accepted offers;
* rejected offers;
* active orders;
* awaiting payments;
* awaiting settlements;
* uploaded materials;
* products connected to IDEA catalogue;
* files requiring review;
* recent notifications.

Use elegant data cards with restrained motion.

Do not invent revenue, conversion, customer or sales numbers.

When no data exists, show a polished empty state with a real action.

---

# 5. COMPANY MATERIAL UPLOAD CENTER

Create a complete company file and material-management system.

Route:

`/business/materials`

Upload route:

`/business/materials/upload`

Allow verified companies to upload:

* PDF files;
* product catalogues;
* technical data sheets;
* certificates;
* warranty documents;
* installation guides;
* product images;
* material texture images;
* lifestyle images;
* Word documents;
* Excel files;
* CSV files;
* ZIP archives;
* price lists;
* stock lists;
* quotation documents;
* company documents.

Supported examples:

* `.pdf`
* `.jpg`
* `.jpeg`
* `.png`
* `.webp`
* `.doc`
* `.docx`
* `.xls`
* `.xlsx`
* `.csv`
* `.zip`

Do not accept dangerous executable file types.

---

# 6. UPLOAD INTERFACE

Create a professional drag-and-drop upload interface.

Display:

* accepted file types;
* maximum file size;
* upload progress;
* file name;
* file type;
* file size;
* uploader;
* upload time;
* processing status;
* review status;
* visibility;
* linked product;
* linked brand;
* linked collection.

Possible processing statuses:

* Uploading
* Uploaded
* Virus Scan Pending
* Processing
* Reading File
* Extracting Data
* Extracting Images
* Validating
* Needs Review
* Approved
* Rejected
* Published
* Failed

Do not show fake processing progress.

---

# 7. COMPANY-UPLOADED PRODUCT DATA

A company may upload product information containing:

* product name;
* model number;
* code;
* barcode;
* brand;
* collection;
* material;
* dimensions;
* thickness;
* colors;
* finish;
* texture;
* wall or floor;
* indoor or outdoor;
* room usage;
* pieces per box;
* square meters per box;
* box weight;
* stock quantity;
* minimum order;
* available delivery areas;
* technical documents;
* product images.

Company uploads must not immediately create public IDEA products.

First place them in a review workflow.

Possible results:

* Connected to Existing IDEA Product
* New Variant Proposed
* New Product Proposed
* Duplicate
* Conflicting Data
* Needs Administrator Review
* Rejected

---

# 8. PRODUCT MAPPING

Create:

`/business/product-mappings`

The company must connect its supplied item to an existing IDEA product and exact variant.

Example:

IDEA public product:

* approved brand;
* approved model;
* approved size;
* approved finish;
* approved color.

Company supply record:

* company stock status;
* available quantity;
* minimum order;
* service areas;
* delivery capacity;
* private internal reference.

Do not let the company alter the approved public catalogue record.

The company may propose a correction, but an administrator must approve it.

---

# 9. COMPANY FILE LIBRARY

Each company must have a private material library.

Allow:

* folders;
* tags;
* search;
* filters;
* preview;
* version history;
* replace file;
* archive;
* download;
* link to product;
* link to offer;
* link to order;
* permission control.

Example folders:

* Company Documents
* Product Catalogues
* Product Images
* Technical Sheets
* Certificates
* Price Lists
* Stock Lists
* Quotations
* Orders
* Invoices

Legal and verification documents must remain private.

Public product media requires admin approval.

---

# 10. EXCEL AND CSV HANDLING

When a company uploads an Excel or CSV file:

1. Read column headers.
2. Show a preview.
3. Detect product rows.
4. Let the company map source columns to IDEA fields.
5. Validate dimensions.
6. Validate numeric values.
7. Detect duplicates.
8. Detect missing model numbers.
9. Detect conflicting products.
10. Show errors by row.
11. Allow corrected re-upload.
12. Send valid records to administrator review.

Possible mappings include:

* Product Name
* Model
* Product Code
* Brand
* Size
* Color
* Finish
* Material
* Stock
* Minimum Order
* Square Meters Per Box
* Pieces Per Box

Never silently assign the wrong column.

---

# 11. COMPANY INBOX

Every company must have a private inbox:

`/business/inbox`

Inbox categories:

* New Matching Requests
* Offer Deadlines
* Offer Accepted
* Offer Not Selected
* Offer Expired
* Customer Clarification
* Order Updates
* Payment Updates
* Settlement Updates
* Document Review
* Verification
* Subscription
* Administration

Support:

* unread count;
* search;
* filters;
* archive;
* secure attachments;
* linked request;
* linked offer;
* linked order;
* notification preferences.

A company must not see another company’s messages or offers.

---

# 12. COMPANY OFFER WORKFLOW

From a matching request, the company can submit:

* exact product;
* approved equivalent;
* full quantity;
* partial quantity;
* unit price;
* tax;
* shipping;
* total;
* stock status;
* preparation time;
* delivery period;
* payment terms;
* offer expiry;
* notes;
* PDF quotation;
* technical document.

The company may:

* save draft;
* submit;
* revise before deadline;
* withdraw where allowed;
* view customer acceptance state.

The company must never see competitors’ prices or offers.

---

# 13. COMPANY SUBSCRIPTIONS

Create dedicated company subscription plans.

Do not invent final prices.

The administrator controls:

* plan name;
* monthly price;
* annual price;
* currency;
* free trial;
* product-mapping limit;
* file-storage limit;
* monthly offer limit;
* team-member limit;
* analytics access;
* priority matching;
* support level;
* featured supplier eligibility;
* API access;
* export access.

Example plan names may be editable:

* Starter Supplier
* Professional Supplier
* Enterprise Supplier
* Manufacturer
* Importer

Routes:

* `/business/subscription`
* `/subscriptions/businesses`
* `/admin/subscriptions/businesses`

Display:

* current plan;
* current usage;
* plan limits;
* upgrade;
* downgrade;
* renewal date;
* payment status;
* invoices;
* cancellation;
* payment failure;
* grace period.

A company must not submit offers when its subscription or verification status does not permit it.

---

# 14. COMPANY TEAM MANAGEMENT

Create:

`/business/team`

Allow the company owner to invite staff.

Business roles:

* Company Owner
* Account Administrator
* Sales Manager
* Sales Representative
* Catalogue Manager
* Inventory Manager
* Finance Manager
* Order Manager
* Viewer

Permissions must be granular.

Examples:

* upload files;
* edit catalogue mappings;
* view requests;
* submit offers;
* approve offers;
* view orders;
* view payments;
* view settlements;
* download invoices;
* manage subscription;
* invite team members.

Only the company owner or authorized administrator may manage sensitive financial permissions.

---

# 15. CUSTOMER PAYMENTS VS COMPANY SETTLEMENTS

Clearly separate:

## Customer Payment

Money paid by the customer for:

* accepted quotation;
* order;
* subscription;
* optional premium service.

## Company Settlement

Money owed or transferred to the selected supplier after:

* verified customer payment;
* order confirmation;
* platform commission calculation;
* delivery or milestone rules;
* refund and dispute checks.

Do not treat the company payment page as a normal customer checkout screen.

---

# 16. COMPANY PAYMENT CENTER

Create:

`/business/payments`

Display:

* customer payment status;
* linked order;
* gross order amount;
* tax;
* shipping;
* platform fee where configured;
* refund status;
* dispute status;
* settlement eligibility.

Do not expose another supplier’s finances.

---

# 17. COMPANY SETTLEMENT CENTER

Create:

`/business/settlements`

Display:

* pending balance;
* eligible balance;
* settled balance;
* held balance;
* refunded amount;
* settlement reference;
* settlement date;
* destination account;
* linked orders;
* platform commission;
* adjustment reason.

Settlement statuses:

* Awaiting Customer Payment
* Payment Verified
* On Hold
* Eligible for Settlement
* Settlement Processing
* Settled
* Failed
* Refunded
* Disputed

Do not fabricate a completed settlement.

---

# 18. COMPANY PAYOUT DESTINATIONS

Allow an approved company to configure authorized payout destinations.

Possible destination types depend on the contracted payment provider:

* Egyptian business bank account;
* supported merchant wallet;
* approved payment-provider merchant balance;
* other administrator-approved settlement method.

Collect only necessary data.

Protect financial details.

Require:

* company verification;
* authorized representative;
* account ownership validation;
* administrator approval;
* re-authentication for changes;
* audit log.

Mask sensitive values in the interface.

Do not store banking passwords.

Do not allow an unverified company to configure live settlements.

---

# 19. REAL PAYMENT INTEGRATION

Payment processing must be real, server-side and based on contracted providers.

Create a payment-provider abstraction.

Possible Egyptian acceptance methods may include, when supported by the selected contracted gateway:

* Visa
* Mastercard
* Meeza
* Fawry Pay
* Fawry Reference Code
* Mobile Wallets
* Vodafone Cash
* Orange Cash
* e& cash
* Apple Pay where supported
* payment links
* bank-card installments where supported

Do not enable every method merely because it appears in the interface.

A method is active only after:

1. merchant contract exists;
2. credentials are supplied;
3. server-side integration is complete;
4. webhook verification works;
5. sandbox testing passes;
6. payment reconciliation passes;
7. production approval is granted.

---

# 20. OFFICIAL PAYMENT ASSETS

Use official recognizable payment icons and provider assets.

Do not redraw:

* Visa;
* Mastercard;
* Meeza;
* Fawry;
* mobile-wallet brands;
* Apple Pay;
* payment-gateway branding.

Use official SVG or approved provider checkout components.

Comply with provider spacing, colors and minimum-size requirements.

Do not recolor every payment logo gold.

Payment brands must remain recognizable against the IDEA dark interface.

---

# 21. PAYMENT SECURITY

Implement:

* server-side payment initiation;
* signed callback validation;
* webhook signature verification;
* idempotency;
* duplicate-payment prevention;
* amount verification;
* currency verification;
* order verification;
* reconciliation;
* refund records;
* dispute records;
* audit logs.

Use:

**EGP — Egyptian Pound**

Do not store:

* full card numbers;
* CVV;
* OTP;
* gateway secret keys in client code.

Do not mark an order paid based on a redirect URL alone.

Verify the transaction server-side.

---

# 22. MARKETPLACE MONEY FLOW

The marketplace payment flow must be:

1. Customer accepts one supplier offer.
2. System locks the accepted offer.
3. Order is created.
4. Customer selects an active payment method.
5. Backend creates the provider transaction.
6. Customer completes payment through the provider.
7. Provider callback or webhook is verified.
8. Order becomes Paid only after verification.
9. Selected supplier is notified.
10. Platform calculates configured fees.
11. Supplier settlement remains pending.
12. Delivery or milestone conditions are met.
13. Settlement becomes eligible.
14. Settlement is initiated through a supported real payout method or recorded through an approved manual settlement workflow.
15. Settlement result is verified.
16. Supplier and administrator receive the settlement record.

Do not create fake split payments if the selected provider does not support marketplace settlements.

When automatic settlement is unavailable, implement:

* verified manual settlement record;
* administrator approval;
* transfer reference;
* proof document;
* reconciliation;
* complete audit trail.

Label it honestly as a manual settlement workflow.

---

# 23. ADMIN FINANCIAL CONTROL

Create:

* `/admin/payments`
* `/admin/settlements`
* `/admin/refunds`
* `/admin/disputes`
* `/admin/settings/payments`
* `/admin/settings/commissions`

Allow authorized finance administrators to:

* inspect transactions;
* reconcile payments;
* inspect webhooks;
* retry failed reconciliation;
* approve eligible settlements;
* record manual settlements;
* manage refunds;
* manage disputes;
* configure commission rules;
* export reports;
* inspect audit logs.

Financial permissions must be separate from ordinary content-management permissions.

---

# 24. FIGMA COMPONENTS FOR COMPANY DASHBOARD

Create reusable Figma components for:

* Business Sidebar
* Business Header
* Company Verification Badge
* Subscription Status
* Upload Dropzone
* File Card
* File Table
* Product Mapping Row
* Request Card
* Offer Form
* Offer Comparison Summary
* Business Inbox Item
* Payment Status
* Settlement Status
* Invoice Row
* Team Member Row
* Permission Matrix
* Usage Meter
* Empty State
* Loading Skeleton
* Error Banner
* Success Notification
* Confirmation Dialog

Create variants for:

* default;
* hover;
* focus;
* disabled;
* loading;
* success;
* warning;
* error;
* verified;
* pending;
* rejected.

---

# 25. FIGMA RESPONSIVE FRAMES

Create complete responsive designs for:

## Desktop

* 1440 px
* 1280 px

## Tablet

* 1024 px
* 768 px

## Mobile

* 430 px
* 390 px
* 360 px

The company dashboard must not be a desktop table compressed into a phone.

For mobile:

* convert the sidebar into a drawer;
* convert large tables into cards or responsive rows;
* preserve upload features;
* preserve inbox access;
* preserve offer submission;
* preserve payment and subscription access.

---

# 26. FIGMA PROTOTYPE FLOWS

Create working prototype flows for:

## Company onboarding

Sign In
→ Choose Business Account
→ Enter Company Details
→ Upload Verification Documents
→ Select Supplied Products
→ Submit for Review
→ Verification Pending
→ Verified Dashboard

## Material upload

Business Dashboard
→ Material Library
→ Upload Files
→ Enter Metadata
→ Map to Product
→ Submit for Review
→ Approved or Correction Required

## Offer submission

Business Inbox
→ Matching Request
→ Review Product and Quantity
→ Submit Private Offer
→ Confirm
→ Offer Submitted
→ Customer Decision

## Subscription

Business Dashboard
→ Plans
→ Compare Plans
→ Select Plan
→ Checkout
→ Verified Payment
→ Subscription Active

## Settlement

Accepted Order
→ Customer Payment Verified
→ Order Fulfilled
→ Settlement Eligible
→ Settlement Processing
→ Settled

Every prototype connection must point to the correct frame and route.

---

# 27. END-TO-END COMPANY TEST

Create a non-production company test account.

Run this complete workflow:

1. Register a business account.
2. Submit company verification.
3. Admin approves the business.
4. Activate a sandbox subscription.
5. Invite one sales team member.
6. Upload a PDF catalogue.
7. Upload product images.
8. Upload an Excel stock list.
9. Map one supplied item to an existing IDEA product.
10. Admin approves the mapping.
11. Receive a matching 10,000 m² quotation request.
12. Open it through the business inbox.
13. Submit a private full-quantity offer.
14. Confirm the customer receives it.
15. Confirm competitors cannot see it.
16. Customer accepts the offer.
17. Create a sandbox customer payment.
18. Verify the payment callback.
19. Create the order.
20. Mark delivery milestones.
21. Make the supplier settlement eligible.
22. Process a sandbox or verified manual settlement.
23. Generate an invoice and settlement statement.
24. Verify all audit logs.

Record:

* company account ID;
* subscription ID;
* uploaded file IDs;
* product mapping ID;
* request ID;
* offer ID;
* order ID;
* payment ID;
* settlement ID;
* invoice ID;
* routes tested;
* errors found;
* fixes applied.

Do not mark the workflow complete unless the records exist in the connected backend.

---

# 28. FIGMA MAKE TESTING REQUIREMENT

Inside Figma Make:

1. Run every route.
2. Test every tab.
3. Test file uploads.
4. Test permissions.
5. Test company isolation.
6. Test inbox records.
7. Test offer submission.
8. Test subscription state.
9. Test payment initiation.
10. Test webhook or simulated sandbox callback through the backend.
11. Test settlements.
12. Test mobile layouts.
13. Test Arabic RTL.
14. Test English and French LTR.
15. Inspect runtime errors.
16. Inspect backend errors.
17. Fix all failures.

Do not treat Figma prototype transitions as proof that the backend works.

A button animation is not a payment integration.

A success frame is not a verified transaction.

A dashboard card is not a database record.

---

# 29. DELIVERY AND HANDOFF

At completion, provide:

* organized Figma Design file;
* shared IDEA component library;
* Figma Make functional application;
* connected backend details;
* environment-variable list without secret values;
* GitHub repository where used;
* route map;
* permission matrix;
* database schema;
* file-storage schema;
* payment-provider status;
* settlement-provider status;
* test report;
* unresolved requirements;
* credentials still required;
* production deployment instructions.

Clearly label every feature as:

* Designed
* Prototyped
* Connected to Backend
* Tested in Sandbox
* Production Enabled
* Waiting for Credentials
* Waiting for Contract
* Experimental
* Blocked

Never call a feature production-ready merely because it looks complete in Figma.

Start by updating the Figma structure, then build the complete company dashboard and connect its real backend workflows.
