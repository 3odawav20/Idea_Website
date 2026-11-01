<?php
/**
 * IDEA / Runpod surface-only postprocessor.
 * Pure image postprocessing: no credentials, endpoint assumptions or external API calls.
 * IMPORTANT: $allowedMask must be generated from wall/floor segmentation and exclude
 * all furniture, doors, windows, people, fixtures and any unselected surfaces.
 */
declare(strict_types=1);

function ideaSurfaceOnlyPrompt(string $target, int $width, int $height): string
{
    if (!in_array($target, ['walls', 'floor', 'walls_and_floor'], true)) {
        throw new InvalidArgumentException('SURFACE_TARGET_INVALID');
    }
    if ($width < 64 || $height < 64 || $width > 4096 || $height > 4096) {
        throw new InvalidArgumentException('ROOM_DIMENSIONS_INVALID');
    }
    $surface = match ($target) {
        'walls' => 'the visible WALL SURFACES only (not the ceiling)',
        'floor' => 'the visible FLOOR SURFACE only',
        default => 'the visible WALL AND FLOOR SURFACES only (not the ceiling)',
    };
    return "STRICT IN-PLACE MATERIAL EDIT, NOT IMAGE GENERATION. "
        . "The FIRST image is the immutable reference room and defines ALL geometry. "
        . "The SECOND image supplies the selected ceramic/porcelain material appearance ONLY. "
        . "Change ONLY {$surface}, strictly within the provided wall/floor mask. "
        . "Do not alter a single furniture item, cabinet, appliance, person, lamp, door, window, "
        . "ceiling, decoration, fixture, object, reflection outside the target surface, or any unselected surface. "
        . "Do not move, replace, remove, recolor, restyle or hallucinate furniture or room contents. "
        . "Preserve all boundaries, corners, perspective, camera position, field of view, architecture, "
        . "composition, shadows, natural lighting and object occlusion. Keep every edge exactly aligned. "
        . "Never crop, zoom, rotate, stretch, expand or reframe the source photograph. "
        . "The final image MUST have exactly {$width} x {$height} pixels and the same aspect ratio. "
        . "Photorealistically apply the selected material, realistic grout, perspective and scale ONLY "
        . "to the allowed surface pixels. Preserve EVERYTHING else pixel-identical to the source. "
        . "Return only the edited photograph with no text, collage, borders or watermark.";
}

/**
 * Compose a Runpod render on top of the original room, applying ONLY the approved mask.
 * Mask contract: PNG, same dimensions as the ORIGINAL room; black = protected (0 edits),
 * white = allowed floor/wall material, gray = anti-aliased edge. Never trust the image
 * generator to determine the allowed mask: derive it from an independent wall/floor
 * segmentation step and subtract furniture/object/door/window masks.
 *
 * Returns PNG bytes, retaining precisely the ORIGINAL pixel grid. If the generated
 * image aspect ratio has drifted appreciably, do NOT stretch it into place.
 */
function ideaSurfaceOnlyComposite(string $roomBytes, string $renderBytes, string $allowedMaskBytes): string
{
    if (!extension_loaded('gd')) {
        throw new RuntimeException('GD_EXTENSION_REQUIRED');
    }
    $read = static function (string $bytes, string $label): array {
        if (strlen($bytes) < 16 || strlen($bytes) > 16 * 1024 * 1024) {
            throw new InvalidArgumentException($label . '_IMAGE_SIZE_INVALID');
        }
        $info = @getimagesizefromstring($bytes);
        if ($info === false || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
            throw new InvalidArgumentException($label . '_IMAGE_FORMAT_INVALID');
        }
        [$w, $h] = $info;
        if ($w < 64 || $h < 64 || $w > 4096 || $h > 4096 || $w * $h > 6000000) {
            throw new InvalidArgumentException($label . '_IMAGE_DIMENSIONS_INVALID');
        }
        $image = @imagecreatefromstring($bytes);
        if (!$image) {
            throw new InvalidArgumentException($label . '_IMAGE_DECODE_FAILED');
        }
        return [$image, $w, $h];
    };

    [$room, $width, $height] = $read($roomBytes, 'ROOM');
    [$render, $renderWidth, $renderHeight] = $read($renderBytes, 'RENDER');
    [$mask, $maskWidth, $maskHeight] = $read($allowedMaskBytes, 'MASK');

    if ($maskWidth !== $width || $maskHeight !== $height) {
        throw new InvalidArgumentException('MASK_DIMENSIONS_MUST_MATCH_ORIGINAL');
    }
    // Only accept resampling for a model output that preserves the *same* composition ratio.
    // Arbitrary aspect changes indicate re-framing; automatically stretching them can distort walls.
    $aspectError = abs(($renderWidth / $renderHeight) / ($width / $height) - 1);
    if ($aspectError > 0.012) {
        throw new InvalidArgumentException('RENDER_ASPECT_MISMATCH_RETRY_AT_ORIGINAL_DIMENSIONS');
    }

    $scaled = imagecreatetruecolor($width, $height);
    if (!$scaled || !imagecopyresampled($scaled, $render, 0, 0, 0, 0, $width, $height, $renderWidth, $renderHeight)) {
        throw new RuntimeException('RENDER_ALIGNMENT_FAILED');
    }
    $out = imagecreatetruecolor($width, $height);
    if (!$out || !imagecopy($out, $room, 0, 0, 0, 0, $width, $height)) {
        throw new RuntimeException('ORIGINAL_COPY_FAILED');
    }
    $editedPixels = 0;
    for ($y = 0; $y < $height; ++$y) {
        for ($x = 0; $x < $width; ++$x) {
            $m = imagecolorat($mask, $x, $y);
            $maskStrength = (int) round((($m >> 16 & 0xff) + ($m >> 8 & 0xff) + ($m & 0xff)) / 3);
            // Black and near-black mask pixels remain EXACTLY the original.
            if ($maskStrength < 12) {
                continue;
            }
            ++$editedPixels;
            $c = imagecolorat($scaled, $x, $y);
            if ($maskStrength >= 250) {
                imagesetpixel($out, $x, $y, $c);
                continue;
            }
            $o = imagecolorat($room, $x, $y);
            $a = $maskStrength / 255;
            $r = (int) round((1 - $a) * (($o >> 16) & 255) + $a * (($c >> 16) & 255));
            $g = (int) round((1 - $a) * (($o >> 8) & 255) + $a * (($c >> 8) & 255));
            $b = (int) round((1 - $a) * ($o & 255) + $a * ($c & 255));
            imagesetpixel($out, $x, $y, ($r << 16) | ($g << 8) | $b);
        }
    }
    if ($editedPixels === 0 || $editedPixels > (int) floor($width * $height * 0.96)) {
        throw new InvalidArgumentException('SURFACE_MASK_EMPTY_OR_UNSAFE');
    }
    // PNG is intentionally lossless: re-encoding JPEG would change unselected pixels.
    ob_start();
    $ok = imagepng($out, null, 6);
    $result = ob_get_clean();
    if (!$ok || !is_string($result) || $result === '') {
        throw new RuntimeException('OUTPUT_ENCODE_FAILED');
    }
    return $result;
}
