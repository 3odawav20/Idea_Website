# Apartment material preview — integration contract

This pull request adds the **frontend handoff only**. The separate visualization developer owns all image generation, segmentation, masking, perspective, and result processing.

## Customer flow
1. Every product-detail page shows **جرّب المنتج في شقتك** in Arabic and **Try this product in your apartment** in English.
2. The button opens `/ai-room-visualizer?product=<encoded-product-id>`; the corresponding catalogue material is already selected.
3. A visitor can upload a JPEG/PNG/WebP apartment photo (max 15 MB), optionally replace the catalogue material with their own material image (also max 15 MB), and pick a room and target surface.
4. Nothing uploads until the customer submits. The submit action stays disabled until the external endpoint is configured; no fake AI preview is displayed.

## Connecting the independent renderer
Set `VITE_IDEA_VISUALIZER_ENDPOINT` when building the storefront to an HTTPS or same-origin endpoint controlled by the visualization developer. No service tokens should be embedded in this Vite variable or browser bundle.

The frontend makes a user-triggered `POST` with `multipart/form-data`:
- `room_photo`: required image file.
- `material_photo`: optional image file (when the customer uploads a custom material).
- `product_id`, `product_slug`, `material_url`: included when a catalogue product is selected; `material_url` is the absolute catalogue image URL.
- `room_type`: `apartment`, `living_room`, `bathroom`, `kitchen`, `bedroom`, or `other`.
- `surface`: `auto`, `floor`, or `wall`.
- `locale`: `ar` or `en`.

Expected response: any HTTP 2xx JSON, optionally `{"result_url":"https://trusted-provider.example/result/..."}` for a completed result. The UI reports successful handoff, not generation, if no `result_url` is returned. The backend team owns authorization, image storage, model inference, request limits, privacy terms, image lifecycle/deletion and optional job polling.

## Localization and mobile
All newly introduced customer-facing text is selected from Arabic and English strings based on the current storefront locale. The apartment form becomes one column on screens narrower than 720 px. This does **not** certify all existing site content as fully localized.

## Verification
Production build passed with Vite: 2,107 transformed modules, exit code 0, with the existing large-chunk warning. Backend integration was not tested because the rendering endpoint has not been supplied.
