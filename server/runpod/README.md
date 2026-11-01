# IDEA / Runpod — Surface-only guard

This is a **standalone PHP module** for the real Runpod image-editing pipeline. It does not invoke Gemini or modify credentials or endpoints. It is **not yet installed in the live** `/idea-accounts-api/platform.php`.

## Required integration

1. Keep the uploaded original room bytes and their true width/height.
2. Generate a **trusted PNG mask at the original size**, with white ONLY for the selected walls/floor; black for furniture, appliances, doors, windows, fixtures, ceiling, persons and unselected regions. Subtract foreground/occlusion masks from your wall/floor segmentation. Never use the model output itself as the trusted mask.
3. Call `ideaSurfaceOnlyPrompt('walls_and_floor', $width, $height)` for the prompt sent to your existing Runpod image-edit endpoint. Use `'walls'` or `'floor'` for single surfaces.
4. After receiving a completed Runpod edit, but **before** publishing or marking the job complete, do:

```php
require_once __DIR__ . '/surface-lock.php';
$finalPng = ideaSurfaceOnlyComposite(
    $originalRoomBytes,
    $runpodEditedImageBytes,
    $trustedWallFloorMaskPng
);
file_put_contents($privateJobDir . '/result.png', $finalPng, LOCK_EX);
// Serve with Content-Type: image/png, never image/jpeg.
// Only after success: change the job state to completed.
```

5. If the model re-frames the room and its aspect ratio differs substantially, request a retry at the original dimensions instead of distorting geometry. The final composited image is always the original width × height.

## What is guaranteed

**Every unmasked pixel** in the composited PNG is taken from the original image, and the output dimensions are exact. The selected masked surfaces can take the new tile material, perspective and grout.

**What cannot be guaranteed without a trustworthy mask:** whether a selected pixel belongs to a wall/floor or a furniture item. If the mask accidentally includes a sofa, that region can change. A text prompt alone cannot solve this; use segmentation plus furniture occlusion or manually corrected masks.

Requires PHP 8+ and GD. Keep the mask and photos in private per-job storage. This does not fix unrelated account/CSRF/Runpod failures and does not prove live generation.