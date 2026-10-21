<?php
// Local SQLite test fixture maintenance only. Not part of public_html.
$path=$argv[1]??'';$root=realpath(__DIR__.'/../artifacts');$parent=realpath(dirname($path));
if(!$root||!$parent||!str_starts_with($parent.DIRECTORY_SEPARATOR,$root.DIRECTORY_SEPARATOR)||!is_file($path))exit(1);
$db=new PDO('sqlite:'.$path);$db->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
if(($argv[2]??'')==='clear-rates')$db->exec('DELETE FROM idea_auth_attempts');
elseif(($argv[2]??'')==='used-products')echo json_encode($db->query("SELECT DISTINCT catalog_product_id FROM idea_supplier_products WHERE catalog_product_id<>''")->fetchAll(PDO::FETCH_COLUMN));
elseif(($argv[2]??'')==='admin'){$s=$db->prepare("UPDATE idea_users SET role='admin' WHERE email=?");$s->execute([$argv[3]??'']);}

elseif(($argv[2]??'')==='verified-company'){$s=$db->prepare("UPDATE idea_companies SET status='verified' WHERE id=?");$s->execute([$argv[3]??'']);}
