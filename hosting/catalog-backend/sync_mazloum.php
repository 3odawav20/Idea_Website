<?php
declare(strict_types=1);

$dsn = getenv('IDEA_DB_DSN') ?: '';
$dbUser = getenv('IDEA_DB_USER') ?: '';
$dbPassword = getenv('IDEA_DB_PASSWORD') ?: '';
$listingApi = rtrim(getenv('IDEA_SOURCE_LISTING_API') ?: 'https://idea-website-two.vercel.app/api/mazloum', '?&');
$detailApi = getenv('IDEA_SOURCE_DETAIL_API') ?: 'https://idea-website-two.vercel.app/api/mazloum-detail?url=';
$mediaDir = getenv('IDEA_MEDIA_DIR') ?: (__DIR__ . '/media');
$mediaBase = rtrim(getenv('IDEA_MEDIA_PUBLIC_BASE') ?: '', '/');
$detailBatch = max(0, min(300, (int)(getenv('IDEA_DETAIL_BATCH') ?: 60)));

if ($dsn === '' || $dbUser === '') {
    fwrite(STDERR, "Missing IDEA_DB_DSN or IDEA_DB_USER.\n");
    exit(2);
}

$pdo = new PDO($dsn, $dbUser, $dbPassword, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);

if (!is_dir($mediaDir)) {
    @mkdir($mediaDir, 0755, true);
}

function jsonGet(string $url, int $attempts = 3): ?array {
    for ($attempt = 1; $attempt <= $attempts; $attempt++) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 45,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
            CURLOPT_USERAGENT => 'IDEA-Catalog-Sync/1.0',
        ]);
        $body = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($status >= 200 && $status < 300 && is_string($body)) {
            $decoded = json_decode($body, true);
            if (is_array($decoded)) return $decoded;
        }
        if ($attempt < $attempts) usleep(350000 * $attempt);
    }
    return null;
}

function slugify(string $value): string {
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?: 'product';
    return trim($value, '-');
}

function inferCollection(?string $category, ?string $name = null): string {
    $text = strtolower(trim(($category ?? '') . ' ' . ($name ?? '')));
    if (preg_match('/bathtub|bath tub|jacuzzi/', $text)) return 'bathtubs';
    if (preg_match('/faucet|mixer|\btap\b/', $text)) return 'faucets';
    if (preg_match('/shower|shower cabin/', $text)) return 'shower-units';
    if (preg_match('/basin|toilet|\bwc\b|sanitary/', $text)) return 'sanitary-ware';
    if (preg_match('/vanity|bathroom unit/', $text)) return 'bathroom-units';
    if (preg_match('/porcelain tile|porcelain slab/', $text)) return 'porcelain';
    if (preg_match('/ceramic tile|wall tile|floor tile/', $text)) return 'ceramics';
    if (preg_match('/living room|sofa|chair|bed room|bedroom|dining room|table|cushion/', $text)) return 'furniture';
    if (preg_match('/lamp|lighting|chandelier|pendant/', $text)) return 'lighting';
    return 'home-decor';
}

function variantData(string $url): array {
    $parts = parse_url($url);
    $fragment = $parts['fragment'] ?? '';
    $result = ['material' => null, 'color' => null, 'dimension' => null];
    if ($fragment === '') return $result;

    foreach (explode('/', trim($fragment, '/')) as $segment) {
        $segment = rawurldecode($segment);
        if (preg_match('/^\d+-(material|color|dimension_model)-(.+)$/i', $segment, $m)) {
            $value = trim(str_replace('_', ' ', $m[2]));
            if ($m[1] === 'material') $result['material'] = $value;
            if ($m[1] === 'color') $result['color'] = $value;
            if ($m[1] === 'dimension_model') $result['dimension'] = $value;
        }
    }
    return $result;
}

