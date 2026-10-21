<?php
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require __DIR__.'/../public/api/accounts-db.php';
$config=getenv('IDEA_ACCOUNTS_CONFIG');if(!$config||!is_file($config))throw new RuntimeException('Set IDEA_ACCOUNTS_CONFIG to the existing private account configuration');
$_SERVER['DOCUMENT_ROOT']=dirname($config).'/public_html';
$sql=file_get_contents(__DIR__.'/../database/mysql-platform.sql');accountDb()->exec($sql);
$version='20261021-platform-v1';if(!accountQuery('SELECT version FROM idea_schema_versions WHERE version=?',[$version])->fetch())accountQuery('INSERT INTO idea_schema_versions(version,applied_at) VALUES(?,?)',[$version,(int)(microtime(true)*1000)]);
echo "PLATFORM_MIGRATION_OK\n";
