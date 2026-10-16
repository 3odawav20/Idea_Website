<?php
declare(strict_types=1);
// Image-only proxy for this catalogue's known source. No arbitrary URL fetching.
header('X-Content-Type-Options: nosniff');
if ($_SERVER['REQUEST_METHOD'] !== 'GET') { http_response_code(405); exit; }
$url = $_GET['url'] ?? ''; $p = is_string($url) ? parse_url($url) : false;
if (!$p || ($p['scheme']??'') !== 'https' || !in_array(strtolower($p['host']??''), ['dashboard.artceramic-egypt.com'],true) || isset($p['user']) || isset($p['pass']) || (isset($p['port']) && $p['port']!==443)) { http_response_code(400); exit; }
if (!extension_loaded('curl')) { http_response_code(503); exit; }
$buffer='';$ch=curl_init($url);
curl_setopt_array($ch,[CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>25,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,CURLOPT_WRITEFUNCTION=>function($ch,$chunk)use(&$buffer){if(strlen($buffer)+strlen($chunk)>5*1024*1024)return 0;$buffer.=$chunk;return strlen($chunk);}]);
$ok=curl_exec($ch);$code=curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);
$info=$ok!==false&&$code===200?@getimagesizefromstring($buffer):false;
if (!$info || !in_array($info['mime']??'', ['image/png','image/jpeg','image/webp'],true) || $info[0]*$info[1]>25000000) { http_response_code(502); exit; }
header('Content-Type: '.$info['mime']);header('Cache-Control: public, max-age=3600');echo $buffer;
