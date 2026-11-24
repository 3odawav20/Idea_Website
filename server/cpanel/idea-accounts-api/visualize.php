<?php
declare(strict_types=1);
/**
 * IDEA Visualizer / PHP-MySQL compatibility endpoint.
 * Existing platform-ai.php remains the only source of Runpod jobs,
 * quota enforcement and verified-mask compositing.
 * Never generates a substitute image when the worker is unavailable.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
require_once __DIR__.'/platform-core.php';
require_once __DIR__.'/platform-mail.php';
require_once __DIR__.'/platform-ai.php';
require_once __DIR__.'/platform-ai-surfaces.php';

function ideaVizReply(array $payload,int $code=200): never {
  http_response_code($code);
  echo json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_INVALID_UTF8_SUBSTITUTE);
  exit;
}
function ideaVizError(int $status,string $error): never {
  ideaVizReply(['ok'=>false,'error'=>$error,'code'=>strtolower($error)],$status);
}
function ideaVizReadiness(): array {
  $endpoint=platformSecret('RUNPOD_ENDPOINT_ID');
  $configured=platformSecret('RUNPOD_API_KEY')!==''
    && preg_match('/^[A-Za-z0-9_-]{3,120}$/D',$endpoint)===1
    && $endpoint!=='qwen-image-edit-2511'
    && platformSecret('RUNPOD_WORKER_CONTRACT')==='idea-qwen-mask-v1';
  $missing=[];
  foreach(['curl','gd','fileinfo','mbstring'] as $ext) {
    if(!extension_loaded($ext))$missing[]=$ext;
  }
  $workerVerified=false;
  try {
    $workerVerified=(int)accountQuery("SELECT COUNT(*) FROM idea_ai_jobs WHERE state='completed' AND updated_at>=? AND settings LIKE ?",
      [platformNow()-86400000,'%provider_jobs%'])->fetchColumn()>0;
  } catch(Throwable $error) { /* Keep status conservative if job history cannot be read. */ }
  return [
    'provider'=>'runpod',
    'model'=>'Qwen/Qwen-Image-Edit-2511',
    'configured'=>$configured,
    'runtime_ready'=>count($missing)===0,
    'missing_extensions'=>$missing,
    'worker_verified'=>$workerVerified,
    'integration'=>$workerVerified?'worker_verified':($configured&&count($missing)===0
      ?'configuration_present_unverified':'configuration_required'),
  ];
}
function ideaVizImageSelftest(): bool {
  if(!extension_loaded('gd')||!extension_loaded('fileinfo'))return false;
  $image=@imagecreatetruecolor(4,4);
  if($image===false)return false;
  ob_start();
  $encoded=imagepng($image);
  $png=ob_get_clean();
  imagedestroy($image);
  if(!$encoded||!is_string($png)||strlen($png)<50)return false;
  $info=@getimagesizefromstring($png);
  if(!$info||$info[0]!==4||$info[1]!==4)return false;
  $mime=(new finfo(FILEINFO_MIME_TYPE))->buffer($png);
  return $mime==='image/png';
}
function ideaVizAccount(): array {
  accountSession();
  $user=accountUser();
  if(!in_array($user['role']??'',['buyer','admin'],true))accountError(403,'AI_ACCOUNT_REQUIRED');
  return $user;
}
function ideaVizReadFile(string $name): array {
  $file=$_FILES[$name]??null;
  if(!is_array($file)||($file['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_OK)accountError(422,'IMAGE_UPLOAD_REQUIRED');
  if(!is_uploaded_file($file['tmp_name']??''))accountError(422,'IMAGE_UPLOAD_INVALID');
  $size=(int)($file['size']??0);
  if($size<1||$size>8388608)accountError(413,'IMAGE_TOO_LARGE');
  if(!extension_loaded('fileinfo'))accountError(503,'FILEINFO_REQUIRED');
  $type=(new finfo(FILEINFO_MIME_TYPE))->file((string)$file['tmp_name']);
  if(!in_array($type,['image/png','image/jpeg','image/webp'],true))accountError(422,'IMAGE_TYPE_UNSUPPORTED');
  $info=@getimagesize((string)$file['tmp_name']);
  if(!$info||$info[0]<256||$info[1]<256||$info[0]>8192||$info[1]>8192
     ||$info[0]*$info[1]>10000000)accountError(422,'IMAGE_DIMENSIONS_INVALID');
  $bytes=file_get_contents((string)$file['tmp_name']);
  if(!is_string($bytes)||strlen($bytes)!==$size)accountError(422,'IMAGE_READ_FAILED');
  return ['bytes'=>$bytes,'mime'=>$type,'width'=>$info[0],'height'=>$info[1]];
}
function ideaVizImageInput(string $name): string {
  $file=ideaVizReadFile($name);
  return 'data:'.$file['mime'].';base64,'.base64_encode($file['bytes']);
}
function ideaVizQuota(array $u): array {
  return platformAiQuota($u);
}
function ideaVizGetJob(string $id,array $user): array {
  $job=platformAiAction('ai-job',['id'=>$id],$user);
  $state=(string)($job['state']??'');
  $result=[
    'ok'=>true,'jobId'=>$id,'quota'=>ideaVizQuota($user),
    'state'=>match($state){'queued'=>'queued','processing'=>'running','completed'=>'ready',default=>'failed'},
    'stage'=>match($state){'queued'=>'queued','processing'=>'generating','completed'=>'ready',default=>'failed'},
  ];
  if($state==='completed'&&($job['settings']['edit_version']??null)===2){
    $dir=platformAiDir($id);
    if(!is_file($dir.'/result.png')||!is_file($dir.'/surface-mask.png'))accountError(502,'VERIFIED_IMAGE_MISSING');
    $result['image']='/api/visualize.php?job='.$id.'&asset=result';
    $result['maskAvailable']=true;
    $result['quality']=['dimensionsPreserved'=>true,'maskVerified'=>true,'protectedPixelsCompositedFromOriginal'=>true];
  }elseif($state==='completed'){
    // platformAiPollJob writes result.jpg after its verified-mask composite.
    $file=platformAiDir($id).'/result.jpg';
    if(!is_file($file)||filesize($file)<100||filesize($file)>20000000){
      accountError(502,'VERIFIED_IMAGE_MISSING');
    }
    $bytes=file_get_contents($file);
    $info=is_string($bytes)?@getimagesizefromstring($bytes):false;
    if(!$info||$info[2]!==IMAGETYPE_JPEG||$info[0]*$info[1]>10000000)
      accountError(502,'VERIFIED_IMAGE_UNREADABLE');
    // Existing live clients require PNG. Transcode the already verified JPEG;
    // do not modify the stored image, rerun generation, or bypass mask checks.
    $image=@imagecreatefromstring($bytes);
    if(!$image)accountError(502,'VERIFIED_IMAGE_UNREADABLE');
    ob_start();
    $encoded=imagepng($image,null,3);
    $png=ob_get_clean();
    imagedestroy($image);
    if(!$encoded||!is_string($png)||strlen($png)>42000000)
      accountError(502,'VERIFIED_IMAGE_EXPORT_FAILED');
    $result['image']='data:image/png;base64,'.base64_encode($png);
    $result['quality']=[
      'dimensionsPreserved'=>true,
      'maskVerified'=>true,
      'protectedPixelsCompositedFromOriginal'=>false,
    ];
  }elseif($state==='failed'){
    $result['error']=(string)($job['error_code']??'GENERATION_FAILED');
  }
  return $result;
}
function ideaVizServeAsset(string $id, string $asset, array $user): never {
  $job=platformAiJob($user,$id);
  if($job['state']!=='completed'||($job['settings']['edit_version']??null)!==2
     ||!in_array($asset,['result','mask'],true))accountError(404,'IMAGE_NOT_READY');
  $path=platformAiDir($id).($asset==='mask'?'/surface-mask.png':'/result.png');
  if(!is_file($path)||filesize($path)<100||filesize($path)>42000000)accountError(404,'IMAGE_NOT_READY');
  header('Content-Type: image/png');
  header('Content-Length: '.filesize($path));
  session_write_close();
  readfile($path);
  exit;
}
function ideaVizCreateSurfaceJob(string $surface, array $user): never {
  $request=accountString($_POST,'idempotencyKey',80,true);
  if(!preg_match('/^[A-Za-z0-9-]{16,80}$/D',$request))accountError(422,'INVALID_REQUEST_ID');
  $kind=accountString($_POST,'roomKind',25,true);
  if(!in_array($kind,['living','bedroom','kitchen','bathroom','office','hallway','commercial','other'],true))
    accountError(422,'INVALID_ROOM_TYPE');
  $targets=$surface==='both'?['walls','floor']:[$surface];
  $room=ideaVizReadFile('room');
  session_write_close();
  $choices=[];
  $materials=[];
  foreach($targets as $target){
    $prefix=$target.'_';
    $product=accountString($_POST,$prefix.'productId',100,true);
    $face=accountString($_POST,$prefix.'face',2,true);
    if(!ctype_digit($face)||(int)$face>30)accountError(422,'MATERIAL_FACE_UNAVAILABLE');
    $choices[$target]=platformAiSurfaceMaterial($target,$product,accountString($_POST,$prefix.'tileSize',60,true),[
      'width'=>accountString($_POST,$prefix.'tileWidth',12,true),
      'height'=>accountString($_POST,$prefix.'tileHeight',12,true),
      'rotation'=>accountString($_POST,$prefix.'rotation',2,true),
      'grout'=>accountString($_POST,$prefix.'grout',7,true),
      'area'=>accountString($_POST,$prefix.'area',1600),
    ]);
    $materials[$target]=platformAiSurfaceFace($product,(int)$face);
  }
  $id=platformAiSurfaceCreate($user,$room,$materials,$choices,$kind,$request);
  platformAiSurfaceStart($user,$id);
  ideaVizReply(ideaVizGetJob($id,$user),202);
}

try{
  $method=(string)($_SERVER['REQUEST_METHOD']??'GET');
  $action=(string)($_GET['action']??$_POST['action']??'');
  if($method==='GET'&&in_array($action,['health','capabilities'],true)){
    $ready=ideaVizReadiness();
    ideaVizReply([
      'ok'=>true,'api'=>'idea-visualize-php-mysql-v1',
      'auth'=>'IDEASESSID','image_input'=>['jpeg','png','webp'],'independent_surfaces'=>2,
      'private_assets_method'=>'POST',
      'image_codec_test_passed'=>ideaVizImageSelftest(),
      'provider'=>$ready,
    ]);
  }
  if($method==='GET'&&$action==='status'){
    $ready=ideaVizReadiness();
    $user=accountUser(false);
    $quota=$user&&in_array($user['role'],['buyer','admin'],true)?ideaVizQuota($user):null;
    ideaVizReply($ready+['ok'=>true,'quota'=>$quota]);
  }
  if($method==='GET'){
    $user=ideaVizAccount();
    $id=accountString($_GET,'job',32,true);
    if(!preg_match('/^[a-f0-9]{32}$/D',$id))accountError(422,'INVALID_JOB');
    $asset=accountString($_GET,'asset',12);
    if($asset!=='')accountError(405,'USE_POST');
    $known=platformAiJob($user,$id);
    if(($known['settings']['edit_version']??null)===2)accountError(405,'USE_POST');
    session_write_close();
    ideaVizReply(ideaVizGetJob($id,$user));
  }
  if($method!=='POST'){
    header('Allow: GET, POST');
    accountError(405,'METHOD_NOT_ALLOWED');
  }
  if((int)($_SERVER['CONTENT_LENGTH']??0)>24000000)accountError(413,'PAYLOAD_TOO_LARGE');
  $user=ideaVizAccount();
  accountCsrf();
  if(in_array($action,['job','asset'],true)){
    $id=accountString($_POST,'job',32,true);
    if(!preg_match('/^[a-f0-9]{32}$/D',$id))accountError(422,'INVALID_JOB');
    if($action==='asset')ideaVizServeAsset($id,accountString($_POST,'asset',12,true),$user);
    session_write_close();
    ideaVizReply(ideaVizGetJob($id,$user));
  }
  if($action==='cancel'){
    accountError(409,'CANCEL_VIA_RUNPOD_NOT_IMPLEMENTED');
  }
  if($action!=='create')accountError(422,'INVALID_ACTION');
  $readiness=ideaVizReadiness();
  if(!$readiness['configured'])accountError(503,'RUNPOD_NOT_CONFIGURED');
  if(!$readiness['runtime_ready'])accountError(503,'IMAGE_SERVER_DEPENDENCIES_MISSING');
  $surface=accountString($_POST,'surface',16,true);
  if(!in_array($surface,['floor','walls','both'],true))accountError(422,'INVALID_SURFACE');
  if(($_POST['editVersion']??null)==='2')ideaVizCreateSurfaceJob($surface,$user);
  $product=accountString($_POST,'productId',100,true);
  $size=accountString($_POST,'tileSize',60,true);
  $grout=accountString($_POST,'grout',40);
  $roomKind=accountString($_POST,'roomKind',80);
  $angle=accountString($_POST,'rotation',30);
  $idempotency=accountString($_POST,'idempotencyKey',80,true);
  if(!preg_match('/^[A-Za-z0-9-]{16,80}$/D',$idempotency))accountError(422,'INVALID_REQUEST_ID');
  accountSession();
  $cache=$_SESSION['idea_viz_idempotency']??[];
  if(is_array($cache)&&isset($cache[$idempotency])){
    $id=(string)$cache[$idempotency];
    ideaVizReply(ideaVizGetJob($id,$user));
  }
  $data=[
    'room'=>ideaVizImageInput('room'),
    'material'=>ideaVizImageInput('material'),
    'product_id'=>$product,'surface'=>$surface,
    'size'=>$size,'grout'=>$grout,'angle'=>$angle,
    'roomType'=>$roomKind,
    'instructions'=>'Edit only the selected surface. Preserve all protected scene pixels.',
  ];
  $created=platformAiAction('ai-create',$data,$user);
  $jobId=(string)($created['id']??'');
  if(!preg_match('/^[a-f0-9]{32}$/D',$jobId))accountError(502,'JOB_CREATION_NOT_CONFIRMED');
  if(!isset($_SESSION['idea_viz_idempotency'])||!is_array($_SESSION['idea_viz_idempotency'])){
    $_SESSION['idea_viz_idempotency']=[];
  }
  $_SESSION['idea_viz_idempotency'][$idempotency]=$jobId;
  $_SESSION['idea_viz_idempotency']=array_slice($_SESSION['idea_viz_idempotency'],-20,null,true);
  // Start the async Runpod job through the existing audited PHP/MySQL adapter.
  $queued=platformAiAction('ai-process',['id'=>$jobId],$user);
  ideaVizReply([
    'ok'=>true,'jobId'=>$jobId,
    'state'=>(string)($queued['state']??'processing'),
    'stage'=>'generating','quota'=>ideaVizQuota($user),
  ],202);
}catch(IdeaAccountError $e){
  ideaVizError($e->status,$e->getMessage());
}catch(Throwable $e){
  error_log('IDEA visualize error: '.get_class($e));
  ideaVizError(503,'VISUALIZER_UNAVAILABLE');
}
