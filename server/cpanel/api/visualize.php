<?php
/**
 * IDEA Immutable Scene Engine — PHP 8.1+ / Runpod Serverless adapter.
 *
 * Required server-only environment:
 * RUNPOD_API_KEY, RUNPOD_ENDPOINT_ID, IDEA_SUPABASE_URL, IDEA_SUPABASE_ANON_KEY.
 *
 * The configured Runpod worker must implement the documented
 * idea-qwen-mask-v1 contract and return BOTH an edited image and the exact
 * editable mask as base64/data URIs. Results without a verified mask are never
 * released. The original image is always the compositing base.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_REQUEST_BYTES = 27 * 1024 * 1024;
const MAX_PIXELS = 12000000;
const REGULAR_LIFETIME_LIMIT = 5;
const JOB_TTL_SECONDS = 172800;

function respond(int $code, array $payload): never {
  http_response_code($code);
  echo json_encode($payload, JSON_UNESCAPED_SLASHES);
  exit;
}
function fail(int $code, string $message, string $errorCode='request_failed'): never {
  respond($code, ['error'=>$message, 'code'=>$errorCode]);
}
function envValue(string $name): string {
  return trim((string)getenv($name));
}
function requestHeaders(): array {
  return ['Accept: application/json', 'Content-Type: application/json'];
}
function httpJson(string $url, array $headers, ?array $json=null, int $timeout=25, string $method='POST'): array {
  $curl = curl_init($url);
  $options = [
    CURLOPT_RETURNTRANSFER=>true,
    CURLOPT_HTTPHEADER=>$headers,
    CURLOPT_CONNECTTIMEOUT=>10,
    CURLOPT_TIMEOUT=>$timeout,
    CURLOPT_FOLLOWLOCATION=>false,
    CURLOPT_SSL_VERIFYPEER=>true,
    CURLOPT_SSL_VERIFYHOST=>2,
    CURLOPT_CUSTOMREQUEST=>$method,
  ];
  if ($json !== null) $options[CURLOPT_POSTFIELDS] = json_encode($json, JSON_UNESCAPED_SLASHES);
  curl_setopt_array($curl, $options);
  $raw = curl_exec($curl);
  $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
  $curlError = curl_error($curl);
  curl_close($curl);
  return [$status, is_string($raw) ? json_decode($raw, true) : null, $curlError];
}
function sameOrigin(): void {
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  $host = strtolower(explode(':', $_SERVER['HTTP_HOST'] ?? '')[0]);
  if ($origin && strtolower((string)parse_url($origin, PHP_URL_HOST)) !== $host) fail(403, 'Origin rejected', 'origin_rejected');
}
function configuration(): array {
  $config = [
    'runpodKey'=>envValue('RUNPOD_API_KEY'),
    'endpoint'=>envValue('RUNPOD_ENDPOINT_ID'),
    'supabaseUrl'=>rtrim(envValue('IDEA_SUPABASE_URL'), '/'),
    'supabaseAnon'=>envValue('IDEA_SUPABASE_ANON_KEY'),
    'contract'=>envValue('RUNPOD_WORKER_CONTRACT') ?: 'idea-qwen-mask-v1',
  ];
  if (!$config['runpodKey'] || !$config['endpoint'] || !$config['supabaseUrl'] || !$config['supabaseAnon']) {
    fail(503, 'Visualizer configuration is incomplete', 'configuration_required');
  }
  if (!preg_match('/^[A-Za-z0-9_-]{3,120}$/', $config['endpoint'])
      || !filter_var($config['supabaseUrl'], FILTER_VALIDATE_URL)
      || parse_url($config['supabaseUrl'], PHP_URL_SCHEME) !== 'https') {
    fail(503, 'Visualizer configuration is invalid', 'configuration_required');
  }
  if ($config['contract'] !== 'idea-qwen-mask-v1') {
    fail(503, 'Runpod worker contract has not been approved', 'worker_contract_unverified');
  }
  return $config;
}
function authenticate(array $config): array {
  $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
  if (!preg_match('/^Bearer ([A-Za-z0-9._~-]+)$/', $authorization, $token)) {
    fail(401, 'Sign in required', 'authentication_required');
  }
  [$status, $identity] = httpJson(
    $config['supabaseUrl'].'/auth/v1/user',
    ['apikey: '.$config['supabaseAnon'], 'Authorization: Bearer '.$token[1], 'Accept: application/json'],
    null,
    15,
    'GET'
  );
  $uid = is_array($identity) ? ($identity['id'] ?? '') : '';
  if ($status !== 200 || !is_string($uid) || !preg_match('/^[a-f0-9-]{36}$/i', $uid)) {
    fail(401, 'Session is invalid', 'authentication_required');
  }
  [$roleStatus, $roleRows] = httpJson(
    $config['supabaseUrl'].'/rest/v1/user_roles?select=role&user_id=eq.'.rawurlencode($uid).'&limit=1',
    ['apikey: '.$config['supabaseAnon'], 'Authorization: Bearer '.$token[1], 'Accept: application/json'],
    null,
    15,
    'GET'
  );
  $role = $roleStatus === 200 && is_array($roleRows) && isset($roleRows[0]['role'])
    ? (string)$roleRows[0]['role'] : 'buyer';
  return ['id'=>$uid, 'role'=>$role, 'token'=>$token[1]];
}
function rootDir(): string {
  $dir = sys_get_temp_dir().DIRECTORY_SEPARATOR.'idea-immutable-scene-engine';
  if (!is_dir($dir) && !mkdir($dir, 0700, true)) fail(503, 'Private job storage unavailable', 'storage_unavailable');
  return $dir;
}
function safeId(string $value): string {
  if (!preg_match('/^[a-f0-9-]{16,80}$/i', $value)) fail(422, 'Invalid job identifier', 'invalid_job');
  return $value;
}
function readJsonFile(string $path): array {
  $raw = @file_get_contents($path);
  $data = is_string($raw) ? json_decode($raw, true) : null;
  return is_array($data) ? $data : [];
}
function writeJsonFile(string $path, array $data): void {
  $tmp = $path.'.tmp';
  if (file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_SLASHES), LOCK_EX) === false || !rename($tmp, $path)) {
    fail(503, 'Private job storage unavailable', 'storage_unavailable');
  }
  @chmod($path, 0600);
}
function quotaPath(string $uid): string {
  return rootDir().DIRECTORY_SEPARATOR.'quota-'.hash('sha256', $uid).'.json';
}
function quotaSnapshot(string $uid, bool $admin): array {
  if ($admin) return ['limit'=>null, 'used'=>0, 'remaining'=>null, 'unlimited'=>true];
  $data = readJsonFile(quotaPath($uid));
  $entries = is_array($data['entries'] ?? null) ? $data['entries'] : [];
  $used = count(array_filter($entries, fn($entry) =>
    is_array($entry) && in_array($entry['state'] ?? '', ['reserved','running','ready'], true)
  ));
  return ['limit'=>REGULAR_LIFETIME_LIMIT, 'used'=>$used, 'remaining'=>max(0, REGULAR_LIFETIME_LIMIT-$used), 'unlimited'=>false];
}
function reserveAttempt(string $uid, string $idempotencyKey, bool $admin, string $jobId): array {
  if ($admin) return quotaSnapshot($uid, true);
  $path = quotaPath($uid);
  $fp = @fopen($path, 'c+');
  if (!$fp || !flock($fp, LOCK_EX)) fail(503, 'Quota service unavailable', 'quota_unavailable');
  $raw = stream_get_contents($fp);
  $data = json_decode($raw ?: '{}', true);
  if (!is_array($data)) $data = [];
  $entries = is_array($data['entries'] ?? null) ? $data['entries'] : [];
  foreach ($entries as $entry) {
    if (($entry['key'] ?? '') === $idempotencyKey) {
      flock($fp, LOCK_UN); fclose($fp);
      return quotaSnapshot($uid, false) + ['duplicateJobId'=>$entry['jobId'] ?? null];
    }
  }
  $used = count(array_filter($entries, fn($entry) =>
    is_array($entry) && in_array($entry['state'] ?? '', ['reserved','running','ready'], true)
  ));
  if ($used >= REGULAR_LIFETIME_LIMIT) {
    flock($fp, LOCK_UN); fclose($fp);
    fail(429, 'Lifetime generation limit reached', 'quota_exhausted');
  }
  $entries[] = ['key'=>$idempotencyKey, 'jobId'=>$jobId, 'state'=>'reserved', 'at'=>time()];
  rewind($fp); ftruncate($fp, 0);
  fwrite($fp, json_encode(['entries'=>$entries], JSON_UNESCAPED_SLASHES)); fflush($fp);
  flock($fp, LOCK_UN); fclose($fp); @chmod($path, 0600);
  return ['limit'=>REGULAR_LIFETIME_LIMIT, 'used'=>$used+1, 'remaining'=>REGULAR_LIFETIME_LIMIT-$used-1, 'unlimited'=>false];
}
function updateAttempt(string $uid, string $jobId, string $state, bool $admin): void {
  if ($admin) return;
  $path = quotaPath($uid);
  $fp = @fopen($path, 'c+');
  if (!$fp || !flock($fp, LOCK_EX)) return;
  $data = json_decode(stream_get_contents($fp) ?: '{}', true);
  $entries = is_array($data['entries'] ?? null) ? $data['entries'] : [];
  foreach ($entries as &$entry) if (($entry['jobId'] ?? '') === $jobId) $entry['state'] = $state;
  unset($entry);
  rewind($fp); ftruncate($fp, 0);
  fwrite($fp, json_encode(['entries'=>$entries], JSON_UNESCAPED_SLASHES)); fflush($fp);
  flock($fp, LOCK_UN); fclose($fp);
}
function imageUpload(string $name): array {
  $file = $_FILES[$name] ?? null;
  if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    fail(422, 'Room and material images are required', 'missing_image');
  }
  $tmp = (string)$file['tmp_name'];
  $size = (int)$file['size'];
  if (!is_uploaded_file($tmp) || $size < 1 || $size > MAX_IMAGE_BYTES) fail(422, 'Invalid uploaded image', 'invalid_image');
  $mime = (new finfo(FILEINFO_MIME_TYPE))->file($tmp);
  if (!in_array($mime, ['image/png','image/jpeg','image/webp'], true)) fail(422, 'Unsupported image format', 'unsupported_format');
  $dimensions = @getimagesize($tmp);
  if (!$dimensions || $dimensions[0] < 256 || $dimensions[1] < 256
      || $dimensions[0] > 8192 || $dimensions[1] > 8192
      || $dimensions[0] * $dimensions[1] > MAX_PIXELS) {
    fail(422, 'Image dimensions are outside the supported range', 'invalid_dimensions');
  }
  $bytes = file_get_contents($tmp);
  if ($bytes === false) fail(422, 'Image cannot be decoded', 'invalid_image');
  return ['bytes'=>$bytes, 'mime'=>$mime, 'width'=>$dimensions[0], 'height'=>$dimensions[1], 'hash'=>hash('sha256', $bytes)];
}
function postValue(string $name, int $max=120): string {
  return mb_substr(trim(strip_tags((string)($_POST[$name] ?? ''))), 0, $max);
}
function dataUri(string $mime, string $bytes): string {
  return 'data:'.$mime.';base64,'.base64_encode($bytes);
}
function decodeProviderImage(mixed $value): ?string {
  if (!is_string($value)) return null;
  if (preg_match('#^data:image/(?:png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$#', $value, $match)) {
    $decoded = base64_decode($match[1], true);
    return is_string($decoded) ? $decoded : null;
  }
  $decoded = base64_decode($value, true);
  return is_string($decoded) ? $decoded : null;
}
function watermark($image): void {
  $width = imagesx($image); $height = imagesy($image);
  $text = 'IDEA';
  $font = 5;
  $textWidth = imagefontwidth($font) * strlen($text);
  $textHeight = imagefontheight($font);
  $padding = max(12, (int)round(min($width, $height) * 0.018));
  $shadow = imagecolorallocatealpha($image, 0, 0, 0, 118);
  $ivory = imagecolorallocatealpha($image, 245, 236, 218, 114);
  imagestring($image, $font, $width-$textWidth-$padding+1, $height-$textHeight-$padding+1, $text, $shadow);
  imagestring($image, $font, $width-$textWidth-$padding, $height-$textHeight-$padding, $text, $ivory);
}
function compositeVerified(string $originalBytes, string $generatedBytes, string $maskBytes, int $expectedWidth, int $expectedHeight): string {
  if (!extension_loaded('gd')) fail(503, 'Server image compositing is unavailable', 'gd_required');
  $original = @imagecreatefromstring($originalBytes);
  $generated = @imagecreatefromstring($generatedBytes);
  $mask = @imagecreatefromstring($maskBytes);
  if (!$original || !$generated || !$mask) fail(502, 'Runpod returned invalid image data', 'invalid_provider_output');
  if (imagesx($original)!==$expectedWidth || imagesy($original)!==$expectedHeight
      || imagesx($generated)!==$expectedWidth || imagesy($generated)!==$expectedHeight
      || imagesx($mask)!==$expectedWidth || imagesy($mask)!==$expectedHeight) {
    fail(502, 'Runpod output dimensions failed preservation checks', 'geometry_mismatch');
  }
  imagealphablending($original, true); imagesavealpha($original, true);
  for ($y=0; $y<$expectedHeight; $y++) {
    for ($x=0; $x<$expectedWidth; $x++) {
      $maskColor = imagecolorat($mask, $x, $y);
      $r = ($maskColor >> 16) & 0xFF;
      $g = ($maskColor >> 8) & 0xFF;
      $b = $maskColor & 0xFF;
      if (($r+$g+$b) >= 690) imagesetpixel($original, $x, $y, imagecolorat($generated, $x, $y));
    }
  }
  watermark($original);
  ob_start(); imagepng($original, null, 6); $output = ob_get_clean();
  imagedestroy($original); imagedestroy($generated); imagedestroy($mask);
  if (!is_string($output) || !$output) fail(502, 'Final image could not be encoded', 'compositing_failed');
  return $output;
}
function jobPath(string $jobId): string {
  return rootDir().DIRECTORY_SEPARATOR.'job-'.$jobId.'.json';
}
function roomPath(string $jobId): string {
  return rootDir().DIRECTORY_SEPARATOR.'room-'.$jobId.'.bin';
}
function cleanupExpired(): void {
  foreach (glob(rootDir().DIRECTORY_SEPARATOR.'job-*.json') ?: [] as $path) {
    if ((filemtime($path) ?: time()) < time()-JOB_TTL_SECONDS) {
      $job = readJsonFile($path);
      @unlink(roomPath((string)($job['id'] ?? '')));
      @unlink($path);
    }
  }
}

sameOrigin();
if (!extension_loaded('curl') || !extension_loaded('fileinfo') || !extension_loaded('mbstring')) {
  fail(503, 'Required PHP modules are missing', 'server_dependencies_missing');
}
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > MAX_REQUEST_BYTES) fail(413, 'Upload is too large', 'payload_too_large');
cleanupExpired();
$config = configuration();
$user = authenticate($config);
$admin = $user['role'] === 'admin';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET' && ($_GET['action'] ?? '') === 'status') {
  respond(200, [
    'provider'=>'runpod',
    'integration'=>'configuration_present_unverified',
    'model'=>'Qwen/Qwen-Image-Edit-2511 preferred; worker deployment must be verified',
    'quota'=>quotaSnapshot($user['id'], $admin),
  ]);
}

if ($method === 'GET') {
  $jobId = safeId((string)($_GET['job'] ?? ''));
  $job = readJsonFile(jobPath($jobId));
  if (!$job || !hash_equals((string)($job['owner'] ?? ''), $user['id'])) fail(404, 'Job not found', 'job_not_found');
  if (($job['state'] ?? '') === 'ready' && is_string($job['result'] ?? null)) {
    respond(200, ['jobId'=>$jobId, 'state'=>'ready', 'stage'=>'ready', 'image'=>$job['result'], 'quota'=>quotaSnapshot($user['id'], $admin), 'quality'=>$job['quality'] ?? []]);
  }
  if (in_array($job['state'] ?? '', ['failed','cancelled'], true)) {
    respond(200, ['jobId'=>$jobId, 'state'=>$job['state'], 'stage'=>$job['state'], 'error'=>$job['error'] ?? 'Generation failed', 'quota'=>quotaSnapshot($user['id'], $admin)]);
  }
  [$code, $provider] = httpJson(
    'https://api.runpod.ai/v2/'.$config['endpoint'].'/status/'.rawurlencode((string)$job['providerJobId']),
    ['Authorization: Bearer '.$config['runpodKey'], 'Accept: application/json'],
    null,
    35,
    'GET'
  );
  if ($code !== 200 || !is_array($provider)) respond(202, ['jobId'=>$jobId, 'state'=>'running', 'stage'=>'generating', 'quota'=>quotaSnapshot($user['id'], $admin)]);
  $providerStatus = strtoupper((string)($provider['status'] ?? ''));
  if (in_array($providerStatus, ['IN_QUEUE','IN_PROGRESS'], true)) {
    $job['state'] = 'running'; $job['updatedAt'] = time(); writeJsonFile(jobPath($jobId), $job); updateAttempt($user['id'], $jobId, 'running', $admin);
    respond(202, ['jobId'=>$jobId, 'state'=>'running', 'stage'=>$providerStatus==='IN_QUEUE'?'queued':'generating', 'quota'=>quotaSnapshot($user['id'], $admin)]);
  }
  if ($providerStatus !== 'COMPLETED') {
    $job['state']='failed'; $job['error']='Runpod job failed before producing a usable result'; writeJsonFile(jobPath($jobId), $job); updateAttempt($user['id'], $jobId, 'failed', $admin);
    respond(200, ['jobId'=>$jobId, 'state'=>'failed', 'stage'=>'failed', 'error'=>$job['error'], 'quota'=>quotaSnapshot($user['id'], $admin)]);
  }
  $output = is_array($provider['output'] ?? null) ? $provider['output'] : [];
  $generated = decodeProviderImage($output['image'] ?? $output['edited_image'] ?? null);
  $mask = decodeProviderImage($output['mask'] ?? $output['edit_mask'] ?? null);
  $roomBytes = @file_get_contents(roomPath($jobId));
  if (!$generated || !$mask || !is_string($roomBytes)) {
    $job['state']='failed'; $job['error']='Runpod worker did not return the required edited image and verified mask'; writeJsonFile(jobPath($jobId), $job); updateAttempt($user['id'], $jobId, 'failed', $admin);
    respond(200, ['jobId'=>$jobId, 'state'=>'failed', 'stage'=>'verification_failed', 'error'=>$job['error'], 'quota'=>quotaSnapshot($user['id'], $admin)]);
  }
  $final = compositeVerified($roomBytes, $generated, $mask, (int)$job['width'], (int)$job['height']);
  $job['state']='ready';
  $job['result']='data:image/png;base64,'.base64_encode($final);
  $job['quality']=['dimensionsPreserved'=>true, 'maskVerified'=>true, 'protectedPixelsCompositedFromOriginal'=>true, 'watermark'=>'IDEA / bottom-right / subtle'];
  $job['updatedAt']=time();
  writeJsonFile(jobPath($jobId), $job); updateAttempt($user['id'], $jobId, 'ready', $admin); @unlink(roomPath($jobId));
  respond(200, ['jobId'=>$jobId, 'state'=>'ready', 'stage'=>'ready', 'image'=>$job['result'], 'quality'=>$job['quality'], 'quota'=>quotaSnapshot($user['id'], $admin)]);
}

if ($method !== 'POST') { header('Allow: GET, POST'); fail(405, 'GET or POST required', 'method_not_allowed'); }
$action = (string)($_POST['action'] ?? 'create');
if ($action === 'cancel') {
  $jobId = safeId((string)($_POST['jobId'] ?? ''));
  $job = readJsonFile(jobPath($jobId));
  if (!$job || !hash_equals((string)($job['owner'] ?? ''), $user['id'])) fail(404, 'Job not found', 'job_not_found');
  httpJson('https://api.runpod.ai/v2/'.$config['endpoint'].'/cancel/'.rawurlencode((string)$job['providerJobId']), ['Authorization: Bearer '.$config['runpodKey'], 'Accept: application/json'], null, 20, 'POST');
  $job['state']='cancelled'; $job['error']='Cancelled by user'; writeJsonFile(jobPath($jobId), $job); updateAttempt($user['id'], $jobId, 'failed', $admin); @unlink(roomPath($jobId));
  respond(200, ['jobId'=>$jobId, 'state'=>'cancelled', 'quota'=>quotaSnapshot($user['id'], $admin)]);
}
if ($action !== 'create') fail(422, 'Unsupported action', 'invalid_action');

$surface = postValue('surface', 12);
$roomKind = postValue('roomKind', 20);
$rotation = (int)($_POST['rotation'] ?? -1);
$tileSize = postValue('tileSize', 40);
$grout = strtolower(postValue('grout', 7));
$productId = postValue('productId', 120);
$productName = postValue('productName', 160);
$brand = postValue('brand', 100);
$finish = postValue('finish', 100);
$idempotencyKey = postValue('idempotencyKey', 80);
if (!in_array($surface, ['floor','walls','both'], true)
    || !in_array($roomKind, ['living','bedroom','kitchen','bathroom','office','hallway','commercial','other'], true)
    || !in_array($rotation, [0,45,90], true)
    || !preg_match('/^#[a-f0-9]{6}$/', $grout)
    || !$productId || !$productName
    || !preg_match('/^[A-Za-z0-9._:-]{16,80}$/', $idempotencyKey)) {
  fail(422, 'Invalid visualization settings', 'invalid_settings');
}
$room = imageUpload('room');
$material = imageUpload('material');
$jobId = bin2hex(random_bytes(16));
$quota = reserveAttempt($user['id'], $idempotencyKey, $admin, $jobId);
if (isset($quota['duplicateJobId']) && is_string($quota['duplicateJobId'])) {
  $existing = readJsonFile(jobPath($quota['duplicateJobId']));
  respond(200, ['jobId'=>$quota['duplicateJobId'], 'state'=>$existing['state'] ?? 'running', 'stage'=>$existing['state'] ?? 'running', 'quota'=>quotaSnapshot($user['id'], $admin)]);
}
$prompt = 'IDEA IMMUTABLE SCENE ENGINE. Edit only the approved '.$surface.' mask in the original room. '
  .'Use the exact reference material appearance. Preserve camera, dimensions, perspective, geometry, furniture, people, windows, doors, ceiling, fixtures, objects and every unselected pixel. '
  .'Generate realistic scale, grout, perspective, occlusion, contact shadows and reflections. Return the edited image and exact white editable-region mask; black pixels are immutable. '
  .'Room type: '.$roomKind.'. Product: '.$brand.' '.$productName.' '.$finish.'. Physical tile size: '.$tileSize.'. Rotation: '.$rotation.' degrees. Grout: '.$grout.'.';
$payload = [
  'input'=>[
    'contract'=>'idea-qwen-mask-v1',
    'model'=>'Qwen/Qwen-Image-Edit-2511',
    'prompt'=>$prompt,
    'original_image'=>dataUri($room['mime'], $room['bytes']),
    'material_reference'=>dataUri($material['mime'], $material['bytes']),
    'target_surface'=>$surface,
    'output_width'=>$room['width'],
    'output_height'=>$room['height'],
    'return_edit_mask'=>true,
    'preserve_unmasked_pixels'=>true,
    'product'=>['id'=>$productId, 'name'=>$productName, 'brand'=>$brand, 'finish'=>$finish, 'tile_size'=>$tileSize, 'rotation'=>$rotation, 'grout'=>$grout],
  ],
  'policy'=>['executionTimeout'=>600000],
];
[$providerCode, $providerResponse] = httpJson(
  'https://api.runpod.ai/v2/'.$config['endpoint'].'/run',
  array_merge(requestHeaders(), ['Authorization: Bearer '.$config['runpodKey']]),
  $payload,
  45,
  'POST'
);
$providerJobId = is_array($providerResponse) ? ($providerResponse['id'] ?? '') : '';
if (!in_array($providerCode, [200,201], true) || !is_string($providerJobId) || !$providerJobId) {
  updateAttempt($user['id'], $jobId, 'failed', $admin);
  fail($providerCode===429?429:502, 'Runpod did not accept the generation job', 'provider_unavailable');
}
$job = [
  'id'=>$jobId, 'owner'=>$user['id'], 'providerJobId'=>$providerJobId, 'state'=>'queued',
  'productId'=>$productId, 'surface'=>$surface, 'width'=>$room['width'], 'height'=>$room['height'],
  'sourceHash'=>$room['hash'], 'createdAt'=>time(), 'updatedAt'=>time(),
];
if (file_put_contents(roomPath($jobId), $room['bytes'], LOCK_EX) === false) {
  updateAttempt($user['id'], $jobId, 'failed', $admin);
  fail(503, 'Private job storage unavailable', 'storage_unavailable');
}
@chmod(roomPath($jobId), 0600);
writeJsonFile(jobPath($jobId), $job);
updateAttempt($user['id'], $jobId, 'running', $admin);
respond(202, ['jobId'=>$jobId, 'state'=>'queued', 'stage'=>'queued', 'quota'=>$quota]);
