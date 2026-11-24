<?php
declare(strict_types=1);

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    http_response_code(404);
    exit;
}
require_once __DIR__.'/tile-dimensions.php';

function platformAiSurfaceArea(string $json): array
{
    $points = json_decode($json, true, 6);
    if ($points === [] || $json === '') return [];
    if (!is_array($points) || !array_is_list($points) || count($points) < 3 || count($points) > 24) {
        accountError(422, 'INVALID_SURFACE_AREA');
    }
    foreach ($points as $point) {
        if (!is_array($point) || !array_is_list($point) || count($point) !== 2) accountError(422, 'INVALID_SURFACE_AREA');
        foreach ($point as $value) {
            if ((!is_float($value) && !is_int($value)) || !is_finite((float)$value) || $value < 0 || $value > 1) {
                accountError(422, 'INVALID_SURFACE_AREA');
            }
        }
    }
    return $points;
}

function platformAiSurfaceCatalogue(): array
{
    static $source = null;
    if ($source !== null) return $source;
    $json = @file_get_contents(dirname(__DIR__).'/data/idea-catalogue.json');
    $rows = is_string($json) ? json_decode($json, true) : null;
    if (!is_array($rows)) accountError(503, 'MATERIAL_CATALOGUE_UNAVAILABLE');
    $source = array_column($rows, null, 'id');
    return $source;
}

function platformAiSurfaceMaterial(string $target, string $product, string $size, array $fields): array
{
    $row = platformAiSurfaceCatalogue()[$product] ?? null;
    if (!$row) accountError(422, 'PRODUCT_NOT_APPROVED_FOR_VISUALIZATION');
    $types = implode(' ', array_filter($row['types'] ?? [], 'is_string'));
    if (!preg_match($target === 'walls' ? '/\bwall\b/i' : '/\bfloor\b/i', $types)) {
        accountError(422, 'PRODUCT_SURFACE_MISMATCH');
    }
    try {
        $spec = ideaTileParseSize((string)($row['size'] ?? ''), 'cm');
        ideaTileAssertMatches($spec, $size, $fields['width'], $fields['height']);
    } catch (InvalidArgumentException) {
        accountError(422, 'PRODUCT_TILE_SIZE_MISMATCH');
    }
    if (!in_array($fields['rotation'], ['0', '45', '90'], true) || !preg_match('/^#[a-f0-9]{6}$/iD', $fields['grout'])) {
        accountError(422, 'INVALID_TILE_LAYOUT');
    }
    return [
        'product_id' => $product,
        'size' => $spec['size_label'],
        'width_mm' => $spec['width_mm'],
        'height_mm' => $spec['height_mm'],
        'aspect_ratio' => $spec['aspect_ratio'],
        'angle' => (int)$fields['rotation'],
        'grout' => $fields['grout'],
        'area' => platformAiSurfaceArea($fields['area']),
    ];
}

function platformAiSurfaceFace(string $product, int $index): array
{
    $root = dirname(__DIR__);
    $row = platformAiSurfaceCatalogue()[$product] ?? null;
    if (!$row) accountError(422, 'PRODUCT_NOT_APPROVED_FOR_VISUALIZATION');
    $mapping = json_decode((string)@file_get_contents($root.'/data/idea-material-faces.json'), true);
    if (!is_array($mapping)) accountError(503, 'MATERIAL_CATALOGUE_UNAVAILABLE');
    $sourceFaces = array_values(array_unique(array_filter($row['tiles'] ?? [], static function ($url) {
        return is_string($url) && preg_match('#^https://[^\s]+\.(?:png|jpe?g|webp)(?:\?[^\s]*)?$#iD', $url);
    })));
    $max = 8388608;
    $cached = $mapping[$product] ?? null;
    if ($index === 0 && is_string($cached) && preg_match('#^/images/material-faces/[a-f0-9]{24}\.jpg$#D', $cached)) {
        $bytes = @file_get_contents($root.$cached, false, null, 0, $max + 1);
    } else {
        $url = $sourceFaces[$index] ?? null;
        if (!is_string($url) || !preg_match('#^https://dashboard\.artceramic-egypt\.com/uploads/[A-Za-z0-9_.%()/-]+\.(?:png|jpe?g|webp)$#iD', $url)) {
            accountError(422, 'MATERIAL_FACE_UNAVAILABLE');
        }
        $bytes = '';
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_WRITEFUNCTION => static function ($handle, string $chunk) use (&$bytes, $max): int {
                if (strlen($bytes) + strlen($chunk) > $max) return 0;
                $bytes .= $chunk;
                return strlen($chunk);
            },
        ]);
        $ok = curl_exec($curl);
        if (!$ok || curl_getinfo($curl, CURLINFO_RESPONSE_CODE) !== 200) $bytes = false;
        curl_close($curl);
    }
    $info = is_string($bytes) && strlen($bytes) <= $max ? @getimagesizefromstring($bytes) : null;
    if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true) ||
        $info[0] < 64 || $info[1] < 64 || $info[0] * $info[1] > 10000000) {
        accountError(422, 'MATERIAL_FACE_UNAVAILABLE');
    }
    return ['bytes' => $bytes, 'mime' => $info['mime']];
}