function mirrorImage(string $url, string $productKey, int $position, string $mediaDir, string $mediaBase): array {
    if ($url === '') return ['source' => $url, 'local' => null, 'sha1' => null];
    $productDir = rtrim($mediaDir, '/\\') . DIRECTORY_SEPARATOR . preg_replace('/[^a-zA-Z0-9_-]/', '_', $productKey);
    if (!is_dir($productDir)) @mkdir($productDir, 0755, true);

    $path = parse_url($url, PHP_URL_PATH) ?: '';
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'], true)) $ext = 'jpg';

    $filename = sprintf('%02d-%s.%s', $position + 1, substr(sha1($url), 0, 14), $ext);
    $target = $productDir . DIRECTORY_SEPARATOR . $filename;

    if (!is_file($target) || filesize($target) < 128) {
        $ch = curl_init($url);
        $fp = fopen($target . '.tmp', 'wb');
        curl_setopt_array($ch, [
            CURLOPT_FILE => $fp,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_USERAGENT => 'IDEA-Media-Mirror/1.0',
        ]);
        $ok = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        fclose($fp);

        if ($ok && $status >= 200 && $status < 300 && filesize($target . '.tmp') >= 128) {
            rename($target . '.tmp', $target);
        } else {
            @unlink($target . '.tmp');
        }
    }

    $local = null;
    if (is_file($target) && $mediaBase !== '') {
        $local = $mediaBase . '/' . rawurlencode($productKey) . '/' . rawurlencode($filename);
    }
    return ['source' => $url, 'local' => $local, 'sha1' => is_file($target) ? sha1_file($target) : null];
}

function upsertListing(PDO $pdo, array $source): int {
    $id = (string)($source['id'] ?? '');
    $name = trim((string)($source['name'] ?? ''));
    $url = (string)($source['productUrl'] ?? '');
    if ($id === '' || $name === '' || $url === '') return 0;

    $category = trim((string)($source['category'] ?? ''));
    $variant = variantData($url);
    $slug = 'mazloum-' . $id . '-' . slugify($name);
    $collection = inferCollection($category, $name);

    $sql = 'INSERT INTO catalog_products
        (source_id,source_record_id,slug,name,collection_slug,subcategory,product_type,material,color,dimension_text,
         price_text,compare_at_price_text,currency,primary_image_url,source_url,source_payload,approved,last_source_sync_at)
        VALUES
        ("source-13",?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
        ON DUPLICATE KEY UPDATE
          slug=VALUES(slug),name=VALUES(name),collection_slug=VALUES(collection_slug),subcategory=VALUES(subcategory),
          product_type=VALUES(product_type),material=COALESCE(VALUES(material),material),
          color=COALESCE(VALUES(color),color),dimension_text=COALESCE(VALUES(dimension_text),dimension_text),
          price_text=VALUES(price_text),compare_at_price_text=VALUES(compare_at_price_text),
          currency=COALESCE(VALUES(currency),currency),primary_image_url=COALESCE(VALUES(primary_image_url),primary_image_url),
          source_url=VALUES(source_url),source_payload=VALUES(source_payload),approved=1,last_source_sync_at=NOW()';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $id, $slug, $name, $collection, $category ?: null, $category ?: null,
        $variant['material'], $variant['color'], $variant['dimension'],
        $source['price'] ?? null, $source['previousPrice'] ?? null,
        str_contains((string)($source['price'] ?? ''), 'EGP') ? 'EGP' : null,
        $source['image'] ?? null, $url,
        json_encode($source, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        1,
    ]);

    $find = $pdo->prepare('SELECT id FROM catalog_products WHERE source_id="source-13" AND source_record_id=?');
    $find->execute([$id]);
    return (int)$find->fetchColumn();
}

