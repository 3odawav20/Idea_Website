<?php
/**
 * IDEA Egypt — production-gated Twilio Verify SMS adapter.
 * Credentials, bridge and rate limit storage must live outside the web root.
 * It MUST NOT issue a login session by itself or trust client-supplied roles.
 */
declare(strict_types=1);

function ideaPhoneFail(int $status, string $code): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private');
    header('X-Content-Type-Options: nosniff');
    echo json_encode(['ok' => false, 'error' => $code], JSON_UNESCAPED_SLASHES);
    exit;
}
function ideaPhoneSuccess(array $value): never {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private');
    header('X-Content-Type-Options: nosniff');
    echo json_encode(['ok' => true] + $value, JSON_UNESCAPED_SLASHES);
    exit;
}
function ideaPhonePrivatePath(string $file): string {
    $real = realpath($file);
    $root = realpath((string)($_SERVER['DOCUMENT_ROOT'] ?? ''));
    if ($real === false || !is_file($real)) ideaPhoneFail(503, 'AUTH_NOT_CONFIGURED');
    if ($root === false || str_starts_with($real, rtrim($root, '/').'/')) ideaPhoneFail(503, 'PRIVATE_CONFIG_REQUIRED');
    return $real;
}
function ideaPhoneConfig(): array {
    $path = getenv('IDEA_OAUTH_CONFIG_FILE') ?: '/home/lsenet5/idea_private/oauth-config.php';
    $config = require ideaPhonePrivatePath($path);
    if (!is_array($config) || ($config['bridge_verified'] ?? false) !== true) {
        ideaPhoneFail(503, 'AUTH_NOT_READY');
    }
    $sms = $config['sms'] ?? null;
    if (!is_array($sms) || ($sms['e2e_verified'] ?? false) !== true) {
        ideaPhoneFail(503, 'PHONE_AUTH_NOT_READY');
    }
    foreach (['account_sid','api_key','api_secret','verify_service_sid'] as $key) {
        if (!is_string($sms[$key] ?? null) || trim($sms[$key]) === '') ideaPhoneFail(503, 'PHONE_AUTH_NOT_READY');
    }
    if (!preg_match('/^VA[a-fA-F0-9]{32}$/D', (string)$sms['verify_service_sid'])) ideaPhoneFail(503, 'PHONE_AUTH_NOT_READY');
    $bridge = getenv('IDEA_AUTH_BRIDGE_FILE') ?: '/home/lsenet5/idea_private/auth-bridge.php';
    require_once ideaPhonePrivatePath($bridge);
    if (!function_exists('ideaAuthLoginVerifiedPhone')) ideaPhoneFail(503, 'ACCOUNT_BRIDGE_NOT_READY');
    return $config;
}
function ideaPhoneRequest(array $config): array {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') ideaPhoneFail(405, 'METHOD_NOT_ALLOWED');
    $https = ($_SERVER['HTTPS'] ?? '') === 'on' || (string)($_SERVER['SERVER_PORT'] ?? '') === '443';
    if (!$https) ideaPhoneFail(403, 'HTTPS_REQUIRED');
    $origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
    $site = rtrim((string)($config['site_url'] ?? ''), '/');
    if (!hash_equals($site, $origin)) ideaPhoneFail(403, 'ORIGIN_DENIED');
    if (!str_starts_with((string)($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) ideaPhoneFail(415, 'JSON_REQUIRED');
    $raw = file_get_contents('php://input', false, null, 0, 4097);
    if (!is_string($raw) || strlen($raw) > 4096 || !$raw) ideaPhoneFail(413, 'INVALID_REQUEST');
    $data = json_decode($raw, true);
    if (!is_array($data) || array_is_list($data)) ideaPhoneFail(422, 'INVALID_REQUEST');
    return $data;
}
function ideaPhoneSession(): void {
    if (session_status() === PHP_SESSION_ACTIVE) ideaPhoneFail(503, 'SESSION_CONFLICT');
    session_name('IDEA_PHONE_CHALLENGE');
    session_set_cookie_params([
        'lifetime' => 0, 'path' => '/idea-accounts-api/auth/phone/',
        'secure' => true, 'httponly' => true, 'samesite' => 'Strict'
    ]);
    if (!session_start()) ideaPhoneFail(503, 'SESSION_UNAVAILABLE');
}
function ideaPhoneRateLimit(string $type, string $value, int $max, int $period, string $privateRoot): void {
    $dir = rtrim($privateRoot, '/').'/sms-rate-limits';
    if ((!is_dir($dir) && !mkdir($dir, 0700, true)) || !is_dir($dir)) ideaPhoneFail(503, 'RATE_LIMIT_UNAVAILABLE');
    $path = $dir.'/'.hash('sha256', $type."\n".$value).'.json';
    $fp = fopen($path, 'c+');
    if (!$fp) ideaPhoneFail(503, 'RATE_LIMIT_UNAVAILABLE');
    try {
        if (!flock($fp, LOCK_EX)) ideaPhoneFail(503, 'RATE_LIMIT_UNAVAILABLE');
        $raw = stream_get_contents($fp);
        $times = json_decode($raw ?: '[]', true);
        if (!is_array($times)) $times = [];
        $now = time();
        $times = array_values(array_filter($times, static fn($t) => is_int($t) && $t > $now-$period && $t <= $now+2));
        if (count($times) >= $max) ideaPhoneFail(429, 'PLEASE_TRY_LATER');
        $times[] = $now;
        rewind($fp);
        if (!ftruncate($fp, 0) || fwrite($fp, json_encode($times)) === false) ideaPhoneFail(503, 'RATE_LIMIT_UNAVAILABLE');
        fflush($fp);
        flock($fp, LOCK_UN);
    } finally { fclose($fp); }
}
function ideaPhoneTwilio(string $resource, array $payload, array $sms): array {
    if (!extension_loaded('curl')) ideaPhoneFail(503, 'CURL_REQUIRED');
    $base = 'https://verify.twilio.com/v2/Services/'.rawurlencode($sms['verify_service_sid']).$resource;
    $c = curl_init($base);
    if (!$c) ideaPhoneFail(503, 'SMS_TRANSPORT_UNAVAILABLE');
    curl_setopt_array($c, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($payload, '', '&', PHP_QUERY_RFC3986),
        CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded','Accept: application/json'],
        CURLOPT_USERPWD => $sms['api_key'].':'.$sms['api_secret'],
        CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 7,
        CURLOPT_TIMEOUT => 17,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);
    try {
        $body = curl_exec($c);
        $http = (int)curl_getinfo($c, CURLINFO_RESPONSE_CODE);
        if (!is_string($body) || strlen($body) > 20000 || $http < 200 || $http >= 300) ideaPhoneFail(502, 'SMS_PROVIDER_UNAVAILABLE');
        $json = json_decode($body, true);
        if (!is_array($json)) ideaPhoneFail(502, 'SMS_PROVIDER_UNAVAILABLE');
        return $json;
    } finally { curl_close($c); }
}
