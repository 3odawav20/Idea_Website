<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/bootstrap.php';
$config = ideaCatalogConfig();
$dsn = $config['db_dsn'];
$dbUser = $config['db_user'];
$dbPassword = $config['db_password'];
$allowedOrigin = $config['cors_origin'];

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

if ($action === 'source-feed') {
    $page=max(1,(int)($_GET['page']??1)); $size=30; $offset=($page-1)*$size;
    $total=(int)$pdo->query('SELECT COUNT(*) FROM catalog_products WHERE approved=1 AND source_id="source-13"')->fetchColumn();
    $rows=$pdo->query('SELECT source_record_id,name,source_url,primary_image_url,subcategory,price_text,compare_at_price_text FROM catalog_products WHERE approved=1 AND source_id="source-13" ORDER BY id DESC LIMIT '.$size.' OFFSET '.$offset)->fetchAll();
    $products=array_map(static fn($r)=>[
        'id'=>$r['source_record_id'],'name'=>$r['name'],'productUrl'=>$r['source_url'],
        'image'=>$r['primary_image_url'],'category'=>$r['subcategory'],'price'=>$r['price_text'],
        'previousPrice'=>$r['compare_at_price_text'],'discount'=>null,'badges'=>[]
    ],$rows);
    reply(['ok'=>true,'page'=>$page,'pageSize'=>$size,'total'=>$total,'totalPages'=>max(1,(int)ceil($total/$size)),'products'=>$products]);
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
