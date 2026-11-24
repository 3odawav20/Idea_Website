# FLUX.2 Klein visualizer worker — staged migration

**Status: local candidate only. No Runpod resource, production endpoint, cPanel file, or live model setting was changed.** The endpoint ID remains `5lvjvfqqbkw3c7`; the candidate is not approved for production until the acceptance gates below pass.

## What is in this change

- `runpod/flux2-klein/handler.py` is a real Runpod Serverless handler. It accepts the existing `idea-qwen-mask-v1` envelope and the opt-in `idea-flux2-klein-mask-v2` envelope, and returns the legacy-compatible `output.image` and `output.mask` values.
- The worker decodes the room and selected catalogue material as two independent images and calls `Flux2KleinPipeline` with `image=[room_reference, material_reference]`, 4 steps and guidance scale 1.0.
- Floor and wall labels are segmented independently with SegFormer. The returned replacement mask contains only confident floor/wall pixels; other semantic labels (including ceiling, windows, curtains, doors, furniture, rugs, lights and decor) are excluded, and uncertain edges are eroded.
- Depth Anything V2 supplies a relative depth map. Texture coordinates use that relative depth, selected tile proportions, rotation, and grout width to create a depth-scaled perspective projection. The original image supplies most of the illumination; FLUX contributes a restrained low-frequency refinement. The server-side PHP adapter still composites only white pixels from the worker mask over the original.
- The worker rejects malformed inputs, unsupported contracts, empty or broad masks, mismatched geometry, invalid model output and oversized responses. Image/model errors are returned without stack traces or user image data.
- `platform-ai.php` adds a versioned FLUX contract selector, preserves the v1 request/response schema, stores the selected contract with each job, adds request idempotency/fingerprint checks before quota reservation, and persists real Runpod queue vs. processing state in the job settings.
- The React visualizer now uses the authenticated PHP/MySQL platform API, SWR polling, MySQL job history, and the existing authenticated `ai-download` action to restore active/completed work after a reload. No room photo, result image, access token, or user record is persisted in browser storage; only a short-lived idempotency key is kept in `sessionStorage`.

### Important visual-quality limitation

The depth-based projection is a conservative relative-depth approximation, not metrically calibrated projective reconstruction. The product dimensions and grout width shape the projection, but without measured room geometry or a verified plane calibration it must not be represented as a construction measurement. The worker prevents changes outside its semantic mask; that alone does not prove the generated surface is visually or materially correct. Real room/material acceptance tests are a hard release gate.

## Model and compute basis

Official Black Forest Labs model card: <https://huggingface.co/black-forest-labs/FLUX.2-klein-4B>. It identifies the 4B model as multi-reference editing and reports approximately 13 GB VRAM. Official Diffusers API: <https://huggingface.co/docs/diffusers/main/api/pipelines/flux2>. The Docker requirements pin the Diffusers source revision used for `Flux2KleinPipeline`.

A 24 GB RTX 4090 is the candidate low-cost class because it leaves headroom beyond the model card's approximate 13 GB requirement; the segmentation and depth models are moved to the GPU sequentially and returned to CPU. This is a recommendation, not a verified cheapest Runpod SKU. The Runpod account's live regional availability and hourly prices were not accessible in this workspace. The existing endpoint currently lists `AMPERE_80`; that pool must not be changed until a live, no-deployment price/availability check confirms a suitable GPU.

Runpod's Serverless model cache is preferred over creating a paid persistent network volume. The candidate sets `MODEL_NAME` and `HF_HOME=/runpod-volume/huggingface-cache`, loads weights once per worker process, and shares the Hugging Face cache directory. Do not attach or create a network volume unless the account's actual caching behavior is checked and its recurring storage price is approved.

## Build and endpoint configuration

