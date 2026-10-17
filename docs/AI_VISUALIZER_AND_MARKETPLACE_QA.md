# IDEA Visualizer & Marketplace — Deployment and Verification

## Scope

This branch upgrades the **IDEA** `/ai-room-visualizer` route using the screenshot as a visual design reference. It does **not** automatically modify `https://livefree.support/ai-room-visualizer`: that hostname currently serves a separate site and is not linked to this repository or verified as a deployment target. Confirm the hosting document root/repository linkage before copying anything into that domain.

The studio allows selecting actual approved catalogue finishes, searching the catalogue, uploading and validating a room photo locally, choosing floor/wall target, grout and orientation, opening a product, and adding it to the quotation basket. **No fake rendered images** are shown.

The advanced AI result requires the Gemini 2.5 Flash Image API. The source room and exact chosen tile image are supplied to the server as separate reference images with strong architectural preservation instructions. Image generation remains unavailable until configuration and deployment are completed. Results are **approximations**, not guaranteed dimensional or colour matches. The uploaded photo is kept in memory until generation is requested.

## Gemini production setup — required before activating renders

1. Connect the correct Supabase project and deploy the Edge Function source: `supabase functions deploy ai-room-render`.
2. Configure `GEMINI_API_KEY` **only in Supabase Edge Function Secrets**. Never paste it into the frontend, cPanel public_html or GitHub.
3. Set `IDEA_ALLOWED_ORIGINS` to the **actual HTTPS origins** of the deployed site, comma-separated. The source includes development and expected domain defaults but final domains must be verified.
4. If tile images are on external approved supplier/CDN hosts, set `IDEA_IMAGE_HOSTS` to exact allowlisted hostnames, comma-separated. The adapter rejects arbitrary URL fetching.
5. Keep authentication enabled: only signed-in sessions can request renders. Test both missing-key (expected HTTP 503) and valid-key flows with a real, owned room photo.
6. Test on actual iPhone Safari and Android Chrome in addition to emulation. Never claim rendering accuracy without real API responses.
7. For cPanel SPA hosting, configure HTTPS, an Apache `.htaccess` BrowserRouter fallback to `/index.html`, secure caching and backups. **Do not replace production catalogue assets** with a smaller Vercel build; merge and back up the existing cPanel product corpus first.

Gemini API reference: https://ai.google.dev/gemini-api/docs/image-generation
Supabase functions reference: https://supabase.com/docs/guides/functions/quickstart

## Marketplace: data and functionality

* The quotation basket is visible in the header at mobile and desktop widths. A cart entry represents a quotation item, **not a paid checkout**.
* The RFQ submit action now sends all items in **one** `create_buyer_request` transaction, waits for confirmed success, and **keeps the basket** if a network/server error occurs. Only authenticated buyer accounts can submit.
* Optional visitor registration invitation links to personal and business intake pages without locking the body scroll.
* The business intake form records `requested_account_type=business` and the company name in signup metadata. **Seller privileges are not automatically granted**; a verified role and company onboarding are still required.
* The new `20261017_supplier_rfq_notifications.sql` migration notifies members of matching verified supplier companies when their company is assigned an RFQ. The SQL must be reviewed and applied to the active database. It is not deployed by merely merging this branch.
* Admin overrides are queried by the storefront only if `VITE_ENABLE_CATALOGUE_OVERRIDES=true` **after** applying `20261016_admin_catalogue_overrides.sql`. This prevents missing-table 404s on every public page while leaving the admin edit feature gated.
* Genuine payment capture, merchant payout, offer acceptance, all email delivery, and complete two-way messaging workflows are not proven active by this change. Do not claim production readiness until integration tests and backend verification pass.

## Catalogue integrity

The latest 40-entry import run in the local reviewer workspace examined 40 registered entries but its summary contained **818 quarantined candidates (368 ceramics, 391 porcelain, 59 tiles), 0 publishable**. Separate earlier source discovery has 977 Mashreqy URLs and 1,753 Cleopatra metadata records pending review. Some supplier URLs are duplicated or unsupported; material metadata **must not** be counted as product approval. Natural marble is particularly under-sourced.

Catalogue release criteria remain at least **1,500 independently approved unique products in each of ceramics, porcelain, tiles and natural marble (6,000 minimum)**, with 2,000 per category (8,000) the target. Correct original product URL, high-resolution licensed local images, verified material, verified physical dimensions, no product mixing or duplicate SKU, and valid internal site routes must be independently checked. Never fill missing counts with fake products or marble-effect porcelain.

## Test scope and limitations

Vite production build + browser mobile emulation on several Android/iPhone viewport sizes. These tests validate layout, page access, basket UI, guest registration invitation, Arabic studio labels, local photo selection, and scrolling, **not live Gemini generation, signup emails, payment transactions, or actual supplier notification delivery**. The Supabase connector for this session reported no connected projects, so SQL/Edge deployment cannot be claimed.
