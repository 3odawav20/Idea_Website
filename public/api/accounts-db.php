<?php
declare(strict_types=1);
if (realpath($_SERVER['SCRIPT_FILENAME']??'') === __FILE__) { http_response_code(404); exit; }
class IdeaAccountError extends RuntimeException { public function __construct(public int $status, string $code) { parent::__construct($code); } }
function accountError(int $status,string $code): never { throw new IdeaAccountError($status,$code); }
function accountConfig(): array {
  $path=getenv('IDEA_ACCOUNTS_CONFIG') ?: dirname($_SERVER['DOCUMENT_ROOT']).'/idea-accounts-config.php';
  if(!is_file($path)) accountError(503,'ACCOUNTS_NOT_CONFIGURED');
  $config=require $path;if(!is_array($config))accountError(503,'ACCOUNTS_NOT_CONFIGURED');return $config;
}
function accountDb(): PDO {
  static $db=null;if($db)return $db;$config=accountConfig();
  // SQLite is only available to the local PHP test server; production always uses MySQL.
  $test=getenv('IDEA_ACCOUNT_TEST_SQLITE');
  if(PHP_SAPI==='cli-server'&&$test)$db=new PDO('sqlite:'.$test);
  else {$m=$config['mysql']??[];if(empty($m['database'])||empty($m['username']))accountError(503,'ACCOUNTS_NOT_CONFIGURED');
    $db=new PDO('mysql:host='.($m['host']??'localhost').';port='.(int)($m['port']??3306).';dbname='.$m['database'].';charset=utf8mb4',$m['username'],$m['password']??'');}
  $db->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);$db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE,PDO::FETCH_ASSOC);$db->setAttribute(PDO::ATTR_EMULATE_PREPARES,false);return $db;
}
function accountQuery(string $sql,array $params=[]): PDOStatement {$s=accountDb()->prepare($sql);$s->execute($params);return $s;}
function accountSession(): void {
  if(session_status()===PHP_SESSION_ACTIVE)return;
  ini_set('session.use_strict_mode','1');ini_set('session.use_only_cookies','1');session_name('IDEASESSID');
  session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off','httponly'=>true,'samesite'=>'Lax']);
  session_start();if(empty($_SESSION['csrf']))$_SESSION['csrf']=bin2hex(random_bytes(32));
  if(isset($_SESSION['uid'])&&($_SESSION['last_seen']??0)<time()-86400){unset($_SESSION['uid']);session_regenerate_id(true);$_SESSION['csrf']=bin2hex(random_bytes(32));}
  $_SESSION['last_seen']=time();
}
function accountCsrf(?string $token=null): void { accountSession();$token=$token??($_SERVER['HTTP_X_CSRF_TOKEN']??'');if(!$token||!hash_equals($_SESSION['csrf'],$token))accountError(403,'INVALID_CSRF'); }
function accountUser(bool $required=true): ?array {
  accountSession();$u=empty($_SESSION['uid'])?null:accountQuery('SELECT id,email,name,role,phone,created_at FROM idea_users WHERE id=?',[$_SESSION['uid']])->fetch();
  if(!$u){if($required)accountError(401,'AUTH_REQUIRED');return null;}return $u;
}
function accountCompany(array $user): array {if($user['role']!=='supplier')accountError(403,'COMPANY_REQUIRED');$c=accountQuery('SELECT * FROM idea_companies WHERE owner_id=?',[$user['id']])->fetch();if(!$c)accountError(403,'COMPANY_REQUIRED');return $c;}
function accountCustomer(array $user): void {if($user['role']!=='buyer'||accountQuery('SELECT id FROM idea_companies WHERE owner_id=?',[$user['id']])->fetch())accountError(403,'CUSTOMER_ONLY');}
function accountString(array $data,string $key,int $max,bool $required=false): string {
  $value=$data[$key]??'';if(!is_string($value)||strlen($value)>$max*4)accountError(422,'INVALID_FIELDS');$value=trim($value);
  if(preg_match_all('/./us',$value)>$max||($required&&$value===''))accountError(422,'INVALID_FIELDS');return $value;
}
function accountRate(string $kind,int $limit,int $window=900): void {
  $key=hash('sha256',$kind.'|'.($_SERVER['REMOTE_ADDR']??''));$now=time();$db=accountDb();$db->beginTransaction();
  try { $row=accountQuery('SELECT attempts,expires_at FROM idea_auth_attempts WHERE attempt_key=?',[$key])->fetch();
    if($row&&$row['expires_at']>$now&&$row['attempts']>=$limit){$db->rollBack();accountError(429,'TRY_LATER');}
    if($row&&$row['expires_at']>$now)accountQuery('UPDATE idea_auth_attempts SET attempts=attempts+1 WHERE attempt_key=?',[$key]);
    else {accountQuery('DELETE FROM idea_auth_attempts WHERE attempt_key=?',[$key]);accountQuery('INSERT INTO idea_auth_attempts(attempt_key,attempts,expires_at) VALUES(?,1,?)',[$key,$now+$window]);}
    $db->commit();
  }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
}
function accountSnapshot(?array $u): array {
  if(!$u)return ['user'=>null,'company'=>null,'membership'=>null,'csrf'=>$_SESSION['csrf']];
  $company=accountQuery('SELECT * FROM idea_companies WHERE owner_id=?',[$u['id']])->fetch()?:null;
  if($company)$company['business_details']=json_decode($company['business_details'],true)?:[];
  return ['user'=>$u,'company'=>$company,'membership'=>accountQuery('SELECT * FROM idea_memberships WHERE user_id=?',[$u['id']])->fetch()?:null,'csrf'=>$_SESSION['csrf']];
}
