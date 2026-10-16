# Ceramic Studio validation — 2026-10-16

Repository: `3odawav20/Idea_Website`; base commit `b54a755f6865e1596a2c6dafaa0df28f7e364573`.

## Verified locally

- Production Vite build: PASS. The studio is lazy-loaded; Firebase SDKs are loaded only when optional cloud storage is used. Existing application chunks still produce Vite's bundle-size warning.
- Playwright / installed Chrome: **4 passed**. Room and material uploads, manual local preview with changed pixels, before/after slider, PNG download, IndexedDB save/gallery, catalogue product selection from URL, mobile overflow, invalid upload rejection, existing room designer, automatic AI mode without manual corners, and authentication required before paid generation.
- PHP 8.4.26 lint: PASS for generation endpoint, image proxy and compositor.
- GD compositor: PASS, all **5,500 pixels outside the mask unchanged**, all **4,500 pixels inside changed** in the synthetic fixture; central fixture exclusion preserved; invalid coordinates rejected. This checks compositing logic, not real-world segmentation accuracy.
- Local PHP HTTP checks: GET generation = 405; unconfigured generation = 503; arbitrary proxy host = 400; direct include access = 404.
- Rendered desktop inspection at 1600 px: no horizontal overflow, embedded IDEA header, local Arabic font loaded, default automatic AI mode, 475 approved catalogue entries exposed through filtering/pagination. Catalogue count may change with the existing store data.
- Mobile inspection at 390 px: no horizontal overflow; inputs, gallery and summary stack vertically.
- Existing Supabase authentication, old room editor and storefront are preserved.

## Activation still required

Customer access update: PHP policy test passes for buyer-only access. Suppliers, admins, company members, designer/contractor roles and missing or invalid permission data are denied. The server checks the persisted Supabase role and company membership before processing images or charging the generation quota. Live checks with real buyer/company/admin accounts still require configured account access.

- No cPanel account/domain credentials were provided; no production deployment was performed.
- No Gemini API key was provided; no actual paid image-generation or real-image surface-detection call was made.
- Automatic segmentation quality, faithful product texture/colour, occlusion quality and output quality on customer room/bathroom/kitchen photos remain **NOT VERIFIED**.
- Firebase cloud upload and rules need project configuration and a real round-trip test. Local image storage and downloads are verified.
- External supplier images can be unavailable or reject browser CORS. The proxy handles the allowlisted Art Ceramic source; uploading a local swatch is supported.

See `CERAMIC-STUDIO-CPANEL.md` for activation steps. The package is a built integration ready to upload and configure; it is not evidence of an already active AI service on the public website.
