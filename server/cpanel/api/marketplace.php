<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
require_once __DIR__.'/platform-core.php';
require_once __DIR__.'/tile-dimensions.php';

/** IDEA marketplace is same-origin, session-backed and MySQL-only. */
function mpOut(array $v): never { echo platformJson($v); exit; }
function mpNow(): int { return platformNow(); }
function mpRole(array $u,string $companyId): string {
 if($u['role']==='admin')return 'admin';
 $owner=accountQuery('SELECT id FROM idea_companies WHERE id=? AND owner_id=?',[$companyId,$u['id']])->fetch();
 if($owner)return 'owner';
 $staff=accountQuery('SELECT role FROM idea_company_staff WHERE company_id=? AND user_id=? AND active=1',[$companyId,$u['id']])->fetch();
 return $staff ? (string)$staff['role'] : '';
}
function mpNeedCompany(array $u,string $companyId,bool $ownerOnly=false): string {
 if(!preg_match('/^[a-f0-9]{32}$/D',$companyId))accountError(422,'INVALID_COMPANY');
 $role=mpRole($u,$companyId);
 if(!$role||($ownerOnly&&!in_array($role,['owner','admin'],true)))accountError(403,'COMPANY_ACCESS_DENIED');
 return $role;
}
function mpStr(array $d,string $k,int $n,bool $req=false):string {return accountString($d,$k,$n,$req);}
function mpValue(array $d,string $k,float $min,float $max):float {
 $x=$d[$k]??null;
 if(!(is_int($x)||is_float($x)||is_string($x)&&is_numeric($x))||!is_finite((float)$x)||(float)$x<$min||(float)$x>$max)accountError(422,'INVALID_'.$k);
 return (float)$x;
}
function mpPublicTicker(bool $all=false):array {
 $now=mpNow();
 $sql="SELECT id,text_ar,text_en,link_path,state,start_at,end_at,updated_at FROM idea_marketplace_announcements";
 if(!$all)$sql.=" WHERE state='published' AND (start_at IS NULL OR start_at<=?) AND (end_at IS NULL OR end_at>?)";
 $sql.=" ORDER BY updated_at DESC LIMIT 20";
 return accountQuery($sql,$all?[]:[$now,$now])->fetchAll();
}
function mpCompanies(array $u):array {
 if($u['role']==='admin')$rows=accountQuery('SELECT c.id,c.public_name,c.legal_name,c.email,c.status,c.owner_id,c.created_at,u.name AS owner_name FROM idea_companies c JOIN idea_users u ON u.id=c.owner_id ORDER BY c.created_at DESC LIMIT 500')->fetchAll();
 else $rows=accountQuery('SELECT c.id,c.public_name,c.legal_name,c.email,c.status,c.owner_id,c.created_at,u.name AS owner_name FROM idea_companies c JOIN idea_users u ON u.id=c.owner_id WHERE c.owner_id=? OR EXISTS(SELECT 1 FROM idea_company_staff s WHERE s.company_id=c.id AND s.user_id=? AND s.active=1) ORDER BY c.created_at DESC LIMIT 150',[$u['id'],$u['id']])->fetchAll();
 foreach($rows as &$r){$r['my_role']=mpRole($u,$r['id']);$r['products']=(int)accountQuery('SELECT COUNT(*) FROM idea_supplier_products WHERE company_id=?',[$r['id']])->fetchColumn();}unset($r);
 return $rows;
}
function mpCatalogueRows(?array $u,string $q='',string $company='',bool $private=false,int $limit=80):array{
 $criteria=['1=1'];$args=[];
 if(!$private){$criteria[]="p.active=1 AND c.status='verified' AND m.approved_for_storefront=1";}
 if($company!==''){$criteria[]='p.company_id=?';$args[]=$company;}
 if($q!==''){$like='%'.str_replace(['%','_'],['\%','\_'],$q).'%';$criteria[]='(p.sku LIKE ? OR p.title LIKE ? OR m.brand LIKE ? OR m.manufacturer LIKE ? OR c.public_name LIKE ? OR p.product_key LIKE ?)';array_push($args,$like,$like,$like,$like,$like,$like);}
 $sql="SELECT p.id,p.company_id,p.sku,p.title,p.active,p.catalog_product_id,p.product_key,
     c.public_name AS company_name,c.status AS company_status,
     m.brand,m.manufacturer,m.category,m.size_label,m.width_mm,m.height_mm,m.finish,m.color,
     m.image_url,m.private_price_cents,m.currency,m.approved_for_storefront,m.admin_notes
     FROM idea_supplier_products p
     JOIN idea_companies c ON c.id=p.company_id
     LEFT JOIN idea_marketplace_product_meta m ON m.product_id=p.id
     WHERE ".implode(' AND ',$criteria)." ORDER BY p.created_at DESC LIMIT ".(int)$limit;
 $rows=accountQuery($sql,$args)->fetchAll();
 foreach($rows as &$r){
  $isAdmin=$u&&$u['role']==='admin';
  $authorized=$u&&($isAdmin||mpRole($u,$r['company_id'])!=='');
  if(!$authorized){unset($r['private_price_cents'],$r['admin_notes']);}
  $r['active']=(bool)$r['active'];
  $r['approved_for_storefront']=(bool)($r['approved_for_storefront']??false);
 }unset($r);
 return $rows;
}
function mpSales(string $month,array $u,string $company=''):array {
 if(!preg_match('/^20[2-9][0-9]-(0[1-9]|1[0-2])$/D',$month))accountError(422,'INVALID_MONTH');
 $zone=new DateTimeZone('Africa/Cairo');
 $from=new DateTimeImmutable($month.'-01 00:00:00',$zone);
 $to=$from->modify('+1 month');
 $start=$from->getTimestamp()*1000;$end=$to->getTimestamp()*1000;
 if($company!=='')mpNeedCompany($u,$company);
 elseif($u['role']!=='admin')accountError(403,'ADMIN_REQUIRED');
 $where=$company!==''?' AND oi.company_id=?':'';
 $params=[$start,$end];if($company!=='')$params[]=$company;
 // Only verified captured payments are counted; accepted quotes and COD-unpaid orders are excluded.
 $sql="SELECT oi.company_id,c.public_name,
      COUNT(DISTINCT oi.order_id) AS orders_count,
      COALESCE(SUM(oi.subtotal_cents+oi.tax_cents),0) AS gross_cents
      FROM idea_order_items oi JOIN idea_orders o ON o.id=oi.order_id
      JOIN idea_companies c ON c.id=oi.company_id
      WHERE o.payment_status='paid'
      AND EXISTS(SELECT 1 FROM idea_payments pm WHERE pm.order_id=o.id AND pm.status='paid' AND pm.updated_at>=? AND pm.updated_at<?)
      ".$where." GROUP BY oi.company_id,c.public_name ORDER BY gross_cents DESC";
 $rows=accountQuery($sql,$params)->fetchAll();
 foreach($rows as &$r){$r['orders_count']=(int)$r['orders_count'];$r['gross_cents']=(int)$r['gross_cents'];$r['net_confirmed_cents']=$r['gross_cents'];$r['refund_accounting']='separate_reconciliation_required';}unset($r);
 return ['month'=>$month,'timezone'=>'Africa/Cairo','basis'=>'captured_payments_only','rows'=>$rows,
 'caveat'=>'Net excludes refunds pending verified per-supplier allocation; never treat quotes or unpaid COD as revenue.'];
}
function mpPackages(bool $admin):array{
 return accountQuery('SELECT * FROM idea_marketplace_ad_packages'.($admin?'':' WHERE is_published=1').' ORDER BY id')->fetchAll();
}
try{
 accountSession();
 $action=(string)($_GET['action']??'bootstrap');
 $method=$_SERVER['REQUEST_METHOD']??'GET';
 if($action==='ticker'&&$method==='GET')mpOut(['announcements'=>mpPublicTicker(false)]);
 if($action==='search'&&$method==='GET'){
  $q=trim((string)($_GET['q']??''));
  if(mb_strlen($q)>100)accountError(422,'INVALID_QUERY');
  $u=accountUser(false);
  $admin=$u&&$u['role']==='admin';
  $rows=mpCatalogueRows($u,$q,'',(bool)$admin,100);
  // Similarity is based only on known material metadata; do not claim visual AI similarity.
  $reference=$rows[0]??null;$similar=[];
  if($reference){
   $pool=mpCatalogueRows($u,'','',(bool)$admin,130);
   foreach($pool as $p){
    if($p['id']===$reference['id'])continue;
    $score=0;
    if(!empty($p['category'])&&$p['category']===$reference['category'])$score+=3;
    if(!empty($p['width_mm'])&&$p['width_mm']===$reference['width_mm']&&$p['height_mm']===$reference['height_mm'])$score+=4;
    if(!empty($p['finish'])&&$p['finish']===$reference['finish'])$score++;
    if(!empty($p['brand'])&&$p['brand']===$reference['brand'])$score++;
    if($score>0){$p['similarity_reason']='material_dimensions_finish';$p['_score']=$score;$similar[]=$p;}
   }
   usort($similar,fn($a,$b)=>$b['_score']<=>$a['_score']);
   $similar=array_slice($similar,0,8);foreach($similar as &$p)unset($p['_score']);unset($p);
  }
  mpOut(['products'=>$rows,'similar'=>$similar,'method'=>'metadata_comparison_not_visual_embedding']);
 }
 $u=accountUser();
 $admin=$u['role']==='admin';
 if($method==='GET'){
  if($action==='bootstrap')mpOut(['user'=>['id'=>$u['id'],'name'=>$u['name'],'role'=>$u['role']],
    'csrf'=>$_SESSION['csrf'],'companies'=>mpCompanies($u),'announcements'=>mpPublicTicker($admin),
    'packages'=>mpPackages($admin),'role'=>$u['role']]);
  $company=mpStr($_GET,'company_id',32);
  if($action==='products'){
   mpNeedCompany($u,$company);
   mpOut(['products'=>mpCatalogueRows($u,'',$company,true,500)]);
  }
  if($action==='staff'){
   mpNeedCompany($u,$company,true);
   mpOut(['staff'=>accountQuery('SELECT s.user_id,s.role,s.active,u.name,u.email FROM idea_company_staff s JOIN idea_users u ON u.id=s.user_id WHERE s.company_id=? ORDER BY s.created_at DESC LIMIT 100',[$company])->fetchAll()]);
  }
  if($action==='sales')mpOut(mpSales(mpStr($_GET,'month',7,true),$u,$company));
  if($action==='ad-requests'){
   if($company!=='')mpNeedCompany($u,$company);elseif(!$admin)accountError(403,'ADMIN_REQUIRED');
   $sql='SELECT r.id,r.company_id,r.package_id,r.title,r.message,r.media_kind,r.state,r.admin_notes,r.created_at,c.public_name FROM idea_marketplace_ad_requests r JOIN idea_companies c ON c.id=r.company_id';
   mpOut(['requests'=>accountQuery($sql.($company!==''?' WHERE r.company_id=?':'').' ORDER BY r.created_at DESC LIMIT 200',$company!==''?[$company]:[])->fetchAll()]);
  }
  accountError(404,'UNKNOWN_ACTION');
 }
 if($method!=='POST')accountError(405,'METHOD_NOT_ALLOWED');
 if((int)($_SERVER['CONTENT_LENGTH']??0)>1048576)accountError(413,'BODY_TOO_LARGE');
 accountCsrf();
 $data=json_decode(file_get_contents('php://input',false,null,0,1048577),true);
 if(!is_array($data))accountError(400,'INVALID_JSON');
 $company=mpStr($data,'company_id',32);
 if($action==='product-save'){
  mpNeedCompany($u,$company);
  $c=accountQuery('SELECT id,status FROM idea_companies WHERE id=?',[$company])->fetch();
  if(!$c)accountError(404,'COMPANY_NOT_FOUND');
  $id=mpStr($data,'id',32);
  $sku=mpStr($data,'sku',100,true);
  $title=mpStr($data,'title',190,true);
  $brand=mpStr($data,'brand',190,true);
  $mfg=mpStr($data,'manufacturer',190,true);
  $cat=mpStr($data,'category',40,true);
  if(!in_array($cat,['ceramic','porcelain','marble','granite','tile'],true))accountError(422,'INVALID_MATERIAL');
  $w=mpValue($data,'width_mm',50,3200);$h=mpValue($data,'height_mm',50,3200);
  $size=mpStr($data,'size_label',80,true);
   try { ideaTileAssertMatches(['width_mm'=>$w,'height_mm'=>$h],$size); }
   catch(InvalidArgumentException $e){accountError(422,'PRODUCT_DIMENSIONS_CONFLICT');}
  $finish=mpStr($data,'finish',100);$color=mpStr($data,'color',100);
  $image=mpStr($data,'image_url',500);
  if($image!==''&&!preg_match('#^/uploads/company-products/[a-f0-9]{32}/[a-f0-9]{32}\.(?:png|jpg|webp)$#D',$image))accountError(422,'INVALID_IMAGE_PATH');
  $price=$data['price_cents']??null;
  if($price!==null&&(!is_int($price)||$price<0||$price>100000000000))accountError(422,'INVALID_PRIVATE_PRICE');
  $other=accountQuery('SELECT id FROM idea_supplier_products WHERE company_id=? AND sku=?'.($id!==''?' AND id<>?':''),$id!==''?[$company,$sku,$id]:[$company,$sku])->fetch();
  if($other)accountError(409,'DUPLICATE_COMPANY_CODE');
  $now=mpNow();
  $spec=['material'=>$cat,'brand'=>$brand,'dimensions'=>$size,'description'=>mpStr($data,'description',2000),'image'=>$image,'manufacturer'=>$mfg,'width_mm'=>$w,'height_mm'=>$h,'finish'=>$finish,'color'=>$color];
  $serial=platformJson($spec);
  $productKey=strtolower(preg_replace('/[^a-zA-Z0-9-]/','-',trim($sku)));
  if($productKey==='')$productKey='idea-'.substr(hash('sha256',$sku),0,16);
  platformTransaction(function()use(&$id,$company,$u,$sku,$title,$productKey,$serial,$brand,$mfg,$cat,$size,$w,$h,$finish,$color,$image,$price,$now){
   if($id!==''){
    $old=accountQuery('SELECT id FROM idea_supplier_products WHERE id=? AND company_id=?'.platformLock(),[$id,$company])->fetch();
    if(!$old)accountError(404,'PRODUCT_NOT_FOUND');
    accountQuery('UPDATE idea_supplier_products SET title=?,sku=?,active=0,product_key=?,specifications=? WHERE id=? AND company_id=?',[$title,$sku,$productKey,$serial,$id,$company]);
    accountQuery('DELETE FROM idea_marketplace_product_meta WHERE product_id=? AND company_id=?',[$id,$company]);
   }else{
    $id=platformId();
    accountQuery('INSERT INTO idea_supplier_products(id,company_id,title,sku,active,catalog_product_id,product_key,specifications,created_at) VALUES(?,?,?,?,0,?,?,?,?)',[$id,$company,$title,$sku,'',$productKey,$serial,$now]);
   }
   accountQuery('INSERT INTO idea_marketplace_product_meta(product_id,company_id,product_code,brand,manufacturer,category,size_label,width_mm,height_mm,finish,color,image_url,private_price_cents,currency,approved_for_storefront,admin_notes,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [$id,$company,$sku,$brand,$mfg,$cat,$size,$w,$h,$finish,$color,$image,$price,'EGP',0,'',$now]);
  });
  mpOut(['saved'=>true,'id'=>$id,'approval'=>'pending_platform_admin_review']);
 }
 if($action==='product-approval'){
  if(!$admin)accountError(403,'ADMIN_REQUIRED');
  $id=mpStr($data,'id',32,true);
  $yes=$data['approved']??null;
  if(!is_bool($yes))accountError(422,'INVALID_APPROVAL');
  $notes=mpStr($data,'notes',1000);
  $row=accountQuery('SELECT p.id,p.company_id,c.status FROM idea_supplier_products p JOIN idea_companies c ON c.id=p.company_id WHERE p.id=?',[$id])->fetch();
  if(!$row)accountError(404,'PRODUCT_NOT_FOUND');
  if($yes&&$row['status']!=='verified')accountError(409,'COMPANY_NOT_VERIFIED');
  platformTransaction(function()use($yes,$notes,$id,$u){
   accountQuery('UPDATE idea_marketplace_product_meta SET approved_for_storefront=?,admin_notes=?,updated_at=? WHERE product_id=?',[(int)$yes,$notes,mpNow(),$id]);
   if(!$yes)accountQuery('UPDATE idea_supplier_products SET active=0 WHERE id=?',[$id]);
   platformAudit($u,$yes?'product-approved':'product-rejected',$id);
  });
  mpOut(['saved'=>true]);
 }
 if($action==='product-active'){
  mpNeedCompany($u,$company);
  $id=mpStr($data,'id',32,true);$active=$data['active']??null;
  if(!is_bool($active))accountError(422,'INVALID_STATE');
  $row=accountQuery('SELECT p.id,c.status,m.approved_for_storefront FROM idea_supplier_products p JOIN idea_companies c ON c.id=p.company_id JOIN idea_marketplace_product_meta m ON m.product_id=p.id WHERE p.id=? AND p.company_id=?',[$id,$company])->fetch();
  if(!$row)accountError(404,'PRODUCT_NOT_FOUND');
  if($active&&($row['status']!=='verified'||!(bool)$row['approved_for_storefront']))accountError(403,'ADMIN_APPROVAL_REQUIRED');
  accountQuery('UPDATE idea_supplier_products SET active=? WHERE id=? AND company_id=?',[(int)$active,$id,$company]);
  mpOut(['saved'=>true]);
 }
 if($action==='staff-save'){
  mpNeedCompany($u,$company,true);
  $email=strtolower(mpStr($data,'email',190,true));
  if(!filter_var($email,FILTER_VALIDATE_EMAIL))accountError(422,'INVALID_EMAIL');
  $active=$data['active']??null;
  if(!is_bool($active))accountError(422,'INVALID_STATE');
  $staff=accountQuery('SELECT id,role FROM idea_users WHERE email=?',[$email])->fetch();
  if(!$staff||$staff['role']==='admin')accountError(404,'STAFF_ACCOUNT_NOT_FOUND');
  $owner=accountQuery('SELECT owner_id FROM idea_companies WHERE id=?',[$company])->fetch();
  if($owner&&$owner['owner_id']===$staff['id'])accountError(422,'CANNOT_REVOKE_OWNER');
  platformTransaction(function()use($company,$staff,$active,$u){
   $old=accountQuery('SELECT id FROM idea_company_staff WHERE company_id=? AND user_id=?'.platformLock(),[$company,$staff['id']])->fetch();
   if($old)accountQuery("UPDATE idea_company_staff SET active=?,updated_at=? WHERE company_id=? AND user_id=?",[(int)$active,mpNow(),$company,$staff['id']]);
   else accountQuery('INSERT INTO idea_company_staff(id,company_id,user_id,role,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',[platformId(),$company,$staff['id'],'manager',(int)$active,mpNow(),mpNow()]);
   // The scope is enforced by company owner/admin checks before this transaction.
  });
  mpOut(['saved'=>true,'scope'=>'this_company_only']);
 }
 if($action==='company-suspend'||$action==='company-status'){
  if(!$admin)accountError(403,'ADMIN_REQUIRED');
  $row=accountQuery('SELECT id,status FROM idea_companies WHERE id=?',[$company])->fetch();
  if(!$row)accountError(404,'COMPANY_NOT_FOUND');
  $next=$action==='company-suspend'?'suspended':mpStr($data,'status',24,true);
  if(!in_array($next,['verified','suspended'],true))accountError(422,'INVALID_COMPANY_STATE');
  if($next==='verified'&&($data['reviewed']??false)!==true)
    accountError(422,'COMPANY_REVIEW_REQUIRED');
  platformTransaction(function()use($company,$next,$u){
    accountQuery('UPDATE idea_companies SET status=? WHERE id=?',[$next,$company]);
    if($next==='suspended')accountQuery('UPDATE idea_supplier_products SET active=0 WHERE company_id=?',[$company]);
    platformAudit($u,$next==='verified'?'company-verified':'company-suspended',$company);
  });
  mpOut(['saved'=>true,'state'=>$next,'products_remain_disabled'=>true]);
 }
 if($action==='ticker-save'){
  if(!$admin)accountError(403,'ADMIN_REQUIRED');
  $id=mpStr($data,'id',32)?:platformId();
  $ar=mpStr($data,'text_ar',500,true);$en=mpStr($data,'text_en',500,true);
  $path=mpStr($data,'link_path',300);
  if($path!==''&&(!str_starts_with($path,'/')||str_starts_with($path,'//')||str_contains($path,'\\')))accountError(422,'INVALID_LINK');
  $state=mpStr($data,'state',24,true);
  if(!in_array($state,['draft','published','archived'],true))accountError(422,'INVALID_STATE');
  $old=accountQuery('SELECT id,created_at FROM idea_marketplace_announcements WHERE id=?',[$id])->fetch();
  if($old)accountQuery('UPDATE idea_marketplace_announcements SET text_ar=?,text_en=?,link_path=?,state=?,updated_at=? WHERE id=?',[$ar,$en,$path,$state,mpNow(),$id]);
  else accountQuery('INSERT INTO idea_marketplace_announcements(id,text_ar,text_en,link_path,state,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',[$id,$ar,$en,$path,$state,mpNow(),mpNow()]);
  mpOut(['saved'=>true,'id'=>$id]);
 }
 if($action==='package-save'){
  if(!$admin)accountError(403,'ADMIN_REQUIRED');
  $id=mpStr($data,'id',40,true);
  $price=$data['price_cents']??null;
  $days=$data['duration_days']??null;
  $published=$data['is_published']??null;
  if(!is_int($price)||$price<0||$price>10000000000||!is_int($days)||$days<1||$days>365||!is_bool($published))accountError(422,'INVALID_PRICE_OR_DAYS');
  if(!accountQuery('SELECT id FROM idea_marketplace_ad_packages WHERE id=?',[$id])->fetch())accountError(404,'PACKAGE_NOT_FOUND');
  accountQuery('UPDATE idea_marketplace_ad_packages SET price_cents=?,duration_days=?,is_published=?,updated_at=? WHERE id=?',[$price,$days,(int)$published,mpNow(),$id]);
  mpOut(['saved'=>true]);
 }
 if($action==='ad-request'){
  mpNeedCompany($u,$company);
  $pack=mpStr($data,'package_id',40,true);
  $title=mpStr($data,'title',160,true);$msg=mpStr($data,'message',4000,true);
  $kind=mpStr($data,'media_kind',20,true);
  if(!in_array($kind,['image','video'],true))accountError(422,'INVALID_MEDIA_KIND');
  $pkg=accountQuery('SELECT id FROM idea_marketplace_ad_packages WHERE id=? AND is_published=1',[$pack])->fetch();
  if(!$pkg)accountError(409,'PACKAGE_NOT_AVAILABLE');
  $id=platformId();
  accountQuery("INSERT INTO idea_marketplace_ad_requests(id,company_id,user_id,package_id,title,message,media_kind,state,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'pending',?,?)",[$id,$company,$u['id'],$pack,$title,$msg,$kind,mpNow(),mpNow()]);
  mpOut(['saved'=>true,'id'=>$id,'status'=>'pending','video_requires_admin_spec_review'=>true]);
 }
 if($action==='ad-review'){
  if(!$admin)accountError(403,'ADMIN_REQUIRED');
  $id=mpStr($data,'id',32,true);$state=mpStr($data,'state',25,true);
  if(!in_array($state,['pending','needs_revision','approved','rejected'],true))accountError(422,'INVALID_STATE');
  $notes=mpStr($data,'notes',2500);
  accountQuery('UPDATE idea_marketplace_ad_requests SET state=?,admin_notes=?,updated_at=? WHERE id=?',[$state,$notes,mpNow(),$id]);
  platformAudit($u,'advert-review',$id);
  mpOut(['saved'=>true,'publishing_separate'=>true]);
 }
 accountError(404,'UNKNOWN_ACTION');
}catch(IdeaAccountError $e){
 http_response_code($e->status);
 echo json_encode(['error'=>$e->getMessage()],JSON_UNESCAPED_UNICODE);
}catch(Throwable $e){
 error_log('IDEA marketplace: '.get_class($e));
 http_response_code(500);
 echo json_encode(['error'=>'MARKETPLACE_UNAVAILABLE']);
}
