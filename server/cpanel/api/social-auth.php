<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
require_once __DIR__.'/accounts-db.php';

function socialJson(array $data,int $status=200): never {
  http_response_code($status);
  echo json_encode($data,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
  exit;
}
function socialFail(string $code,int $status=400): never {
  socialJson(['ok'=>false,'error'=>$code],$status);
}
function socialConfig(): array {
  $path=dirname(__DIR__,2).'/idea-social-config.php';
  if(!is_file($path)||!is_readable($path))return [];
  $value=require $path;
  return is_array($value)?$value:[];
}
function socialReady(string $provider,array $config): bool {
  if($provider==='phone'){
    $t=$config['twilio']??[];
    return is_array($t)&&!empty($t['account_sid'])&&!empty($t['auth_token'])&&!empty($t['verify_service_sid']);
  }
  if(!in_array($provider,['google','facebook','x'],true))return false;
  $c=$config[$provider]??[];
  return is_array($c)&&!empty($c['client_id'])&&!empty($c['client_secret']);
}
function socialCallbackUri(string $provider,array $config): string {
  if($provider==='google'){
    $uri=trim((string)($config['google']['redirect_uri']??'https://idea-dh.com'));
    if($uri!=='https://idea-dh.com')socialFail('GOOGLE_REDIRECT_URI_INVALID',503);
    return $uri;
  }
  return 'https://idea-dh.com/api/social-auth.php?action=callback&provider='.rawurlencode($provider);
}
function socialTableReady(): bool {
  try{return (bool)accountQuery("SHOW TABLES LIKE 'idea_auth_identities'")->fetchColumn();}
  catch(Throwable $e){return false;}
}
function socialNetwork(string $url,?array $post=null,array $headers=[],?string $basic=null): array {
  if(!function_exists('curl_init'))socialFail('SOCIAL_CURL_REQUIRED',503);
  $handle=curl_init($url);
  $options=[
    CURLOPT_RETURNTRANSFER=>true,
    CURLOPT_FOLLOWLOCATION=>false,
    CURLOPT_CONNECTTIMEOUT=>8,
    CURLOPT_TIMEOUT=>20,
    CURLOPT_SSL_VERIFYPEER=>true,
    CURLOPT_SSL_VERIFYHOST=>2,
    CURLOPT_HTTPHEADER=>array_merge(['Accept: application/json'],$headers)
  ];
  if($post!==null){
    $options[CURLOPT_POST]=true;
    $options[CURLOPT_POSTFIELDS]=http_build_query($post,'','&',PHP_QUERY_RFC3986);
  }
  if($basic!==null)$options[CURLOPT_USERPWD]=$basic;
  curl_setopt_array($handle,$options);
  $response=curl_exec($handle);
  $status=(int)curl_getinfo($handle,CURLINFO_HTTP_CODE);
  curl_close($handle);
  if(!is_string($response)||$status<200||$status>=300||strlen($response)>100000) socialFail('SOCIAL_PROVIDER_UNAVAILABLE',502);
  $result=json_decode($response,true);
  if(!is_array($result))socialFail('SOCIAL_PROVIDER_RESPONSE_INVALID',502);
  return $result;
}
function socialIssueLogin(string $provider,string $subject,string $name,?string $verifiedEmail=null,?string $phone=null): array {
  if(!preg_match('/^[a-z0-9_-]{1,20}$/D',$provider)||strlen($subject)<1||strlen($subject)>190)socialFail('INVALID_IDENTITY',422);
  $db=accountDb();
  $db->beginTransaction();
  try{
    $row=accountQuery('SELECT user_id FROM idea_auth_identities WHERE provider=? AND subject=?',[$provider,$subject])->fetch();
    if($row){
      $userId=$row['user_id'];
    }else{
      $userId=bin2hex(random_bytes(16));
      $cleanName=trim(mb_substr($name,0,120));
      if(!$cleanName)$cleanName=ucfirst($provider).' member';
      $email=strtolower(trim((string)$verifiedEmail));
      if($email&&!filter_var($email,FILTER_VALIDATE_EMAIL))$email='';
      if($email&&accountQuery('SELECT id FROM idea_users WHERE email=?',[$email])->fetch()){
        $db->rollBack();
        socialFail('EMAIL_ALREADY_REGISTERED_SIGN_IN_FIRST',409);
      }
      if(!$email)$email=$provider.'-'.substr(hash('sha256',$subject),0,32).'@identity.invalid';
      $now=(int)round(microtime(true)*1000);
      accountQuery('INSERT INTO idea_users(id,email,name,password_hash,role,phone,created_at) VALUES(?,?,?,?,?,?,?)',
        [$userId,$email,$cleanName,password_hash(bin2hex(random_bytes(32)),PASSWORD_DEFAULT),'buyer',$phone??'',$now]);
      accountQuery('INSERT INTO idea_memberships(user_id,audience,billing_interval,status,updated_at) VALUES(?,?,?,?,?)',
        [$userId,'customer','monthly','active',$now]);
      accountQuery('INSERT INTO idea_auth_identities(user_id,provider,subject,created_at) VALUES(?,?,?,?)',
        [$userId,$provider,$subject,$now]);
    }
    $db->commit();
  }catch(Throwable $e){
    if($db->inTransaction())$db->rollBack();
    error_log('IDEA social identity database failure');
    socialFail('SOCIAL_ACCOUNT_UNAVAILABLE',503);
  }
  accountSession();
  session_regenerate_id(true);
  $_SESSION['uid']=$userId;
  $_SESSION['csrf']=bin2hex(random_bytes(32));
  return accountSnapshot(accountUser());
}
function socialRedirect(string $error=''): never {
  header('Location: /'.($error?'login?social_error='.rawurlencode($error):'account'),true,303);
  exit;
}
try{
  $action=(string)($_GET['action']??'providers');
  $method=$_SERVER['REQUEST_METHOD']??'GET';
  $config=socialConfig();
  if($method==='GET'&&$action==='providers'){
    $enabled=socialTableReady();
    socialJson(['ok'=>true,'providers'=>[
      'google'=>$enabled&&socialReady('google',$config),
      'apple'=>false, // Requires Apple Developer keys and verified callback; never advertise before implementation.
      'facebook'=>$enabled&&socialReady('facebook',$config),
      'x'=>$enabled&&socialReady('x',$config),
      'whatsapp'=>$enabled&&socialReady('phone',$config)&&(($config['twilio']['whatsapp_enabled']??false)===true),
      'phone'=>$enabled&&socialReady('phone',$config)
    ]]);
  }
  if($method==='GET'&&$action==='start'){
    if(($_SERVER['HTTPS']??'')==='off'||empty($_SERVER['HTTPS']))socialFail('HTTPS_REQUIRED',403);
    $provider=(string)($_GET['provider']??'');
    if(!socialTableReady()||!socialReady($provider,$config))socialFail('PROVIDER_NOT_CONFIGURED',503);
    accountSession();
    $state=bin2hex(random_bytes(24));
    $verifier=bin2hex(random_bytes(32));
    $_SESSION['social_flow']=['provider'=>$provider,'state_hash'=>hash('sha256',$state),
      'code_verifier'=>$verifier,'expires'=>time()+600];
    $callback=socialCallbackUri($provider,$config);
    $c=$config[$provider];
    if($provider==='google'){
      $url='https://accounts.google.com/o/oauth2/v2/auth';
      $args=['client_id'=>$c['client_id'],'redirect_uri'=>$callback,'response_type'=>'code',
        'scope'=>'openid email profile','state'=>$state,'prompt'=>'select_account',
        'code_challenge'=>rtrim(strtr(base64_encode(hash('sha256',$verifier,true)),'+/','-_'),'='),
        'code_challenge_method'=>'S256'];
    }elseif($provider==='facebook'){
      $url='https://www.facebook.com/v27.0/dialog/oauth';
      $args=['client_id'=>$c['client_id'],'redirect_uri'=>$callback,'response_type'=>'code',
        'scope'=>'public_profile,email','state'=>$state];
    }else{
      $url='https://x.com/i/oauth2/authorize';
      $challenge=rtrim(strtr(base64_encode(hash('sha256',$verifier,true)),'+/','-_'),'=');
      $args=['client_id'=>$c['client_id'],'redirect_uri'=>$callback,'response_type'=>'code',
        'scope'=>'users.read tweet.read','state'=>$state,'code_challenge'=>$challenge,'code_challenge_method'=>'S256'];
    }
    header('Content-Type: text/plain; charset=utf-8');
    header('Location: '.$url.'?'.http_build_query($args,'','&',PHP_QUERY_RFC3986),true,302);
    exit;
  }
  if($method==='GET'&&$action==='callback'){
    accountSession();
    $flow=$_SESSION['social_flow']??null;
    unset($_SESSION['social_flow']);
    $provider=(string)($_GET['provider']??'');
    if(!is_array($flow)||!hash_equals((string)($flow['provider']??''),$provider)
       ||time()>(int)($flow['expires']??0)
       ||!hash_equals((string)($flow['state_hash']??''),hash('sha256',(string)($_GET['state']??'')))
       ||!socialReady($provider,$config))socialRedirect('SOCIAL_STATE_INVALID');
    $code=(string)($_GET['code']??'');
    if($code===''||strlen($code)>2000)socialRedirect('SOCIAL_AUTH_DECLINED');
    $callback=socialCallbackUri($provider,$config);
    $c=$config[$provider];
    if($provider==='google'){
      $token=socialNetwork('https://oauth2.googleapis.com/token',[
        'code'=>$code,'client_id'=>$c['client_id'],'client_secret'=>$c['client_secret'],
        'redirect_uri'=>$callback,'grant_type'=>'authorization_code','code_verifier'=>(string)$flow['code_verifier']
      ]);
      $access=$token['access_token']??'';
      if(!is_string($access)||!$access)socialRedirect('SOCIAL_TOKEN_INVALID');
      $info=socialNetwork('https://openidconnect.googleapis.com/v1/userinfo',null,['Authorization: Bearer '.$access]);
      $sub=(string)($info['sub']??'');
      $email=($info['email_verified']??false)===true?(string)($info['email']??''):null;
      $name=(string)($info['name']??'Google member');
    }elseif($provider==='facebook'){
      $token=socialNetwork('https://graph.facebook.com/v27.0/oauth/access_token',[
        'client_id'=>$c['client_id'],'client_secret'=>$c['client_secret'],
        'redirect_uri'=>$callback,'code'=>$code
      ]);
      $access=$token['access_token']??'';
      if(!is_string($access)||!$access)socialRedirect('SOCIAL_TOKEN_INVALID');
      $info=socialNetwork('https://graph.facebook.com/v27.0/me?fields=id,name',null,['Authorization: Bearer '.$access]);
      $sub=(string)($info['id']??'');$email=null;
      $name=(string)($info['name']??'Facebook member');
    }else{
      $token=socialNetwork('https://api.x.com/2/oauth2/token',[
        'code'=>$code,'grant_type'=>'authorization_code','client_id'=>$c['client_id'],
        'redirect_uri'=>$callback,'code_verifier'=>(string)$flow['code_verifier']
      ],[],(string)$c['client_id'].':'.(string)$c['client_secret']);
      $access=$token['access_token']??'';
      if(!is_string($access)||!$access)socialRedirect('SOCIAL_TOKEN_INVALID');
      $info=socialNetwork('https://api.x.com/2/users/me',null,['Authorization: Bearer '.$access]);
      $sub=(string)($info['data']['id']??'');$email=null;
      $name=(string)($info['data']['name']??'X member');
    }
    if($sub===''||strlen($sub)>190)socialRedirect('SOCIAL_IDENTITY_MISSING');
    socialIssueLogin($provider,$sub,$name,$email);
    socialRedirect();
  }
  if($method==='POST'&&in_array($action,['phone-send','phone-check'],true)){
    if(!socialTableReady()||!socialReady('phone',$config))socialFail('SMS_NOT_CONFIGURED',503);
    accountSession();
    accountCsrf();
    if((int)($_SERVER['CONTENT_LENGTH']??0)>4096)socialFail('INVALID_REQUEST',413);
    $body=json_decode(file_get_contents('php://input',false,null,0,4097),true);
    if(!is_array($body))socialFail('INVALID_REQUEST',400);
    $phone=trim((string)($body['phone']??''));
    if(!preg_match('/^\+[1-9][0-9]{7,14}$/D',$phone))socialFail('PHONE_INVALID',422);
    $twilio=$config['twilio'];
    $service=(string)$twilio['verify_service_sid'];
    if(!preg_match('/^VA[0-9a-fA-F]{32}$/D',$service))socialFail('SMS_NOT_CONFIGURED',503);
    if($action==='phone-send'){
      $channel=(string)($body['channel']??'sms');
      if(!in_array($channel,['sms','whatsapp'],true))socialFail('CHANNEL_INVALID',422);
      if($channel==='whatsapp'&&(($twilio['whatsapp_enabled']??false)!==true))socialFail('WHATSAPP_NOT_CONFIGURED',503);
      accountRate('phone-send',5,3600);
      $result=socialNetwork('https://verify.twilio.com/v2/Services/'.$service.'/Verifications',
        ['To'=>$phone,'Channel'=>$channel],[],(string)$twilio['account_sid'].':'.(string)$twilio['auth_token']);
      if(($result['status']??'')!=='pending')socialFail('SMS_DELIVERY_NOT_CONFIRMED',502);
      socialJson(['ok'=>true,'status'=>'pending']);
    }
    accountRate('phone-check',10,900);
    $code=trim((string)($body['code']??''));
    if(!preg_match('/^[0-9]{4,10}$/D',$code))socialFail('CODE_INVALID',422);
    $result=socialNetwork('https://verify.twilio.com/v2/Services/'.$service.'/VerificationCheck',
      ['To'=>$phone,'Code'=>$code],[],(string)$twilio['account_sid'].':'.(string)$twilio['auth_token']);
    if(($result['status']??'')!=='approved')socialFail('CODE_NOT_VERIFIED',401);
    $identity=socialIssueLogin('phone',hash('sha256',$phone),'Mobile member',null,$phone);
    socialJson(array_merge(['ok'=>true],$identity));
  }
  socialFail('METHOD_NOT_ALLOWED',405);
}catch(IdeaAccountError $e){socialFail($e->getMessage(),$e->status);}
catch(Throwable $e){error_log('IDEA social authentication unexpectedly unavailable');socialFail('SOCIAL_AUTH_UNAVAILABLE',503);}
