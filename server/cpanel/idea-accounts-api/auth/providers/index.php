<?php
/**
 * IDEA Egypt OAuth & SMS provider availability endpoint.
 * GET /idea-accounts-api/auth/providers
 *
 * This endpoint NEVER leaks provider credentials. It only advertises providers
 * that have passed the required server-side operational checks. Adding keys is
 * not enough: the callback and MySQL session bridge must be live and verified.
 * Production OAuth / SMS operations require separate server-side handlers.
 */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private, max-age=0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    http_response_code(405);
    echo json_encode(['error' => 'METHOD_NOT_ALLOWED']);
    exit;
}
$providers = [];
$phone = false;
$path = getenv('IDEA_OAUTH_CONFIG_FILE');
if (!is_string($path) || $path === '') {
    $path = '/home/lsenet5/idea_private/oauth-config.php';
}
// Never load configuration from the public web root or repository.
$root = realpath((string)($_SERVER['DOCUMENT_ROOT'] ?? ''));
$real = is_file($path) ? realpath($path) : false;
if ($real !== false && ($root === false || !str_starts_with($real, rtrim($root, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR))) {
    $config = require $real;
    if (is_array($config) && ($config['bridge_verified'] ?? false) === true) {
        $spec = [
            'google'    => ['client_id', 'client_secret'],
            'facebook'  => ['client_id', 'client_secret'],
            'apple'     => ['services_id', 'team_id', 'key_id', 'private_key_file'],
            'twitter'   => ['client_id', 'client_secret'],
            'azure'     => ['client_id', 'client_secret', 'tenant'],
        ];
        foreach ($spec as $name => $required) {
            $cfg = $config['providers'][$name] ?? null;
            if (!is_array($cfg) || ($cfg['e2e_verified'] ?? false) !== true) continue;
            $complete = true;
            foreach ($required as $key) {
                if (!is_string($cfg[$key] ?? null) || trim($cfg[$key]) === '') {
                    $complete = false;
                    break;
                }
            }
            if ($name === 'apple' && $complete) {
                $key = realpath($cfg['private_key_file']);
                if ($key === false || !is_readable($key) || ($root !== false && str_starts_with($key, rtrim($root, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR))) {
                    $complete = false;
                }
            }
            if ($complete) $providers[] = $name;
        }
        $sms = $config['sms'] ?? null;
        $phone = is_array($sms) && ($sms['e2e_verified'] ?? false) === true;
        if ($phone) foreach (['account_sid', 'api_key', 'api_secret', 'verify_service_sid'] as $key) {
            if (!is_string($sms[$key] ?? null) || trim($sms[$key]) === '') {
                $phone = false;
                break;
            }
        }
    }
}
echo json_encode(['providers' => $providers, 'phone' => $phone], JSON_UNESCAPED_SLASHES);
