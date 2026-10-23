<?php
declare(strict_types=1);
if(realpath($_SERVER['SCRIPT_FILENAME']??'')===__FILE__){http_response_code(404);exit;}
function platformAccountAction(string $a,array $d,array $u): mixed{
 if($a==='profile'){$security=platformSecurity($u);return ['user'=>$u,'security'=>['email_verified'=>(bool)$security['email_verified_at'],'deletion_requested_at'=>$security['deletion_requested_at'],'notifications'=>json_decode($security['notification_preferences'],true)?:[]],'mail_configured'=>platformMailReady()];}
 if($a==='profile-save'){
  $name=accountString($d,'name',120,true);$phone=accountString($d,'phone',40);$pref=$d['notifications']??[];if(!is_array($pref)||array_diff(array_keys($pref),['orders','quotes','delivery','security']))accountError(422,'INVALID_FIELDS');foreach($pref as $value)if(!is_bool($value))accountError(422,'INVALID_FIELDS');
  platformTransaction(function()use($name,$phone,$u,$pref){accountQuery('UPDATE idea_users SET name=?,phone=? WHERE id=?',[$name,$phone,$u['id']]);platformSecuritySave($u,['notification_preferences'=>platformJson($pref)]);});return ['saved'=>true];
 }
 if($a==='addresses')return ['addresses'=>accountQuery('SELECT * FROM idea_addresses WHERE user_id=? ORDER BY created_at',[$u['id']])->fetchAll()];
 if($a==='address-save'){
  $id=accountString($d,'id',32)?:platformId();if(!preg_match('/^[a-f0-9]{32}$/D',$id))accountError(422,'INVALID_FIELDS');$old=accountQuery('SELECT user_id FROM idea_addresses WHERE id=?',[$id])->fetch();if($old&&$old['user_id']!==$u['id'])accountError(404,'ADDRESS_NOT_FOUND');
  $values=[];foreach(['label'=>80,'recipient'=>160,'phone'=>40,'governorate'=>100,'city'=>120,'street'=>400,'building'=>80,'floor_number'=>40,'apartment'=>40,'postal_code'=>20,'instructions'=>1000] as $key=>$max)$values[$key]=accountString($d,$key,$max,in_array($key,['label','recipient','phone','governorate','city','street','building'],true));
  if(!preg_match('/^\+?[0-9 ()-]{7,40}$/D',$values['phone']))accountError(422,'INVALID_PHONE');platformTransaction(function()use($id,$u,$values){accountQuery('DELETE FROM idea_addresses WHERE id=? AND user_id=?',[$id,$u['id']]);accountQuery('INSERT INTO idea_addresses(id,user_id,label,recipient,phone,governorate,city,street,building,floor_number,apartment,postal_code,instructions,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',array_merge([$id,$u['id']],array_values($values),[platformNow()]));});return ['id'=>$id];
 }
 if($a==='address-delete'){accountQuery('DELETE FROM idea_addresses WHERE id=? AND user_id=?',[accountString($d,'id',32,true),$u['id']]);return ['deleted'=>true];}
 if($a==='verification-send'){if(!platformMailReady())accountError(503,'SMTP_NOT_CONFIGURED');accountRate('verify-email',3,3600);if(platformSecurity($u)['email_verified_at'])return ['verified'=>true];platformVerificationToken($u);return ['queued'=>true,'delivery'=>'queued'];}
 if($a==='verification-confirm'){
  $token=accountString($d,'token',64,true);if(!preg_match('/^[a-f0-9]{64}$/D',$token))accountError(422,'INVALID_TOKEN');
  return platformTransaction(function()use($token){$r=accountQuery("SELECT * FROM idea_email_tokens WHERE token_hash=? AND purpose='verify' AND expires_at>?".platformLock(),[hash('sha256',$token),time()])->fetch();if(!$r)accountError(400,'TOKEN_EXPIRED');$owner=accountQuery('SELECT id FROM idea_users WHERE id=?',[$r['user_id']])->fetch();platformSecuritySave($owner,['email_verified_at'=>platformNow()]);accountQuery('DELETE FROM idea_email_tokens WHERE token_hash=?',[hash('sha256',$token)]);return ['verified'=>true];});
 }
 if($a==='deletion-request'){
  $password=accountString($d,'password',128,true);$hash=accountQuery('SELECT password_hash FROM idea_users WHERE id=?',[$u['id']])->fetchColumn();if(!password_verify($password,$hash))accountError(401,'INVALID_CURRENT_PASSWORD');
  platformTransaction(function()use($u){platformSecuritySave($u,['deletion_requested_at'=>platformNow()]);platformAudit($u,'account-deletion-request',$u['id']);});return ['requested'=>true];
 }
 if($a==='notifications')return ['notifications'=>accountQuery('SELECT * FROM idea_notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 100',[$u['id']])->fetchAll()];
 if($a==='notification-read'){accountQuery('UPDATE idea_notifications SET read_at=? WHERE id=? AND user_id=?',[platformNow(),accountString($d,'id',32,true),$u['id']]);return ['saved'=>true];}
 if($a==='comparisons')return ['products'=>array_column(accountQuery('SELECT product_id FROM idea_product_comparisons WHERE user_id=?',[$u['id']])->fetchAll(),'product_id')];
 if($a==='comparison-save'){$id=accountString($d,'product_id',100,true);platformProduct($id);platformTransaction(function()use($u,$id,$d){accountQuery('DELETE FROM idea_product_comparisons WHERE user_id=? AND product_id=?',[$u['id'],$id]);if(!empty($d['active'])){if((int)accountQuery('SELECT COUNT(*) FROM idea_product_comparisons WHERE user_id=?',[$u['id']])->fetchColumn()>=4)accountError(409,'COMPARISON_LIMIT');accountQuery('INSERT INTO idea_product_comparisons(user_id,product_id) VALUES(?,?)',[$u['id'],$id]);}});return ['saved'=>true];}
 accountError(404,'UNKNOWN_ACTION');
}
