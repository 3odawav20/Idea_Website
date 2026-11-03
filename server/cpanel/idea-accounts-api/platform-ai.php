<?php
declare(strict_types=1);
if(realpath($_SERVER['SCRIPT_FILENAME']??'')===__FILE__){http_response_code(404);exit;}
function platformAiDir(string $id): string{if(!preg_match('/^[a-f0-9]{32}$/D',$id))accountError(422,'INVALID_JOB');return platformPrivateRoot().'/jobs/'.$id;}
function platformAiImage(string $value): string{
 if(strlen($value)>11534336||!preg_match('#^data:image/(?:png|jpeg|webp);base64,([A-Za-z0-9+/=\r\n]+)$#D',$value,$m))accountError(422,'INVALID_IMAGE');$bytes=base64_decode($m[1],true);if(!$bytes||strlen($bytes)>8388608)accountError(413,'IMAGE_TOO_LARGE');$info=@getimagesizefromstring($bytes);if(!$info||!in_array($info[2],[IMAGETYPE_JPEG,IMAGETYPE_PNG,IMAGETYPE_WEBP],true)||$info[0]*$info[1]>10000000)accountError(422,'INVALID_IMAGE');
 if(!extension_loaded('gd'))accountError(503,'GD_REQUIRED');$im=@imagecreatefromstring($bytes);if(!$im)accountError(422,'INVALID_IMAGE');ob_start();imagejpeg($im,null,94);$result=ob_get_clean();imagedestroy($im);return $result;
}
function platformAiInputImage(array $data,string $key): string{
 $value=$data[$key]??null;if(!is_string($value))accountError(422,'INVALID_IMAGE');return platformAiImage($value);
}
function platformAiServeInput(): never{
 $id=$_GET['id']??'';$asset=$_GET['asset']??'';$expires=$_GET['expires']??'';$sig=$_GET['sig']??'';if(!is_string($id)||!preg_match('/^[a-f0-9]{32}$/D',$id)||!in_array($asset,['room','material'],true)||!is_string($expires)||!ctype_digit($expires)||!is_string($sig)||!preg_match('/^[a-f0-9]{64}$/D',$sig))accountError(404,'IMAGE_UNAVAILABLE');$expiry=(int)$expires;if($expiry<time()||$expiry>time()+600||!hash_equals(hash_hmac('sha256',$id.'|'.$asset.'|'.$expiry,platformSecret('RUNPOD_API_KEY')),$sig))accountError(404,'IMAGE_UNAVAILABLE');$path=platformAiDir($id).'/'.$asset.'.jpg';if(!is_file($path))accountError(404,'IMAGE_UNAVAILABLE');header('Content-Type: image/jpeg');header('Cache-Control: private, no-store, max-age=0');header('Content-Length: '.filesize($path));readfile($path);exit;
}
function platformAiSignedInputUrl(string $id,string $asset): string{
 $expires=time()+300;$sig=hash_hmac('sha256',$id.'|'.$asset.'|'.$expires,platformSecret('RUNPOD_API_KEY'));$base=rtrim((string)(accountConfig()['site_url']??''),'/');if(!preg_match('#^https://#i',$base))accountError(503,'SITE_URL_REQUIRED');$api=rtrim(str_replace('\\','/',dirname($_SERVER['SCRIPT_NAME'])),'/').'/platform.php';return $base.$api.'?action=ai-input&id='.$id.'&asset='.$asset.'&expires='.$expires.'&sig='.$sig;
}
function platformAiRunpodDownload(string $url): string{
 $p=parse_url($url);if(!is_array($p)||($p['scheme']??'')!=='https'||strtolower($p['host']??'')!=='image.runpod.ai'||isset($p['user'])||isset($p['pass']))accountError(502,'RUNPOD_IMAGE_URL_INVALID');if(PHP_SAPI==='cli-server'&&isset($GLOBALS['IDEA_PLATFORM_TEST_DOWNLOAD']))$bytes=($GLOBALS['IDEA_PLATFORM_TEST_DOWNLOAD'])($url);else{if(!extension_loaded('curl'))accountError(503,'CURL_REQUIRED');$c=curl_init($url);$bytes='';curl_setopt_array($c,[CURLOPT_RETURNTRANSFER=>false,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>12,CURLOPT_TIMEOUT=>45,CURLOPT_WRITEFUNCTION=>function($ch,$chunk)use(&$bytes){if(strlen($bytes)+strlen($chunk)>25000000)return 0;$bytes.=$chunk;return strlen($chunk);}]);$ok=curl_exec($c);$code=(int)curl_getinfo($c,CURLINFO_RESPONSE_CODE);$err=curl_errno($c);curl_close($c);if($ok===false||$err||$code!==200||!$bytes)accountError(502,'RUNPOD_IMAGE_DOWNLOAD_FAILED');}if(!$bytes)accountError(502,'RUNPOD_IMAGE_DOWNLOAD_FAILED');$info=@getimagesizefromstring($bytes);if(!$info||!in_array($info[2],[IMAGETYPE_JPEG,IMAGETYPE_PNG,IMAGETYPE_WEBP],true)||$info[0]*$info[1]>16000000)accountError(502,'RUNPOD_IMAGE_INVALID');if(!extension_loaded('gd'))accountError(503,'GD_REQUIRED');$im=@imagecreatefromstring($bytes);if(!$im)accountError(502,'RUNPOD_IMAGE_INVALID');ob_start();imagejpeg($im,null,94);$out=ob_get_clean();imagedestroy($im);return $out;
}
function platformAiLimit(array $u): ?int{
 $role=$u['role']??'';
 if($role==='admin')return null;
 elseif($role==='supplier'){accountCompany($u);$limit=5;}
 elseif($role==='buyer'){accountCustomer($u);$limit=5;}
 else accountError(403,'AI_ACCOUNT_REQUIRED');
 return $limit;
}
function platformAiQuota(array $u): array{
 $limit=platformAiLimit($u);
 $used=(int)accountQuery("SELECT COUNT(*) FROM idea_ai_jobs WHERE user_id=? AND state IN ('queued','processing','completed') AND settings NOT LIKE ?",[$u['id'],'%"quota_companion":true%'])->fetchColumn();
 return ['role'=>$u['role'],'unlimited'=>$limit===null,'limit'=>$limit,'used'=>$used,
   'remaining'=>$limit===null?null:max(0,$limit-$used),
   'period'=>'lifetime','resets_at'=>null,
   'paid_upgrade_available'=>false,'payment_configured'=>platformFeatures()['payments']['configured']];
}