function platformAiSurfaceWrite(string $path, string $bytes): void
{
    $temporary = $path.'.'.bin2hex(random_bytes(6)).'.tmp';
    try {
        if (file_put_contents($temporary, $bytes, LOCK_EX) !== strlen($bytes) ||
            !chmod($temporary, 0600) || !rename($temporary, $path)) {
            accountError(503, 'STORAGE_UNAVAILABLE');
        }
    } finally {
        if (is_file($temporary)) unlink($temporary);
    }
}

function platformAiSurfaceCreate(array $user, array $room, array $materials, array $choices, string $kind, string $requestId): string
{
    $limit = platformAiLimit($user);
    if ($limit !== null) accountRate('ai-create', 10, 3600);
    $userId = $user['id'];
    $request = hash('sha256', strtolower($requestId));
    $pattern = '%"request_id":"'.$request.'"%';
    $id = platformId();
    $dir = platformAiDir($id);
    $installed = [];
    try {
        return platformTransaction(function () use ($userId, $limit, $pattern, $request, $id, $dir, $room, $materials, $choices, $kind, &$installed) {
            accountQuery('SELECT id FROM idea_users WHERE id=?'.platformLock(), [$userId]);
            $existing = accountQuery('SELECT id FROM idea_ai_jobs WHERE user_id=? AND settings LIKE ? LIMIT 1', [$userId, $pattern])->fetchColumn();
            if (is_string($existing)) return $existing;
            if ($limit !== null) {
                $used = (int)accountQuery("SELECT COUNT(*) FROM idea_ai_jobs WHERE user_id=? AND state IN ('queued','processing','completed') AND settings NOT LIKE ?", [$userId, '%"quota_companion":true%'])->fetchColumn();
                if ($used >= $limit) accountError(429, 'AI_SUBSCRIPTION_REQUIRED');
            }
            $now = platformNow();
            $daily = (int)accountQuery('SELECT COUNT(*) FROM idea_ai_jobs WHERE created_at>?', [$now - 86400000])->fetchColumn();
            if ($daily >= (int)(platformConfig()['ai_daily_global_limit'] ?? 100)) accountError(429, 'AI_DAILY_LIMIT');
            if (!mkdir($dir, 0700, true)) accountError(503, 'STORAGE_UNAVAILABLE');
            $installed[$dir.'/source'] = $room['bytes'];
            foreach ($materials as $target => $material) $installed[$dir.'/'.$target.'-tile'] = $material['bytes'];
            foreach ($installed as $path => $bytes) platformAiSurfaceWrite($path, $bytes);
            $selected = count($choices) === 2 ? 'both' : array_key_first($choices);
            $primary = reset($choices);
            $settings = [
                'edit_version' => 2,
                'request_id' => $request,
                'surface' => $selected,
                'roomType' => $kind,
                'mime' => $room['mime'],
                'width' => $room['width'],
                'height' => $room['height'],
                'materials' => $choices,
            ];
            foreach ($materials as $target => $asset) $settings['materials'][$target]['mime'] = $asset['mime'];
            accountQuery("INSERT INTO idea_ai_jobs(id,user_id,parent_id,product_id,state,settings,created_at,updated_at) VALUES(?,?,NULL,?,'queued',?,?,?)",
                [$id, $userId, $primary['product_id'], platformJson($settings), $now, $now]);
            return $id;
        });
    } catch (Throwable $error) {
        foreach ($installed as $path => $bytes) {
            if (is_file($path)) unlink($path);
        }
        if ($installed && is_dir($dir)) rmdir($dir);
        throw $error;
    }
}

