<?php
declare(strict_types=1);
header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
require_once __DIR__.'/accounts-db.php';
function studioReply(array $value,int $status=200): never {http_response_code($status);header('Content-Type: application/json; charset=utf-8');echo json_encode($value,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
function studioWrite(string $path,array $value): void {$tmp=$path.'.'.bin2hex(random_bytes(4)).'.tmp';if(file_put_contents($tmp,json_encode($value,JSON_UNESCAPED_UNICODE),LOCK_EX)===false)throw new RuntimeException('write');chmod($tmp,0600);rename($tmp,$path);}
function studioImage(mixed $value): array {
 if(!is_string($value)||!preg_match('#^data:(image/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$#D',$value,$m))accountError(422,'INVALID_IMAGE');
 $bytes=base64_decode($m[2],true);if($bytes===false||strlen($bytes)>8*1024*1024)accountError(413,'IMAGE_TOO_LARGE');
 $info=@getimagesizefromstring($bytes);if(!$info||($info['mime']??'')!==$m[1]||$info[0]*$info[1]>25000000)accountError(422,'INVALID_IMAGE');return [$bytes,$m[1]];
}
try {
 $configFile=dirname($_SERVER['DOCUMENT_ROOT']).'/idea-assisted-studio-config.php';
 $cfg=is_file($configFile)?require $configFile:[];
 if(empty($cfg['enabled'])||($cfg['expires_at']??0)<time())accountError(503,'ASSISTED_UNAVAILABLE');
 $root=dirname($configFile).'/idea-assisted-studio';if(!is_dir($root)&&!mkdir($root,0700,true))throw new RuntimeException('storage');
 $u=accountUser();$admin=$u['role']==='admin';if(!$admin&&$u['role']!=='buyer')accountError(403,'CUSTOMER_ONLY');
 $action=$_GET['action']??'status';$method=$_SERVER['REQUEST_METHOD']??'GET';
 if($method==='POST')accountCsrf();
 $guard=fopen($root.'/.lock','c+');if(!$guard||!flock($guard,LOCK_EX))throw new RuntimeException('lock');
 // Only an active authenticated operator can open the queue to new requests.
 $lease=$root.'/.operator';if($action==='pending'&&$admin&&$method==='GET'){touch($lease);chmod($lease,0600);}
 $available=is_file($lease)&&filemtime($lease)>time()-900;
 if($action==='availability'&&$method==='GET')studioReply(['available'=>$available,'mode'=>'assisted','expires_at'=>$cfg['expires_at']]);
 if($action==='pending'&&$method==='GET'){
  if(!$admin)accountError(403,'ADMIN_REQUIRED');$jobs=[];
  foreach(glob($root.'/*/job.json')?:[] as $path){$j=json_decode(file_get_contents($path),true);if(!$j)continue;
   if(in_array($j['status'],['queued','processing'],true)&&($j['updated_at']??0)<time()-1200){$j['status']='failed';$j['error']='انتهت مهلة معالجة التصميم. يمكنك إعادة المحاولة.';$j['updated_at']=time();studioWrite($path,$j);}
   if(in_array($j['status'],['queued','processing'],true))$jobs[]=$j;
  }usort($jobs,fn($a,$b)=>$a['created_at']<=>$b['created_at']);studioReply(['jobs'=>$jobs,'available'=>true]);
 }
 if($action==='create'&&$method==='POST'){
  if(!$available)accountError(503,'ASSISTED_UNAVAILABLE');if((int)($_SERVER['CONTENT_LENGTH']??0)>23068672)accountError(413,'IMAGE_TOO_LARGE');
  $data=json_decode(file_get_contents('php://input',false,null,0,23068673),true);if(!is_array($data))accountError(422,'INVALID_FIELDS');
  $active=0;$today=0;$total=0;foreach(glob($root.'/*/job.json')?:[] as $path){$j=json_decode(file_get_contents($path),true);if(!$j)continue;if($j['created_at']>time()-86400){$total++;if($j['user_id']===$u['id'])$today++;}if(in_array($j['status'],['queued','processing'],true)&&$j['user_id']===$u['id'])$active++;}
  if($active)accountError(409,'JOB_ALREADY_PENDING');if($today>=($cfg['daily_user_limit']??4)||$total>=($cfg['daily_global_limit']??12))accountError(429,'DAILY_LIMIT');
  if(!in_array($data['surface']??'', ['الأرضية','الحوائط'],true)||!in_array($data['roomType']??'', ['حمّام','غرفة معيشة','غرفة نوم','مطبخ','مساحة خارجية'],true)||!in_array($data['angle']??null,[0,45,90],true)||!preg_match('/^#[a-fA-F0-9]{6}$/D',$data['grout']??'')||!preg_match('/^[1-9]\d{0,2}(?:\.\d{1,2})? × [1-9]\d{0,2}(?:\.\d{1,2})?$/u',$data['size']??''))accountError(422,'INVALID_FIELDS');
  [$room,$roomMime]=studioImage($data['room']??null);[$material,$materialMime]=studioImage($data['material']??null);
  $id=bin2hex(random_bytes(16));$dir=$root.'/'.$id;mkdir($dir,0700);file_put_contents($dir.'/room',$room);file_put_contents($dir.'/material',$material);chmod($dir.'/room',0600);chmod($dir.'/material',0600);
  $j=['id'=>$id,'user_id'=>$u['id'],'status'=>'queued','created_at'=>time(),'updated_at'=>time(),'surface'=>$data['surface'],'roomType'=>$data['roomType'],'size'=>$data['size'],'angle'=>$data['angle'],'grout'=>$data['grout'],'materialType'=>accountString($data,'materialType',80),'room_mime'=>$roomMime,'material_mime'=>$materialMime];studioWrite($dir.'/job.json',$j);studioReply(['id'=>$id,'status'=>'queued','mode'=>'assisted'],202);
 }
 $id=$_GET['id']??'';if(!preg_match('/^[a-f0-9]{32}$/D',$id))accountError(404,'JOB_NOT_FOUND');$dir=$root.'/'.$id;$file=$dir.'/job.json';$j=is_file($file)?json_decode(file_get_contents($file),true):null;
 if(!$j||(!$admin&&$j['user_id']!==$u['id']))accountError(404,'JOB_NOT_FOUND');
 if($action==='status'&&$method==='GET')studioReply(['id'=>$id,'status'=>$j['status'],'error'=>$j['error']??null,'mode'=>'assisted','result'=>$j['status']==='complete'?'?action=result&id='.$id:null]);
 if(($action==='input'||$action==='result')&&$method==='GET'){
  $kind=$action==='result'?'result':($_GET['kind']??'');if($action==='input'&&!$admin)accountError(403,'ADMIN_REQUIRED');if(!in_array($kind,['room','material','result'],true)||!is_file($dir.'/'.$kind)||($kind==='result'&&$j['status']!=='complete'))accountError(404,'IMAGE_NOT_FOUND');
  header('Content-Type: '.$j[$kind.'_mime']);header('Content-Length: '.filesize($dir.'/'.$kind));flock($guard,LOCK_UN);session_write_close();readfile($dir.'/'.$kind);exit;
 }
 if($method==='POST'&&in_array($action,['claim','complete','fail'],true)){
  if(!$admin)accountError(403,'ADMIN_REQUIRED');if(!in_array($j['status'],['queued','processing'],true))accountError(409,'JOB_FINISHED');
  if($action==='claim'){$j['status']='processing';$j['updated_at']=time();studioWrite($file,$j);studioReply(['ok'=>true]);}
  if((int)($_SERVER['CONTENT_LENGTH']??0)>12582912)accountError(413,'IMAGE_TOO_LARGE');$data=json_decode(file_get_contents('php://input',false,null,0,12582913),true);if(!is_array($data))accountError(422,'INVALID_FIELDS');
  if($action==='complete'){[$bytes,$mime]=studioImage($data['image']??null);file_put_contents($dir.'/result.tmp',$bytes,LOCK_EX);chmod($dir.'/result.tmp',0600);rename($dir.'/result.tmp',$dir.'/result');$j['status']='complete';$j['result_mime']=$mime;}
  else {$j['status']='failed';$j['error']=accountString($data,'error',300,true);}
  $j['updated_at']=time();studioWrite($file,$j);studioReply(['ok'=>true,'status'=>$j['status']]);
 }
 accountError(405,'METHOD_NOT_ALLOWED');
}catch(IdeaAccountError $e){studioReply(['error'=>$e->getMessage()],$e->status);}catch(Throwable $e){error_log('IDEA assisted studio: '.$e->getMessage());studioReply(['error'=>'STUDIO_UNAVAILABLE'],503);}
