<?php
/**
 * IDEA Egypt — OAuth 2.0 / OIDC server module (not deployed, disabled by default).
 * Five adapters: Google, Facebook, Apple, X, Microsoft.
 * The existing PRIVATE MySQL account bridge must authorize and issue the
 * real PHP session. This module NEVER creates accounts or assigns roles.
 *
 * Prerequisite: a tested private /home/lsenet5/idea_private/oauth-config.php,
 * a private auth-bridge.php exposing ideaAuthLoginVerifiedOAuth(), and actual
 * provider app credentials/callback registrations.
 */
declare(strict_types=1);

const IDEA_OAUTH_NAMES = ['google','facebook','apple','twitter','azure'];

function ideaOauthFail(int $status, string $error): never {
    http_response_code($status);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store, private');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    echo 'IDEA OAuth: '.$error;
    exit;
}
function ideaOauthB64(string $binary): string {
    return rtrim(strtr(base64_encode($binary), '+/', '-_'), '=');
}
function ideaOauthUnb64(string $value): string {
    if (!preg_match('/^[A-Za-z0-9_-]{1,10000}$/D',$value)) ideaOauthFail(401,'INVALID_TOKEN');
    $s=base64_decode(strtr($value,'-_','+/').str_repeat('=', (4-strlen($value)%4)%4),true);
    if (!is_string($s)) ideaOauthFail(401,'INVALID_TOKEN');
    return $s;
}
function ideaOauthPrivateFile(string $path): string {
    $file=realpath($path);
    $root=realpath((string)($_SERVER['DOCUMENT_ROOT']??''));
    if ($file===false||!is_file($file)||$root===false||str_starts_with($file,rtrim($root,'/').'/')) {
        ideaOauthFail(503,'PRIVATE_CONFIG_REQUIRED');
    }
    return $file;
}
function ideaOauthContext(string $provider): array {
    if (!in_array($provider,IDEA_OAUTH_NAMES,true)) ideaOauthFail(404,'UNKNOWN_PROVIDER');
    $https=($_SERVER['HTTPS']??'')==='on'||(string)($_SERVER['SERVER_PORT']??'')==='443';
    if (!$https) ideaOauthFail(403,'HTTPS_REQUIRED');
    $path=getenv('IDEA_OAUTH_CONFIG_FILE')?:'/home/lsenet5/idea_private/oauth-config.php';
    $file=ideaOauthPrivateFile($path);
    $all=require $file;
    if (!is_array($all)||($all['bridge_verified']??false)!==true) ideaOauthFail(503,'BRIDGE_NOT_READY');
    $site=rtrim((string)($all['site_url']??''),'/');
    if ($site!=='https://idea-dh.com') ideaOauthFail(503,'INVALID_SITE_URL');
    $bridge=getenv('IDEA_AUTH_BRIDGE_FILE')?:'/home/lsenet5/idea_private/auth-bridge.php';
    require_once ideaOauthPrivateFile($bridge);
    if (!function_exists('ideaAuthLoginVerifiedOAuth')) ideaOauthFail(503,'BRIDGE_NOT_READY');
    $cfg=$all['providers'][$provider]??null;
    if (!is_array($cfg)) ideaOauthFail(503,'PROVIDER_NOT_CONFIGURED');
    $required=['client_id','client_secret'];
    if ($provider==='apple') $required=['services_id','team_id','key_id','private_key_file'];
    if ($provider==='azure') $required=['client_id','client_secret','tenant'];
    foreach ($required as $name) {
        if (!is_string($cfg[$name]??null)||trim($cfg[$name])==='') ideaOauthFail(503,'PROVIDER_NOT_CONFIGURED');
    }
    return [$all,$cfg,$file];
}
function ideaOauthDirectory(string $configFile): string {
    $d=dirname($configFile).'/oauth-flow';
    if ((!is_dir($d) && !mkdir($d,0700,true))||!is_dir($d)) ideaOauthFail(503,'STATE_STORAGE_UNAVAILABLE');
    return $d;
}
function ideaOauthCallbackUrl(string $provider): string {
    return 'https://idea-dh.com/idea-accounts-api/oauth/'.$provider.'/callback/';
}
function ideaOauthClientId(string $provider, array $cfg): string {
    return $provider==='apple' ? $cfg['services_id'] : $cfg['client_id'];
}
function ideaOauthEndpoints(string $provider, array $cfg): array {
    return match($provider){
        'google'=>['https://accounts.google.com/o/oauth2/v2/auth','https://oauth2.googleapis.com/token','openid email profile'],
        'facebook'=>['https://www.facebook.com/v24.0/dialog/oauth','https://graph.facebook.com/v24.0/oauth/access_token','email public_profile'],
        'apple'=>['https://appleid.apple.com/auth/authorize','https://appleid.apple.com/auth/token','name email'],
        'twitter'=>['https://twitter.com/i/oauth2/authorize','https://api.x.com/2/oauth2/token','tweet.read users.read'],
        'azure'=>['https://login.microsoftonline.com/common/oauth2/v2.0/authorize','https://login.microsoftonline.com/common/oauth2/v2.0/token','openid email profile'],
        default=>ideaOauthFail(404,'UNKNOWN_PROVIDER')
    };
}
function ideaOauthBaseHeaders(): void {
    header('Cache-Control: no-store, private');
    header('Referrer-Policy: no-referrer');
    header('X-Content-Type-Options: nosniff');
}
function ideaOauthStart(string $provider): never {
    [$all,$cfg,$privateFile]=ideaOauthContext($provider);
    if (($_SERVER['REQUEST_METHOD']??'')!=='GET') ideaOauthFail(405,'METHOD_NOT_ALLOWED');
    $aud=$_GET['audience']??null;
    $intent=$_GET['intent']??null;
    if (!in_array($aud,['customer','business','admin'],true)||!in_array($intent,['login','register'],true)) ideaOauthFail(422,'INVALID_REQUEST');
    if ($aud==='admin'&&$intent==='register') ideaOauthFail(403,'ADMIN_SELF_REGISTRATION_DISABLED');
    $state=ideaOauthB64(random_bytes(32));
    $nonce=ideaOauthB64(random_bytes(32));
    $verifier=ideaOauthB64(random_bytes(32));
    $cookie=ideaOauthB64(random_bytes(32));
    $store=[
        'provider'=>$provider,'audience'=>$aud,'intent'=>$intent,
        'nonce'=>$nonce,'verifier'=>$verifier,
        'cookie_hash'=>hash('sha256',$cookie), 'expires'=>time()+600,
    ];
    $dir=ideaOauthDirectory($privateFile);
    $file=$dir.'/'.hash('sha256',$state).'.json';
    $handle=fopen($file,'x');
    if (!$handle) ideaOauthFail(503,'STATE_STORAGE_UNAVAILABLE');
    chmod($file,0600);
    try {
        $json=json_encode($store,JSON_THROW_ON_ERROR);
        if (fwrite($handle,$json)!==strlen($json)) ideaOauthFail(503,'STATE_STORAGE_UNAVAILABLE');
    } finally {fclose($handle);}
    setcookie('__Host-IDEA-OAUTH',$cookie,[
        'expires'=>time()+600,'path'=>'/','secure'=>true,
        'httponly'=>true,'samesite'=>'None'
    ]);
    [$authorize]=$ep=ideaOauthEndpoints($provider,$cfg);
    $args=[
        'client_id'=>ideaOauthClientId($provider,$cfg),
        'redirect_uri'=>ideaOauthCallbackUrl($provider),
        'response_type'=>'code','scope'=>$ep[2], 'state'=>$state,
    ];
    if (in_array($provider,['google','azure','apple'],true)) $args['nonce']=$nonce;
    if (in_array($provider,['google','azure','twitter'],true)){
        $args['code_challenge']=ideaOauthB64(hash('sha256',$verifier,true));
        $args['code_challenge_method']='S256';
    }
    if ($provider==='apple') $args['response_mode']='form_post';
    if ($provider==='google') $args['prompt']='select_account';
    if ($provider==='azure') $args['response_mode']='query';
    ideaOauthBaseHeaders();
    header('Location: '.$authorize.'?'.http_build_query($args,'','&',PHP_QUERY_RFC3986),true,302);
    exit;
}
function ideaOauthConsumeState(string $provider, string $state, string $privateFile): array {
    if (!preg_match('/^[A-Za-z0-9_-]{30,100}$/D',$state)) ideaOauthFail(401,'INVALID_STATE');
    $dir=ideaOauthDirectory($privateFile);
    $path=$dir.'/'.hash('sha256',$state).'.json';
    $handle=@fopen($path,'r+');
    if (!$handle) ideaOauthFail(401,'INVALID_STATE');
    try {
        if (!flock($handle,LOCK_EX)) ideaOauthFail(503,'STATE_STORAGE_UNAVAILABLE');
        $raw=stream_get_contents($handle,8193);
        // Invalidate this flow *before* any token exchange, even when failed.
        ftruncate($handle,0);
        @unlink($path);
        flock($handle,LOCK_UN);
    } finally {fclose($handle);}
    $item=json_decode($raw?:'',true);
    if (!is_array($item)||
        ($item['provider']??null)!==$provider||
        (int)($item['expires']??0)<time()||
        (int)($item['expires']??0)>time()+601) ideaOauthFail(401,'INVALID_STATE');
    $cookie=$_COOKIE['__Host-IDEA-OAUTH']??null;
    setcookie('__Host-IDEA-OAUTH','',['expires'=>time()-3600,'path'=>'/','secure'=>true,'httponly'=>true,'samesite'=>'None']);
    if (!is_string($cookie)||!hash_equals((string)$item['cookie_hash'],hash('sha256',$cookie))) ideaOauthFail(401,'STATE_BROWSER_MISMATCH');
    return $item;
}
function ideaOauthHttp(string $url, array $post=[], array $headers=[]): array {
    if (!extension_loaded('curl')) ideaOauthFail(503,'CURL_REQUIRED');
    $allowed=[
        'oauth2.googleapis.com','graph.facebook.com','appleid.apple.com',
        'api.x.com','login.microsoftonline.com',
        'www.googleapis.com','accounts.google.com'
    ];
    $parts=parse_url($url);
    if (!is_array($parts)||($parts['scheme']??'')!=='https'||!in_array(strtolower((string)($parts['host']??'')),$allowed,true)){
        ideaOauthFail(503,'AUTH_PROVIDER_URL_DENIED');
    }
    $c=curl_init($url);
    if (!$c) ideaOauthFail(503,'AUTH_PROVIDER_UNAVAILABLE');
    $headers[]='Accept: application/json';
    curl_setopt_array($c,[
        CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,
        CURLOPT_CONNECTTIMEOUT=>7,CURLOPT_TIMEOUT=>18,
        CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,
        CURLOPT_HTTPHEADER=>$headers,
    ]);
    if ($post!==[]){
        curl_setopt($c,CURLOPT_POST,true);
        curl_setopt($c,CURLOPT_POSTFIELDS,http_build_query($post,'','&',PHP_QUERY_RFC3986));
    }
    try {
        $data=curl_exec($c);
        $http=(int)curl_getinfo($c,CURLINFO_RESPONSE_CODE);
        if (!is_string($data)||strlen($data)>150000||$http<200||$http>=300) ideaOauthFail(502,'AUTH_PROVIDER_UNAVAILABLE');
        $json=json_decode($data,true);
        if (!is_array($json)) ideaOauthFail(502,'AUTH_PROVIDER_UNAVAILABLE');
        return $json;
    } finally {curl_close($c);}
}
function ideaOauthEcdsaDerToJose(string $der): string {
    $len=strlen($der);
    if ($len<8||$len>80||ord($der[0])!==0x30||ord($der[2])!==0x02) ideaOauthFail(503,'APPLE_SIGNING_FAILED');
    $rLen=ord($der[3]);$sAt=4+$rLen;
    if ($sAt+2>$len||ord($der[$sAt])!==0x02) ideaOauthFail(503,'APPLE_SIGNING_FAILED');
    $sLen=ord($der[$sAt+1]);
    if ($sAt+2+$sLen!==$len) ideaOauthFail(503,'APPLE_SIGNING_FAILED');
    $r=ltrim(substr($der,4,$rLen),"\x00");$s=ltrim(substr($der,$sAt+2,$sLen),"\x00");
    if (strlen($r)>32||strlen($s)>32) ideaOauthFail(503,'APPLE_SIGNING_FAILED');
    return str_pad($r,32,"\x00",STR_PAD_LEFT).str_pad($s,32,"\x00",STR_PAD_LEFT);
}
function ideaOauthAppleSecret(array $cfg): string {
    $path=ideaOauthPrivateFile($cfg['private_key_file']);
    $now=time();
    $header=ideaOauthB64(json_encode(['alg'=>'ES256','kid'=>$cfg['key_id']],JSON_THROW_ON_ERROR));
    $body=ideaOauthB64(json_encode([
        'iss'=>$cfg['team_id'],'iat'=>$now,'exp'=>$now+300,
        'aud'=>'https://appleid.apple.com','sub'=>$cfg['services_id']
    ],JSON_THROW_ON_ERROR));
    $unsigned=$header.'.'.$body;
    $signature='';
    $ok=openssl_sign($unsigned,$signature,file_get_contents($path),OPENSSL_ALGO_SHA256);
    if (!$ok) ideaOauthFail(503,'APPLE_SIGNING_FAILED');
    return $unsigned.'.'.ideaOauthB64(ideaOauthEcdsaDerToJose($signature));
}
function ideaOauthAsnLength(int $len): string {
    if ($len<128)return chr($len);
    $bytes='';
    while($len>0){$bytes=chr($len&255).$bytes;$len>>=8;}
    return chr(0x80|strlen($bytes)).$bytes;
}
function ideaOauthAsnInteger(string $bytes): string {
    $bytes=ltrim($bytes,"\x00");
    if ($bytes==='')$bytes="\x00";
    if (ord($bytes[0])>=128)$bytes="\x00".$bytes;
    return "\x02".ideaOauthAsnLength(strlen($bytes)).$bytes;
}
function ideaOauthJwkPem(array $jwk): string {
    $n=ideaOauthUnb64((string)($jwk['n']??''));
    $e=ideaOauthUnb64((string)($jwk['e']??''));
    if (strlen($n)<128||strlen($n)>1024||strlen($e)<1||strlen($e)>8) ideaOauthFail(401,'INVALID_KEY');
    $rsa=ideaOauthAsnInteger($n).ideaOauthAsnInteger($e);
    $rsa="\x30".ideaOauthAsnLength(strlen($rsa)).$rsa;
    $alg=hex2bin('300d06092a864886f70d0101010500');
    $bit="\x03".ideaOauthAsnLength(strlen($rsa)+1)."\x00".$rsa;
    $spki="\x30".ideaOauthAsnLength(strlen($alg.$bit)).$alg.$bit;
    return "-----BEGIN PUBLIC KEY-----\n".chunk_split(base64_encode($spki),64,"\n")."-----END PUBLIC KEY-----\n";
}
function ideaOauthVerifyJwt(string $jwt, string $provider, array $cfg, string $nonce): array {
    $parts=explode('.',$jwt);
    if (count($parts)!==3||strlen($jwt)>20000) ideaOauthFail(401,'INVALID_ID_TOKEN');
    [$h,$p,$sig]=$parts;
    $header=json_decode(ideaOauthUnb64($h),true);
    $claims=json_decode(ideaOauthUnb64($p),true);
    if (!is_array($header)||!is_array($claims)||($header['alg']??'')!=='RS256'||!is_string($header['kid']??null)) ideaOauthFail(401,'INVALID_ID_TOKEN');
    $jwks=match($provider){
        'google'=>'https://www.googleapis.com/oauth2/v3/certs',
        'apple'=>'https://appleid.apple.com/auth/keys',
        'azure'=>'https://login.microsoftonline.com/common/discovery/v2.0/keys',
        default=>ideaOauthFail(401,'INVALID_ID_TOKEN'),
    };
    $keys=ideaOauthHttp($jwks);
    $verified=false;
    foreach(($keys['keys']??[]) as $key){
        if (!is_array($key)||($key['kid']??null)!==$header['kid']||($key['kty']??'')!=='RSA')continue;
        if (openssl_verify($h.'.'.$p,ideaOauthUnb64($sig),ideaOauthJwkPem($key),OPENSSL_ALGO_SHA256)===1){$verified=true;break;}
    }
    if (!$verified) ideaOauthFail(401,'INVALID_ID_TOKEN');
    $now=time();$aud=$claims['aud']??null;
    if (!is_string($aud)||!hash_equals(ideaOauthClientId($provider,$cfg),$aud)||
        !is_string($claims['sub']??null)||$claims['sub']===''||
        (int)($claims['exp']??0)<$now-60 ||
        (int)($claims['iat']??0)>$now+60 ||
        (string)($claims['nonce']??'')!==$nonce) ideaOauthFail(401,'INVALID_ID_TOKEN');
    $iss=(string)($claims['iss']??'');
    if ($provider==='google'&&!in_array($iss,['accounts.google.com','https://accounts.google.com'],true)) ideaOauthFail(401,'INVALID_ISSUER');
    if ($provider==='apple'&&$iss!=='https://appleid.apple.com') ideaOauthFail(401,'INVALID_ISSUER');
    if ($provider==='azure'){
        $tid=(string)($claims['tid']??'');
        if (!preg_match('/^[a-f0-9-]{36}$/iD',$tid) ||
            $iss!=='https://login.microsoftonline.com/'.$tid.'/v2.0') ideaOauthFail(401,'INVALID_ISSUER');
    }
    return $claims;
}
function ideaOauthCallback(string $provider): never {
    [$all,$cfg,$privateFile]=ideaOauthContext($provider);
    $method=($_SERVER['REQUEST_METHOD']??'');
    $expected=$provider==='apple'?'POST':'GET';
    if ($method!==$expected) ideaOauthFail(405,'METHOD_NOT_ALLOWED');
    $data=$method==='POST'?$_POST:$_GET;
    if (!is_array($data)||isset($data['error'])||!is_string($data['state']??null)||
        !is_string($data['code']??null)||strlen($data['code'])>5000) ideaOauthFail(401,'OAUTH_DENIED');
    $flow=ideaOauthConsumeState($provider,$data['state'],$privateFile);
    [$auth,$tokenEndpoint]=ideaOauthEndpoints($provider,$cfg);
    $code=$data['code'];
    $tokenData=[
        'grant_type'=>'authorization_code','client_id'=>ideaOauthClientId($provider,$cfg),
        'code'=>$code,'redirect_uri'=>ideaOauthCallbackUrl($provider)
    ];
    $headers=['Content-Type: application/x-www-form-urlencoded'];
    if ($provider==='apple')$tokenData['client_secret']=ideaOauthAppleSecret($cfg);
    elseif ($provider==='twitter'){
        $headers[]='Authorization: Basic '.base64_encode($cfg['client_id'].':'.$cfg['client_secret']);
        $tokenData['code_verifier']=$flow['verifier'];
    }else {
        $tokenData['client_secret']=$cfg['client_secret'];
        if (in_array($provider,['google','azure'],true))$tokenData['code_verifier']=$flow['verifier'];
    }
    $token=ideaOauthHttp($tokenEndpoint,$tokenData,$headers);
    $subject=null;$email=null;$profile=[];
    if (in_array($provider,['google','apple','azure'],true)){
        if (!is_string($token['id_token']??null)) ideaOauthFail(401,'INVALID_ID_TOKEN');
        $profile=ideaOauthVerifyJwt($token['id_token'],$provider,$cfg,$flow['nonce']);
        $subject=(string)$profile['sub'];
        if ($provider==='azure')$subject=(string)$profile['tid'].':'.$subject;
        if (($profile['email_verified']??false)===true||($profile['email_verified']??'')==='true'){
            $email=is_string($profile['email']??null)?$profile['email']:null;
        }
    }else{
        if (!is_string($token['access_token']??null)) ideaOauthFail(401,'INVALID_ACCESS_TOKEN');
        $headers=['Authorization: Bearer '.$token['access_token']];
        if ($provider==='facebook'){
            $url='https://graph.facebook.com/v24.0/me?fields=id,name,email';
            $profile=ideaOauthHttp($url,[],$headers);
            $subject=$profile['id']??null;
            // Meta may omit email. Do not trust it to auto-link existing accounts.
            $email=null;
        }else{
            $profile=ideaOauthHttp('https://api.x.com/2/users/me',[],$headers);
            $subject=$profile['data']['id']??null;
            $email=null;
        }
    }
    if (!is_string($subject)||!preg_match('/^[A-Za-z0-9:_\-.]{1,255}$/D',$subject))ideaOauthFail(401,'INVALID_IDENTITY');
    // Private adapter must map immutable provider+subject into the EXISTING
    // IDEA MySQL user, enforce company approval and existing admin MFA.
    // Never use OAuth scope, email or user-supplied audience as a role.
    $login=ideaAuthLoginVerifiedOAuth($provider,$subject,$email,$profile,$flow['audience'],$flow['intent']);
    if (!is_array($login)||($login['ok']??false)!==true)ideaOauthFail(403,'ACCOUNT_NOT_AUTHORIZED');
    $role=($login['role']??null)==='buyer'?'customer':($login['role']??null);
    if (!in_array($role,['customer','business','admin'],true))ideaOauthFail(403,'ACCOUNT_NOT_AUTHORIZED');
    if ($role==='admin'&&($login['mfa_verified']??false)!==true)ideaOauthFail(403,'ADMIN_MFA_REQUIRED');
    $dest=match($role){'admin'=>'/admin','business'=>'/business',default=>'/account'};
    ideaOauthBaseHeaders();
    header('Location: https://idea-dh.com'.$dest,true,303);
    exit;
}
