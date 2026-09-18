<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$configPath = __DIR__ . '/config.local.php';
if (!is_file($configPath)) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'Backend not configured']);
    exit;
}

$config = require $configPath;
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $config['cors_origins'] ?? [], true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

$pdo = new PDO(
    $config['db_dsn'],
    $config['db_user'],
    $config['db_pass'],
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
