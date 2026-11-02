<?php
declare(strict_types=1);
if(realpath($_SERVER['SCRIPT_FILENAME']??'')===__FILE__){http_response_code(404);exit;}

/* IDEA supplier eligibility is verified on the server; image similarity is not identity. */
function ideaCatalogueIndex(): array {
 static $index=null;
 if($index===null){$index=json_decode((string)file_get_contents(__DIR__.'/catalogue-index.json'),true);if(!is_array($index))$index=[];}
 return $index;
}
function ideaDimensionsMatch(string $reported,string $canonical): bool {
 $normalise=static function(string $value): ?array {
  $value=strtolower(preg_replace('/\s+/u','',str_replace(['×','*'],'x',trim($value))));
  if(!preg_match('/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)(?:cm)?$/u',$value,$m))return null;
  $dims=[(float)$m[1],(float)$m[2]];sort($dims,SORT_NUMERIC);return $dims;
 };
 $a=$normalise($reported);$b=$normalise($canonical);
 return $a!==null&&$b!==null&&$a===$b;
}
function ideaReviewedProduct(array $p): bool {
 if(empty($p['active'])||empty($p['catalog_product_id']))return false;
 $catalogue=ideaCatalogueIndex();$catalog=$catalogue[$p['catalog_product_id']]??null;
 if(!is_array($catalog))return false;
 $spec=json_decode((string)($p['specifications']??''),true);
 return is_array($spec)
  && trim((string)($spec['manufacturer_name']??''))!==''
  && trim((string)($spec['manufacturer_model']??''))!==''
  && trim((string)($spec['manufacturer_evidence']??''))!==''
  && preg_match('/^[a-f0-9]{32}$/D',(string)($spec['manufacturer_verified_by']??''))===1
  && (int)($spec['manufacturer_verified_at']??0)>0
  && ideaDimensionsMatch((string)($spec['dimensions']??''),(string)($catalog['size']??''));
}
function ideaPublicProductSpecs(array $p): array {
 $spec=json_decode((string)($p['specifications']??''),true)?:[];
 unset($spec['manufacturer_evidence'],$spec['manufacturer_verified_by'],$spec['manufacturer_verified_at']);
 return $spec;
}
function ideaEligibleSupplierIds(string $key): array {
 $rows=accountQuery("SELECT p.* FROM idea_supplier_products p
 JOIN idea_companies c ON c.id=p.company_id
 JOIN idea_memberships m ON m.user_id=c.owner_id
 WHERE c.status='verified' AND m.audience='business' AND m.status='active'
 AND p.active=1 AND p.catalog_product_id<>'' AND p.product_key=?",[$key])->fetchAll();
 $ids=[];
 foreach($rows as $p)if(ideaReviewedProduct($p))$ids[$p['company_id']]=true;
 return array_keys($ids);
}
/* Admin approval is a separate authenticated decision from company verification. */
function ideaAdminSetProductPublication(array $u,array $data,string $id,int $now): void {
 if($u['role']!=='admin')accountError(403,'ADMIN_REQUIRED');
 $p=accountQuery("SELECT p.*,c.status AS company_status,m.status AS membership_status,m.audience AS membership_audience
 FROM idea_supplier_products p JOIN idea_companies c ON c.id=p.company_id
 LEFT JOIN idea_memberships m ON m.user_id=c.owner_id WHERE p.id=?",[$id])->fetch();
 if(!$p)accountError(404,'NOT_FOUND');
 $active=!empty($data['active']);
 if(!$active){
  accountQuery('UPDATE idea_supplier_products SET active=0 WHERE id=?',[$id]);
  accountQuery('INSERT INTO idea_admin_audit(id,admin_id,action,subject_id,created_at) VALUES(?,?,?,?,?)',
   [bin2hex(random_bytes(16)),$u['id'],'product:unpublished',$id,$now]);
  return;
 }
 if($p['company_status']!=='verified'||$p['membership_audience']!=='business'||$p['membership_status']!=='active')
  accountError(403,'ELIGIBLE_COMPANY_REQUIRED');
 if(!$p['catalog_product_id'])accountError(422,'CATALOGUE_CODE_REQUIRED');
 $catalogue=ideaCatalogueIndex();$canonical=$catalogue[$p['catalog_product_id']]??null;
 if(!is_array($canonical))accountError(422,'PRODUCT_NOT_FOUND');
 $spec=json_decode($p['specifications'],true)?:[];
 if(!ideaDimensionsMatch((string)($spec['dimensions']??''),(string)($canonical['size']??'')))
  accountError(422,'CATALOGUE_DIMENSIONS_MISMATCH');
 $manufacturer=accountString($data,'manufacturer_name',200,true);
 $model=accountString($data,'manufacturer_model',160,true);
 $evidence=accountString($data,'manufacturer_evidence',1000,true);
 // The same canonical code may be shared only by listings of the SAME factory and factory model.
 // A lookalike tile from another maker needs a separate canonical product ID.
 $peers=accountQuery('SELECT specifications FROM idea_supplier_products WHERE catalog_product_id=? AND id<>? AND active=1',[$p['catalog_product_id'],$id])->fetchAll();
 foreach($peers as $peer){
  $other=json_decode((string)$peer['specifications'],true)?:[];
  if(trim((string)($other['manufacturer_name']??''))!==$manufacturer
   || trim((string)($other['manufacturer_model']??''))!==$model)
   accountError(409,'CANONICAL_FACTORY_MODEL_CONFLICT');
 }
 $spec['manufacturer_name']=$manufacturer;
 $spec['manufacturer_model']=$model;
 $spec['manufacturer_evidence']=$evidence;
 $spec['manufacturer_verified_by']=$u['id'];
 $spec['manufacturer_verified_at']=$now;
 $db=accountDb();$db->beginTransaction();
 try{
  accountQuery('UPDATE idea_supplier_products SET active=1,specifications=? WHERE id=?',
   [json_encode($spec,JSON_UNESCAPED_UNICODE),$id]);
  accountQuery('INSERT INTO idea_admin_audit(id,admin_id,action,subject_id,created_at) VALUES(?,?,?,?,?)',
   [bin2hex(random_bytes(16)),$u['id'],'product:approved',$id,$now]);
  $requests=accountQuery('SELECT id FROM idea_quote_requests WHERE product_key=? AND deadline_at>?',
   [$p['product_key'],$now])->fetchAll();
  foreach($requests as $request){
   if(!accountQuery('SELECT request_id FROM idea_request_recipients WHERE request_id=? AND company_id=?',
     [$request['id'],$p['company_id']])->fetch()){
    accountQuery('INSERT INTO idea_request_recipients(request_id,company_id) VALUES(?,?)',
     [$request['id'],$p['company_id']]);
   }
  }
  $db->commit();
 }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
}