<?php
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require __DIR__.'/../public/api/platform-core.php';require __DIR__.'/../public/api/platform-mail.php';
$path=getenv('IDEA_ACCOUNTS_CONFIG');if(!$path)throw new RuntimeException('Set private IDEA_ACCOUNTS_CONFIG');$_SERVER['DOCUMENT_ROOT']=dirname($path).'/public_html';
echo platformJson(platformFlushMail(20))."\n";
