# Temporary NVIDIA FLUX 3 integration

Set provider=nvidia in the private ceramic-studio-config.php and set nvidia_key there. Never put the key in React, Git, a public file or a browser URL. The hosted site uses /home/lsenet5/idea-fuzzycell-private/studio-config.php via CERAMIC_CONFIG_PATH.

The pipeline uses nvidia/nemotron-3.5-super-vl-120b-a12b with reasoning_effort=none to inspect the room and material swatch, identify surface/exclusion polygons, and describe the swatch. FLUX 3's documented image-editing request has one image field, so it receives the original room plus the material description. This is a temporary approximation; it does not prove exact reproduction of the selected tile pattern. The final output is composited into the original room using the validated surface and exclusion masks. Pixels outside those masks are preserved; mask accuracy must be visually checked.

NVIDIA's current hosted Preview API documentation restricts image to predefined example_id values0–3. This can block custom customer room photos even with a valid API key. HTTP422 is surfaced explicitly; no example-room or local-preview result is substituted. Treat this integration as pending until a real custom room and selected swatch produce an acceptable output. The adapter does not automatically switch providers.

References:
- https://docs.api.nvidia.com/nim/reference/black-forest-labs-flux-3-image-klein-infer
- https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-nano-12b-v2-vl-infer
- https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3_5-super-vl-120b-a12b-infer

If the endpoint returns202 beyond the synchronous polling window, the application reports that no final image arrived; it does not claim completion. Background-job persistence is not implemented. API keys, quotas, response format and custom-image support require a live account test. Hosted Preview terms differ from model deployment licensing; no assumption of unlimited free or production use is made.

Validation: php scripts/test-nvidia-provider.php exercises the request contract and failure handling with mocked provider responses. It does not establish live API availability or image quality.

Live test 2026-10-17: a key supplied through a local password field was configured privately. The dotted URL in the reference returned404. The signed-in NVIDIA Build Shell example uses https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux-3-image-klein; the live API requires mode=i2i for editing. A real custom room JPEG at that URL/mode returned422: Expected: example_id, got: base64. No edited image was generated. The adapter now uses the verified URL/mode and explicitly surfaces the trial limitation. A key is present, but custom-room generation remains blocked by this provider interface.

The previous Nano12B vision endpoint returned410 and was absent from the authenticated model list. Nemotron3.5 Super VL was listed and returned200 with answer Yes for the real room-image test when reasoning_effort=none. No claim is made that surface segmentation quality has been validated. Production and local private configs set nvidia_custom_images_verified=false, so customer generation requests fail clearly before spending vision/generation quota on a known unsupported editing endpoint. A supported endpoint and successful custom-room test are required before changing that flag.