/** Only byte-encoded image output is accepted: no untrusted remote download URL. */
function platformAiDecodedOutput(mixed $value): string{
 if(!is_string($value)||$value===''||strlen($value)>27000000)accountError(502,'RUNPOD_OUTPUT_INVALID');
 $payload=$value;
 if(str_starts_with($value,'data:')){
  if(!preg_match('#^data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/=\r\n]+)$#D',$value,$m))accountError(502,'RUNPOD_OUTPUT_INVALID');
  $payload=$m[2];
 }
 $bytes=base64_decode($payload,true);
 if(!is_string($bytes)||strlen($bytes)<100||strlen($bytes)>20000000)accountError(502,'RUNPOD_OUTPUT_INVALID');
 $info=@getimagesizefromstring($bytes);
 if(!$info||!in_array($info[2],[IMAGETYPE_PNG,IMAGETYPE_JPEG,IMAGETYPE_WEBP],true)
   ||$info[0]*$info[1]>12000000)accountError(502,'RUNPOD_OUTPUT_INVALID');
 return $bytes;
}
/** Composites only pixels explicitly marked white by the returned edit mask.
 * Any furniture/doors/objects masked black stay from the original room.
 */
function platformAiVerifiedMaskComposite(string $room,string $edited,string $mask): string{
 if(!extension_loaded('gd'))accountError(503,'GD_REQUIRED');
 $a=@imagecreatefromstring($room);$b=@imagecreatefromstring($edited);$m=@imagecreatefromstring($mask);
 if(!$a||!$b||!$m)accountError(502,'RUNPOD_INVALID_MASK');
 $width=imagesx($a);$height=imagesy($a);
 if($width<256||$height<256||$width*$height>12000000
   ||imagesx($b)!==$width||imagesy($b)!==$height||imagesx($m)!==$width||imagesy($m)!==$height)
  accountError(502,'RUNPOD_DIMENSIONS_CHANGED');
 $approved=0;
 for($y=0;$y<$height;$y++){
  for($x=0;$x<$width;$x++){
   $rgb=imagecolorat($m,$x,$y);
   $red=($rgb>>16)&255;$green=($rgb>>8)&255;$blue=$rgb&255;
   if($red>=248&&$green>=248&&$blue>=248){
    imagesetpixel($a,$x,$y,imagecolorat($b,$x,$y));$approved++;
   }
  }
 }
 if($approved===0||$approved>=$width*$height)accountError(502,'RUNPOD_MASK_UNSAFE');
 ob_start();imagejpeg($a,null,94);$final=ob_get_clean();
 imagedestroy($a);imagedestroy($b);imagedestroy($m);
 if(!is_string($final)||!$final)accountError(503,'IMAGE_EXPORT_FAILED');
 return $final;
}
function platformAiJob(array $u,string $id): array{$r=accountQuery('SELECT * FROM idea_ai_jobs WHERE id=? AND user_id=?',[$id,$u['id']])->fetch();if(!$r)accountError(404,'JOB_NOT_FOUND');$r['settings']=json_decode($r['settings'],true);return $r;}


