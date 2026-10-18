<?php
declare(strict_types=1);
if(realpath($_SERVER['SCRIPT_FILENAME']??'')===__FILE__){http_response_code(404);exit;}

function ideaLockRequest(string $id): void {
  $suffix=accountDb()->getAttribute(PDO::ATTR_DRIVER_NAME)==='mysql'?' FOR UPDATE':'';
  if(!accountQuery('SELECT id FROM idea_quote_requests WHERE id=?'.$suffix,[$id])->fetch())accountError(404,'NOT_FOUND');
}
function ideaAssertOpenRequest(string $id): void {
  ideaLockRequest($id);
  if(accountQuery('SELECT request_id FROM idea_quote_awards WHERE request_id=?',[$id])->fetch())accountError(409,'REQUEST_ALREADY_AWARDED');
}
function ideaSignature(array $data): array {
  $strokes=$data['signature']??[];
  if(!is_array($strokes)||count($strokes)<1||count($strokes)>50)accountError(422,'SIGNATURE_REQUIRED');
  $points=0;
  foreach($strokes as $stroke){
    if(!is_array($stroke)||count($stroke)<2||count($stroke)>1000)accountError(422,'INVALID_SIGNATURE');
    foreach($stroke as $point){
      if(!is_array($point)||count($point)!==2||!is_numeric($point[0])||!is_numeric($point[1])||!is_finite((float)$point[0])||!is_finite((float)$point[1])||$point[0]<0||$point[0]>600||$point[1]<0||$point[1]>200)accountError(422,'INVALID_SIGNATURE');
      if(++$points>4000)accountError(422,'INVALID_SIGNATURE');
    }
  }
  return $strokes;
}
function ideaQuoteDetails(array $box): array {
  foreach($box['quotes'] as &$q){
    $signature=accountQuery('SELECT strokes,payment_terms,revision FROM idea_quote_signatures WHERE quote_id=?',[$q['id']])->fetch();
    $q['signature']=$signature?json_decode($signature['strokes'],true):null;
    $q['payment_terms']=$signature['payment_terms']??'';$q['revision']=$signature['revision']??0;
    $award=accountQuery('SELECT quote_id FROM idea_quote_awards WHERE request_id=?',[$q['request_id']])->fetch();
    $q['decision']=$award?($award['quote_id']===$q['id']?'accepted':'not-selected'):(accountQuery('SELECT quote_id FROM idea_quote_rejections WHERE quote_id=?',[$q['id']])->fetch()?'rejected':'submitted');
  }
  unset($q);return $box;
}
function ideaWorkflowAction(string $action,array $data,array $u): never {
  $now=(int)(microtime(true)*1000);$id=accountString($data,'id',32,true);
  if(in_array($action,['accept-quote','reject-quote'],true)){
    accountCustomer($u);$db=accountDb();$db->beginTransaction();
    try{
      $q=accountQuery('SELECT q.*,r.buyer_id FROM idea_price_quotes q JOIN idea_quote_requests r ON r.id=q.request_id WHERE q.id=? AND r.buyer_id=?',[$id,$u['id']])->fetch();
      if(!$q)accountError(404,'NOT_FOUND');ideaAssertOpenRequest($q['request_id']);
      if($action==='accept-quote'){
        if((int)$q['created_at']+(int)$q['validity_days']*86400000<$now)accountError(422,'QUOTE_EXPIRED');
        if(!accountQuery('SELECT id FROM idea_companies WHERE id=? AND status=?',[$q['company_id'],'verified'])->fetch())accountError(403,'COMPANY_UNVERIFIED');
        if(accountQuery('SELECT quote_id FROM idea_quote_rejections WHERE quote_id=?',[$id])->fetch())accountError(409,'QUOTE_REJECTED');
        if(!accountQuery('SELECT quote_id FROM idea_quote_signatures WHERE quote_id=?',[$id])->fetch())accountError(422,'SIGNATURE_REQUIRED');
        accountQuery('INSERT INTO idea_quote_awards(request_id,quote_id,buyer_id,created_at) VALUES(?,?,?,?)',[$q['request_id'],$id,$u['id'],$now]);
      }else{
        if(!accountQuery('SELECT quote_id FROM idea_quote_rejections WHERE quote_id=?',[$id])->fetch())accountQuery('INSERT INTO idea_quote_rejections(quote_id,buyer_id,created_at) VALUES(?,?,?)',[$id,$u['id'],$now]);
      }
      $db->commit();reply(['ok'=>true]);
    }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
  }
  ideaAdmin($u);
  if($action==='admin-membership'){
    $status=accountString($data,'status',16,true);if(!in_array($status,['active','requested','cancelled','suspended'],true))accountError(422,'INVALID_FIELDS');
    if(!accountQuery('SELECT user_id FROM idea_memberships WHERE user_id=?',[$id])->fetch())accountError(404,'NOT_FOUND');
    $db=accountDb();$db->beginTransaction();try{
      accountQuery('UPDATE idea_memberships SET status=?,updated_at=? WHERE user_id=?',[$status,$now,$id]);
      accountQuery('INSERT INTO idea_admin_audit(id,admin_id,action,subject_id,created_at) VALUES(?,?,?,?,?)',[bin2hex(random_bytes(16)),$u['id'],'membership:'.$status,$id,$now]);$db->commit();
    }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}reply(['ok'=>true]);
  }
  if($action==='admin-product'){
    $p=accountQuery('SELECT p.id,c.status FROM idea_supplier_products p JOIN idea_companies c ON c.id=p.company_id WHERE p.id=?',[$id])->fetch();
    if(!$p)accountError(404,'NOT_FOUND');$active=!empty($data['active'])?1:0;
    if($active&&$p['status']!=='verified')accountError(403,'COMPANY_UNVERIFIED');
    accountQuery('UPDATE idea_supplier_products SET active=? WHERE id=?',[$active,$id]);reply(['ok'=>true]);
  }
  if($action==='admin-invite'){
    $db=accountDb();$db->beginTransaction();try{
      ideaAssertOpenRequest($id);$r=accountQuery('SELECT * FROM idea_quote_requests WHERE id=?',[$id])->fetch();if($r['deadline_at']<$now)accountError(422,'REQUEST_EXPIRED');
      $matches=accountQuery("SELECT DISTINCT c.id FROM idea_companies c JOIN idea_supplier_products p ON p.company_id=c.id WHERE c.status='verified' AND p.active=1 AND p.product_key=?",[$r['product_key']])->fetchAll();$count=0;
      foreach($matches as $c){if(!accountQuery('SELECT request_id FROM idea_request_recipients WHERE request_id=? AND company_id=?',[$id,$c['id']])->fetch()){accountQuery('INSERT INTO idea_request_recipients(request_id,company_id) VALUES(?,?)',[$id,$c['id']]);$count++;}}
      $db->commit();reply(['ok'=>true,'invited'=>$count]);
    }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
  }
  accountError(404,'NOT_FOUND');
}
