<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

$dsn=getenv('IDEA_DB_DSN')?:''; $user=getenv('IDEA_DB_USER')?:''; $password=getenv('IDEA_DB_PASSWORD')?:'';
if($dsn===''||$user===''){http_response_code(503);echo json_encode(['ok'=>false,'error'=>'Backend not configured']);exit;}
$origin=$_SERVER['HTTP_ORIGIN']??''; $allowed=getenv('IDEA_CORS_ORIGIN')?:'https://idea-website-two.vercel.app';
if($origin===$allowed){header('Access-Control-Allow-Origin: '.$origin);header('Vary: Origin');}
$pdo=new PDO($dsn,$user,$password,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);

$url=trim((string)($_GET['url']??''));
$stmt=$pdo->prepare('SELECT * FROM catalog_products WHERE approved=1 AND source_id="source-13" AND source_url=? LIMIT 1');
$stmt->execute([$url]); $row=$stmt->fetch();
if(!$row){http_response_code(404);echo json_encode(['ok'=>false,'error'=>'Product not found']);exit;}

$images=$pdo->prepare('SELECT COALESCE(local_url,source_url) url FROM catalog_product_images WHERE product_id=? ORDER BY position,id');
$images->execute([$row['id']]); $gallery=array_column($images->fetchAll(),'url');
if(!$gallery && $row['primary_image_url'])$gallery[]=$row['primary_image_url'];

$attrs=$pdo->prepare('SELECT attribute_key label,attribute_value value FROM catalog_product_attributes WHERE product_id=? ORDER BY position,id');
$attrs->execute([$row['id']]); $features=$attrs->fetchAll();

echo json_encode([
 'ok'=>true,'sourceUrl'=>$row['source_url'],'name'=>$row['name'],'description'=>$row['description'],
 'sku'=>$row['sku'],'brand'=>$row['brand'],'gallery'=>$gallery,
 'breadcrumbs'=>array_values(array_filter([$row['collection_slug'],$row['subcategory'],$row['name']])),
 'features'=>$features,'price'=>$row['price_text'],'priceCurrency'=>$row['currency'],
 'availability'=>$row['availability'],'fetchedAt'=>$row['last_source_sync_at']
],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