function saveDetail(PDO $pdo, int $productId, array $detail, string $mediaDir, string $mediaBase): int {
    $features = [];
    foreach (($detail['features'] ?? []) as $item) {
        if (!is_array($item) || empty($item['label'])) continue;
        $features[(string)$item['label']] = (string)($item['value'] ?? '');
    }

    $material = $features['Material'] ?? null;
    $color = $features['Color'] ?? null;
    $dimension = $features['Dimension / Model'] ?? null;
    $brand = $detail['brand'] ?? null;
    $sku = $detail['sku'] ?? null;
    $availability = $detail['availability'] ?? null;

    $stmt = $pdo->prepare(
        'UPDATE catalog_products SET brand=COALESCE(?,brand),sku=COALESCE(?,sku),description=COALESCE(?,description),
         material=COALESCE(?,material),color=COALESCE(?,color),dimension_text=COALESCE(?,dimension_text),
         availability=COALESCE(?,availability),source_payload=?,last_source_sync_at=NOW() WHERE id=?'
    );
    $stmt->execute([
        $brand, $sku, $detail['description'] ?? null, $material, $color, $dimension, $availability,
        json_encode($detail, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), $productId,
    ]);

    $pdo->prepare('DELETE FROM catalog_product_attributes WHERE product_id=?')->execute([$productId]);
    $attr = $pdo->prepare(
        'INSERT INTO catalog_product_attributes(product_id,attribute_key,attribute_value,source_value,position) VALUES(?,?,?,?,?)'
    );
    $pos = 0;
    foreach ($features as $key => $value) {
        if ($value === '') continue;
        $attr->execute([$productId, $key, $value, $value, $pos++]);
    }

    $pdo->prepare('DELETE FROM catalog_product_images WHERE product_id=?')->execute([$productId]);
    $imgStmt = $pdo->prepare(
        'INSERT INTO catalog_product_images(product_id,source_url,local_url,position,checksum_sha1) VALUES(?,?,?,?,?)'
    );

    $mirrored = 0;
    foreach (array_values(array_unique($detail['gallery'] ?? [])) as $position => $url) {
        if (!is_string($url) || $url === '') continue;
        $stored = mirrorImage($url, 'source-13-' . $productId, $position, $mediaDir, $mediaBase);
        $imgStmt->execute([$productId, $stored['source'], $stored['local'], $position, $stored['sha1']]);
        if ($stored['local']) $mirrored++;
    }

    $primary = $pdo->prepare(
        'SELECT COALESCE(local_url,source_url) FROM catalog_product_images WHERE product_id=? ORDER BY position,id LIMIT 1'
    );
    $primary->execute([$productId]);
    $primaryUrl = $primary->fetchColumn();
    if ($primaryUrl) {
        $pdo->prepare('UPDATE catalog_products SET primary_image_url=? WHERE id=?')->execute([$primaryUrl, $productId]);
    }
    return $mirrored;
}

$run = $pdo->prepare('INSERT INTO catalog_sync_runs(source_id,status) VALUES("source-13","running")');
$run->execute();
$runId = (int)$pdo->lastInsertId();

$seen = 0;
$updated = 0;
$mirrored = 0;
$errors = [];

try {
    $first = jsonGet($listingApi . '?page=1');
    if (!$first || empty($first['ok'])) throw new RuntimeException('Listing discovery failed.');

    $totalPages = max(1, min(100, (int)($first['totalPages'] ?? 1)));
    for ($page = 1; $page <= $totalPages; $page++) {
        $payload = $page === 1 ? $first : jsonGet($listingApi . '?page=' . $page);
        if (!$payload || empty($payload['ok'])) {
            $errors[] = 'Listing page ' . $page . ' failed';
            continue;
        }
        foreach (($payload['products'] ?? []) as $source) {
            $seen++;
            $productId = upsertListing($pdo, $source);
            if ($productId > 0) $updated++;
        }
    }

    if ($detailBatch > 0) {
        $candidates = $pdo->query(
            'SELECT id,source_url FROM catalog_products
             WHERE source_id="source-13" AND approved=1
               AND (brand IS NULL OR brand="" OR primary_image_url IS NULL OR primary_image_url="")
             ORDER BY updated_at DESC LIMIT ' . $detailBatch
        )->fetchAll();

        foreach ($candidates as $candidate) {
            $detail = jsonGet($detailApi . rawurlencode($candidate['source_url']), 2);
            if (!$detail || empty($detail['ok'])) continue;
            $mirrored += saveDetail($pdo, (int)$candidate['id'], $detail, $mediaDir, $mediaBase);
        }
    }

    $status = $errors ? 'partial' : 'success';
    $finish = $pdo->prepare(
        'UPDATE catalog_sync_runs SET status=?,products_seen=?,products_updated=?,images_mirrored=?,error_text=?,finished_at=NOW() WHERE id=?'
    );
    $finish->execute([$status, $seen, $updated, $mirrored, $errors ? implode("\n", $errors) : null, $runId]);

    echo json_encode([
        'ok' => true, 'status' => $status, 'productsSeen' => $seen,
        'productsUpdated' => $updated, 'imagesMirrored' => $mirrored, 'errors' => $errors,
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . PHP_EOL;
} catch (Throwable $e) {
    $finish = $pdo->prepare(
        'UPDATE catalog_sync_runs SET status="failed",products_seen=?,products_updated=?,images_mirrored=?,error_text=?,finished_at=NOW() WHERE id=?'
    );
    $finish->execute([$seen, $updated, $mirrored, $e->getMessage(), $runId]);
    fwrite(STDERR, $e->getMessage() . PHP_EOL);
    exit(1);
}