function platformAiSurfaceFail(array $user, string $id, string $code): void
{
    accountQuery("UPDATE idea_ai_jobs SET state='failed',error_code=?,updated_at=? WHERE id=? AND user_id=? AND state='processing'",
        [$code, platformNow(), $id, $user['id']]);
}

function platformAiSurfacePayload(array $settings, string $target, array $material, string $room, string $face): array
{
    $appliedTo = $target === 'walls' ? 'exposed interior vertical wall paint or cladding' : 'exposed walkable floor';
    $prompt = 'Refinish only the '.$appliedTo.' in image 1 using the real tile face in image 2. '
        .'Keep the same view, architecture and illumination. Preserve the other surface, ceiling, all furnishings, rugs, '
        .'fixtures, trim, doors, windows, people, mirrors, woodwork and their edges. Do not add, remove or move anything. '
        .'Use the actual color, grain and markings of image 2 in perspective. Maintain the documented tile proportions '
        .$material['size'].' at '.$material['angle'].' degrees, with grout '.$material['grout'].'. '
        .'Only exposed target-surface pixels may appear in the binary edit mask.';
    return ['input' => [
        'contract' => 'idea-qwen-mask-v1',
        'model' => 'Qwen/Qwen-Image-Edit-2511',
        'prompt' => $prompt,
        'original_image' => 'data:'.$settings['mime'].';base64,'.base64_encode($room),
        'material_reference' => 'data:'.$material['mime'].';base64,'.base64_encode($face),
        'target_surface' => $target,
        'output_width' => $settings['width'],
        'output_height' => $settings['height'],
        'return_edit_mask' => true,
        'preserve_unmasked_pixels' => true,
        'product' => [
            'id' => $material['product_id'],
            'tile_size' => $material['size'],
            'tile_width_mm' => $material['width_mm'],
            'tile_height_mm' => $material['height_mm'],
            'tile_aspect_ratio' => $material['aspect_ratio'],
            'physical_scale_calibrated' => false,
        ],
    ]];
}

function platformAiSurfaceStart(array $user, string $id): void
{
    platformAiLimit($user);
    $job = platformTransaction(function () use ($user, $id) {
        $row = accountQuery('SELECT * FROM idea_ai_jobs WHERE id=? AND user_id=?'.platformLock(), [$id, $user['id']])->fetch();
        if (!$row) accountError(404, 'JOB_NOT_FOUND');
        if ($row['state'] !== 'queued') return null;
        accountQuery("UPDATE idea_ai_jobs SET state='processing',attempts=attempts+1,updated_at=? WHERE id=? AND user_id=?",
            [platformNow(), $id, $user['id']]);
        return $row;
    });
    if (!$job) return;
    session_write_close();
    ignore_user_abort(true);
    $dir = platformAiDir($id);
    try {
        $settings = json_decode($job['settings'], true, 16, JSON_THROW_ON_ERROR);
        $endpoint = platformSecret('RUNPOD_ENDPOINT_ID');
        $key = platformSecret('RUNPOD_API_KEY');
        if (!$key || !preg_match('/^[A-Za-z0-9_-]{3,120}$/D', $endpoint) ||
            $endpoint === 'qwen-image-edit-2511' || platformSecret('RUNPOD_WORKER_CONTRACT') !== 'idea-qwen-mask-v1') {
            accountError(503, 'RUNPOD_WORKER_NOT_VERIFIED');
        }
        $room = file_get_contents($dir.'/source');
        if (!is_string($room) || $room === '') accountError(503, 'ROOM_IMAGE_UNAVAILABLE');
        $settings['provider_jobs'] = [];
        foreach ($settings['materials'] as $target => $material) {
            $tile = file_get_contents($dir.'/'.$target.'-tile');
            if (!is_string($tile) || $tile === '') accountError(503, 'MATERIAL_IMAGE_UNAVAILABLE');
            [$status, $reply] = platformHttp('https://api.runpod.ai/v2/'.$endpoint.'/run',
                ['Content-Type: application/json', 'Authorization: Bearer '.$key],
                platformAiSurfacePayload($settings, $target, $material, $room, $tile), 'POST', 23);
            $provider = is_array($reply) ? ($reply['id'] ?? null) : null;
            if (!in_array($status, [200, 201, 202], true) || !is_string($provider) ||
                !preg_match('/^[A-Za-z0-9_-]{8,128}$/D', $provider)) {
                accountError(502, $status === 429 ? 'RUNPOD_RATE_LIMIT' : 'RUNPOD_QUEUE_REJECTED');
            }
            $settings['provider_jobs'][$target] = $provider;
            accountQuery("UPDATE idea_ai_jobs SET settings=?,updated_at=? WHERE id=? AND user_id=? AND state='processing'",
                [platformJson($settings), platformNow(), $id, $user['id']]);
        }
    } catch (Throwable $error) {
        $code = $error instanceof IdeaAccountError ? $error->getMessage() : 'RUNPOD_SUBMISSION_FAILED';
        platformAiSurfaceFail($user, $id, $code);
    }
}

