<?php
/**
 * IDEA visualizer: PHP 8.1+ server adapter for cPanel.
 * Configure GEMINI_API_KEY, IDEA_SUPABASE_URL and IDEA_SUPABASE_ANON_KEY on server.
 * Raw room/material files are never saved to public storage.
 */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
function fail(int $code, string $message): never {
  http_response_code($code);
  echo json_encode(['error'=>$message]);
  exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); fail(405,'POST required'); }
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = strtolower(explode(':',$_SERVER['HTTP_HOST'] ?? '')[0]);
if ($origin && strtolower((string)parse_url($origin,PHP_URL_HOST)) !== $host) fail(403,'Origin rejected');
if (!extension_loaded('curl') || !extension_loaded('fileinfo') || !extension_loaded('mbstring')) fail(503,'Required PHP modules missing');
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 23*1024*1024) fail(413,'Images too large');
$key = (string)getenv('GEMINI_API_KEY');
$url = rtrim((string)getenv('IDEA_SUPABASE_URL'),'/');
$anon = (string)getenv('IDEA_SUPABASE_ANON_KEY');
if (!$key || !$url || !$anon || parse_url($url,PHP_URL_SCHEME)!=='https' || !filter_var($url,FILTER_VALIDATE_URL)) fail(503,'Backend is not configured');
$authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if (!preg_match('/^Bearer ([A-Za-z0-9._~-]+)$/',$authorization,$token)) fail(401,'Sign in required');
function api(string $url,array $headers,?array $json=null,int $seconds=15): array {
  $curl=curl_init($url);
  curl_setopt_array($curl,[
    CURLOPT_RETURNTRANSFER=>true,CURLOPT_HTTPHEADER=>$headers,
    CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>$seconds,
    CURLOPT_FOLLOWLOCATION=>false,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,
    CURLOPT_POST=>$json!==null
  ]);
  if ($json!==null) curl_setopt($curl,CURLOPT_POSTFIELDS,json_encode($json));
  $raw=curl_exec($curl);$status=(int)curl_getinfo($curl,CURLINFO_HTTP_CODE);curl_close($curl);
  return [$status,is_string($raw)?json_decode($raw,true):null];
}
[$status,$identity]=api($url.'/auth/v1/user',[
  'apikey: '.$anon,'Authorization: Bearer '.$token[1],'Accept: application/json'
]);
$uid=is_array($identity)?($identity['id']??''):'';
if ($status!==200 || !is_string($uid) || !preg_match('/^[a-f0-9-]{36}$/i',$uid)) fail(401,'Session is invalid');
/* Local quota is a first-pass abuse safeguard, not a distributed billing limit. */
$dir=sys_get_temp_dir().DIRECTORY_SEPARATOR.'idea-room-quota';
if (!is_dir($dir) && !mkdir($dir,0700,true)) fail(503,'Quota unavailable');
$filename=$dir.DIRECTORY_SEPARATOR.hash('sha256',$uid.'|'.($_SERVER['REMOTE_ADDR']??'').'|'.gmdate('Ymd')).'.json';
$fp=@fopen($filename,'c+');
if (!$fp || !flock($fp,LOCK_EX)) fail(503,'Quota unavailable');
$data=json_decode(stream_get_contents($fp)?:'{}',true);
$count=(int)($data['count']??0);
if ($count>=8) {flock($fp,LOCK_UN);fclose($fp);fail(429,'Daily generation limit reached');}
rewind($fp);ftruncate($fp,0);fwrite($fp,json_encode(['count'=>$count+1]));fflush($fp);flock($fp,LOCK_UN);fclose($fp);
function imagePart(string $name): array {
  $f=$_FILES[$name]??null;
  if (!is_array($f) || ($f['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_OK) fail(422,'Room and material photos required');
  $tmp=$f['tmp_name'];$size=(int)$f['size'];
  if (!is_uploaded_file($tmp) || $size<1 || $size>10*1024*1024) fail(422,'Invalid uploaded image');
  $mime=(new finfo(FILEINFO_MIME_TYPE))->file($tmp);
  if (!in_array($mime,['image/png','image/jpeg','image/webp'],true)) fail(422,'Unsupported image format');
  $dims=@getimagesize($tmp);
  if (!$dims || $dims[0]<64 || $dims[1]<64 || $dims[0]>8000 || $dims[1]>8000 || $dims[0]*$dims[1]>24000000) fail(422,'Invalid image dimensions');
  $bytes=file_get_contents($tmp);
  if ($bytes===false) fail(422,'Image cannot be read');
  return ['inlineData'=>['mimeType'=>$mime,'data'=>base64_encode($bytes)]];
}
$room=imagePart('room');$sample=imagePart('material');
$surface=$_POST['surface']??null;$roomKind=$_POST['roomKind']??null;
$rotation=(int)($_POST['rotation']??-1);
$tileSize=$_POST['tileSize']??null;
$grout=strtolower((string)($_POST['grout']??''));
if (!in_array($surface,['floor','walls','backsplash'],true)
 || !in_array($roomKind,['living','bedroom','kitchen','bathroom','other'],true)
 || !in_array($rotation,[0,45,90],true)
 || !in_array($tileSize,['30 × 30 cm','60 × 60 cm','60 × 120 cm','80 × 80 cm','120 × 120 cm'],true)
 || !preg_match('/^#[a-f0-9]{6}$/',$grout)) fail(422,'Invalid visualization settings');
$name=mb_substr(trim(strip_tags((string)($_POST['productName']??''))),0,120);
$brand=mb_substr(trim(strip_tags((string)($_POST['brand']??''))),0,80);
$id=mb_substr(trim(strip_tags((string)($_POST['productId']??''))),0,100);
if (!$name || !$id) fail(422,'Select a catalogue product');
$finish=mb_substr(trim(strip_tags((string)($_POST['finish']??''))),0,80);
$prompt='Create ONE photorealistic renovation image. Image 1: the customer room. Image 2: the selected material sample. '
.'Replace ONLY the '.$surface.' surface in image 1, using the EXACT color, texture and pattern of image 2. '
.'Preserve original camera, perspective, furniture, architecture, fixtures, windows, doors and all other materials. '
.'Room: '.$roomKind.'. Physical tile dimensions: '.$tileSize.'. Layout rotation: '.$rotation.' degrees. Grout: '.$grout.'. '
.'Material context only: '.$brand.' '.$name.' '.$finish.'. '
.'Do not invent furniture or change other surfaces. Do not include captions, labels, logos or watermarks. Output only the realistic edited room image.';
$model=(string)(getenv('GEMINI_IMAGE_MODEL')?:'gemini-2.5-flash-image');
if (!in_array($model,['gemini-2.5-flash-image','gemini-3.1-flash-image','gemini-nano-banana-2.1'],true)) fail(503,'Invalid model configuration');
[$code,$response]=api(
  'https://generativelanguage.googleapis.com/v1beta/models/'.$model.':generateContent',
  ['x-goog-api-key: '.$key,'Content-Type: application/json','Accept: application/json'],
  ['contents'=>[['parts'=>[['text'=>$prompt],$room,$sample]]],
   'generationConfig'=>['responseModalities'=>['TEXT','IMAGE']]],
  110
);
if ($code!==200 || !is_array($response)) fail($code===429?429:502,'Image provider unavailable');
foreach (($response['candidates'][0]['content']['parts']??[]) as $part) {
  $data=$part['inlineData']['data']??null;$mime=$part['inlineData']['mimeType']??null;
  if (is_string($data) && strlen($data)<22*1024*1024
      && in_array($mime,['image/png','image/jpeg','image/webp'],true)
      && base64_decode($data,true)!==false) {
    echo json_encode(['image'=>'data:'.$mime.';base64,'.$data],JSON_UNESCAPED_SLASHES);
    exit;
  }
}
fail(502,'Image provider returned no image');
