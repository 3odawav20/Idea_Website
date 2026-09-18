<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$dsn = getenv('IDEA_DB_DSN') ?: '';
$dbUser = getenv('IDEA_DB_USER') ?: '';
$dbPassword = getenv('IDEA_DB_PASSWORD') ?: '';
$allowedOrigin = getenv('IDEA_CORS_ORIGIN') ?: 'https://idea-website-two.vercel.app';

if ($dsn === '' || $dbUser === '') {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'Backend not configured']);
    exit;
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === $allowedOrigin) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

$pdo = new PDO(
    $dsn,
    $dbUser,
    $dbPassword,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);

function reply(array $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

$action = $_GET['action'] ?? 'health';

if ($action === 'health') {
    reply(['ok' => true, 'service' => 'IDEA Catalog API', 'time' => gmdate('c')]);
}

if ($action === 'collections') {
    $rows = $pdo->query(
        'SELECT collection_slug, COUNT(*) product_count FROM catalog_products WHERE approved=1 GROUP BY collection_slug ORDER BY collection_slug'
    )->fetchAll();
    reply(['ok' => true, 'collections' => $rows]);
}

if ($action === 'product') {
    $id = (int)($_GET['id'] ?? 0);
    $stmt = $pdo->prepare('SELECT * FROM catalog_products WHERE id=? AND approved=1 LIMIT 1');
    $stmt->execute([$id]);
    $product = $stmt->fetch();
    if (!$product) reply(['ok' => false, 'error' => 'Product not found'], 404);
    reply(['ok' => true, 'product' => $product]);
}

if ($action === 'products') {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(100, max(1, (int)($_GET['per_page'] ?? 30)));
    $offset = ($page - 1) * $perPage;
    $where = ['approved=1'];
    $args = [];

    foreach (['source_id' => 'source', 'collection_slug' => 'collection', 'brand' => 'brand'] as $column => $key) {
        $value = trim((string)($_GET[$key] ?? ''));
        if ($value !== '') {
            $where[] = $column . '=?';
            $args[] = $value;
        }
    }

    $q = trim((string)($_GET['q'] ?? ''));
    if ($q !== '') {
        $where[] = '(name LIKE ? OR brand LIKE ? OR sku LIKE ? OR subcategory LIKE ?)';
        $needle = '%' . $q . '%';
        array_push($args, $needle, $needle, $needle, $needle);
    }

    $whereSql = implode(' AND ', $where);
    $count = $pdo->prepare('SELECT COUNT(*) FROM catalog_products WHERE ' . $whereSql);
    $count->execute($args);
    $total = (int)$count->fetchColumn();

    $sql = 'SELECT * FROM catalog_products WHERE ' . $whereSql .
        ' ORDER BY updated_at DESC,id DESC LIMIT ' . $perPage . ' OFFSET ' . $offset;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($args);

    reply([
        'ok' => true,
        'page' => $page,
        'perPage' => $perPage,
        'total' => $total,
        'totalPages' => max(1, (int)ceil($total / $perPage)),
        'products' => $stmt->fetchAll(),
    ]);
}

reply(['ok' => false, 'error' => 'Unknown action'], 404);
