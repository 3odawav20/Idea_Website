<?php
// Explicit local HTTP contract fixture; not copied into the production release.
if(PHP_SAPI!=='cli-server')exit;
$GLOBALS['IDEA_PLATFORM_TEST_HTTP']=function($url,$headers,$body,$method){
 if(str_contains($url,'generativelanguage.googleapis.com')){
  if(count($body['contents'][0]['parts']??[])!==3)throw new RuntimeException('Both image references are required');
  $fixture=__DIR__.'/../artifacts/php-platform-test/gemini-result.jpg';if(!is_file($fixture))throw new RuntimeException('Missing explicit image fixture');
  return [200,['candidates'=>[['content'=>['parts'=>[['inlineData'=>['mimeType'=>'image/jpeg','data'=>base64_encode(file_get_contents($fixture))]]]]]]]];
 }
 if($url==='https://accept.paymob.com/v1/intention/')return [201,['id'=>'fixture-intention','intention_order_id'=>random_int(100000,900000),'client_secret'=>'fixture-client-secret']];
 throw new RuntimeException('Unexpected provider fixture request');
};
$path=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);if(str_starts_with($path,'/api/')&&preg_match('#^/api/[a-z-]+\.php$#D',$path)){require __DIR__.'/../public'.$path;return true;}return false;
