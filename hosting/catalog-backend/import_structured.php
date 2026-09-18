<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
$config = ideaCatalogConfig();

$importDir = __DIR__ . '/imports';
$files = glob($importDir . '/source-*.json') ?: [];
if (!$files) {
    fwrite(STDERR, "No structured source snapshots found.\n");
    exit(2);
}

$pdo = new PDO($config['db_dsn'], $config['db_user'], $config['db_password'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);

function cleanText(?string $value): ?string {
    if ($value === null) return null;
    $value = trim(html_entity_decode(strip_tags($value), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    $value = preg_replace('/\s+/u', ' ', $value) ?: $value;
    return $value === '' ? null : $value;
}

function slugifySource(string $value): string {
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?: 'product';
    return trim($value, '-');
}

function attrMap(array $row): array {
    $map = [];
    foreach (($row['attributes'] ?? []) as $attr) {
        if (!is_array($attr)) continue;
        $name = cleanText((string)($attr['name'] ?? $attr['label'] ?? ''));
        if (!$name) continue;
        $terms = $attr['terms'] ?? $attr['options'] ?? $attr['value'] ?? [];
        if (is_array($terms)) {
            $vals = [];
            foreach ($terms as $term) {
                if (is_array($term)) $term = $term['name'] ?? $term['value'] ?? null;
                if ($term !== null && trim((string)$term) !== '') $vals[] = trim((string)$term);
            }
            $value = implode(', ', array_values(array_unique($vals)));
        } else {
            $value = cleanText((string)$terms) ?? '';
        }
        if ($value !== '') $map[$name] = $value;
    }

    foreach (($row['options'] ?? []) as $opt) {
        if (!is_array($opt)) continue;
        $name = cleanText((string)($opt['name'] ?? ''));
        if (!$name) continue;
        $values = $opt['values'] ?? [];
        $value = is_array($values) ? implode(', ', array_map('strval', $values)) : (string)$values;
        if (trim($value) !== '') $map[$name] = trim($value);
    }
    return $map;
}

function findAttr(array $attrs, array $needles): ?string {
    foreach ($attrs as $key => $value) {
        $k = mb_strtolower($key, 'UTF-8');
        foreach ($needles as $needle) {
            if (str_contains($k, mb_strtolower($needle, 'UTF-8'))) return $value;
        }
    }
    return null;
}

function inferCollectionSource(array $row, array $attrs): string {
    $parts = [
        $row['category'] ?? '',
        implode(' ', array_map(fn($x) => is_array($x) ? ($x['name'] ?? '') : (string)$x, $row['categories'] ?? [])),
        $row['name'] ?? '',
        implode(' ', array_keys($attrs)),
        implode(' ', array_values($attrs)),
    ];
    $text = mb_strtolower(implode(' ', $parts), 'UTF-8');

    if (preg_match('/bathtub|bath tub|jacuzzi|بانيو/u', $text)) return 'bathtubs';
    if (preg_match('/faucet|mixer|tap|خلاط|حنفية/u', $text)) return 'faucets';
    if (preg_match('/shower|دش|شاور/u', $text)) return 'shower-units';
    if (preg_match('/basin|toilet|wc|sanitary|حوض|مرحاض|تواليت|صحى|صحي/u', $text)) return 'sanitary-ware';
    if (preg_match('/vanity|bathroom furniture|bathroom unit|وحدة حمام|اثاث حمام|أثاث حمام/u', $text)) return 'bathroom-units';
    if (preg_match('/bathroom access|اكسسوار حمام|إكسسوار حمام/u', $text)) return 'bathroom-accessories';
    if (preg_match('/porcelain|بورسلين/u', $text)) return 'porcelain';
    if (preg_match('/ceramic|tile|سيراميك|بلاط/u', $text)) return 'ceramics';
    if (preg_match('/pipe|plumbing|سباكة|ماسورة|مواسير/u', $text)) return 'plumbing';
    if (preg_match('/lamp|lighting|chandelier|اضاءة|إضاءة|نجفة/u', $text)) return 'lighting';
    if (preg_match('/sofa|chair|table|bedroom|living room|furniture|اثاث|أثاث|كنبة|كرسي/u', $text)) return 'furniture';
    return 'home-decor';
}

function normalizePrice($value, ?int $minor = null): ?string {
    if ($value === null || $value === '') return null;
    if (is_numeric($value) && $minor !== null) {
        $number = ((float)$value) / (10 ** $minor);
        return number_format($number, $minor, '.', '');
    }
    return trim((string)$value);
}

$upsert = $pdo->prepare(
    'INSERT INTO catalog_products
    (source_id,source_record_id,slug,name,brand,sku,collection_slug,subcategory,product_type,description,material,color,
     dimension_text,price_text,compare_at_price_text,currency,availability,primary_image_url,source_url,source_payload,
     approved,last_source_sync_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,NOW())
    ON DUPLICATE KEY UPDATE
      slug=VALUES(slug),name=VALUES(name),brand=COALESCE(VALUES(brand),brand),sku=COALESCE(VALUES(sku),sku),
      collection_slug=VALUES(collection_slug),subcategory=VALUES(subcategory),product_type=VALUES(product_type),
      description=COALESCE(VALUES(description),description),material=COALESCE(VALUES(material),material),
      color=COALESCE(VALUES(color),color),dimension_text=COALESCE(VALUES(dimension_text),dimension_text),
      price_text=COALESCE(VALUES(price_text),price_text),compare_at_price_text=COALESCE(VALUES(compare_at_price_text),compare_at_price_text),
      currency=COALESCE(VALUES(currency),currency),availability=COALESCE(VALUES(availability),availability),
      primary_image_url=COALESCE(VALUES(primary_image_url),primary_image_url),source_url=VALUES(source_url),
      source_payload=VALUES(source_payload),approved=1,last_source_sync_at=NOW()'
);
$find = $pdo->prepare('SELECT id FROM catalog_products WHERE source_id=? AND source_record_id=?');
$deleteImages = $pdo->prepare('DELETE FROM catalog_product_images WHERE product_id=?');
$insertImage = $pdo->prepare(
    'INSERT INTO catalog_product_images(product_id,source_url,local_url,position,checksum_sha1) VALUES(?,?,NULL,?,NULL)'
);
$deleteAttrs = $pdo->prepare('DELETE FROM catalog_product_attributes WHERE product_id=?');
$insertAttr = $pdo->prepare(
    'INSERT INTO catalog_product_attributes(product_id,attribute_key,attribute_value,source_value,position) VALUES(?,?,?,?,?)'
);

$summary = [];
foreach ($files as $file) {
    $payload = json_decode(file_get_contents($file), true);
    if (!is_array($payload) || empty($payload['source_id']) || !is_array($payload['products'] ?? null)) continue;

    $sourceId = (string)$payload['source_id'];
    $sourceCompany = (string)($payload['source_company'] ?? $sourceId);
    $count = 0;
    $imageCount = 0;
    $pdo->beginTransaction();

    foreach ($payload['products'] as $row) {
        if (!is_array($row)) continue;
        $recordId = (string)($row['source_record_id'] ?? '');
        $name = cleanText((string)($row['name'] ?? ''));
        $url = (string)($row['product_url'] ?? '');
        if ($recordId === '' || !$name || $url === '') continue;

        $attrs = attrMap($row);
        $dimension = findAttr($attrs, ['size', 'dimension', 'dimensions', 'measure', 'مقاس', 'الأبعاد', 'ابعاد']);
        $color = findAttr($attrs, ['color', 'colour', 'لون']);
        $material = findAttr($attrs, ['material', 'خامة', 'الخامة']);
        $finish = findAttr($attrs, ['finish', 'surface', 'texture', 'تشطيب', 'ملمس']);
        if ($finish) $attrs['Finish / Surface'] = $finish;

        $minor = isset($row['currency_minor_unit']) ? (int)$row['currency_minor_unit'] : null;
        $price = normalizePrice($row['sale_price'] ?? $row['price'] ?? null, $minor);
        $oldPrice = normalizePrice($row['regular_price'] ?? $row['old_price'] ?? null, $minor);
        $description = cleanText((string)($row['description_html'] ?? $row['short_description_html'] ?? ''));
        $category = cleanText((string)($row['category'] ?? ''));
        $collection = inferCollectionSource($row, $attrs);
        $images = array_values(array_unique(array_filter(array_map('strval', $row['images'] ?? []))));
        $primary = $images[0] ?? null;
        $availability = isset($row['is_in_stock']) ? ($row['is_in_stock'] ? 'in-stock' : 'out-of-stock') : null;
        $slug = $sourceId . '-' . $recordId . '-' . slugifySource($name);

        $upsert->execute([
            $sourceId, $recordId, $slug, $name,
            cleanText((string)($row['brand'] ?? $sourceCompany)),
            cleanText((string)($row['sku'] ?? '')),
            $collection, $category, $category, $description,
            $material, $color, $dimension,
            $price, $oldPrice, cleanText((string)($row['currency'] ?? '')),
            $availability, $primary, $url,
            json_encode($row, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        ]);

        $find->execute([$sourceId, $recordId]);
        $productId = (int)$find->fetchColumn();
        if (!$productId) continue;

        $deleteImages->execute([$productId]);
        foreach ($images as $position => $image) {
            $insertImage->execute([$productId, $image, $position]);
            $imageCount++;
        }

        $deleteAttrs->execute([$productId]);
        $pos = 0;
        foreach ($attrs as $key => $value) {
            if (trim((string)$value) === '') continue;
            $insertAttr->execute([$productId, $key, (string)$value, (string)$value, $pos++]);
        }
        $count++;
    }
    $pdo->commit();
    $summary[] = ['sourceId' => $sourceId, 'productsImported' => $count, 'imageReferencesImported' => $imageCount];
}

echo json_encode(['ok' => true, 'sources' => $summary], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . PHP_EOL;
