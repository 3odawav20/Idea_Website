# Art Ceramic owner-supplied PDF ingestion — 2026-11-02

## Files received and inspected

| Source PDF | PDF pages | Material-only crop candidates |
|---|---:|---:|
| Art  Ceramic File (2).pdf | 151 | 149 |
| Art  Ceramic File (4).pdf | 167 | 165 |
| Art  Ceramic File.pdf | 110 | 108 |
| Art  Ceramic File (2)(1).pdf | 69 | 67 |
| ART Ceramic File.pdf | 134 | 66 |
| **Total** | **631** | **555** |

The PDFs have **no searchable text layer**; they are embedded raster layouts. The "pages" above are actual PDF pages, which often contain two catalogue page images on one spread. Counts represent **image candidates, not distinct products or sellable variants**. In the image review queue, 515 of the 555 panels passed a simple visual-content threshold; 40 were tagged possible divider/blank and require review.

## Source-derived catalogue observations

* Wall tile page 3 in Art  Ceramic File (2).pdf: WAVE, 50 × 150 cm, multiple manufacturer face swatches next to an application photo.
* Page 3 in Art  Ceramic File (4).pdf: DIVO, 50 × 150 cm, multiple face swatches.
* Page 4 in ART Ceramic File.pdf: MONTANA GARDEN BEIGE, 50 × 60 cm, standalone outdoor tile specimen.
* Others must remain under review until their names, factory references, finishes, variants, physical material and image identity are verified.

## Import staging

The original PDFs have been processed into an **owner-delivered review bundle** named `IDEA_Art_Ceramic_PDF_Review_Assets.zip`, which contains `gallery.html`, a material-only image-crop staging directory, `review_queue.json`, `review_queue.csv` and the reusable local extraction script. This private bundle is **not part of GitHub**, and is **not yet deployed**.

Each staged record retains original PDF name, page, source file SHA-256, crop coordinates, crop SHA-256, dimensions and a human review state. Unverified fields are null rather than invented. The scanned PDF crops are NOT high-fidelity original tile face assets for AI generation; download true manufacturer source material photographs for that.

## Publication boundary

Do not append all PDF review candidates to `artceramic.json`: the existing source export already has 475 catalog items; several PDFs may overlap. Exact product identity and variant/source reconciliations are not yet verified. Similar-looking products from distinct manufacturers must not be merged. New catalog records need a verified manufacturer, source name, physical material category, variant mapping, image provenance and stable database identity.

Image references beneath the AI studio must be tile-face or material-only specimens. Never use room/kitchen/bathroom/facade/car imagery. Any unsupported material face stays outside the selectable AI catalog until verified.

## Release evidence

The current GitHub CI can prove source and UI tests plus the `build:cpanel` packaging step, but it cannot prove the live Runpod backend works. The live endpoint at `https://livefree.support/api/visualize.php?action=status` previously returned a legacy PHP fatal error instead of JSON. A real authenticated admin generation test and confirmed cPanel release are still required.

No PDF material candidates were automatically promoted or deployed to the public catalogue.