1. Build the image from `runpod/flux2-klein/Dockerfile` and push it under the immutable candidate tag in `runpod/flux2-klein/endpoint-candidate.json`. Do not overwrite the existing Qwen image tag.
2. In Runpod, edit the existing endpoint only after the pre-release acceptance tests pass. Keep endpoint ID `5lvjvfqqbkw3c7`, minimum workers `0`, maximum workers `1`, and the existing server-side `RUNPOD_API_KEY` and `RUNPOD_ENDPOINT_ID` secrets. Do not echo, copy, or rotate those secrets.
3. Set the new image and `MODEL_NAME=black-forest-labs/FLUX.2-klein-4B`; keep model cache enabled. Select an available GPU only after comparing live region prices and verifying at least 24 GB VRAM for this combined worker. Keep the deployment in the current US region set unless the endpoint owner explicitly approves otherwise.
4. Keep `RUNPOD_WORKER_CONTRACT=idea-qwen-mask-v1` until the candidate endpoint passes all checks. Then opt in to `idea-flux2-klein-mask-v2` for the PHP/MySQL platform. Do not change the legacy Supabase adapter or copy it over the newer cPanel platform files.
5. Verify min/max workers, endpoint health, one bounded real generation, async status progression, mask dimensions/area, output dimensions and authenticated browser delivery before enabling user traffic. Do not run repeated paid tests.

## PHP/MySQL and frontend rollout

- No schema migration is required: the new idempotency key, request fingerprint and adapter version are held in the existing `idea_ai_jobs.settings` JSON. Confirm the live `settings` column accepts valid JSON text before rollout.
- Deploy the candidate `server/cpanel/idea-accounts-api/platform-ai.php` only as part of the actual MySQL platform release. The repository's Vite build does not package this candidate, and `platform.php`, the live schema, account functions, cPanel deployment channel, and newer live patches were not available for verification here.
- The frontend expects `GET /api/platform.php?action=ai-history`, `GET /api/platform.php?action=ai-job&id=...`, `POST /api/platform.php?action=ai-create`, `POST /api/platform.php?action=ai-process`, and authenticated `GET /api/platform.php?action=ai-download&id=...`. Confirm those action mappings and CSRF behavior in the actual deployed `platform.php` before release.
- Do not deploy `server/cpanel/api/visualize.php`; it is a legacy Supabase adapter and is intentionally left untouched. Do not run the cPanel publishing script or replace the production domain from this branch.

## Acceptance tests before promotion

1. Build the container and verify CUDA, BF16/FP16 selection, model download/cache hit, repeated request reusing one loaded pipeline, and correct cold-start/error handling on a non-billed local or provider-approved test environment.
2. With a curated set of licensed room photographs and exact catalogue material images, verify both references arrive independently at the pipeline, and check the output reproduces the exact source motif rather than an approximate look.
3. For floor-only, wall-only and both, manually inspect semantic masks on furniture, rugs, windows, curtains, doors, ceiling, lighting and decor. Confirm each protected region stays byte-identical after server compositing. Reject missed boundaries or false-positive masks.
4. Measure tile direction, perspective, grout spacing, shadows and reflections with independent architectural review. Because relative depth is not metric, do not claim physical-scale accuracy without calibrated room geometry.
5. Verify generated/final dimensions, unsupported or corrupted image rejection, empty/full/oversized masks, wrong-user job IDs, queue transitions, retries, completion history recovery, result download and no duplicate quota charge across refreshes and concurrent tabs.
6. Test real PHP/MySQL customer, admin, supplier/owner, quota exhaustion and session/CSRF cases on staging. This candidate has not been run against the live account platform or database.

## Rollback

1. Keep the existing endpoint image `ghcr.io/3odawav20/idea-dh-qwen-mask:20261115-v3` available and do not retag/delete it.
2. If any acceptance gate fails, restore that exact image on the same endpoint ID, retain min workers `0`/max workers `1`, and restore the previously recorded worker-contract setting. Do not create a second endpoint or change Runpod credentials.
3. Restore the previous PHP/MySQL release from the cPanel backup made immediately before rollout. Do not copy historical `deploy/livefree/20261102` stubs or overwrite newer live fixes.
4. Leave already-completed MySQL result records readable and keep their per-job worker contract metadata. Confirm authenticated downloads and user ownership after rollback.
5. Record the failing sample/job IDs without including image data or secrets; disable generation rather than silently falling back to another provider.

## Verification record for this candidate

- Official FLUX.2 Klein model card and official Diffusers Flux2 API were reviewed.
- Runpod Serverless worker and network-volume documentation were reviewed; no Runpod API credentials, cPanel deployment access, or Runpod endpoint control plane were available to this agent.
- No Runpod endpoint was changed, no paid GPU was started, no production generation was submitted, and no production website was deployed.
- Container build, actual GPU inference, live endpoint availability/pricing, real room-material quality, live PHP/MySQL integration, and the current cPanel deployment were not verified. These remain mandatory release blockers.