function platformAiSurfaceGd(string $source, int $width, int $height): GdImage
{
    $image = @imagecreatefromstring($source);
    if (!$image || imagesx($image) !== $width || imagesy($image) !== $height ||
        (!imageistruecolor($image) && !imagepalettetotruecolor($image))) {
        accountError(502, 'RUNPOD_DIMENSIONS_CHANGED');
    }
    imagealphablending($image, false);
    imagesavealpha($image, true);
    return $image;
}

function platformAiSurfaceSavePng(GdImage $image, string $path): void
{
    $temporary = $path.'.'.bin2hex(random_bytes(6)).'.tmp';
    try {
        if (!imagepng($image, $temporary, 4) || !chmod($temporary, 0600) || !rename($temporary, $path)) {
            accountError(503, 'IMAGE_EXPORT_FAILED');
        }
    } finally {
        if (is_file($temporary)) unlink($temporary);
    }
}

/**
 * Copy provider RGB only at accepted, unambiguous mask pixels.
 * Disagreements between wall and floor masks keep the original pixel.
 */
function platformAiComposeSurfaces(string $dir, array $settings): void
{
    $width = (int)$settings['width'];
    $height = (int)$settings['height'];
    $room = file_get_contents($dir.'/source');
    if (!is_string($room)) accountError(503, 'ROOM_IMAGE_UNAVAILABLE');
    $original = platformAiSurfaceGd($room, $width, $height);
    unset($room);
    $result = imagecreatetruecolor($width, $height);
    imagealphablending($result, false);
    imagesavealpha($result, true);
    imagecopy($result, $original, 0, 0, 0, 0, $width, $height);
    $preview = imagecreatetruecolor($width, $height);
    imagealphablending($preview, false);
    imagesavealpha($preview, true);
    $blank = 0x7f000000;
    imagefill($preview, 0, 0, $blank);
    $colors = ['walls' => 0x3af3b568, 'floor' => 0x3a57e7da];
    $counts = [];
    $overlap = 0;
    $previousTarget = null;
    foreach ($settings['materials'] as $target => $material) {
        $mask = platformAiSurfaceGd((string)file_get_contents($dir.'/'.$target.'-provider-mask'), $width, $height);
        $edit = platformAiSurfaceGd((string)file_get_contents($dir.'/'.$target.'-provider-image'), $width, $height);
        $area = null;
        if ($material['area']) {
            $area = imagecreate($width, $height);
            imagecolorallocate($area, 0, 0, 0);
            $white = imagecolorallocate($area, 255, 255, 255);
            $points = [];
            foreach ($material['area'] as [$x, $y]) {
                $points[] = (int)round($x * ($width - 1));
                $points[] = (int)round($y * ($height - 1));
            }
            imagefilledpolygon($area, $points, $white);
        }
        $changed = 0;
        $approved = 0;
        for ($y = 0; $y < $height; $y++) {
            for ($x = 0; $x < $width; $x++) {
                if (imagecolorat($mask, $x, $y) !== 0xffffff || ($area !== null && imagecolorat($area, $x, $y) !== $white)) continue;
                $approved++;
                $before = imagecolorat($original, $x, $y);
                if (imagecolorat($preview, $x, $y) !== $blank) {
                    if (imagecolorat($result, $x, $y) !== $before) $counts[$previousTarget]--;
                    imagesetpixel($result, $x, $y, $before);
                    imagesetpixel($preview, $x, $y, $blank);
                    $overlap++;
                    continue;
                }
                $after = imagecolorat($edit, $x, $y);
                if (($after >> 24) !== 0) continue;
                imagesetpixel($preview, $x, $y, $colors[$target]);
                if ($after !== $before) {
                    imagesetpixel($result, $x, $y, $after);
                    $changed++;
                }
            }
        }
        $counts[$target] = $changed;
        $previousTarget = $target;
        unset($mask, $edit, $area);
        if ($approved >= $width * $height * 0.92) accountError(502, 'RUNPOD_MASK_UNSAFE');
    }
    if (min($counts) < max(64, $width * $height * 0.0005) ||
        ($overlap > 0 && $overlap / ($overlap + min($counts)) > 0.18)) {
        accountError(502, 'SURFACE_MASK_UNCERTAIN');
    }
    platformAiSurfaceSavePng($preview, $dir.'/surface-mask.png');
    platformAiSurfaceSavePng($result, $dir.'/result.png');
}

