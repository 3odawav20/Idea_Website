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
function platformAiLimit(array $u): int{
 $cfg=platformConfig();$role=$u['role']??'';
 if($role==='admin')return 0; // zero is unlimited
 elseif($role==='supplier'){accountCompany($u);$limit=5;}
 elseif($role==='buyer'){accountCustomer($u);$limit=5;}
 else accountError(403,'AI_ACCOUNT_REQUIRED');
 return $limit;
}
function platformAiQuota(array $u): array{
 $limit=platformAiLimit($u);$used=(int)accountQuery("SELECT COUNT(*) FROM idea_ai_jobs WHERE user_id=? AND state IN ('queued','processing','completed')",[$u['id']])->fetchColumn();
 return ['role'=>$u['role'],'limit'=>$limit===0?null:$limit,'used'=>$used,'remaining'=>$limit===0?null:max(0,$limit-$used),'unlimited'=>$limit===0,'period'=>'lifetime','paid_upgrade_available'=>false,'payment_configured'=>platformFeatures()['payments']['configured']];
}
function platformAiJob(array $u,string $id): array{$r=accountQuery('SELECT * FROM idea_ai_jobs WHERE id=? AND user_id=?',[$id,$u['id']])->fetch();if(!$r)accountError(404,'JOB_NOT_FOUND');$r['settings']=json_decode($r['settings'],true);return $r;}
function platformAiAction(string $a,array $d,array $u): array{
 if($a==='ai-quota')return platformAiQuota($u);
 if($a==='ai-history')return ['jobs'=>array_map(function($r){$r['settings']=json_decode($r['settings'],true);return $r;},accountQuery('SELECT * FROM idea_ai_jobs WHERE user_id=? ORDER BY created_at DESC LIMIT 50',[$u['id']])->fetchAll())];
 if($a==='ai-job'){
  $record=platformAiJob($u,accountString($d,'id',32,true));
  if($record['state']==='processing'&&!empty($record['settings']['runpod_job_id'])){
   if((int)$record['updated_at']<platformNow()-1200000){
    accountQuery("UPDATE idea_ai_jobs SET state='failed',error_code='RUNPOD_TIMEOUT',updated_at=? WHERE id=? AND state='processing'",[platformNow(),$record['id']]);
    return platformAiJob($u,$record['id']);
   }
   try{
    $response=platformRunpodStatus((string)$record['settings']['runpod_job_id']);
    $record=platformRunpodFinish(['id'=>$record['id'],'user_id'=>$u['id'],'settings'=>platformJson($record['settings'])],$response);
   }catch(Throwable $e){
    if($e instanceof IdeaAccountError&&in_array($e->getMessage(),['RUNPOD_ACCESS_DENIED','RUNPOD_INVALID_REQUEST','RUNPOD_IMAGE_HOST_UNSUPPORTED','RUNPOD_NO_IMAGE','RUNPOD_COMPOSITION_CHANGED'],true)){
     accountQuery('UPDATE idea_ai_jobs SET state=?,error_code=?,updated_at=? WHERE id=? AND state=?',['failed',$e->getMessage(),platformNow(),$record['id'],'processing']);
     return platformAiJob($u,$record['id']);
    }
    error_log('IDEA Runpod status issue: '.get_class($e));
   }
  }
  return $record;
 }
 if($a==='ai-create'){
  $limit=platformAiLimit($u);if(platformSecret('RUNPOD_API_KEY')==='')accountError(503,'RUNPOD_API_KEY_REQUIRED');accountRate('ai-create',10,3600);
  $parent=accountString($d,'parent_id',32);$room=$parent?file_get_contents(platformAiDir(platformAiJob($u,$parent)['id']).'/result.jpg'):platformAiInputImage($d,'room');if(!$room)accountError(422,'PARENT_IMAGE_UNAVAILABLE');
  $material=platformAiInputImage($d,'material');$product=accountString($d,'product_id',100);if($product!=='')platformProduct($product);
  $settings=[];foreach(['surface'=>50,'size'=>60,'grout'=>40,'angle'=>30,'roomType'=>80,'instructions'=>1200] as $key=>$len)$settings[$key]=accountString($d,$key,$len);if(!in_array($settings['surface'],['floor','walls','wall','both','الأرضية','الجدران','الحوائط','السقف','ceiling','الأرضية والحوائط','الأرضية والجدران'],true))accountError(422,'INVALID_SURFACE');
  $points=$d['points']??[];if(!is_array($points)||count($points)!==0&&count($points)!==4)accountError(422,'INVALID_SURFACE_POINTS');foreach($points as $point){if(!is_array($point)||count($point)!==2||!is_numeric($point[0])||!is_numeric($point[1])||$point[0]<0||$point[0]>1||$point[1]<0||$point[1]>1)accountError(422,'INVALID_SURFACE_POINTS');}$settings['points']=$points;
  $id=platformId();$dir=platformAiDir($id);mkdir($dir,0700,true);file_put_contents($dir.'/room.jpg',$room);file_put_contents($dir.'/material.jpg',$material);chmod($dir.'/room.jpg',0600);chmod($dir.'/material.jpg',0600);
  try{platformTransaction(function()use($u,$parent,$product,$settings,$id,$limit){accountQuery('SELECT id FROM idea_users WHERE id=?'.platformLock(),[$u['id']]);$day=platformNow()-86400000;$n=(int)accountQuery("SELECT COUNT(*) FROM idea_ai_jobs WHERE user_id=? AND state IN ('queued','processing','completed')",[$u['id']])->fetchColumn();$all=(int)accountQuery('SELECT COUNT(*) FROM idea_ai_jobs WHERE created_at>?',[$day])->fetchColumn();if($limit>0&&$n>=$limit)accountError(429,'AI_QUOTA_EXHAUSTED');if($all>=(int)(platformConfig()['ai_daily_global_limit']??100))accountError(429,'AI_DAILY_LIMIT');accountQuery('INSERT INTO idea_ai_jobs(id,user_id,parent_id,product_id,state,settings,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',[$id,$u['id'],$parent?:null,$product,'queued',platformJson($settings),platformNow(),platformNow()]);});}catch(Throwable $e){@unlink($dir.'/room.jpg');@unlink($dir.'/material.jpg');@rmdir($dir);throw $e;}return ['id'=>$id,'state'=>'queued'];
 }
 if($a==='ai-process'){
  $id=accountString($d,'id',32,true);
  $job=platformTransaction(function()use($id,$u){
   $r=accountQuery('SELECT * FROM idea_ai_jobs WHERE id=? AND user_id=?'.platformLock(),[$id,$u['id']])->fetch();
   if(!$r)accountError(404,'JOB_NOT_FOUND');
   if($r['state']!=='queued')return $r;
   accountQuery("UPDATE idea_ai_jobs SET state='processing',attempts=attempts+1,updated_at=? WHERE id=?",[platformNow(),$id]);
   $r['claimed']=true;return $r;
  });
  if(empty($job['claimed']))return ['id'=>$id,'state'=>$job['state']];
  session_write_close();$dir=platformAiDir($id);
  try{
   $settings=json_decode((string)$job['settings'],true)?:[];
   $prompt='Edit image 1 (the actual room photograph) using only image 2 (the ceramic/porcelain tile texture). Replace ONLY the explicitly selected surface. Preserve ALL furniture, fixtures, walls and windows not selected, people, reflections and camera viewpoint. Never add new furnishings or change lighting. Tile texture is not a second room. Exact original layout, perspective, aspect ratio and physical scale. Never change objects occluding the chosen surface. Manual polygon coordinates are a strict server-side protection boundary when supplied. Return one edited photograph only. Settings: '.platformJson($settings);
   $rid=platformRunpodSubmit((string)file_get_contents($dir.'/room.jpg'),(string)file_get_contents($dir.'/material.jpg'),$prompt);
   $settings['runpod_job_id']=$rid;$settings['provider']='runpod';$settings['endpoint']='qwen-image-edit-2511';
   accountQuery("UPDATE idea_ai_jobs SET settings=?,updated_at=? WHERE id=? AND state='processing'",[platformJson($settings),platformNow(),$id]);
   error_log('IDEA Runpod submitted idea_job='.$id.' runpod_job='.$rid);
   return ['id'=>$id,'state'=>'processing','runpod_job_id'=>$rid];
  }catch(Throwable $e){
   $error=$e instanceof IdeaAccountError?$e->getMessage():'RUNPOD_SUBMISSION_FAILED';
   accountQuery("UPDATE idea_ai_jobs SET state='failed',error_code=?,updated_at=? WHERE id=? AND state='processing'",[$error,platformNow(),$id]);
   if($e instanceof IdeaAccountError)throw $e;
   error_log('IDEA Runpod submission: '.get_class($e));
   accountError(502,'RUNPOD_SUBMISSION_FAILED');
  }
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