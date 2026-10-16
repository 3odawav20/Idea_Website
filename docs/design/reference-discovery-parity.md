# IDEA discovery experience — 16 October 2026

Reference inspected: https://www.cleopatraceramics.com/en/ plus ceramic floor listing and a collection detail. Independent IDEA implementation; no reference code, logos, product photography or company claims copied.

## Interface and journey map

| Reference area | IDEA equivalent | Status |
| --- | --- | --- |
| Brand navigation | About, how it works, memberships, professionals | Implemented with IDEA-specific content |
| Ceramic/porcelain category menus | Explicit category, floor/wall application, inspiration looks, room destination | Implemented; porcelain records still unverified |
| XXL and 2 cm navigation | Large-format filter and documented 20 mm outdoor filter | Implemented; unknown source fields never inferred |
| Hero carousel | Existing original IDEA editorial carousel | Retained |
| Below-hero panel | Restored four uniform service shortcuts and search panel | Restored with supported wording; no unverified delivery or 24h promises |
| Featured collections | Existing original category covers, mouse drag, 2 whole cards desktop | Retained |
| Porcelain/ceramic editorial rows | Existing IDEA inspiration rows | Retained |
| Search by look | Five round original visual links to interactive showroom | Implemented; inspiration, not certified material classification |
| Visualizer | Room designer and interactive showroom routes | Existing implementation linked; rendering service not newly certified |
| Destination of use | Seven room concepts with explicit suitability note | Implemented; only exact source usage matches may appear |
| Showroom | Online showroom plus physical showroom status page | Physical addresses/hours/maps not supplied |
| Advanced search | Category first; cascading application/finish/colour/size; name search | Implemented against current catalogue |
| Listing/filter/detail flow | URL-based facets, application, name form, sorting, uniform grid and existing product detail | Implemented; URL navigation now updates selected filters |
| Video gallery | Video library status page and interactive alternative | Official videos not supplied |
| Projects | Clearly labelled concepts and publication status | Delivered-project case studies not supplied |
| News | Three original design guides, journal index, individual guide routes | No fabricated company news |
| Mailing list | Updates page with accurate inactive status | Email provider/consent workflow not connected; no email collected |
| Downloads | Actual current product JSON index with public source links | Official PDF catalogues/certificates not supplied |
| Glossary | Original localized materials/finish/format/application guide | Implemented |
| Contact/appointment | Existing product quote flow and explicit appointment status | Public contact details and appointment service not supplied |
| Footer | Localized links to every implemented discovery/resource page | Implemented |
| Social accounts | None fabricated | Official IDEA social URLs required |

## Validation

- Production build passed (existing large JavaScript bundle warning).
- Supplier grade/model values masquerading as colour choices and vendor/type tags masquerading as usage choices are excluded from facets; source records are retained unchanged.
- Eight executable checks covered measured format thresholds, missing dimensions, explicit thickness plus outdoor usage, and floor/wall matching.
- Source imports, provider identity and material classification are not changed.
- Both homepage rail sizing rules are retained: two complete equal cards desktop, one mobile, no partial neighbor at rest.
- Existing account, quote, subscription, payment, AI and supplier integrations are not certified by this change. No financial or messaging test submission performed.
- Physical iPhone and Android testing not performed. Responsive CSS does not constitute device testing.

## Required owner inputs for full operational parity

1. Verified porcelain/natural-marble records and technical data, including outdoor suitability and thickness.
2. Official showroom addresses/hours/maps, contact information and social URLs.
3. Approved delivered-project case studies, company history/technology/facilities/sustainability content and real videos.
4. Official catalogue PDFs/certificates.
5. Mailing provider, consent policy and appointment integration.

## Preview QA

- Desktop viewport 1363px: page width 1353px, no horizontal overflow.
- Category → Floor → Matte enabled and narrowed available colours and sizes; search opened `/products?category=ceramics&application=Floor&finish=Matte` with 194 matching records.
- Ceramic mega menu opened with four columns of category/application, looks, destinations and planning links.

- Product-index browser download event confirmed with 699 loaded records.
- Arabic RTL and dark palette observed on the downloads page; no desktop horizontal overflow.
- Corrected colour dropdown contains 44 valid colour labels and no Arabic grade labels after external catalogue load.
- New light accent contrast: 5.99:1 on white; dark accent: 6.93:1 on the dark surface; search button text: 6.79:1 on orange. These measurements cover the new discovery controls, not a site-wide contrast certification.
- Fourteen additional checks passed for excluding vendor/model/grade values from colour/usage facets.
- Business registration link navigated to the existing `/register/business` route; no account was created.
