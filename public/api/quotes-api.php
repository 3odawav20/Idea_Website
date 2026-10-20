<?php
declare(strict_types=1);
if(realpath($_SERVER['SCRIPT_FILENAME']??'')===__FILE__){http_response_code(404);exit;}
function ideaProductKey(string $catalog,string $title,array $spec): string {
  if($catalog!=='')return hash('sha256','catalog:'.$catalog);
  $parts=[$title,$spec['brand']??'',$spec['material']??'',$spec['dimensions']??''];
  return hash('sha256',implode('|',array_map(fn($v)=>strtolower(preg_replace('/\s+/u',' ',trim((string)$v))),$parts)));
}
function ideaCatalogueProduct(string $id): array {
  static $catalog=null;$catalog??=json_decode(file_get_contents(__DIR__.'/catalogue-index.json'),true);
  if(!isset($catalog[$id]))accountError(422,'PRODUCT_NOT_FOUND');return $catalog[$id];
}
function ideaMailbox(array $u): array {
  if($u['role']==='buyer'){
    $requests=accountQuery('SELECT r.*,(SELECT COUNT(*) FROM idea_request_recipients rr WHERE rr.request_id=r.id) AS recipient_count FROM idea_quote_requests r WHERE r.buyer_id=? ORDER BY r.created_at DESC',[$u['id']])->fetchAll();
    $quotes=accountQuery('SELECT q.*,c.public_name AS company_name,r.product_title,r.unit,r.buyer_id FROM idea_price_quotes q JOIN idea_quote_requests r ON r.id=q.request_id JOIN idea_companies c ON c.id=q.company_id WHERE r.buyer_id=? ORDER BY q.created_at DESC',[$u['id']])->fetchAll();
  }else{
    $c=accountCompany($u);
    $requests=accountQuery('SELECT r.*,rr.read_at FROM idea_quote_requests r JOIN idea_request_recipients rr ON rr.request_id=r.id WHERE rr.company_id=? ORDER BY r.created_at DESC',[$c['id']])->fetchAll();
    $quotes=accountQuery('SELECT q.*,r.product_title,r.unit FROM idea_price_quotes q JOIN idea_quote_requests r ON r.id=q.request_id WHERE q.company_id=? ORDER BY q.created_at DESC',[$c['id']])->fetchAll();
  }
  return ['requests'=>$requests,'quotes'=>$quotes,'messages'=>accountQuery('SELECT id,body,created_at FROM idea_admin_messages WHERE user_id=? ORDER BY created_at DESC',[$u['id']])->fetchAll()];
}
function ideaQuoteAction(string $action,array $data,array $u): never {
  $now=(int)(microtime(true)*1000);
  if($action==='request-quotes'){
    accountCustomer($u);$items=$data['items']??[];if(!is_array($items)||!count($items)||count($items)>20)accountError(422,'INVALID_FIELDS');
    $gov=accountString($data,'governorate',200,true);$destination=accountString($data,'destination',1000);$delivery=accountString($data,'delivery_date',30);$notes=accountString($data,'notes',4000);$hours=($data['hours']??24)===48?48:24;
    $db=accountDb();$db->beginTransaction();$created=[];
    try{foreach($items as $item){
      if(!is_array($item))accountError(422,'INVALID_FIELDS');$qty=$item['quantity']??0;$unit=$item['unit']??'';
      if(!is_numeric($qty)||$qty<=0||$qty>1000000||!in_array($unit,['sqm','pieces','ton','kg'],true))accountError(422,'INVALID_FIELDS');
      if(!empty($item['supplier_product_id'])){
        $p=accountQuery("SELECT p.* FROM idea_supplier_products p JOIN idea_companies c ON c.id=p.company_id WHERE p.id=? AND p.active=1 AND c.status='verified'",[accountString($item,'supplier_product_id',32,true)])->fetch();if(!$p)accountError(404,'PRODUCT_NOT_FOUND');$key=$p['product_key'];$title=$p['title'];
      }else{$catalog=accountString($item,'product_id',100,true);$p=ideaCatalogueProduct($catalog);$key=ideaProductKey($catalog,$p['name'],[]);$title=$p['name'];}
      $id=bin2hex(random_bytes(16));accountQuery('INSERT INTO idea_quote_requests(id,buyer_id,product_key,product_title,quantity,unit,governorate,destination,delivery_date,notes,deadline_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',[$id,$u['id'],$key,$title,$qty,$unit,$gov,$destination,$delivery,$notes,$now+$hours*3600000,$now]);
      $matches=accountQuery("SELECT DISTINCT c.id FROM idea_companies c JOIN idea_supplier_products p ON p.company_id=c.id WHERE c.status='verified' AND p.active=1 AND p.product_key=?",[$key])->fetchAll();
      foreach($matches as $match)accountQuery('INSERT INTO idea_request_recipients(request_id,company_id) VALUES(?,?)',[$id,$match['id']]);
      $created[]=['id'=>$id,'recipient_count'=>count($matches)];
    }$db->commit();}catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}reply(['requests'=>$created]);
  }
  if($action==='price-quote'){
    $c=accountCompany($u);if($c['status']!=='verified')accountError(403,'COMPANY_UNVERIFIED');$id=accountString($data,'request_id',32,true);
    $r=accountQuery('SELECT r.* FROM idea_quote_requests r JOIN idea_request_recipients rr ON rr.request_id=r.id WHERE r.id=? AND rr.company_id=?',[$id,$c['id']])->fetch();
    if(!$r)accountError(404,'NOT_FOUND');if($r['deadline_at']<$now)accountError(422,'REQUEST_EXPIRED');
    foreach(['unit_price','quantity','shipping','tax_percent','delivery_days','validity_days'] as $key){if(!isset($data[$key])||!is_numeric($data[$key])||!is_finite((float)$data[$key]))accountError(422,'INVALID_FIELDS');}
    $price=round((float)$data['unit_price'],2);$quantity=(float)$data['quantity'];$shipping=round((float)$data['shipping'],2);$tax=(float)$data['tax_percent'];$days=(int)$data['delivery_days'];$valid=(int)$data['validity_days'];
    if($price<0||$price>10000000||$quantity<=0||$quantity>(float)$r['quantity']||$shipping<0||$shipping>10000000||$tax<0||$tax>100||$days<0||$days>365||$valid<1||$valid>90)accountError(422,'INVALID_FIELDS');
    $total=round($price*$quantity*(1+$tax/100)+$shipping,2);$notes=accountString($data,'notes',4000);
    $signature=ideaSignature($data);$terms=accountString($data,'payment_terms',2000,true);
    $db=accountDb();$db->beginTransaction();try{ideaAssertOpenRequest($id);$old=accountQuery('SELECT id FROM idea_price_quotes WHERE request_id=? AND company_id=?',[$id,$c['id']])->fetch();$quoteId=$old['id']??bin2hex(random_bytes(16));
      if($old)accountQuery('UPDATE idea_price_quotes SET unit_price=?,quantity=?,shipping=?,tax_percent=?,total=?,delivery_days=?,validity_days=?,notes=?,buyer_read_at=NULL,created_at=? WHERE id=?',[$price,$quantity,$shipping,$tax,$total,$days,$valid,$notes,$now,$old['id']]);
      else accountQuery('INSERT INTO idea_price_quotes(id,request_id,company_id,unit_price,quantity,shipping,tax_percent,total,delivery_days,validity_days,notes,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',[$quoteId,$id,$c['id'],$price,$quantity,$shipping,$tax,$total,$days,$valid,$notes,$now]);
      $previous=accountQuery('SELECT revision FROM idea_quote_signatures WHERE quote_id=?',[$quoteId])->fetch();
      accountQuery('DELETE FROM idea_quote_signatures WHERE quote_id=?',[$quoteId]);
      accountQuery('DELETE FROM idea_quote_rejections WHERE quote_id=?',[$quoteId]);
      accountQuery('INSERT INTO idea_quote_signatures(quote_id,strokes,payment_terms,revision,signed_at) VALUES(?,?,?,?,?)',[$quoteId,json_encode($signature),$terms,(int)($previous['revision']??0)+1,$now]);
      $db->commit();
    }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}reply(['ok'=>true,'total'=>$total]);
  }
  if($action==='read-message'){
    $id=accountString($data,'id',32,true);
    if($u['role']==='buyer')accountQuery('UPDATE idea_price_quotes SET buyer_read_at=? WHERE id=? AND request_id IN(SELECT id FROM idea_quote_requests WHERE buyer_id=?)',[$now,$id,$u['id']]);
    else{$c=accountCompany($u);accountQuery('UPDATE idea_request_recipients SET read_at=? WHERE request_id=? AND company_id=?',[$now,$id,$c['id']]);}
    reply(['ok'=>true]);
  }
  accountError(404,'NOT_FOUND');
}
