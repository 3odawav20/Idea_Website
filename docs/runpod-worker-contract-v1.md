# IDEA Runpod worker contract — `idea-qwen-mask-v1`

Status: **implementation contract, not yet verified against the deployed endpoint**.

The cPanel adapter refuses any other contract name and never publishes an image
without both a generated image and an exact edit mask.

## Request

`POST https://api.runpod.ai/v2/{ENDPOINT_ID}/run`

The Runpod envelope contains an `input` object with:

- `contract`: `idea-qwen-mask-v1`
- `model`: preferred `Qwen/Qwen-Image-Edit-2511`
- `original_image`: room data URI
- `material_reference`: selected catalogue material data URI
- `target_surface`: `floor`, `walls`, or `both`
- `output_width` and `output_height`: exact original dimensions
- `return_edit_mask`: `true`
- `preserve_unmasked_pixels`: `true`
- `product`: source product ID and non-invented catalogue metadata
- `prompt`: strict preservation and material instructions

## Required completed output

The `output` object must contain:

- `image` or `edited_image`: PNG/JPEG/WebP base64 or data URI
- `mask` or `edit_mask`: same-dimension base64/data URI

The mask uses white for pixels approved for replacement and black for immutable
pixels. The adapter currently accepts only near-white mask pixels to favor
protection over aggressive editing.

URL outputs are deliberately rejected to avoid server-side request forgery. The
worker should return base64 directly or a future reviewed storage adapter must
validate signed hosts and ownership.

## Release gate

The PHP adapter:

1. Authenticates the Supabase user.
2. Enforces the five-attempt reservation or administrator bypass.
3. Verifies original, generated, and mask dimensions match exactly.
4. Uses the original room as the base image.
5. Copies generated pixels only where the verified mask is white.
6. Adds a small, softly blended IDEA watermark at the bottom-right.
7. Returns a PNG only after all checks pass.

If the deployed worker uses a different schema, do not change the production
adapter by guesswork. Capture a redacted real request/response, add a versioned
adapter, run preservation tests, then approve the migration.
