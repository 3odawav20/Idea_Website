<?php
declare(strict_types=1);
// PHP 8.1+, cURL, fileinfo. Secrets live outside public_html.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function fail(int $code, string $message): never { http_response_code($code); echo json_encode(['error'=>$message], JSON_UNESCAPED_UNICODE); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'استخدم طلب POST.');
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 12582912) fail(413, 'حجم الصور أكبر من المسموح.');
$configPath = getenv('CERAMIC_CONFIG_PATH') ?: dirname($_SERVER['DOCUMENT_ROOT']).'/ceramic-studio-config.php';
if (!is_file($configPath)) fail(503, 'خدمة التوليد لم تُفعّل بعد على الاستضافة.');
$config = require $configPath;
if (!is_array($config)) fail(503, 'إعدادات خدمة التوليد غير مكتملة.');
$provider=$config['provider']??'gemini';
if(!in_array($provider,['gemini','nvidia'],true))fail(503,'إعدادات مزوّد التوليد غير صالحة.');
if(empty($config[$provider==='nvidia'?'nvidia_key':'gemini_key']))fail(503,$provider==='nvidia'?'خدمة NVIDIA تحتاج مفتاح API على الاستضافة قبل بدء التجربة.':'إعدادات خدمة التوليد غير مكتملة.');
if($provider==='nvidia'&&array_key_exists('nvidia_custom_images_verified',$config)&&!$config['nvidia_custom_images_verified'])fail(503,'مفتاح NVIDIA مُعدّ، لكن واجهة FLUX 3 التجريبية رفضت صور الغرف الخاصة وتقبل صور أمثلة فقط. توليد صورتك غير متاح بهذه الواجهة حاليًا.');
if (!extension_loaded('curl') || !extension_loaded('fileinfo') || !extension_loaded('gd')) fail(503, 'الاستضافة تحتاج إضافات cURL وfileinfo وGD لحماية باقي الصورة.');
require_once __DIR__.'/image-tools.php';
function requestJson(string $url, array $headers, ?array $body = null, int $timeout = 150): array {
    if (str_contains($url, '/auth/v1/user') || str_contains($url, 'identitytoolkit.googleapis.com')) $timeout = 20;
    elseif (($body['generationConfig']['responseMimeType'] ?? '') === 'application/json') $timeout = 60;
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_HTTPHEADER=>$headers, CURLOPT_CONNECTTIMEOUT=>15, CURLOPT_TIMEOUT=>$timeout, CURLOPT_FOLLOWLOCATION=>false]);
    if ($body !== null) { curl_setopt($ch, CURLOPT_POST, true); curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body)); }
    $raw = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    if ($raw === false) fail(502, 'تعذّر الاتصال بخدمة الصور. حاول لاحقًا.');
    return [$code, json_decode($raw, true) ?? []];
}
$authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if (!preg_match('/^Bearer ([A-Za-z0-9._-]{20,4096})$/', $authorization, $match)) fail(401, 'سجّل الدخول لتفعيل التوليد.');
$token = $match[1];
// The browser supplies its CSRF token; the HttpOnly PHP session identifies the account.
require_once __DIR__.'/accounts-db.php';
try {accountCsrf($token);$buyer=accountUser();accountCustomer($buyer);$uid=$buyer['id'];session_write_close();}
catch(IdeaAccountError $e){fail($e->status,$e->getMessage()==='CUSTOMER_ONLY'?'توليد الصور متاح لحسابات العملاء المشترين فقط، وغير متاح لحسابات الشركات أو الأدمين.':'سجّل الدخول من حساب IDEA أولًا لتفعيل التوليد الذكي. المعاينة المحلية متاحة بدون حساب.');}
catch(Throwable $e){fail(503,'خدمة الحسابات غير متاحة حاليًا.');}
$raw = file_get_contents('php://input', false, null, 0, 12582913);
if (strlen($raw) > 12582912) fail(413, 'حجم الطلب أكبر من المسموح.');
$data = json_decode($raw, true);
if (!is_array($data)) fail(400, 'بيانات الطلب غير صالحة.');
function imagePart(mixed $value): array {
    if (!is_string($value) || !preg_match('#^data:(image/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$#D', $value, $m)) fail(400, 'صيغة الصورة غير مدعومة.');
    $bytes = base64_decode($m[2], true);
    if ($bytes === false || strlen($bytes) > 5*1024*1024) fail(413, 'الصورة أكبر من 5 ميجابايت بعد التحضير.');
    $info = @getimagesizefromstring($bytes);
    if (!$info || ($info['mime'] ?? '') !== $m[1] || $info[0]*$info[1] > 25000000) fail(400, 'الصورة غير صالحة.');
    return ['inlineData'=>['mimeType'=>$m[1], 'data'=>$m[2]]];
}
$room = imagePart($data['room'] ?? null); $material = imagePart($data['material'] ?? null);
$surfaces = ['الأرضية'=>'floor','الحوائط'=>'wall'];
$types = ['حمّام'=>'bathroom','غرفة معيشة'=>'living room','غرفة نوم'=>'bedroom','مطبخ'=>'kitchen','مساحة خارجية'=>'outdoor area'];
if (!isset($surfaces[$data['surface'] ?? '']) || !isset($types[$data['roomType'] ?? '']) || !is_string($data['size']??null) || !preg_match('/^[1-9]\d{0,2}(?:\.\d{1,2})? × [1-9]\d{0,2}(?:\.\d{1,2})?$/u', $data['size']) || !in_array($data['angle'] ?? null, [0,45,90], true) || !preg_match('/^#[a-fA-F0-9]{6}$/', $data['grout'] ?? '')) fail(400, 'إعدادات التصميم غير صالحة.');
$points = $data['points'] ?? [];
if (!is_array($points) || !in_array(count($points), [0,4],true)) fail(400, 'حدود السطح غير صالحة.');
foreach ($points as $p) { if (!is_array($p) || count($p)!==2 || !is_numeric($p[0]) || !is_numeric($p[1]) || $p[0]<0 || $p[0]>1 || $p[1]<0 || $p[1]>1) fail(400, 'زوايا السطح غير صالحة.'); }
// Daily per-account + per-IP + global limits, held under a file lock outside the web root.
$rateDir = $config['rate_dir'] ?? dirname($configPath).'/ceramic-studio-rates';
if (!is_dir($rateDir) && !mkdir($rateDir,0700,true)) fail(503, 'تعذّر تهيئة حد الاستخدام.');
$lock = fopen($rateDir.'/usage.json','c+');
if (!$lock || !flock($lock,LOCK_EX)) fail(503, 'تعذّر فحص حد الاستخدام.');
$usage = json_decode(stream_get_contents($lock),true) ?: [];
$day = gmdate('Y-m-d'); if (($usage['day']??'') !== $day) $usage=['day'=>$day,'users'=>[],'ips'=>[],'total'=>0];
$key = hash('sha256',$uid); $ip = hash('sha256',$_SERVER['REMOTE_ADDR']??'unknown');
if (($usage['users'][$key]??0) >= ($config['daily_user_limit']??10) || ($usage['ips'][$ip]??0) >= ($config['daily_ip_limit']??20) || $usage['total'] >= ($config['daily_global_limit']??100)) { flock($lock,LOCK_UN); fclose($lock); fail(429, 'وصلت للحد اليومي للتوليد. حاول غدًا.'); }
$usage['users'][$key] = ($usage['users'][$key]??0)+1; $usage['ips'][$ip] = ($usage['ips'][$ip]??0)+1; $usage['total']++;
ftruncate($lock,0); rewind($lock); fwrite($lock,json_encode($usage)); fflush($lock); flock($lock,LOCK_UN); fclose($lock);
$visionModel = $config['vision_model'] ?? 'gemini-2.5-flash';
if (!preg_match('/^[a-zA-Z0-9.-]+$/',$visionModel)) fail(503,'اسم موديل العزل غير صالح.');
$maskPrompt = 'Segment the visible '.$surfaces[$data['surface']].' finishing surfaces in this '.$types[$data['roomType']].' photograph for replacing tiles only. Return conservative detailed polygons of visible target surfaces in regions. Return polygons covering ALL occluding furniture, toilets, sinks, bathtubs, shower trays, kitchen cabinets, appliances, rugs, people, plants, doors and windows in exclusions. Exclude ceilings and non-target walls/floors. Coordinates must be normalized [x,y] between 0 and 1, origin top-left, ordered perimeter vertices. Follow true object contours; use up to 96 vertices per polygon and up to 32 polygons per array. Do not fill the bounding boxes of irregular objects if better contours are visible. Return {"regions":[[[x,y],...]],"exclusions":[[[x,y],...]]}. If no target surface can be reliably identified, return empty arrays. '.($points ? 'The user has requested this target quadrilateral: '.json_encode($points).'. Keep the exclusions even when using this region.' : 'Detect the surface automatically; the user is not required to mark corners.');
$polygonSchema = ['type'=>'ARRAY','items'=>['type'=>'ARRAY','items'=>['type'=>'ARRAY','items'=>['type'=>'NUMBER']]]];
if($provider==='nvidia'){
    require_once __DIR__.'/nvidia-provider.php';
    $detected=nvidiaDetectSurfaces($config,$maskPrompt,$room,$material);
}else{
[$maskCode,$maskResponse] = requestJson('https://generativelanguage.googleapis.com/v1beta/models/'.$visionModel.':generateContent', ['Content-Type: application/json','x-goog-api-key: '.$config['gemini_key']], ['contents'=>[['parts'=>[['text'=>$maskPrompt],$room]]],'generationConfig'=>['responseMimeType'=>'application/json','responseSchema'=>['type'=>'OBJECT','properties'=>['regions'=>$polygonSchema,'exclusions'=>$polygonSchema],'required'=>['regions','exclusions']]]]);
if($maskCode!==200) fail(502,'تعذّر تحديد سطح التشطيب تلقائيًا. راجع خدمة العزل أو جرّب لاحقًا.');
$maskText='';foreach($maskResponse['candidates'][0]['content']['parts']??[] as $part)if(isset($part['text'])&&empty($part['thought']))$maskText.=$part['text'];
$detected=json_decode($maskText,true);
}
try { $regions=validatePolygons($points?[$points]:($detected['regions']??null));$exclusions=validatePolygons($detected['exclusions']??null,true); } catch(RuntimeException $e) { fail(422,$e->getMessage()); }
$materialType = in_array($data['materialType']??'', ['سيراميك','بورسلين','رخام'],true) ? $data['materialType'] : 'سيراميك';
if($provider==='nvidia'){
    $edited=nvidiaEditRoom($config,$room,$detected['material_description'],array_merge($data,['materialType'=>$materialType]),$surfaces[$data['surface']],$types[$data['roomType']]);
    try{$output=compositeSurface(base64_decode($room['inlineData']['data'],true),$edited,$regions,$exclusions);}catch(RuntimeException $e){fail(422,$e->getMessage());}
    $output['automatic']=!$points;$output['provider']='nvidia';echo json_encode($output,JSON_UNESCAPED_SLASHES);exit;
}
$prompt = 'Edit reference image 1 (the room). Reference image 2 is the exact '.$materialType.' material swatch. Replace only the '.$surfaces[$data['surface']].' in the '.$types[$data['roomType']].' within these visible surface polygons '.json_encode($regions).', excluding object polygons '.json_encode($exclusions).' (normalized x,y coordinates from top-left). Keep ALL furniture, fixtures, doors, windows, architecture and camera position exactly unchanged. Preserve occlusions, perspective, lighting, contact shadows and reflections. Match the swatch color, pattern and veins faithfully, do not invent a different material. Repeat the texture as '.$materialType.' tiles, '.$data['size'].' cm, rotated '.$data['angle'].' degrees, with narrow grout '.$data['grout'].'. Do not paste the swatch over furniture. Return one photorealistic edited room image with the original exact framing and aspect ratio, no labels, no collage.';
$model = $config['model'] ?? 'gemini-2.5-flash-image';
if (!preg_match('/^[a-zA-Z0-9.-]+$/', $model)) fail(503, 'اسم موديل غير صالح.');
$roomInfo=getimagesizefromstring(base64_decode($room['inlineData']['data'],true));$ratio=$roomInfo[0]/$roomInfo[1];
$ratios=['1:1'=>1,'3:2'=>1.5,'2:3'=>2/3,'3:4'=>.75,'4:3'=>4/3,'4:5'=>.8,'5:4'=>1.25,'9:16'=>9/16,'16:9'=>16/9,'21:9'=>21/9];$aspect='1:1';$distance=INF;foreach($ratios as $label=>$value){$d=abs(log($ratio/$value));if($d<$distance){$aspect=$label;$distance=$d;}}
[$code,$response] = requestJson('https://generativelanguage.googleapis.com/v1beta/models/'.$model.':generateContent', ['Content-Type: application/json','x-goog-api-key: '.$config['gemini_key']], ['contents'=>[['parts'=>[['text'=>$prompt],$room,$material]]], 'generationConfig'=>['responseModalities'=>['TEXT','IMAGE'],'imageConfig'=>['aspectRatio'=>$aspect]]]);
if ($code !== 200) { error_log('IDEA image provider status: '.$code); fail($code === 429 ? 429 : 502, $code === 429 ? 'خدمة الصور مشغولة حاليًا. حاول لاحقًا.' : 'تعذّر توليد التصميم من خدمة الصور. راجع إعدادات الخدمة.'); }
foreach (($response['candidates'][0]['content']['parts'] ?? []) as $part) { $image=$part['inlineData']??null; if (empty($part['thought']) && $image && in_array($image['mimeType']??'', ['image/png','image/jpeg','image/webp'],true) && !empty($image['data'])) {
    $editedBytes=base64_decode($image['data'],true);$sourceBytes=base64_decode($room['inlineData']['data'],true);
    if(!$editedBytes||strlen($editedBytes)>20*1024*1024)fail(502,'صورة الخدمة غير صالحة.');
    try { $output=compositeSurface($sourceBytes,$editedBytes,$regions,$exclusions); }catch(RuntimeException $e){fail(422,$e->getMessage());}
    $output['automatic']=!$points;echo json_encode($output,JSON_UNESCAPED_SLASHES);exit;
} }
fail(422, 'لم تُرجع الخدمة صورة. جرّب صورة أوضح أو عدّل تحديد السطح.');
