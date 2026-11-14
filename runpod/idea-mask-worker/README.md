# IDEA-DH Runpod Qwen Image Edit Worker

Status: SOURCE CANDIDATE ONLY. NOT DEPLOYED OR GPU VERIFIED.

Contract: idea-qwen-mask-v1. The worker accepts the exact PHP platform-ai
request: room photo, tile material reference, selected floor/walls/both,
prompt, same dimensions. Returns PNG image and binary edit_mask.

Editing model: Qwen/Qwen-Image-Edit-2511 (Apache-2.0).
Segmentation model: openmmlab/upernet-convnext-tiny (MIT, ADE20K).
Ambiguous masks fail closed; no image is returned.
Pixel fidelity outside the mask is protected again by PHP.
Surface recognition quality requires real-scene GPU and visual QA.

Deployment requirements:
1. Build and push this Docker image to a registry Runpod can pull.
2. Create QUEUE Serverless endpoint on an 80GB GPU tier. min workers 0,
   max workers 1, short idle timeout, cache 20B model weights on volume.
3. Configure real endpoint ID and contract in the private cPanel config.
   Never put secrets in the browser bundle.
4. Probe with an input object containing probe:contract, then run
   an actual two-image job and validate dimensions, mask and preservation.
5. Avoid paid scaling until a real edited-image test succeeds.

The currently stored Runpod API key received HTTP 403 for both endpoint
listing and endpoint-create permission preflight on 2026-11-14.
Need a scoped key with serverless:read and serverless:write to manage
an endpoint, and invocation access to the target endpoint.

Local checks: python -m py_compile handler.py test_contract.py
and python -m unittest -v test_contract.py (Pillow and numpy required).
