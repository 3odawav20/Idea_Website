<?php
declare(strict_types=1);
if(realpath($_SERVER['SCRIPT_FILENAME']??'')===__FILE__){http_response_code(404);exit;}
require_once __DIR__.'/accounts-db.php';
function platformConfig(): array {
 static $cfg;if(isset($cfg))return $cfg;$path=getenv('IDEA_PLATFORM_CONFIG')?:dirname($_SERVER['DOCUMENT_ROOT']).'/idea-platform-config.php';$cfg=is_file($path)?require $path:[];
 if(!is_array($cfg))accountError(503,'PLATFORM_NOT_CONFIGURED');return $cfg;
}
function platformSecret(string $name): string {$value=getenv($name);return $value!==false&&$value!==''?$value:(string)(platformConfig()[$name]??'');}
function platformSaveGeminiKey(array $d,array $u): array{
 platformAdmin($u);accountRate('gemini-key-save',8,3600);$key=accountString($d,'key',300,true);if(!preg_match('/^[A-Za-z0-9_-]{20,300}$/D',$key))accountError(422,'INVALID_GEMINI_KEY');
 $model=platformConfig()['gemini_model']??'gemini-3.1-flash-image';[$code,$response]=platformHttp('https://generativelanguage.googleapis.com/v1beta/models/'.rawurlencode($model),['x-goog-api-key: '.$key],[],'GET');if($code!==200||empty($response['name']))accountError(422,'GEMINI_KEY_OR_MODEL_ACCESS_FAILED');
 $path=getenv('IDEA_PLATFORM_CONFIG')?:dirname($_SERVER['DOCUMENT_ROOT']).'/idea-platform-config.php';$root=realpath(dirname($path));$web=realpath($_SERVER['DOCUMENT_ROOT']);if(!$root||!$web||$root===$web||str_starts_with($root.DIRECTORY_SEPARATOR,$web.DIRECTORY_SEPARATOR))accountError(503,'PRIVATE_CONFIGURATION_REQUIRED');
 $lock=fopen($path.'.lock','c');if(!$lock||!flock($lock,LOCK_EX))accountError(503,'CONFIGURATION_LOCK_FAILED');@chmod($path.'.lock',0600);
 try{$cfg=is_file($path)?require $path:[];if(!is_array($cfg))accountError(503,'PLATFORM_NOT_CONFIGURED');$cfg['GEMINI_API_KEY']=$key;$cfg['gemini_model']=$model;$tmp=$path.'.'.bin2hex(random_bytes(8));$bytes="<?php\n// Private IDEA platform configuration. Never place in public_html.\nreturn ".var_export($cfg,true).";\n";if(file_put_contents($tmp,$bytes,LOCK_EX)===false)accountError(503,'CONFIGURATION_WRITE_FAILED');chmod($tmp,0600);if(!rename($tmp,$path)){@unlink($tmp);accountError(503,'CONFIGURATION_WRITE_FAILED');}if(function_exists('opcache_invalidate'))opcache_invalidate($path,true);platformAudit($u,'gemini-key-updated',$u['id']);}finally{flock($lock,LOCK_UN);fclose($lock);}return ['saved'=>true,'model'=>$model,'model_access_verified'=>true];
}
function platformNow(): int{return (int)(microtime(true)*1000);}
function platformId(): string{return bin2hex(random_bytes(16));}
function platformAdmin(array $u): void{if($u['role']!=='admin')accountError(403,'ADMIN_REQUIRED');}
function platformLock(): string{return accountDb()->getAttribute(PDO::ATTR_DRIVER_NAME)==='mysql'?' FOR UPDATE':'';}
function platformJson(mixed $v): string{return json_encode($v,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);}
function platformTransaction(callable $f): mixed{$db=accountDb();$db->beginTransaction();try{$result=$f();$db->commit();return $result;}catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}}
function platformSetting(string $key,mixed $default=null): mixed{$r=accountQuery('SELECT value_json FROM idea_platform_settings WHERE setting_key=?',[$key])->fetch();return $r?json_decode($r['value_json'],true):$default;}
function platformPutSetting(string $key,mixed $value): void{accountQuery('DELETE FROM idea_platform_settings WHERE setting_key=?',[$key]);accountQuery('INSERT INTO idea_platform_settings(setting_key,value_json,updated_at) VALUES(?,?,?)',[$key,platformJson($value),platformNow()]);}
function platformAudit(array $u,string $action,string $id): void{accountQuery('INSERT INTO idea_admin_audit(id,admin_id,action,subject_id,created_at) VALUES(?,?,?,?,?)',[platformId(),$u['id'],$action,$id,platformNow()]);}
function platformInt(array $data,string $key,int $min,int $max): int{$v=$data[$key]??null;if(!is_int($v)||$v<$min||$v>$max)accountError(422,'INVALID_'.$key);return $v;}
function platformPrivateRoot(): string{$path=getenv('IDEA_PLATFORM_CONFIG')?:dirname($_SERVER['DOCUMENT_ROOT']).'/idea-platform-config.php';$root=dirname($path).'/idea-platform-private';if(!is_dir($root)&&!mkdir($root,0700,true))accountError(503,'STORAGE_UNAVAILABLE');return $root;}
function platformSecurity(array $u): array{$r=accountQuery('SELECT * FROM idea_user_security WHERE user_id=?',[$u['id']])->fetch();return $r?:['user_id'=>$u['id'],'email_verified_at'=>null,'deletion_requested_at'=>null,'notification_preferences'=>'{}'];}
function platformSecuritySave(array $u,array $changes): void{$r=array_merge(platformSecurity($u),$changes);accountQuery('DELETE FROM idea_user_security WHERE user_id=?',[$u['id']]);accountQuery('INSERT INTO idea_user_security(user_id,email_verified_at,deletion_requested_at,notification_preferences) VALUES(?,?,?,?)',[$u['id'],$r['email_verified_at'],$r['deletion_requested_at'],$r['notification_preferences']]);}
function platformProduct(string $id): array{static $catalog;if(!isset($catalog))$catalog=json_decode(file_get_contents(__DIR__.'/catalogue-index.json'),true);if(!isset($catalog[$id]))accountError(404,'PRODUCT_NOT_FOUND');return ['id'=>$id]+$catalog[$id];}
function platformNotify(string $uid,string $event,string $title,string $body,string $link): void{
 if(accountQuery('SELECT id FROM idea_notifications WHERE event_key=?',[$event])->fetch())return;
 accountQuery('INSERT INTO idea_notifications(id,user_id,event_key,title,body,link,created_at) VALUES(?,?,?,?,?,?,?)',[platformId(),$uid,$event,$title,$body,$link,platformNow()]);
 $u=accountQuery('SELECT email FROM idea_users WHERE id=?',[$uid])->fetch();if($u)platformQueueMail($uid,$u['email'],$event,$title,$body.'\n'.rtrim(accountConfig()['site_url']??'','/').$link);
}
function platformHttp(string $url,array $headers,array $body,string $method='POST',int $timeout=45): array{
 if(PHP_SAPI==='cli-server'&&isset($GLOBALS['IDEA_PLATFORM_TEST_HTTP']))return ($GLOBALS['IDEA_PLATFORM_TEST_HTTP'])($url,$headers,$body,$method);
 if(!extension_loaded('curl'))accountError(503,'CURL_REQUIRED');$c=curl_init($url);curl_setopt_array($c,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_HTTPHEADER=>$headers,CURLOPT_CONNECTTIMEOUT=>12,CURLOPT_TIMEOUT=>$timeout,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CUSTOMREQUEST=>$method]);if($method!=='GET')curl_setopt($c,CURLOPT_POSTFIELDS,platformJson($body));$raw=curl_exec($c);$code=(int)curl_getinfo($c,CURLINFO_RESPONSE_CODE);$error=curl_errno($c);curl_close($c);if($error||$raw===false)accountError(502,'PROVIDER_UNREACHABLE');return [$code,json_decode($raw,true)?:[]];
}
function platformFeatures(): array{return ['mail'=>platformMailReady(),'gemini'=>(bool)platformSecret('GEMINI_API_KEY'),'gemini_model'=>platformConfig()['gemini_model']??'gemini-3.1-flash-image','payments'=>['provider'=>'paymob','configured'=>(bool)(platformSecret('PAYMOB_SECRET_KEY')&&platformSecret('PAYMOB_PUBLIC_KEY')&&platformSecret('PAYMOB_HMAC_SECRET')&&!empty(platformConfig()['paymob_integration_ids']))],'delivery'=>['provider'=>'bosta','configured'=>(bool)platformSecret('BOSTA_API_KEY')],'cod_enabled'=>(bool)platformSetting('cash_on_delivery',false)];}
