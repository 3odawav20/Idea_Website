<?php
declare(strict_types=1);
if(realpath($_SERVER['SCRIPT_FILENAME']??'')===__FILE__){http_response_code(404);exit;}

/** Runpod is the sole image inference provider used by IDEA. Keys stay on the PHP server. */
function platformRunpodEndpoint(): string {
 $id=(string)(platformConfig()['runpod_endpoint_id']??'qwen-image-edit-2511');
 if(!preg_match('/^[a-zA-Z0-9][a-zA-Z0-9-]{2,70}$/D',$id))accountError(503,'RUNPOD_ENDPOINT_INVALID');
 return 'https://api.runpod.ai/v2/'.$id;
}
function platformRunpodCall(string $path,array $body=[],string $method='POST'): array {
 $key=platformSecret('RUNPOD_API_KEY');
 if($key==='')accountError(503,'RUNPOD_API_KEY_REQUIRED');
 if(!preg_match('/^[\\x21-\\x7E]{12,500}$/D',$key))accountError(503,'RUNPOD_API_KEY_INVALID');
 [$code,$reply]=platformHttp(platformRunpodEndpoint().'/'.$path,
   ['Content-Type: application/json','Accept: application/json','Authorization: Bearer '.$key],
   $body,$method,35);
 if($code===401||$code===403)accountError(502,'RUNPOD_ACCESS_DENIED');
 if($code===429)accountError(502,'RUNPOD_RATE_LIMIT');
 if($code===400||$code===422)accountError(502,'RUNPOD_INVALID_REQUEST');
 if($code<200||$code>=300)accountError(502,'RUNPOD_PROVIDER_ERROR');
 if(!is_array($reply))accountError(502,'RUNPOD_INVALID_RESPONSE');
 return $reply;
}
function platformRunpodSubmit(string $roomJpeg,string $materialJpeg,string $prompt): string {
 // Qwen Image Edit 2511 accepts multiple reference images; actual room FIRST, swatch SECOND.
 $input=['prompt'=>$prompt,'images'=>[
   'data:image/jpeg;base64,'.base64_encode($roomJpeg),
   'data:image/jpeg;base64,'.base64_encode($materialJpeg)
 ]];
 $size=getimagesizefromstring($roomJpeg);
 if($size&&$size[0]>0&&$size[1]>0){
   $scale=min(1,1280/max($size[0],$size[1]));
   $input['width']=max(256,(int)(round($size[0]*$scale/8)*8));
   $input['height']=max(256,(int)(round($size[1]*$scale/8)*8));
 }
 $response=platformRunpodCall('run',['input'=>$input]);
 if(in_array(strtoupper((string)($response['status']??'')),['FAILED','CANCELLED'],true))accountError(502,'RUNPOD_GENERATION_FAILED');
 $id=(string)($response['id']??'');
 if(!preg_match('/^[a-zA-Z0-9_-]{4,100}$/D',$id))accountError(502,'RUNPOD_JOB_ID_MISSING');
 return $id;
}
function platformRunpodStatus(string $providerId): array {
 if(!preg_match('/^[a-zA-Z0-9_-]{4,100}$/D',$providerId))accountError(502,'RUNPOD_JOB_ID_INVALID');
 return platformRunpodCall('status/'.rawurlencode($providerId),[],'GET');
}
function platformRunpodImageBytes(array $response): string {
 $out=$response['output']??null;
 $image=is_string($out)?$out:($out['image_url']??$out['image']??$out['url']??$out['images'][0]['image_url']??$out['images'][0]['url']??$out['images'][0]??null);
 if(!is_string($image)||$image==='')accountError(502,'RUNPOD_NO_IMAGE');
 if(preg_match('#^data:image/(?:jpeg|png|webp);base64,#',$image))return platformAiImage($image);
 if(preg_match('#^[A-Za-z0-9+/=\\r\\n]{100,}$#D',$image))return platformAiImage('data:image/png;base64,'.$image);
 $parts=parse_url($image);
 $host=strtolower((string)($parts['host']??''));
 if(($parts['scheme']??'')!=='https'||!in_array($host,['image.runpod.ai','cdn.runpod.ai'],true)||!empty($parts['user'])||!empty($parts['pass']))accountError(502,'RUNPOD_IMAGE_HOST_UNSUPPORTED');
 if(!extension_loaded('curl'))accountError(503,'CURL_REQUIRED');
 $bytes='';$curl=curl_init($image);
 curl_setopt_array($curl,[CURLOPT_RETURNTRANSFER=>false,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>8,CURLOPT_TIMEOUT=>30,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,
 CURLOPT_WRITEFUNCTION=>static function($curl,$chunk)use(&$bytes){if(strlen($bytes)+strlen($chunk)>8388608)return 0;$bytes.=$chunk;return strlen($chunk);}]);
 $success=curl_exec($curl);$status=(int)curl_getinfo($curl,CURLINFO_HTTP_CODE);curl_close($curl);
 if(!$success||$status!==200||$bytes==='')accountError(502,'RUNPOD_IMAGE_DOWNLOAD_FAILED');
 $mime=@getimagesizefromstring($bytes);
 if(!$mime||!in_array($mime[2],[IMAGETYPE_JPEG,IMAGETYPE_PNG,IMAGETYPE_WEBP],true))accountError(502,'RUNPOD_INVALID_IMAGE');
 $kind=$mime[2]===IMAGETYPE_PNG?'png':($mime[2]===IMAGETYPE_WEBP?'webp':'jpeg');
 return platformAiImage('data:image/'.$kind.';base64,'.base64_encode($bytes));
}
function platformRunpodFinish(array $job,array $providerResponse): array {
 $id=$job['id'];$dir=platformAiDir($id);
 $state=strtoupper((string)($providerResponse['status']??''));
 if(in_array($state,['FAILED','CANCELLED','TIMED_OUT'],true)){
   accountQuery("UPDATE idea_ai_jobs SET state='failed',error_code='RUNPOD_GENERATION_FAILED',updated_at=? WHERE id=? AND state='processing'",[platformNow(),$id]);
   return platformAiJob(['id'=>$job['user_id']],$id);
 }
 if($state!=='COMPLETED')return platformAiJob(['id'=>$job['user_id']],$id);
 $output=platformRunpodImageBytes($providerResponse);
 $original=@getimagesize($dir.'/room.jpg');$generated=@getimagesizefromstring($output);
 if(!$original||!$generated||abs(($original[0]/$original[1])/($generated[0]/$generated[1])-1)>0.035)accountError(502,'RUNPOD_COMPOSITION_CHANGED');
 $settings=json_decode((string)$job['settings'],true)?:[];
 if(!empty($settings['points']))$output=platformAiComposite((string)file_get_contents($dir.'/room.jpg'),$output,$settings['points']);
 if(file_put_contents($dir.'/result.jpg',$output,LOCK_EX)===false)accountError(503,'STORAGE_UNAVAILABLE');
 chmod($dir.'/result.jpg',0600);
 accountQuery("UPDATE idea_ai_jobs SET state='completed',error_code='',updated_at=? WHERE id=? AND state='processing'",[platformNow(),$id]);
 return platformAiJob(['id'=>$job['user_id']],$id);
}
function platformSaveRunpodKey(array $d,array $u): array {
 platformAdmin($u);accountRate('runpod-key-save',8,3600);
 $key=accountString($d,'key',500,true);
 if(!preg_match('/^[\\x21-\\x7E]{12,500}$/D',$key))accountError(422,'INVALID_RUNPOD_KEY');
 $path=getenv('IDEA_PLATFORM_CONFIG')?:dirname($_SERVER['DOCUMENT_ROOT']).'/idea-platform-config.php';
 $root=realpath(dirname($path));$web=realpath($_SERVER['DOCUMENT_ROOT']);
 if(!$root||!$web||$root===$web||str_starts_with($root.DIRECTORY_SEPARATOR,$web.DIRECTORY_SEPARATOR))accountError(503,'PRIVATE_CONFIGURATION_REQUIRED');
 $lock=fopen($path.'.lock','c');if(!$lock||!flock($lock,LOCK_EX))accountError(503,'CONFIGURATION_LOCK_FAILED');@chmod($path.'.lock',0600);
 try{
   $cfg=is_file($path)?require $path:[];
   if(!is_array($cfg))accountError(503,'PLATFORM_NOT_CONFIGURED');
   $endpoint=accountString($d,'endpoint_id',70);
   if($endpoint==='')$endpoint='qwen-image-edit-2511';
   if(!preg_match('/^[a-zA-Z0-9][a-zA-Z0-9-]{2,70}$/D',$endpoint))accountError(422,'RUNPOD_ENDPOINT_INVALID');
   $cfg['RUNPOD_API_KEY']=$key;$cfg['runpod_endpoint_id']=$endpoint;
   unset($cfg['GEMINI_API_KEY'],$cfg['gemini_model']);
   $tmp=$path.'.'.bin2hex(random_bytes(8));
   $bytes="<?php\n// Private IDEA Runpod configuration. Never place in public_html.\nreturn ".var_export($cfg,true).";\n";
   if(file_put_contents($tmp,$bytes,LOCK_EX)===false)accountError(503,'CONFIGURATION_WRITE_FAILED');
   chmod($tmp,0600);if(!rename($tmp,$path)){@unlink($tmp);accountError(503,'CONFIGURATION_WRITE_FAILED');}
   if(function_exists('opcache_invalidate'))opcache_invalidate($path,true);
   platformAudit($u,'runpod-key-updated',$u['id']);
 }finally{flock($lock,LOCK_UN);fclose($lock);}
 return ['saved'=>true,'provider'=>'runpod','endpoint'=>$endpoint,'access_tested'=>false];
}