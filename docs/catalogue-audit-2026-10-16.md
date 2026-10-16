# Catalogue and surface audit — 2026-10-16

## Verified source records

| Source | Records | Current application category |
| --- | ---: | --- |
| Art Ceramic embedded export | 475 | ceramics (hardcoded adapter assignment) |
| AbaElMozahem live ceramic endpoint | 224 | ceramics (hardcoded adapter assignment) |
| Combined runtime catalogue when source fetch succeeds | 699 | ceramics |

The records are imported/staged and need human review. This is not confirmation of supplier stock or certification of material composition.

## Answers by category

- **Ceramics:** product records and images are present. Both import adapters label every item ceramics; this assignment does not independently verify the physical material of every product.
- **Porcelain:** zero explicitly classified imported records. Completeness cannot be claimed.
- **Tiles:** wall/floor tile images and usage values exist. There is no independent tiles collection; the tile view currently combines ceramic/porcelain families. Not every tile type is verified.
- **Natural marble:** zero certified imported records. Marble-look images or product names must not be counted as proof of natural marble stock.

Art Ceramic has five declared finish strings (Matt 255, Glossy 119, Nature / Matt 71, High Resistance / Matt 22, Anti Slip / Matt 8) and 46 distinct case-normalized colour strings, including mixtures and spelling variants. Eleven records lack colour. There are 3,434 unique Art Ceramic image URLs; the Aba response has 692 unique image URLs. These URL counts are not quality or availability checks of all images.

The new strip uses 17 existing source tile images, successfully downloaded and decoded, with direct links to the corresponding product. No material identity is inferred from image appearance. New exterior category covers are AI-generated inspiration images, separate from actual product photographs.

## Outstanding

Obtain explicit supplier material/type fields and technical sheets, then classify ceramics, porcelain and natural marble correctly. Confirm stock, missing specs, translations and image coverage before claiming the catalogue is complete. The fixed 475-product announcement and runtime cache can differ from the combined 699 source records.

Source code evidence: `src/app/data/artceramicImport.ts`, `src/app/data/abaElMozahemImport.ts`, `src/app/store/store.tsx`. Raw source: `src/app/data/artceramic.json`; live endpoint: `https://abaelmozahem.com/collections/ceramic/products.json?limit=250`.
