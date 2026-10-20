<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
$config = ideaCatalogConfig();

$input = __DIR__ . '/imports/artceramic.json';
if (!is_file($input)) {
    fwrite(STDERR, "Missing imports/artceramic.json\n");
    exit(2);
}

$data = json_decode(file_get_contents($input), true);
if (!is_array($data)) {
    fwrite(STDERR, "Invalid Art Ceramic JSON\n");
    exit(2);
}

$pdo = new PDO($config['db_dsn'], $config['db_user'], $config['db_password'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);

function slugifyArt(string $value): string {
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?: 'product';
    return trim($value, '-');
}

function collectionForArt(array $row): string {
    $types = strtolower(implode(' ', $row['types'] ?? []));
    if (str_contains($types, 'porcelain')) return 'porcelain';
    return 'ceramics';
}

$upsert = $pdo->prepare(
    'INSERT INTO catalog_products
    (source_id,source_record_id,slug,name,brand,collection_slug,subcategory,product_type,material,color,dimension_text,
     primary_image_url,source_url,source_payload,approved,last_source_sync_at)
    VALUES
    ("source-20",?,?,?,?,?,?,?,?,?,?,?,?,?,1,NOW())
    ON DUPLICATE KEY UPDATE
      slug=VALUES(slug),name=VALUES(name),brand=VALUES(brand),collection_slug=VALUES(collection_slug),
      subcategory=VALUES(subcategory),product_type=VALUES(product_type),material=VALUES(material),
      color=VALUES(color),dimension_text=VALUES(dimension_text),primary_image_url=VALUES(primary_image_url),
      source_url=VALUES(source_url),source_payload=VALUES(source_payload),approved=1,last_source_sync_at=NOW()'
);

$find = $pdo->prepare('SELECT id FROM catalog_products WHERE source_id="source-20" AND source_record_id=?');
$deleteImages = $pdo->prepare('DELETE FROM catalog_product_images WHERE product_id=?');
$insertImage = $pdo->prepare(
    'INSERT INTO catalog_product_images(product_id,source_url,local_url,position,checksum_sha1) VALUES(?,?,NULL,?,NULL)'
);
$deleteAttrs = $pdo->prepare('DELETE FROM catalog_product_attributes WHERE product_id=?');
$insertAttr = $pdo->prepare(
    'INSERT INTO catalog_product_attributes(product_id,attribute_key,attribute_value,source_value,position) VALUES(?,?,?,?,?)'
);

$count = 0;
$images = 0;
$pdo->beginTransaction();
foreach ($data as $row) {
    if (!is_array($row)) continue;
    $recordId = (string)($row['id'] ?? '');
    $name = trim((string)($row['name'] ?? ''));
    if ($recordId === '' || $name === '') continue;

    $size = trim((string)($row['size'] ?? ''));
    $color = trim((string)($row['color'] ?? ''));
    $texture = trim((string)($row['texture'] ?? ''));
    $types = array_values(array_filter(array_map('strval', $row['types'] ?? [])));
    $subcategory = $types ? implode(' / ', $types) : null;
    $primary = (string)($row['image'] ?? '');
    $sourceUrl = 'https://artceramic-egypt.com/';
    $slug = 'art-ceramic-' . $recordId . '-' . slugifyArt($name);

    $upsert->execute([
        $recordId,
        $slug,
        $name,
        'Art Ceramic',
        collectionForArt($row),
        $subcategory,
        $subcategory,
        'Ceramic',
        $color ?: null,
        $size ?: null,
        $primary ?: null,
        $sourceUrl,
        json_encode($row, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
    ]);

    $find->execute([$recordId]);
    $productId = (int)$find->fetchColumn();
    if (!$productId) continue;

    $deleteImages->execute([$productId]);
    $gallery = array_values(array_unique(array_filter(array_merge(
        $primary ? [$primary] : [],
        array_map('strval', $row['tiles'] ?? [])
    ))));
    foreach ($gallery as $position => $url) {
        $insertImage->execute([$productId, $url, $position]);
        $images++;
    }

    $deleteAttrs->execute([$productId]);
    $attrs = [
        'Size' => $size,
        'Color' => $color,
        'Color Category' => (string)($row['colorCategory'] ?? ''),
        'Texture / Finish' => $texture,
        'Usage / Type' => implode(', ', $types),
    ];
    $pos = 0;
    foreach ($attrs as $key => $value) {
        if (trim($value) === '') continue;
        $insertAttr->execute([$productId, $key, $value, $value, $pos++]);
    }
    $count++;
}
$pdo->commit();

echo json_encode([
    'ok' => true,
    'sourceId' => 'source-20',
    'productsImported' => $count,
    'imageReferencesImported' => $images,
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . PHP_EOL;
