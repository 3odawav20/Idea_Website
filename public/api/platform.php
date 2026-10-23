<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
require_once __DIR__.'/platform-core.php';require_once __DIR__.'/platform-mail.php';require_once __DIR__.'/platform-account.php';require_once __DIR__.'/platform-verification.php';require_once __DIR__.'/platform-commerce.php';require_once __DIR__.'/platform-ai.php';require_once __DIR__.'/platform-admin.php';require_once __DIR__.'/platform-payments.php';require_once __DIR__.'/platform-shipping.php';
try{
 $a=$_GET['action']??'';$method=$_SERVER['REQUEST_METHOD'];
 if(in_array($a,['payment-webhook','delivery-webhook'],true)){if($method!=='POST')accountError(405,'METHOD_NOT_ALLOWED');$raw=file_get_contents('php://input',false,null,0,524289);if(strlen($raw)>524288)accountError(413,'PAYLOAD_TOO_LARGE');$out=$a==='payment-webhook'?platformPaymentWebhook($raw):platformShippingWebhook($raw);}
 else{
  accountSession();$get=['features','variants','profile','addresses','notifications','comparisons','company-verification','admin-verifications','cart','checkout-options','orders','order','ai-history','ai-job','ai-image','ai-quota','document','admin-platform'];
  if($method==='GET'){if(!in_array($a,$get,true))accountError(405,'METHOD_NOT_ALLOWED');$d=$_GET;}
  elseif($method==='POST'){if((int)($_SERVER['CONTENT_LENGTH']??0)>24000000)accountError(413,'PAYLOAD_TOO_LARGE');accountCsrf();$d=$a==='company-document-upload'?$_POST:json_decode(file_get_contents('php://input',false,null,0,24000001),true);if(!is_array($d))accountError(400,'INVALID_JSON');}
  else accountError(405,'METHOD_NOT_ALLOWED');
  if($a==='features')$out=platformFeatures();elseif($a==='variants')$out=['variants'=>platformVariants(accountString($d,'product_id',100,true))];
  else{$u=$a==='verification-confirm'?[]:accountUser();if($a==='document')platformDownloadDocument($u,accountString($d,'id',32,true));if($a==='ai-image')platformAiDownload($u,accountString($d,'id',32,true));
   if($a==='admin-gemini-save')$out=platformSaveGeminiKey($d,$u);
   elseif(str_starts_with($a,'ai-'))$out=platformAiAction($a,$d,$u);
   elseif($a==='admin-bosta-book')$out=platformShippingBook($d,$u);
   elseif(in_array($a,['payment-start','refund-request','admin-refund-execute'],true))$out=platformPaymentAction($a,$d,$u);
   elseif(in_array($a,['admin-platform','admin-variant-save','admin-shipping-save','admin-setting-save','admin-delivery-save'],true))$out=platformAdminAction($a,$d,$u);
   elseif(str_starts_with($a,'company-')||str_starts_with($a,'admin-verification'))$out=platformVerificationAction($a,$d,$u);
   elseif(in_array($a,['cart','cart-set','checkout-options','checkout','orders','order','order-cancel-request','admin-order-state'],true))$out=platformCommerceAction($a,$d,$u);
   else $out=platformAccountAction($a,$d,$u);
  }
 }
 echo platformJson($out);
}catch(IdeaAccountError $e){http_response_code($e->status);echo json_encode(['error'=>$e->getMessage()]);}catch(Throwable $e){error_log('IDEA platform: '.get_class($e));http_response_code(500);echo json_encode(['error'=>'PLATFORM_UNAVAILABLE']);}