/** HTTPS-only status check; bounded response; does not assume platformHttp GET support. */
function platformAiProviderStatus(string $endpoint,string $jobId): array{
 if(!extension_loaded('curl'))accountError(503,'CURL_REQUIRED');
 $c=curl_init('https://api.runpod.ai/v2/'.$endpoint.'/status/'.rawurlencode($jobId));
 $bytes='';
 curl_setopt_array($c,[
  CURLOPT_RETURNTRANSFER=>false,
  CURLOPT_FOLLOWLOCATION=>false,
  CURLOPT_CONNECTTIMEOUT=>9,CURLOPT_TIMEOUT=>25,
  CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,
  CURLOPT_HTTPHEADER=>['Authorization: Bearer '.platformSecret('RUNPOD_API_KEY'),'Accept: application/json'],
  CURLOPT_WRITEFUNCTION=>static function($handle,string $chunk)use(&$bytes): int{
   if(strlen($bytes)+strlen($chunk)>55000000)return 0;
   $bytes.=$chunk;return strlen($chunk);
  },
 ]);
 $ok=curl_exec($c);$status=(int)curl_getinfo($c,CURLINFO_RESPONSE_CODE);
 curl_close($c);
 if($ok===false)return [0,null];
 return [$status,json_decode($bytes,true)];
}

/** Runpod queue polling: no PHP request has to await full image generation. */
function platformAiPollJob(array $u,string $id): array{
 $job=platformAiJob($u,$id);
 if(($job['state']??'')!=='processing')return $job;
 $settings=is_array($job['settings']??null)?$job['settings']:[];
 $providerId=$settings['_runpod_job_id']??null;
 if(!is_string($providerId)||!preg_match('/^[A-Za-z0-9_-]{8,128}$/D',$providerId)){
  if((int)($job['updated_at']??0)>0 && (int)$job['updated_at']<platformNow()-180000){
   accountQuery("UPDATE idea_ai_jobs SET state='failed',error_code='RUNPOD_SUBMISSION_INTERRUPTED',updated_at=? WHERE id=? AND user_id=? AND state='processing'",
     [platformNow(),$id,$u['id']]);
   return platformAiJob($u,$id);
  }
  return $job;
 }
 $endpoint=platformSecret('RUNPOD_ENDPOINT_ID');
 if(!is_string($endpoint)||!preg_match('/^[A-Za-z0-9_-]{3,120}$/D',$endpoint)
   ||platformSecret('RUNPOD_WORKER_CONTRACT')!=='idea-qwen-mask-v1')
   accountError(503,'RUNPOD_WORKER_NOT_VERIFIED');
 [$code,$response]=platformAiProviderStatus($endpoint,$providerId);
 if($code!==200||!is_array($response))return $job;
 $status=strtoupper((string)($response['status']??''));
 if(in_array($status,['IN_QUEUE','IN_PROGRESS'],true))return $job;
 if($status==='COMPLETED'){
  try{
  $out=$response['output']??null;
  if(!is_array($out))accountError(502,'RUNPOD_NO_VERIFIED_OUTPUT');
  $dir=platformAiDir($id);
  $room=@file_get_contents($dir.'/room.jpg');
  if(!is_string($room)||!$room)accountError(503,'ROOM_IMAGE_UNAVAILABLE');
  $edited=platformAiDecodedOutput($out['image']??$out['edited_image']??null);
  $mask=platformAiDecodedOutput($out['mask']??$out['edit_mask']??null);
  $result=platformAiVerifiedMaskComposite($room,$edited,$mask);
  if(!empty($settings['points']))$result=platformAiComposite($room,$result,$settings['points']);
  if(file_put_contents($dir.'/result.jpg',$result,LOCK_EX)===false)accountError(503,'STORAGE_UNAVAILABLE');
  @chmod($dir.'/result.jpg',0600);
  accountQuery("UPDATE idea_ai_jobs SET state='completed',error_code='',updated_at=? WHERE id=? AND user_id=? AND state='processing'",
    [platformNow(),$id,$u['id']]);
  return platformAiJob($u,$id);
  }catch(Throwable $e){
    accountQuery("UPDATE idea_ai_jobs SET state='failed',error_code='RUNPOD_VERIFICATION_FAILED',updated_at=? WHERE id=? AND user_id=? AND state='processing'",
      [platformNow(),$id,$u['id']]);
    if($e instanceof IdeaAccountError)throw $e;
    accountError(502,'RUNPOD_VERIFICATION_FAILED');
  }
 }
 if(in_array($status,['FAILED','CANCELLED','TIMED_OUT'],true)){
  accountQuery("UPDATE idea_ai_jobs SET state='failed',error_code='RUNPOD_GENERATION_FAILED',updated_at=? WHERE id=? AND user_id=? AND state='processing'",
    [platformNow(),$id,$u['id']]);
  return platformAiJob($u,$id);
 }
 return $job;
}

