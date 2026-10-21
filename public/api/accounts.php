<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
require_once __DIR__.'/accounts-db.php';
require_once __DIR__.'/platform-core.php';
require_once __DIR__.'/platform-mail.php';
require_once __DIR__.'/quotes-api.php';
require_once __DIR__.'/admin-accounts.php';
require_once __DIR__.'/workflow-extensions.php';
function reply(mixed $data): never {echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
try {
 accountSession();$action=$_GET['action']??'session';$method=$_SERVER['REQUEST_METHOD']??'GET';
 if($action==='health'&&$method==='GET'){accountQuery('SELECT id FROM idea_users LIMIT 1');reply(['ok'=>true,'backend'=>'php-mysql']);}
 if($action==='session'&&$method==='GET')reply(accountSnapshot(accountUser(false)));
 if($action==='supplier-product'&&$method==='GET'){$p=accountQuery("SELECT p.id,p.title,p.specifications,c.public_name AS company_name FROM idea_supplier_products p JOIN idea_companies c ON c.id=p.company_id WHERE p.id=? AND p.active=1 AND c.status='verified'",[$_GET['id']??''])->fetch();if(!$p)accountError(404,'PRODUCT_NOT_FOUND');$p['specifications']=json_decode($p['specifications'],true)?:[];reply($p);}
 if($action==='mailbox'&&$method==='GET')reply(ideaQuoteDetails(ideaMailbox(accountUser())));
 if($action==='admin-overview'&&$method==='GET')reply(ideaAdminOverview(accountUser()));
 if($action==='favorites'&&$method==='GET'){$u=accountUser();reply(['favorites'=>array_column(accountQuery('SELECT product_id FROM idea_favorites WHERE user_id=?',[$u['id']])->fetchAll(),'product_id')]);}
 if($action==='showrooms'&&$method==='GET'){
   $id=$_GET['company']??'';$companies=accountQuery("SELECT id,public_name,description,phone FROM idea_companies WHERE status='verified'".($id?' AND id=?':'').' ORDER BY public_name',$id?[$id]:[])->fetchAll();
   $products=accountQuery("SELECT p.id,p.company_id,p.title,p.sku,p.specifications FROM idea_supplier_products p JOIN idea_companies c ON c.id=p.company_id WHERE p.active=1 AND c.status='verified'".($id?' AND c.id=?':'').' ORDER BY p.created_at DESC LIMIT 100',$id?[$id]:[])->fetchAll();foreach($products as &$p)$p['specifications']=json_decode($p['specifications'],true)?:[];
   reply(['companies'=>$companies,'products'=>$products]);
 }
 if($action==='products'&&$method==='GET'){$c=accountCompany(accountUser());$items=accountQuery('SELECT * FROM idea_supplier_products WHERE company_id=? ORDER BY created_at DESC',[$c['id']])->fetchAll();foreach($items as &$item){$item['specifications']=json_decode($item['specifications'],true)?:[];$item['active']=(bool)$item['active'];}reply(['products'=>$items]);}
 if($method!=='POST')accountError(405,'METHOD_NOT_ALLOWED');
 if((int)($_SERVER['CONTENT_LENGTH']??0)>11534336)accountError(413,'IMAGE_TOO_LARGE');accountCsrf();
 $data=$action==='upload'?[]:json_decode(file_get_contents('php://input',false,null,0,131073),true);
 if(!is_array($data))accountError(400,'INVALID_FIELDS');
 if($action==='register'){
   accountRate('register',8,3600);$email=strtolower(accountString($data,'email',190,true));$name=accountString($data,'display_name',120,true);$password=$data['password']??'';
   if(!filter_var($email,FILTER_VALIDATE_EMAIL)||!is_string($password)||strlen($password)<8||strlen($password)>128)accountError(422,'INVALID_FIELDS');
   $business=($data['account_type']??'customer')==='business';$details=[];
   if($business){
     $company=accountString($data,'company_name',200,true);$legal=accountString($data,'legal_name',200,true);$phone=accountString($data,'phone',40,true);
     $q=$data['business_profile']??[];if(!is_array($q))accountError(422,'INVALID_FIELDS');
     $categories=$q['categories']??[];$allowed=['ceramic','porcelain','marble','granite','sanitary','faucets'];
     if(!is_array($categories)||!count($categories)||count($categories)>6||array_diff($categories,$allowed))accountError(422,'INVALID_FIELDS');
     $primary=$q['primary_category']??'';if($primary!=='all'&&!in_array($primary,$categories,true))accountError(422,'INVALID_FIELDS');
     $contracts=$q['contract_volume']??'';if(!in_array($contracts,['under_100k','100k_500k','500k_2m','2m_10m','over_10m','prefer_not_to_say'],true))accountError(422,'INVALID_FIELDS');
     $activity=$q['company_type']??'';if(!in_array($activity,['retailer','wholesaler','manufacturer','importer','contractor'],true))accountError(422,'INVALID_FIELDS');
     $details=['categories'=>array_values(array_unique($categories)),'primary_category'=>$primary,'contract_volume'=>$contracts,'company_type'=>$activity];
     foreach(['governorate','service_areas','brands','capacity','minimum_order','years_active','website','commercial_registration','tax_number'] as $key)$details[$key]=accountString($q,$key,$key==='brands'||$key==='service_areas'?1000:200);
   }
   $db=accountDb();$db->beginTransaction();$id=bin2hex(random_bytes(16));$now=(int)(microtime(true)*1000);
   try {
     accountQuery('INSERT INTO idea_users(id,email,name,password_hash,role,phone,created_at) VALUES(?,?,?,?,?,?,?)',[$id,$email,$name,password_hash($password,PASSWORD_DEFAULT),$business?'supplier':'buyer',$business?$phone:accountString($data,'phone',40),$now]);
     if($business)accountQuery('INSERT INTO idea_companies(id,owner_id,public_name,legal_name,email,phone,description,status,business_details,created_at) VALUES(?,?,?,?,?,?,?,\'submitted\',?,?)',[bin2hex(random_bytes(16)),$id,$company,$legal,$email,$phone,'',json_encode($details,JSON_UNESCAPED_UNICODE),$now]);
     accountQuery('INSERT INTO idea_memberships(user_id,audience,billing_interval,status,updated_at) VALUES(?,?,?,?,?)',[$id,$business?'business':'customer',($data['membership_interval']??'')==='annual'?'annual':'monthly',$business?'requested':'active',$now]);$db->commit();
   }catch(PDOException $e){$db->rollBack();if(in_array($e->getCode(),['23000','23505'],true))accountError(409,'ACCOUNT_EXISTS');throw $e;}
   if(platformMailReady())platformTransaction(fn()=>platformVerificationToken(['id'=>$id,'email'=>$email]));
   session_regenerate_id(true);$_SESSION['uid']=$id;$_SESSION['csrf']=bin2hex(random_bytes(32));reply(accountSnapshot(accountUser()));
 }
 if($action==='login'){
   accountRate('login',30);$email=strtolower(accountString($data,'email',190,true));$password=$data['password']??'';if(!is_string($password)||strlen($password)>128)accountError(422,'INVALID_FIELDS');
   $u=accountQuery('SELECT * FROM idea_users WHERE email=?',[$email])->fetch();
   if(!$u||!password_verify($password,$u['password_hash']??'$2y$10$QOGdHPqun8kMMZP8s.wq6OcMq5v5dxGpl35RRGn4d1T4LsNJXlSjO'))accountError(401,'INVALID_LOGIN');
   if(password_needs_rehash($u['password_hash'],PASSWORD_DEFAULT))accountQuery('UPDATE idea_users SET password_hash=? WHERE id=?',[password_hash($password,PASSWORD_DEFAULT),$u['id']]);
   session_regenerate_id(true);$_SESSION['uid']=$u['id'];$_SESSION['csrf']=bin2hex(random_bytes(32));reply(accountSnapshot(accountUser()));
 }
 if($action==='reset-request'){
   accountRate('reset',5,3600);$email=strtolower(accountString($data,'email',190,true));if(!platformMailReady())accountError(503,'SMTP_NOT_CONFIGURED');$u=accountQuery('SELECT id,email FROM idea_users WHERE email=?',[$email])->fetch();
   if($u)platformTransaction(function()use($u){$token=bin2hex(random_bytes(32));accountQuery('DELETE FROM idea_password_resets WHERE user_id=?',[$u['id']]);accountQuery('INSERT INTO idea_password_resets(token_hash,user_id,expires_at) VALUES(?,?,?)',[hash('sha256',$token),$u['id'],time()+1200]);$url=rtrim(accountConfig()['site_url'],'/').'/reset-password?token='.$token;platformQueueMail($u['id'],$u['email'],'reset:'.hash('sha256',$token),'IDEA password reset / إعادة تعيين كلمة المرور','Reset within 20 minutes: '.$url);});reply(['ok'=>true,'delivery'=>'queued']);
 }
 if($action==='reset-password'){
   accountRate('reset-confirm',15);$token=accountString($data,'token',64,true);$password=$data['password']??'';if(!preg_match('/^[a-f0-9]{64}$/D',$token)||!is_string($password)||strlen($password)<8||strlen($password)>128)accountError(422,'INVALID_FIELDS');
   $db=accountDb();$db->beginTransaction();try{$row=accountQuery('SELECT * FROM idea_password_resets WHERE token_hash=? AND expires_at>?',[hash('sha256',$token),time()])->fetch();if(!$row){$db->rollBack();accountError(400,'RESET_EXPIRED');}
     accountQuery('UPDATE idea_users SET password_hash=? WHERE id=?',[password_hash($password,PASSWORD_DEFAULT),$row['user_id']]);accountQuery('DELETE FROM idea_password_resets WHERE user_id=?',[$row['user_id']]);$db->commit();}catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}reply(['ok'=>true]);
 }
 $u=accountUser();
 if($action==='change-password'){
   accountRate('password-change',8,900);$current=$data['current_password']??null;$next=$data['new_password']??null;
   if(!is_string($current)||strlen($current)>128||!is_string($next)||strlen($next)<8||strlen($next)>128)accountError(422,'INVALID_FIELDS');
   $row=accountQuery('SELECT password_hash FROM idea_users WHERE id=?',[$u['id']])->fetch();
   if(!$row||!password_verify($current,$row['password_hash']))accountError(401,'INVALID_CURRENT_PASSWORD');
   if($current===$next)accountError(422,'NEW_PASSWORD_SAME');
   accountQuery('UPDATE idea_users SET password_hash=? WHERE id=?',[password_hash($next,PASSWORD_DEFAULT),$u['id']]);
   session_regenerate_id(true);$_SESSION['csrf']=bin2hex(random_bytes(32));reply(accountSnapshot($u));
 }
 if(in_array($action,['accept-quote','reject-quote','admin-membership','admin-product','admin-invite'],true))ideaWorkflowAction($action,$data,$u);
 if($action==='admin-company')accountError(409,'USE_DOCUMENT_VERIFICATION_REVIEW');
 if(in_array($action,['admin-reply'],true))ideaAdminAction($action,$data,$u);
 if($action==='favorite'){$id=accountString($data,'product_id',100,true);accountQuery('DELETE FROM idea_favorites WHERE user_id=? AND product_id=?',[$u['id'],$id]);if(!empty($data['active']))accountQuery('INSERT INTO idea_favorites(user_id,product_id) VALUES(?,?)',[$u['id'],$id]);reply(['ok'=>true]);}
 if(in_array($action,['request-quotes','price-quote','read-message'],true))ideaQuoteAction($action,$data,$u);
 if($action==='logout'){$_SESSION=[];session_regenerate_id(true);$_SESSION['csrf']=bin2hex(random_bytes(32));reply(accountSnapshot(null));}
 if($action==='membership'){
   $audience=$data['audience']??'';$interval=$data['interval']??'';if(!in_array($interval,['monthly','annual'],true))accountError(422,'INVALID_FIELDS');
   if($audience==='business')accountCompany($u);elseif($audience==='customer')accountCustomer($u);else accountError(422,'INVALID_FIELDS');
   $db=accountDb();$db->beginTransaction();try{accountQuery('DELETE FROM idea_memberships WHERE user_id=?',[$u['id']]);accountQuery('INSERT INTO idea_memberships(user_id,audience,billing_interval,status,updated_at) VALUES(?,?,?,?,?)',[$u['id'],$audience,$interval,$audience==='customer'?'active':'requested',(int)(microtime(true)*1000)]);$db->commit();}catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}reply(accountSnapshot($u));
 }
 $c=accountCompany($u);
 if($action==='company'){
   $name=accountString($data,'public_name',200,true);$email=accountString($data,'email',190,true);if(!filter_var($email,FILTER_VALIDATE_EMAIL))accountError(422,'INVALID_FIELDS');
   accountQuery('UPDATE idea_companies SET public_name=?,email=?,phone=?,description=? WHERE id=?',[$name,$email,accountString($data,'phone',40),accountString($data,'description',2000),$c['id']]);reply(accountSnapshot($u));
 }
 if($action==='product'){
   $title=accountString($data,'title',200,true);$spec=$data['specifications']??[];if(!is_array($spec))accountError(422,'INVALID_FIELDS');
   $material=$spec['material']??'';if(!in_array($material,['ceramic','porcelain','marble'],true))accountError(422,'INVALID_FIELDS');
   $image=accountString($spec,'image',500);$uploadBase=rtrim(str_replace('\\','/',dirname($_SERVER['SCRIPT_NAME'],2)),'/').'/uploads/company-products/'.$u['id'].'/';
   if($image!==''&&(!str_starts_with($image,$uploadBase)||!preg_match('#^[a-f0-9]{32}\.(?:png|jpg|webp)$#D',substr($image,strlen($uploadBase)))))accountError(422,'INVALID_FIELDS');
   $spec=['material'=>$material,'brand'=>accountString($spec,'brand',200,true),'dimensions'=>accountString($spec,'dimensions',200,true),'description'=>accountString($spec,'description',2000),'image'=>$image];
   $catalog=accountString($data,'catalog_product_id',100);if($catalog!==''){$catalogue=ideaCatalogueProduct($catalog);$title=$catalogue['name'];}
   $id=accountString($data,'id',32);
   if($id!==''){
     if(!accountQuery('SELECT id FROM idea_supplier_products WHERE id=? AND company_id=?',[$id,$c['id']])->fetch())accountError(404,'NOT_FOUND');
     accountQuery('UPDATE idea_supplier_products SET title=?,sku=?,active=0,catalog_product_id=?,product_key=?,specifications=? WHERE id=? AND company_id=?',[$title,accountString($data,'sku',100),$catalog,ideaProductKey($catalog,$title,$spec),json_encode($spec,JSON_UNESCAPED_UNICODE),$id,$c['id']]);
   }else{
     $id=bin2hex(random_bytes(16));accountQuery('INSERT INTO idea_supplier_products(id,company_id,title,sku,active,catalog_product_id,product_key,specifications,created_at) VALUES(?,?,?,?,0,?,?,?,?)',[$id,$c['id'],$title,accountString($data,'sku',100),$catalog,ideaProductKey($catalog,$title,$spec),json_encode($spec,JSON_UNESCAPED_UNICODE),(int)(microtime(true)*1000)]);
   }
   reply(['id'=>$id]);
 }
 if($action==='publish'){
   if($c['status']!=='verified')accountError(403,'COMPANY_UNVERIFIED');$id=accountString($data,'id',32,true);$p=accountQuery('SELECT id FROM idea_supplier_products WHERE id=? AND company_id=?',[$id,$c['id']])->fetch();if(!$p)accountError(404,'NOT_FOUND');
   accountQuery('UPDATE idea_supplier_products SET active=1 WHERE id=? AND company_id=?',[$id,$c['id']]);
   $product=accountQuery('SELECT product_key FROM idea_supplier_products WHERE id=?',[$id])->fetch();$open=accountQuery('SELECT id FROM idea_quote_requests WHERE product_key=? AND deadline_at>?',[$product['product_key'],(int)(microtime(true)*1000)])->fetchAll();
   foreach($open as $request){if(!accountQuery('SELECT request_id FROM idea_request_recipients WHERE request_id=? AND company_id=?',[$request['id'],$c['id']])->fetch())accountQuery('INSERT INTO idea_request_recipients(request_id,company_id) VALUES(?,?)',[$request['id'],$c['id']]);}reply(['ok'=>true]);
 }
 if($action==='upload'){
   $f=$_FILES['image']??null;if(!$f||$f['error']!==UPLOAD_ERR_OK)accountError(422,'INVALID_IMAGE');if($f['size']>10485760)accountError(413,'IMAGE_TOO_LARGE');
   $mime=(new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);$extensions=['image/png'=>'png','image/jpeg'=>'jpg','image/webp'=>'webp'];$info=@getimagesize($f['tmp_name']);if(!isset($extensions[$mime])||!$info||$info[0]*$info[1]>25000000)accountError(422,'INVALID_IMAGE');
   $dir=dirname(__DIR__).'/uploads/company-products/'.$u['id'];if(!is_dir($dir)&&!mkdir($dir,0755,true))accountError(503,'UPLOAD_UNAVAILABLE');$name=bin2hex(random_bytes(16)).'.'.$extensions[$mime];if(!move_uploaded_file($f['tmp_name'],$dir.'/'.$name))accountError(503,'UPLOAD_UNAVAILABLE');
   reply(['image'=>rtrim(str_replace('\\','/',dirname($_SERVER['SCRIPT_NAME'],2)),'/').'/uploads/company-products/'.$u['id'].'/'.$name]);
 }
 accountError(404,'NOT_FOUND');
} catch(IdeaAccountError $e){http_response_code($e->status);reply(['error'=>$e->getMessage()]);}
catch(Throwable $e){error_log('IDEA accounts: '.$e->getMessage());http_response_code(503);reply(['error'=>'ACCOUNTS_UNAVAILABLE']);}
