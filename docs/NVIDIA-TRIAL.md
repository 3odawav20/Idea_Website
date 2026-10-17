# Temporary NVIDIA FLUX 3 integration

Set provider=nvidia in the private ceramic-studio-config.php and set nvidia_key there. Never put the key in React, Git, a public file or a browser URL. The hosted site uses /home/lsenet5/idea-fuzzycell-private/studio-config.php via CERAMIC_CONFIG_PATH.

The pipeline uses nvidia/nemotron-nano-12b-v2-vl to inspect the room and material swatch, identify surface/exclusion polygons, and describe the swatch. FLUX 3's documented image-editing request has one image field, so it receives the original room plus the material description. This is a temporary approximation; it does not prove exact reproduction of the selected tile pattern. The final output is composited into the original room using the validated surface and exclusion masks. Pixels outside those masks are preserved; mask accuracy must be visually checked.

NVIDIA's current hosted Preview API documentation restricts image to predefined example_id values0–3. This can block custom customer room photos even with a valid API key. HTTP422 is surfaced explicitly; no example-room or local-preview result is substituted. Treat this integration as pending until a real custom room and selected swatch produce an acceptable output. The adapter does not automatically switch providers.

References:
- https://docs.api.nvidia.com/nim/reference/black-forest-labs-flux-3-image-klein-infer
- https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-nano-12b-v2-vl-infer

If the endpoint returns202 beyond the synchronous polling window, the application reports that no final image arrived; it does not claim completion. Background-job persistence is not implemented. API keys, quotas, response format and custom-image support require a live account test. Hosted Preview terms differ from model deployment licensing; no assumption of unlimited free or production use is made.

Validation: php scripts/test-nvidia-provider.php exercises the request contract and failure handling with mocked provider responses. It does not establish live API availability or image quality.