function platformAiAction(string $a,array $d,array $u): array{
 if($a==='ai-quota')return platformAiQuota($u);
 if($a==='ai-history')return ['jobs'=>array_map(function($r){$r['settings']=json_decode($r['settings'],true);return $r;},accountQuery('SELECT * FROM idea_ai_jobs WHERE user_id=? ORDER BY created_at DESC LIMIT 50',[$u['id']])->fetchAll())];
 if($a==='ai-job')return platformAiPollJob($u,accountString($d,'id',32,true));
 if($a==='ai-create'){
  $limit=platformAiLimit($u);if(!platformSecret('RUNPOD_API_KEY')||!platformSecret('RUNPOD_ENDPOINT_ID')||platformSecret('RUNPOD_WORKER_CONTRACT')!=='idea-qwen-mask-v1')accountError(503,'RUNPOD_API_KEY_REQUIRED');if(platformSecret('RUNPOD_ENDPOINT_ID')==='qwen-image-edit-2511')accountError(503,'RUNPOD_MASK_WORKER_REQUIRED');accountRate('ai-create',10,3600);
  $parent=accountString($d,'parent_id',32);$room=platformAiInputImage($d,'room');if(!$room)accountError(422,'PARENT_IMAGE_UNAVAILABLE');
  $material=platformAiInputImage($d,'material');$product=accountString($d,'product_id',100);if($product!=='')platformProduct($product);
  $settings=[];foreach(['surface'=>50,'size'=>60,'grout'=>40,'angle'=>30,'roomType'=>80,'instructions'=>1200] as $key=>$len)$settings[$key]=accountString($d,$key,$len);if(!in_array($settings['surface'],['floor','walls','wall','both','الأرضية','الجدران','الحوائط'],true))accountError(422,'INVALID_SURFACE');
  $points=$d['points']??[];if(!is_array($points)||count($points)!==0&&count($points)!==4)accountError(422,'INVALID_SURFACE_POINTS');foreach($points as $point){if(!is_array($point)||count($point)!==2||!is_numeric($point[0])||!is_numeric($point[1])||$point[0]<0||$point[0]>1||$point[1]<0||$point[1]>1)accountError(422,'INVALID_SURFACE_POINTS');}$settings['points']=$points;
  $id=platformId();$dir=platformAiDir($id);mkdir($dir,0700,true);file_put_contents($dir.'/room.jpg',$room);file_put_contents($dir.'/material.jpg',$material);chmod($dir.'/room.jpg',0600);chmod($dir.'/material.jpg',0600);
  try{platformTransaction(function()use($u,$parent,$product,$settings,$id,$limit){accountQuery('SELECT id FROM idea_users WHERE id=?'.platformLock(),[$u['id']]);$now=platformNow();$n=(int)accountQuery("SELECT COUNT(*) FROM idea_ai_jobs WHERE user_id=? AND state IN ('queued','processing','completed') AND settings NOT LIKE ?",[$u['id'],'%"quota_companion":true%'])->fetchColumn();$all=(int)accountQuery('SELECT COUNT(*) FROM idea_ai_jobs WHERE created_at>?',[$now-86400000])->fetchColumn();if($parent===''&&$limit!==null&&$n>=$limit)accountError(429,'AI_SUBSCRIPTION_REQUIRED');if($all>=(int)(platformConfig()['ai_daily_global_limit']??100))accountError(429,'AI_DAILY_LIMIT');
   if($parent!==''){$source=accountQuery('SELECT id,state,settings,created_at FROM idea_ai_jobs WHERE id=? AND user_id=?'.platformLock(),[$parent,$u['id']])->fetch();$sourceSettings=$source?json_decode($source['settings'],true):null;if(!$source||$source['state']!=='completed'||$source['created_at']<$now-600000||!in_array($sourceSettings['surface']??'',['floor','الأرضية'],true)||!in_array($settings['surface'],['walls','wall','الجدران','الحوائط'],true)||accountQuery('SELECT id FROM idea_ai_jobs WHERE parent_id=? LIMIT 1',[$parent])->fetch())accountError(422,'INVALID_COMBINED_SURFACE');$settings['quota_companion']=true;}
   accountQuery('INSERT INTO idea_ai_jobs(id,user_id,parent_id,product_id,state,settings,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',[$id,$u['id'],$parent?:null,$product,'queued',platformJson($settings),$now,$now]);});}catch(Throwable $e){@unlink($dir.'/room.jpg');@unlink($dir.'/material.jpg');@rmdir($dir);throw $e;}return ['id'=>$id,'state'=>'queued'];
 }
 if($a==='ai-process'){
  $id=accountString($d,'id',32,true);$job=platformTransaction(function()use($id,$u){$r=accountQuery('SELECT * FROM idea_ai_jobs WHERE id=? AND user_id=?'.platformLock(),[$id,$u['id']])->fetch();if(!$r)accountError(404,'JOB_NOT_FOUND');if($r['state']!=='queued')return $r;accountQuery("UPDATE idea_ai_jobs SET state='processing',attempts=attempts+1,updated_at=? WHERE id=?",[platformNow(),$id]);$r['claimed']=true;return $r;});if(empty($job['claimed']))return ['id'=>$id,'state'=>$job['state']];
  session_write_close();ignore_user_abort(true);@set_time_limit(50);$dir=platformAiDir($id);
  try{
   $s=json_decode($job['settings'],true);if($job['parent_id']){$parent=platformAiJob($u,$job['parent_id']);$source=platformAiDir($parent['id']).'/result.jpg';if($parent['state']!=='completed'||!is_file($source))accountError(422,'PARENT_IMAGE_UNAVAILABLE');$room=file_get_contents($source);if(file_put_contents($dir.'/room.jpg',$room,LOCK_EX)===false)accountError(503,'STORAGE_UNAVAILABLE');}else $room=file_get_contents($dir.'/room.jpg');$target=match($s['surface']??''){ 'floor','الأرضية'=>'floor only','walls','wall','الجدران','الحوائط'=>'walls only','ceiling','السقف'=>'ceiling only','both','الأرضية والحوائط','الأرضية والجدران'=>'floor and walls only',default=>'the explicitly selected surface only'};$prompt='Edit IMAGE 1, an interior photograph. IMAGE 2 is the ceramic tile face. Replace ONLY the selected surface: '.$target.'. WALLS means VERTICAL WALL FACES only, never the ceiling, floor, mantel, hearth or furniture. FLOOR means only the walkable floor, never walls or ceiling. Keep the ceiling, all unselected surfaces, sofa, table, fireplace opening, lighting, glass, plants and every other object unchanged. Do NOT redesign the room or add objects. Use the actual tile motif from IMAGE 2 in perspective, without inventing veins. Keep the same camera, composition and aspect ratio. Design settings: '.platformJson(['surface'=>$s['surface'],'tile_size_cm'=>$s['size'],'angle'=>$s['angle'],'grout'=>$s['grout']]);
   // Qwen edit worker is mandatory; all alternate providers are disabled.
   $endpoint=platformSecret('RUNPOD_ENDPOINT_ID');
   if(!is_string($endpoint)||!preg_match('/^[A-Za-z0-9_-]{3,120}$/D',$endpoint)
      ||platformSecret('RUNPOD_WORKER_CONTRACT')!=='idea-qwen-mask-v1')
      accountError(503,'RUNPOD_WORKER_NOT_VERIFIED');
   $roomInfo=@getimagesizefromstring($room);
   if(!$roomInfo||$roomInfo[0]*$roomInfo[1]>12000000)accountError(422,'ROOM_IMAGE_INVALID');
   $payload=['input'=>[
     'contract'=>'idea-qwen-mask-v1','model'=>'Qwen/Qwen-Image-Edit-2511',
     'prompt'=>$prompt,
     'original_image'=>'data:image/jpeg;base64,'.base64_encode($room),
     'material_reference'=>'data:image/jpeg;base64,'.base64_encode(file_get_contents($dir.'/material.jpg')),
     'target_surface'=>in_array($s['surface']??'',['floor','الأرضية'],true)?'floor':(in_array($s['surface']??'',['wall','walls','الجدران','الحوائط'],true)?'walls':'both'),
     'output_width'=>$roomInfo[0],'output_height'=>$roomInfo[1],
     'return_edit_mask'=>true,'preserve_unmasked_pixels'=>true,
     'product'=>['id'=>$job['product_id'],'tile_size'=>$s['size']??null],
   ]];
   // Submit and store provider ID; clients poll ai-job for completion.
   [$code,$response]=platformHttp('https://api.runpod.ai/v2/'.$endpoint.'/run',
     ['Content-Type: application/json','Authorization: Bearer '.platformSecret('RUNPOD_API_KEY')],
     $payload,'POST',45);
   $providerId=is_array($response)?($response['id']??null):null;
   if(!in_array($code,[200,201,202],true)||!is_string($providerId)
       ||!preg_match('/^[A-Za-z0-9_-]{8,128}$/D',$providerId))
     accountError(502,$code===429?'RUNPOD_RATE_LIMIT':'RUNPOD_QUEUE_REJECTED');
   $s['_runpod_job_id']=$providerId;
   accountQuery("UPDATE idea_ai_jobs SET settings=?,updated_at=? WHERE id=? AND user_id=?",
     [platformJson($s),platformNow(),$id,$u['id']]);
   return ['id'=>$id,'state'=>'processing','adapter_revision'=>'20261103-runpod-qwen-async-v1'];
  }catch(Throwable $e){$error=$e instanceof IdeaAccountError?$e->getMessage():'GENERATION_FAILED';accountQuery("UPDATE idea_ai_jobs SET state='failed',error_code=?,updated_at=? WHERE id=?",[$error,platformNow(),$id]);if($e instanceof IdeaAccountError)throw $e;accountError(502,'GENERATION_FAILED');}
 }
 accountError(404,'UNKNOWN_ACTION');
}
function platformAiDownload(array $u,string $id): never{$job=platformAiJob($u,$id);$path=platformAiDir($id).'/result.jpg';if($job['state']!=='completed'||!is_file($path))accountError(404,'IMAGE_NOT_READY');header('Content-Type: image/jpeg');header('Content-Disposition: inline; filename="IDEA-design-'.$id.'.jpg"');header('Content-Length: '.filesize($path));session_write_close();readfile($path);exit;}

// Optional manually selected surface: hard preservation outside that polygon.
// This does not invent a segmentation mask for an automatic edit.
function platformAiComposite(string $room,string $edited,array $points): string{
 $base=imagecreatefromstring($room);$result=imagecreatefromstring($edited);$w=imagesx($base);$h=imagesy($base);$scaled=imagescale($result,$w,$h,IMG_BICUBIC_FIXED);imagedestroy($result);$mask=imagecreatetruecolor($w,$h);$coords=[];foreach($points as $p){$coords[]=(int)round($p[0]*($w-1));$coords[]=(int)round($p[1]*($h-1));}imagefilledpolygon($mask,$coords,0xffffff);
 for($y=0;$y<$h;$y++)for($x=0;$x<$w;$x++)if(imagecolorat($mask,$x,$y)===0xffffff)imagesetpixel($base,$x,$y,imagecolorat($scaled,$x,$y));ob_start();imagejpeg($base,null,96);$output=ob_get_clean();imagedestroy($base);imagedestroy($scaled);imagedestroy($mask);return $output;
}