function platformAiSurfacePoll(array $user, array $job): array
{
    $id = $job['id'];
    $settings = $job['settings'];
    $dir = platformAiDir($id);
    $locked = fopen($dir.'/.poll-lock', 'c');
    if (!$locked || !flock($locked, LOCK_EX | LOCK_NB)) {
        if ($locked) fclose($locked);
        return $job;
    }
    try {
        $job = platformAiJob($user, $id);
        if ($job['state'] !== 'processing') return $job;
        $settings = $job['settings'];
        $providerJobs = $settings['provider_jobs'] ?? [];
        $age = platformNow() - (int)$job['updated_at'];
        if (count($providerJobs) !== count($settings['materials'])) {
            if ($age > 120000) platformAiSurfaceFail($user, $id, 'RUNPOD_SUBMISSION_INTERRUPTED');
            return platformAiJob($user, $id);
        }
        $endpoint = platformSecret('RUNPOD_ENDPOINT_ID');
        if (!preg_match('/^[A-Za-z0-9_-]{3,120}$/D', $endpoint)) accountError(503, 'RUNPOD_WORKER_NOT_VERIFIED');
        if ($age > 2100000) accountError(502, 'RUNPOD_JOB_EXPIRED');
        $complete = true;
        foreach ($providerJobs as $target => $provider) {
            $imagePath = $dir.'/'.$target.'-provider-image';
            $maskPath = $dir.'/'.$target.'-provider-mask';
            if (is_file($imagePath) && is_file($maskPath)) continue;
            [$code, $response] = platformAiProviderStatus($endpoint, $provider);
            if (in_array($code, [404, 410], true)) accountError(502, 'RUNPOD_JOB_EXPIRED');
            if ($code !== 200 || !is_array($response) || in_array($response['status'] ?? '', ['IN_QUEUE', 'IN_PROGRESS'], true)) {
                $complete = false;
                continue;
            }
            if (($response['status'] ?? '') !== 'COMPLETED') accountError(502, 'RUNPOD_GENERATION_FAILED');
            $output = $response['output'] ?? [];
            $generated = platformAiDecodedOutput($output['image'] ?? $output['edited_image'] ?? null);
            $mask = platformAiDecodedOutput($output['mask'] ?? $output['edit_mask'] ?? null);
            unset($response, $output);
            $maskInfo = @getimagesizefromstring($mask);
            if (!$maskInfo || $maskInfo[2] !== IMAGETYPE_PNG) accountError(502, 'RUNPOD_INVALID_MASK');
            platformAiSurfaceWrite($maskPath, $mask);
            platformAiSurfaceWrite($imagePath, $generated);
            unset($generated, $mask);
        }
        if ($complete) {
            platformAiComposeSurfaces($dir, $settings);
            accountQuery("UPDATE idea_ai_jobs SET state='completed',error_code='',updated_at=? WHERE id=? AND user_id=? AND state='processing'",
                [platformNow(), $id, $user['id']]);
        }
    } catch (Throwable $error) {
        $code = $error instanceof IdeaAccountError ? $error->getMessage() : 'RUNPOD_VERIFICATION_FAILED';
        platformAiSurfaceFail($user, $id, $code);
    } finally {
        flock($locked, LOCK_UN);
        fclose($locked);
    }
    return platformAiJob($user, $id);
}

