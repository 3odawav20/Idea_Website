<?php
declare(strict_types=1);
if(realpath($_SERVER['SCRIPT_FILENAME']??'')===__FILE__){http_response_code(404);exit;}
function ideaAdmin(array $u): void {if($u['role']!=='admin')accountError(403,'ADMIN_REQUIRED');}
function ideaAdminOverview(array $u): array {
 ideaAdmin($u);$companies=accountQuery('SELECT * FROM idea_companies ORDER BY created_at DESC')->fetchAll();foreach($companies as &$company)$company['business_details']=json_decode($company['business_details'],true)?:[];
 return ['companies'=>$companies,'memberships'=>accountQuery('SELECT m.*,u.name,u.email FROM idea_memberships m JOIN idea_users u ON u.id=m.user_id ORDER BY m.updated_at DESC LIMIT 500')->fetchAll(),'audit'=>accountQuery('SELECT id,action,subject_id,created_at FROM idea_admin_audit ORDER BY created_at DESC LIMIT 100')->fetchAll(),'requests'=>accountQuery('SELECT r.*,u.name AS buyer_name,u.email AS buyer_email FROM idea_quote_requests r JOIN idea_users u ON u.id=r.buyer_id ORDER BY r.created_at DESC LIMIT 200')->fetchAll(),
  'quotes'=>accountQuery('SELECT q.*,c.public_name AS company_name,r.product_title FROM idea_price_quotes q JOIN idea_companies c ON c.id=q.company_id JOIN idea_quote_requests r ON r.id=q.request_id ORDER BY q.created_at DESC LIMIT 500')->fetchAll(),
  'users'=>accountQuery('SELECT id,name,email,role FROM idea_users ORDER BY created_at DESC LIMIT 500')->fetchAll(),
  'products'=>accountQuery('SELECT p.id,p.title,p.active,p.company_id,p.catalog_product_id,c.public_name AS company_name,c.status AS company_status FROM idea_supplier_products p JOIN idea_companies c ON c.id=p.company_id ORDER BY p.created_at DESC LIMIT 500')->fetchAll()];
}
function ideaAdminAction(string $action,array $data,array $u): never {
 ideaAdmin($u);$id=accountString($data,'id',32,true);$now=(int)(microtime(true)*1000);
 if($action==='admin-company'){
   $status=$data['status']??'';if(!in_array($status,['submitted','verified','rejected','suspended'],true))accountError(422,'INVALID_FIELDS');
   $exists=accountQuery('SELECT id FROM idea_companies WHERE id=?',[$id])->fetch();if(!$exists)accountError(404,'NOT_FOUND');
   accountQuery('UPDATE idea_companies SET status=? WHERE id=?',[$status,$id]);
   accountQuery('INSERT INTO idea_admin_audit(id,admin_id,action,subject_id,created_at) VALUES(?,?,?,?,?)',[bin2hex(random_bytes(16)),$u['id'],'company:'.$status,$id,$now]);reply(['ok'=>true]);
 }
 if($action==='admin-reply'){
   $body=accountString($data,'body',4000,true);if(!accountQuery('SELECT id FROM idea_users WHERE id=?',[$id])->fetch())accountError(404,'NOT_FOUND');
   accountQuery('INSERT INTO idea_admin_messages(id,user_id,admin_id,body,created_at) VALUES(?,?,?,?,?)',[bin2hex(random_bytes(16)),$id,$u['id'],$body,$now]);reply(['ok'=>true]);
 }
 accountError(404,'NOT_FOUND');
}
