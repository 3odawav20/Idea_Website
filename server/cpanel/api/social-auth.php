<?php
declare(strict_types=1);

/**
 * IDEA Marketplace — Customer Social Authentication & WhatsApp OTP Backend
 * Single source of truth: existing cPanel PHP/MySQL accounts system (platform-core.php).
 *
 * Supported providers (Customer / Buyer accounts ONLY — never Admin or Supplier):
 *   - Google    (OAuth 2.0 + OIDC + PKCE S256 + nonce + RS256 JWKS verification)
 *   - Facebook  (Meta OAuth 2.0 + state + appsecret_proof)
 *   - Apple     (Sign in with Apple + ES256 client_secret JWT + form_post + RS256 JWKS)
 *   - Microsoft (Microsoft Identity Platform v2.0 + PKCE S256 + nonce + RS256 JWKS)
 *   - X         (X OAuth 2.0 Authorization Code + mandatory PKCE S256)
 *   - WhatsApp  (Verified phone-number OTP via Meta WhatsApp Business Cloud API — NOT OAuth)
 *
 * Security invariants:
 *   - All credentials are loaded strictly from private server configuration outside public_html.
 *   - Zero secrets are ever returned in responses, logs, or URLs.
 *   - Admin and Supplier accounts are strictly isolated and cannot be linked or logged in here.
 *   - Single-use CSRF/OAuth state tokens stored as SHA-256 hashes in MySQL with 10-minute TTL.
 *   - Strict relative redirect allowlist prevents open redirects.
 */

require_once __DIR__ . '/platform-core.php';

header('Cache-Control: no-store, no-cache, must-revalidate, private');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

const IDEA_SOCIAL_OAUTH_PROVIDERS    = ['google', 'facebook', 'apple', 'microsoft', 'x'];
const IDEA_SOCIAL_ALL_PROVIDERS      = ['google', 'whatsapp', 'facebook', 'apple', 'microsoft', 'x'];
const IDEA_OAUTH_STATE_TTL_MS        = 600000;  // 10 minutes
const IDEA_WA_OTP_TTL_MS             = 300000;  // 5 minutes
const IDEA_WA_OTP_MAX_ATTEMPTS       = 5;
// Public Google OAuth 2.0 Web Client ID for idea-dh.com (public identifier only, never a secret)
const IDEA_DEFAULT_GOOGLE_CLIENT_ID  = '248124470809-kfsdd38rgblg2dvd5020j14kgrm0j38p.apps.googleusercontent.com';

function socialOrigin(): string
{
    $configured = trim((string) platformSecret('IDEA_PUBLIC_ORIGIN'));
    if ($configured !== '' && preg_match('#^https://[a-z0-9.-]+$#i', $configured)) {
        return rtrim($configured, '/');
    }
    $host = strtolower(trim((string) ($_SERVER['HTTP_HOST'] ?? 'idea-dh.com')));
    if (!preg_match('/^(www\.)?idea-dh\.com$/', $host)) {
        return 'https://idea-dh.com';
    }
    return 'https://' . $host;
}

function socialCallbackUrl(string $provider): string
{
    return socialOrigin() . '/api/social-auth.php?action=callback&provider=' . rawurlencode($provider);
}

function socialSanitizeRedirect(?string $path): string
{
    if ($path === null) {
        return '/account';
    }
    $trimmed = trim($path);
    if ($trimmed === '' || $trimmed[0] !== '/' || str_starts_with($trimmed, '//')) {
        return '/account';
    }
    if (str_contains($trimmed, '\\') || preg_match('/[\r\n\t\x00-\x1f]/', $trimmed)) {
        return '/account';
    }
    if (preg_match('#^/(admin|api|login|register)(/|\?|$)#i', $trimmed)) {
        return '/account';
    }
    return $trimmed;
}

function socialClientIpHash(): string
{
    $ip = trim((string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'));
    return hash('sha256', 'idea-ip|' . $ip);
}

function socialRedirectError(string $mode, string $errorCode, string $provider = ''): never
{
    $base = $mode === 'register' ? '/register' : '/login';
    $qs = 'social_error=' . rawurlencode($errorCode);
    if ($provider !== '') {
        $qs .= '&social_provider=' . rawurlencode($provider);
    }
    header('Location: ' . $base . '?' . $qs, true, 302);
    exit;
}

function socialBase64UrlEncode(string $bin): string
{
    return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
}

function socialBase64UrlDecode(string $str): string
{
    $pad = strlen($str) % 4;
    if ($pad > 0) {
        $str .= str_repeat('=', 4 - $pad);
    }
    $decoded = base64_decode(strtr($str, '-_', '+/'), true);
    return $decoded === false ? '' : $decoded;
}

function socialCheckRateLimit(string $bucket, int $maxHits, int $windowSeconds): bool
{
    $now = platformNow();
    $windowMs = $windowSeconds * 1000;
    $windowStart = $now - $windowMs;

    accountQuery(
        'DELETE FROM idea_social_rate_limits WHERE updated_at < ?',
        [$now - 86400000]
    );

    $rows = accountQuery(
        'SELECT hits, window_start FROM idea_social_rate_limits WHERE bucket_key = ? LIMIT 1',
        [$bucket]
    )->fetchAll(PDO::FETCH_ASSOC);

    if (!$rows) {
        accountQuery(
            'INSERT INTO idea_social_rate_limits (bucket_key, hits, window_start, updated_at) VALUES (?, 1, ?, ?)',
            [$bucket, $now, $now]
        );
        return true;
    }

    $row = $rows[0];
    $storedStart = (int) $row['window_start'];
    $hits = (int) $row['hits'];

    if ($storedStart < $windowStart) {
        accountQuery(
            'UPDATE idea_social_rate_limits SET hits = 1, window_start = ?, updated_at = ? WHERE bucket_key = ?',
            [$now, $now, $bucket]
        );
        return true;
    }

    if ($hits >= $maxHits) {
        return false;
    }

    accountQuery(
        'UPDATE idea_social_rate_limits SET hits = hits + 1, updated_at = ? WHERE bucket_key = ?',
        [$now, $bucket]
    );
    return true;
}

/**
 * Resolve Google OAuth credentials from private JSON file outside public_html
 * OR private environment secrets. Never reads from public webroot.
 *
 * @return array{client_id: string, client_secret: string, redirect_uri: string}|null
 */
function socialGoogleCredentials(): ?array
{
    $privateRoot = rtrim((string) platformPrivateRoot(), '/');
    $candidates = [];

    $explicitFile = trim((string) platformSecret('GOOGLE_OAUTH_CREDENTIALS_FILE'));
    if ($explicitFile !== '') {
        $real = realpath($explicitFile);
        $realRoot = realpath($privateRoot);
        if ($real !== false && $realRoot !== false && str_starts_with($real, $realRoot . DIRECTORY_SEPARATOR)) {
            $candidates[] = $real;
        }
    }

    if ($privateRoot !== '') {
        $candidates[] = $privateRoot . '/google-oauth.json';
        $candidates[] = $privateRoot . '/google-oauth-credentials.json';
        $globbed = glob($privateRoot . '/client_secret_*.json');
        if (is_array($globbed)) {
            foreach ($globbed as $f) {
                $candidates[] = $f;
            }
        }
    }

    foreach ($candidates as $file) {
        if (is_file($file) && is_readable($file)) {
            $raw = file_get_contents($file);
            if ($raw !== false) {
                $parsed = json_decode($raw, true);
                if (is_array($parsed)) {
                    $node = $parsed['web'] ?? $parsed['installed'] ?? $parsed;
                    $cid = trim((string) ($node['client_id'] ?? ''));
                    $csec = trim((string) ($node['client_secret'] ?? ''));
                    if ($cid !== '' && $csec !== '') {
                        return [
                            'client_id'     => $cid,
                            'client_secret' => $csec,
                            'redirect_uri'  => socialCallbackUrl('google'),
                        ];
                    }
                }
            }
        }
    }

    $cid = trim((string) platformSecret('GOOGLE_CLIENT_ID'));
    $csec = trim((string) platformSecret('GOOGLE_CLIENT_SECRET'));
    if ($cid !== '' && $csec !== '') {
        return [
            'client_id'     => $cid,
            'client_secret' => $csec,
            'redirect_uri'  => socialCallbackUrl('google'),
        ];
    }

    return null;
}

function socialFacebookCredentials(): ?array
{
    $id = trim((string) platformSecret('FACEBOOK_APP_ID'));
    $secret = trim((string) platformSecret('FACEBOOK_APP_SECRET'));
    if ($id === '' || $secret === '') {
        return null;
    }
    return [
        'client_id'     => $id,
        'client_secret' => $secret,
        'redirect_uri'  => socialCallbackUrl('facebook'),
    ];
}

function socialAppleCredentials(): ?array
{
    $clientId = trim((string) platformSecret('APPLE_CLIENT_ID'));
    $teamId   = trim((string) platformSecret('APPLE_TEAM_ID'));
    $keyId    = trim((string) platformSecret('APPLE_KEY_ID'));
    $keyPem   = trim((string) platformSecret('APPLE_PRIVATE_KEY'));

    if ($keyPem === '') {
        $keyFile = trim((string) platformSecret('APPLE_PRIVATE_KEY_FILE'));
        $privateRoot = rtrim((string) platformPrivateRoot(), '/');
        if ($keyFile !== '' && $privateRoot !== '') {
            $real = realpath($keyFile);
            $realRoot = realpath($privateRoot);
            if ($real !== false && $realRoot !== false && str_starts_with($real, $realRoot . DIRECTORY_SEPARATOR) && is_readable($real)) {
                $keyPem = trim((string) file_get_contents($real));
            }
        }
    }

    if ($clientId === '' || $teamId === '' || $keyId === '' || !str_contains($keyPem, 'BEGIN PRIVATE KEY')) {
        return null;
    }

    return [
        'client_id'    => $clientId,
        'team_id'      => $teamId,
        'key_id'       => $keyId,
        'private_key'  => $keyPem,
        'redirect_uri' => socialCallbackUrl('apple'),
    ];
}

function socialMicrosoftCredentials(): ?array
{
    $id = trim((string) platformSecret('MICROSOFT_CLIENT_ID'));
    $secret = trim((string) platformSecret('MICROSOFT_CLIENT_SECRET'));
    $tenant = trim((string) platformSecret('MICROSOFT_TENANT_ID'));
    if ($tenant === '' || !preg_match('/^[a-z0-9-]+$/i', $tenant)) {
        $tenant = 'common';
    }
    if ($id === '' || $secret === '') {
        return null;
    }
    return [
        'client_id'     => $id,
        'client_secret' => $secret,
        'tenant'        => $tenant,
        'redirect_uri'  => socialCallbackUrl('microsoft'),
    ];
}

function socialXCredentials(): ?array
{
    $id = trim((string) platformSecret('X_CLIENT_ID'));
    $secret = trim((string) platformSecret('X_CLIENT_SECRET'));
    if ($id === '' || $secret === '') {
        return null;
    }
    return [
        'client_id'     => $id,
        'client_secret' => $secret,
        'redirect_uri'  => socialCallbackUrl('x'),
    ];
}

function socialWhatsAppCredentials(): ?array
{
    $phoneNumberId = trim((string) platformSecret('WHATSAPP_PHONE_NUMBER_ID'));
    $accessToken   = trim((string) platformSecret('WHATSAPP_ACCESS_TOKEN'));
    $templateName  = trim((string) platformSecret('WHATSAPP_OTP_TEMPLATE'));
    $templateLang  = trim((string) platformSecret('WHATSAPP_OTP_LANG'));
    if ($templateLang === '') {
        $templateLang = 'ar';
    }
    if ($phoneNumberId === '' || $accessToken === '' || $templateName === '') {
        return null;
    }
    return [
        'phone_number_id' => $phoneNumberId,
        'access_token'    => $accessToken,
        'template_name'   => $templateName,
        'template_lang'   => $templateLang,
    ];
}

function socialGooglePublicClientId(): string
{
    $oauth = socialGoogleCredentials();
    if ($oauth !== null && $oauth['client_id'] !== '') {
        return $oauth['client_id'];
    }
    $envCid = trim((string) platformSecret('GOOGLE_CLIENT_ID'));
    if ($envCid !== '') {
        return $envCid;
    }
    return IDEA_DEFAULT_GOOGLE_CLIENT_ID;
}

function socialProviderStatusMap(): array
{
    return [
        'google'    => socialGoogleCredentials() !== null || socialGooglePublicClientId() !== '',
        'whatsapp'  => socialWhatsAppCredentials() !== null,
        'facebook'  => socialFacebookCredentials() !== null,
        'apple'     => socialAppleCredentials() !== null,
        'microsoft' => socialMicrosoftCredentials() !== null,
        'x'         => socialXCredentials() !== null,
    ];
}

/**
 * Strict outbound HTTPS request helper (TLS verified, no open redirects).
 *
 * @param array<int, string> $headers
 * @return array{status: int, body: string, json: array<string, mixed>|null}
 */
function socialHttpRequest(string $method, string $url, array $headers = [], ?string $body = null, int $timeout = 12): array
{
    if (!str_starts_with($url, 'https://')) {
        throw new RuntimeException('HTTPS_REQUIRED');
    }
    $ch = curl_init($url);
    if ($ch === false) {
        throw new RuntimeException('CURL_INIT_FAILED');
    }
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_CONNECTTIMEOUT => 6,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_CUSTOMREQUEST  => strtoupper($method),
    ];
    if ($body !== null) {
        $opts[CURLOPT_POSTFIELDS] = $body;
    }
    curl_setopt_array($ch, $opts);
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if (!is_string($raw)) {
        return ['status' => 0, 'body' => '', 'json' => null];
    }
    $decoded = json_decode($raw, true);
    return [
        'status' => $status,
        'body'   => $raw,
        'json'   => is_array($decoded) ? $decoded : null,
    ];
}

/**
 * Convert DER-encoded ECDSA signature from OpenSSL into raw 64-byte R||S for ES256 JWT.
 */
function socialEcdsaDerToJose(string $der, int $partLength = 32): string
{
    $pos = 0;
    if (ord($der[$pos++]) !== 0x30) {
        throw new RuntimeException('APPLE_JWT_DER_INVALID');
    }
    $seqLen = ord($der[$pos++]);
    if ($seqLen & 0x80) {
        $pos += ($seqLen & 0x7f);
    }
    if (ord($der[$pos++]) !== 0x02) {
        throw new RuntimeException('APPLE_JWT_DER_R_INVALID');
    }
    $rLen = ord($der[$pos++]);
    $r = substr($der, $pos, $rLen);
    $pos += $rLen;

    if (ord($der[$pos++]) !== 0x02) {
        throw new RuntimeException('APPLE_JWT_DER_S_INVALID');
    }
    $sLen = ord($der[$pos++]);
    $s = substr($der, $pos, $sLen);

    $r = str_pad(ltrim($r, "\x00"), $partLength, "\x00", STR_PAD_LEFT);
    $s = str_pad(ltrim($s, "\x00"), $partLength, "\x00", STR_PAD_LEFT);
    return substr($r, -$partLength) . substr($s, -$partLength);
}

function socialBuildAppleClientSecret(array $cfg): string
{
    $now = time();
    $header = socialBase64UrlEncode(json_encode(['alg' => 'ES256', 'kid' => $cfg['key_id']], JSON_THROW_ON_ERROR));
    $payload = socialBase64UrlEncode(json_encode([
        'iss' => $cfg['team_id'],
        'iat' => $now,
        'exp' => $now + 300,
        'aud' => 'https://appleid.apple.com',
        'sub' => $cfg['client_id'],
    ], JSON_THROW_ON_ERROR));

    $signingInput = $header . '.' . $payload;
    $privKey = openssl_pkey_get_private($cfg['private_key']);
    if ($privKey === false) {
        throw new RuntimeException('APPLE_PRIVATE_KEY_INVALID');
    }
    $derSig = '';
    if (!openssl_sign($signingInput, $derSig, $privKey, OPENSSL_ALGO_SHA256)) {
        throw new RuntimeException('APPLE_SIGN_FAILED');
    }
    $joseSig = socialEcdsaDerToJose($derSig, 32);
    return $signingInput . '.' . socialBase64UrlEncode($joseSig);
}

/**
 * ASN.1 DER length encoder for RSA JWK -> PEM conversion.
 */
function socialDerLength(int $len): string
{
    if ($len < 128) {
        return chr($len);
    }
    $bytes = ltrim(pack('N', $len), "\x00");
    return chr(0x80 | strlen($bytes)) . $bytes;
}

function socialDerInteger(string $bin): string
{
    if ($bin === '' || (ord($bin[0]) & 0x80)) {
        $bin = "\x00" . $bin;
    }
    return "\x02" . socialDerLength(strlen($bin)) . $bin;
}

function socialJwkRsaToPem(string $nB64, string $eB64): string
{
    $modulus = socialBase64UrlDecode($nB64);
    $exponent = socialBase64UrlDecode($eB64);
    if ($modulus === '' || $exponent === '') {
        throw new RuntimeException('JWK_INVALID');
    }

    $rsaPubKey = socialDerInteger($modulus) . socialDerInteger($exponent);
    $rsaPubKeySeq = "\x30" . socialDerLength(strlen($rsaPubKey)) . $rsaPubKey;
    $bitString = "\x03" . socialDerLength(strlen($rsaPubKeySeq) + 1) . "\x00" . $rsaPubKeySeq;

    // rsaEncryption OID 1.2.840.113549.1.1.1 + NULL
    $algId = "\x30\x0d\x06\x09\x2a\x86\x48\x86\xf7\x0d\x01\x01\x01\x05\x00";
    $spki = "\x30" . socialDerLength(strlen($algId . $bitString)) . $algId . $bitString;

    return "-----BEGIN PUBLIC KEY-----\n"
        . chunk_split(base64_encode($spki), 64, "\n")
        . "-----END PUBLIC KEY-----\n";
}

/**
 * Fetch and cache provider JWKS keys (1-hour private cache).
 *
 * @return array<int, array<string, mixed>>
 */
function socialFetchJwks(string $cacheName, string $jwksUrl): array
{
    $cacheDir = rtrim((string) platformPrivateRoot(), '/') . '/cache';
    $cacheFile = $cacheDir . '/jwks-' . preg_replace('/[^a-z0-9_-]/i', '', $cacheName) . '.json';

    if (is_file($cacheFile) && (time() - (int) filemtime($cacheFile)) < 3600) {
        $cached = json_decode((string) file_get_contents($cacheFile), true);
        if (is_array($cached) && isset($cached['keys']) && is_array($cached['keys'])) {
            return $cached['keys'];
        }
    }

    $res = socialHttpRequest('GET', $jwksUrl, ['Accept: application/json']);
    if ($res['status'] !== 200 || !is_array($res['json']) || !isset($res['json']['keys']) || !is_array($res['json']['keys'])) {
        throw new RuntimeException('JWKS_FETCH_FAILED');
    }

    if (is_dir($cacheDir) || @mkdir($cacheDir, 0700, true)) {
        @file_put_contents($cacheFile, $res['body'], LOCK_EX);
    }
    return $res['json']['keys'];
}

/**
 * Cryptographically verify an OIDC RS256 ID token against provider JWKS.
 *
 * @param array<int, string> $allowedIssuers
 * @return array<string, mixed>
 */
function socialVerifyOidcIdToken(
    string $idToken,
    string $jwksCacheName,
    string $jwksUrl,
    string $expectedAudience,
    array $allowedIssuers,
    string $expectedNonce,
    bool $allowMicrosoftTenantIssuer = false
): array {
    $parts = explode('.', $idToken);
    if (count($parts) !== 3) {
        throw new RuntimeException('ID_TOKEN_MALFORMED');
    }
    [$h64, $p64, $s64] = $parts;
    $header = json_decode(socialBase64UrlDecode($h64), true);
    $claims = json_decode(socialBase64UrlDecode($p64), true);
    $sig    = socialBase64UrlDecode($s64);

    if (!is_array($header) || !is_array($claims) || $sig === '') {
        throw new RuntimeException('ID_TOKEN_DECODE_FAILED');
    }
    if (($header['alg'] ?? '') !== 'RS256') {
        throw new RuntimeException('ID_TOKEN_ALG_UNSUPPORTED');
    }
    $kid = (string) ($header['kid'] ?? '');
    if ($kid === '') {
        throw new RuntimeException('ID_TOKEN_KID_MISSING');
    }

    $keys = socialFetchJwks($jwksCacheName, $jwksUrl);
    $matchedJwk = null;
    foreach ($keys as $jwk) {
        if (is_array($jwk) && (($jwk['kid'] ?? '') === $kid) && (($jwk['kty'] ?? '') === 'RSA')) {
            $matchedJwk = $jwk;
            break;
        }
    }
    if ($matchedJwk === null) {
        throw new RuntimeException('ID_TOKEN_KEY_NOT_FOUND');
    }

    $pem = socialJwkRsaToPem((string) ($matchedJwk['n'] ?? ''), (string) ($matchedJwk['e'] ?? ''));
    $verified = openssl_verify($h64 . '.' . $p64, $sig, $pem, OPENSSL_ALGO_SHA256);
    if ($verified !== 1) {
        throw new RuntimeException('ID_TOKEN_SIGNATURE_INVALID');
    }

    $now = time();
    $exp = (int) ($claims['exp'] ?? 0);
    $nbf = isset($claims['nbf']) ? (int) $claims['nbf'] : 0;
    if ($exp <= ($now - 60)) {
        throw new RuntimeException('ID_TOKEN_EXPIRED');
    }
    if ($nbf > ($now + 60)) {
        throw new RuntimeException('ID_TOKEN_NOT_YET_VALID');
    }

    $aud = $claims['aud'] ?? '';
    $audValid = is_array($aud) ? in_array($expectedAudience, $aud, true) : ($aud === $expectedAudience);
    if (!$audValid) {
        throw new RuntimeException('ID_TOKEN_AUD_INVALID');
    }

    $iss = (string) ($claims['iss'] ?? '');
    $issValid = in_array($iss, $allowedIssuers, true);
    if (!$issValid && $allowMicrosoftTenantIssuer) {
        $tid = (string) ($claims['tid'] ?? '');
        if ($tid !== '' && preg_match('/^[0-9a-f-]{36}$/i', $tid)) {
            $issValid = ($iss === 'https://login.microsoftonline.com/' . $tid . '/v2.0');
        }
    }
    if (!$issValid) {
        throw new RuntimeException('ID_TOKEN_ISS_INVALID');
    }

    if ($expectedNonce !== '') {
        $tokenNonce = (string) ($claims['nonce'] ?? '');
        if ($tokenNonce === '' || !hash_equals($expectedNonce, $tokenNonce)) {
            throw new RuntimeException('ID_TOKEN_NONCE_INVALID');
        }
    }

    return $claims;
}

/**
 * Safely link or create a Customer ('buyer') account in idea_users + idea_social_identities.
 * Strictly blocks Admin and Supplier accounts from linking or signing in through social auth.
 *
 * @return array{id: string, name: string, email: string, phone: string, role: string}
 */
function socialResolveOrCreateBuyer(
    string $provider,
    string $providerSubject,
    ?string $email,
    bool $emailVerified,
    ?string $phone,
    string $displayName
): array {
    $now = platformNow();
    $cleanEmail = $email !== null ? strtolower(trim($email)) : '';
    $cleanPhone = $phone !== null ? trim($phone) : '';
    $cleanName  = trim(preg_replace('/\s+/', ' ', $displayName) ?? '');
    if (mb_strlen($cleanName) < 2) {
        $cleanName = $cleanEmail !== '' ? explode('@', $cleanEmail)[0] : 'IDEA Customer';
    }
    $cleanName = mb_substr($cleanName, 0, 120);

    // 1. Existing provider identity lookup
    $linked = accountQuery(
        'SELECT u.id, u.name, u.email, u.phone, u.role
           FROM idea_social_identities si
           INNER JOIN idea_users u ON u.id = si.user_id
          WHERE si.provider = ? AND si.provider_subject = ?
          LIMIT 1',
        [$provider, $providerSubject]
    )->fetchAll(PDO::FETCH_ASSOC);

    if ($linked) {
        $user = $linked[0];
        if (strtolower((string) $user['role']) !== 'buyer') {
            throw new RuntimeException('ADMIN_SOCIAL_LOGIN_DISABLED');
        }
        accountQuery(
            'UPDATE idea_social_identities SET last_login_at = ?, updated_at = ? WHERE provider = ? AND provider_subject = ?',
            [$now, $now, $provider, $providerSubject]
        );
        return [
            'id'    => (string) $user['id'],
            'name'  => (string) $user['name'],
            'email' => (string) ($user['email'] ?? ''),
            'phone' => (string) ($user['phone'] ?? ''),
            'role'  => 'buyer',
        ];
    }

    // 2. Match existing customer by verified email (or verified WhatsApp phone)
    $existingUser = null;
    if ($cleanEmail !== '') {
        if (!$emailVerified) {
            throw new RuntimeException('EMAIL_UNVERIFIED');
        }
        $rows = accountQuery(
            'SELECT id, name, email, phone, role FROM idea_users WHERE LOWER(email) = ? LIMIT 1',
            [$cleanEmail]
        )->fetchAll(PDO::FETCH_ASSOC);
        if ($rows) {
            $existingUser = $rows[0];
        }
    } elseif ($provider === 'whatsapp' && $cleanPhone !== '') {
        $rows = accountQuery(
            'SELECT id, name, email, phone, role FROM idea_users WHERE phone = ? LIMIT 1',
            [$cleanPhone]
        )->fetchAll(PDO::FETCH_ASSOC);
        if ($rows) {
            $existingUser = $rows[0];
        }
    }

    if ($existingUser !== null) {
        if (strtolower((string) $existingUser['role']) !== 'buyer') {
            // Never allow social login to link to Admin or Supplier accounts
            throw new RuntimeException('ADMIN_SOCIAL_LOGIN_DISABLED');
        }
        $identityId = bin2hex(random_bytes(16));
        accountQuery(
            'INSERT INTO idea_social_identities
                (id, user_id, provider, provider_subject, provider_email, email_verified, provider_phone, created_at, updated_at, last_login_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $identityId,
                (string) $existingUser['id'],
                $provider,
                $providerSubject,
                $cleanEmail !== '' ? $cleanEmail : null,
                $emailVerified ? 1 : 0,
                $cleanPhone !== '' ? $cleanPhone : null,
                $now,
                $now,
                $now,
            ]
        );
        return [
            'id'    => (string) $existingUser['id'],
            'name'  => (string) $existingUser['name'],
            'email' => (string) ($existingUser['email'] ?? ''),
            'phone' => (string) ($existingUser['phone'] ?? ''),
            'role'  => 'buyer',
        ];
    }

    // 3. Create a brand-new Customer ('buyer') account — never 'admin' or 'supplier'
    $userId = bin2hex(random_bytes(16));
    $placeholderPasswordHash = password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT);
    $storedEmail = $cleanEmail !== ''
        ? $cleanEmail
        : sprintf('%s_%s@social.idea-dh.local', $provider, substr(hash('sha256', $provider . ':' . $providerSubject), 0, 16));

    accountQuery(
        'INSERT INTO idea_users (id, name, email, phone, password_hash, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
            $userId,
            $cleanName,
            $storedEmail,
            $cleanPhone,
            $placeholderPasswordHash,
            'buyer',
            $now,
            $now,
        ]
    );

    $identityId = bin2hex(random_bytes(16));
    accountQuery(
        'INSERT INTO idea_social_identities
            (id, user_id, provider, provider_subject, provider_email, email_verified, provider_phone, created_at, updated_at, last_login_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
            $identityId,
            $userId,
            $provider,
            $providerSubject,
            $cleanEmail !== '' ? $cleanEmail : null,
            $emailVerified ? 1 : 0,
            $cleanPhone !== '' ? $cleanPhone : null,
            $now,
            $now,
            $now,
        ]
    );

    return [
        'id'    => $userId,
        'name'  => $cleanName,
        'email' => $storedEmail,
        'phone' => $cleanPhone,
        'role'  => 'buyer',
    ];
}

function socialEstablishBuyerSession(array $buyer, string $provider): void
{
    accountSession();
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_regenerate_id(true);
    }
    $_SESSION['uid']                = $buyer['id'];
    $_SESSION['idea_user_id']       = $buyer['id'];
    $_SESSION['user_id']            = $buyer['id'];
    $_SESSION['idea_user_role']     = 'buyer';
    $_SESSION['idea_auth_provider'] = $provider;
    $_SESSION['csrf']               = bin2hex(random_bytes(24));
    $_SESSION['csrf_token']         = $_SESSION['csrf'];
}

function socialVerifyCsrfFromHeader(): void
{
    accountSession();
    $expected = (string) ($_SESSION['csrf'] ?? $_SESSION['csrf_token'] ?? '');
    $provided = trim((string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''));
    if ($expected === '' || $provided === '' || !hash_equals($expected, $provided)) {
        accountError(403, 'CSRF_INVALID');
    }
}

/* ============================================================================
   ROUTER
   ============================================================================ */
$action = strtolower(trim((string) ($_GET['action'] ?? $_POST['action'] ?? 'providers')));

// 1. Provider readiness endpoint (never exposes secrets)
if ($action === 'providers') {
    header('Content-Type: application/json; charset=utf-8');
    $hasFullGoogleOAuth = socialGoogleCredentials() !== null;
    $googleClientId = socialGooglePublicClientId();
    platformJson([
        'ok'             => true,
        'providers'      => socialProviderStatusMap(),
        'googleMode'     => $hasFullGoogleOAuth ? 'oauth' : ($googleClientId !== '' ? 'gis' : null),
        'googleClientId' => $googleClientId !== '' ? $googleClientId : null,
        'businessGoogle' => $googleClientId !== '' && (string) platformSecret('IDEA_BUSINESS_GOOGLE_ENABLED') === '1',
    ]);
    exit;
}

// Company Google registration/login is opt-in until the deployed schema is verified.
if ($action === 'google-business') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') accountError(405, 'METHOD_NOT_ALLOWED');
    if ((string) platformSecret('IDEA_BUSINESS_GOOGLE_ENABLED') !== '1') accountError(503, 'PROVIDER_NOT_CONFIGURED');
    socialVerifyCsrfFromHeader();
    if (!socialCheckRateLimit('google-business:' . socialClientIpHash(), 12, 600)) accountError(429, 'RATE_LIMITED');
    $body = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($body) || !in_array($body['mode'] ?? '', ['login','register'], true)) accountError(422, 'INVALID_FIELDS');
    $credential = $body['credential'] ?? '';
    if (!is_string($credential) || strlen($credential) > 16000 || substr_count($credential, '.') !== 2) accountError(400, 'ID_TOKEN_MALFORMED');
    $clientId = socialGooglePublicClientId();
    if ($clientId === '') accountError(503, 'PROVIDER_NOT_CONFIGURED');
    try {
        $claims = socialVerifyOidcIdToken($credential, 'google', 'https://www.googleapis.com/oauth2/v3/certs', $clientId, ['https://accounts.google.com','accounts.google.com'], '');
        $subject = (string) ($claims['sub'] ?? '');
        $email = strtolower(trim((string) ($claims['email'] ?? '')));
        if ($subject === '' || strlen($subject)>191 || ($claims['email_verified'] ?? false) !== true || !filter_var($email,FILTER_VALIDATE_EMAIL) || strlen($email)>190) throw new RuntimeException('GOOGLE_EMAIL_UNVERIFIED');
        $db = accountDb();
        $db->beginTransaction();
        try {
            $user = accountQuery("SELECT u.id,u.name,u.email,u.phone,u.role FROM idea_social_identities s JOIN idea_users u ON u.id=s.user_id WHERE s.provider='google' AND s.provider_subject=? LIMIT 1", [$subject])->fetch(PDO::FETCH_ASSOC);
            if ($user) {
                if ($user['role'] !== 'supplier') throw new RuntimeException('ACCOUNT_ROLE_PROTECTED');
                if (!accountQuery('SELECT id FROM idea_companies WHERE owner_id=? LIMIT 1',[$user['id']])->fetch()) throw new RuntimeException('COMPANY_REQUIRED');
                accountQuery("UPDATE idea_social_identities SET last_login_at=?,updated_at=? WHERE provider='google' AND provider_subject=?", [platformNow(),platformNow(),$subject]);
            } else {
                // Never silently attach Google to a pre-existing password account or change roles.
                if (accountQuery('SELECT id FROM idea_users WHERE LOWER(email)=? LIMIT 1',[$email])->fetch()) throw new RuntimeException('ACCOUNT_EXISTS');
                if ($body['mode'] !== 'register') throw new RuntimeException('BUSINESS_ACCOUNT_REQUIRED');
                if (($body['consent'] ?? false) !== true) throw new RuntimeException('INVALID_FIELDS');
                $name = accountString($body,'display_name',120,true);
                $company = accountString($body,'company_name',200,true);
                $phone = accountString($body,'phone',40,true);
                $profile = $body['business_profile'] ?? null;
                if (!is_array($profile)) throw new RuntimeException('INVALID_FIELDS');
                $category = $profile['primary_category'] ?? '';
                $activity = $profile['company_type'] ?? '';
                if (!in_array($category,['ceramic','porcelain','marble','granite','sanitary','faucets'],true) || !in_array($activity,['retailer','wholesaler','manufacturer','importer','contractor'],true)) throw new RuntimeException('INVALID_FIELDS');
                $details = ['categories'=>[$category],'primary_category'=>$category,'contract_volume'=>'prefer_not_to_say','company_type'=>$activity];
                foreach (['governorate','service_areas','commercial_registration'] as $key) $details[$key]=accountString($profile,$key,200,true);
                $id=bin2hex(random_bytes(16)); $now=platformNow();
                accountQuery('INSERT INTO idea_users(id,email,name,password_hash,role,phone,created_at) VALUES(?,?,?,?,?,?,?)',[$id,$email,$name,password_hash(bin2hex(random_bytes(32)),PASSWORD_DEFAULT),'supplier',$phone,$now]);
                accountQuery("INSERT INTO idea_companies(id,owner_id,public_name,legal_name,email,phone,description,status,business_details,created_at) VALUES(?,?,?,?,?,?,?,'submitted',?,?)",[bin2hex(random_bytes(16)),$id,$company,$company,$email,$phone,'',json_encode($details,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),$now]);
                accountQuery("INSERT INTO idea_memberships(user_id,audience,billing_interval,status,updated_at) VALUES(?,'business','monthly','requested',?)",[$id,$now]);
                accountQuery("INSERT INTO idea_social_identities(id,user_id,provider,provider_subject,provider_email,email_verified,created_at,updated_at,last_login_at) VALUES(?,?,'google',?,?,1,?,?,?)",[bin2hex(random_bytes(16)),$id,$subject,$email,$now,$now,$now]);
                $user=['id'=>$id,'name'=>$name,'email'=>$email,'phone'=>$phone,'role'=>'supplier'];
            }
            $db->commit();
        } catch (Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            throw $e;
        }
        accountSession();
        session_regenerate_id(true);
        $_SESSION['uid']=$user['id'];
        $_SESSION['idea_user_id']=$user['id'];
        $_SESSION['user_id']=$user['id'];
        $_SESSION['idea_user_role']='supplier';
        $_SESSION['idea_auth_provider']='google';
        $_SESSION['csrf']=bin2hex(random_bytes(32));
        $_SESSION['csrf_token']=$_SESSION['csrf'];
        platformJson(['ok'=>true,'user'=>$user]);
        exit;
    } catch (Throwable $e) {
        $code=$e->getMessage();
        $allowed=['ACCOUNT_ROLE_PROTECTED','ACCOUNT_EXISTS','BUSINESS_ACCOUNT_REQUIRED','COMPANY_REQUIRED','INVALID_FIELDS','GOOGLE_EMAIL_UNVERIFIED'];
        accountError(in_array($code,$allowed,true)?403:401,in_array($code,$allowed,true)?$code:'GOOGLE_BUSINESS_AUTH_FAILED');
    }
}

// 1b. Google Identity Services (GIS) RS256 ID Token verification (POST + CSRF, zero ModSecurity 406 query issues)
if ($action === 'google-id-token') {
    header('Content-Type: application/json; charset=utf-8');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        accountError(405, 'METHOD_NOT_ALLOWED');
    }
    socialVerifyCsrfFromHeader();

    if (!socialCheckRateLimit('google-gis:' . socialClientIpHash(), 30, 600)) {
        accountError(429, 'RATE_LIMITED');
    }

    $googleClientId = socialGooglePublicClientId();
    if ($googleClientId === '') {
        accountError(503, 'PROVIDER_NOT_CONFIGURED');
    }

    $body = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($body)) {
        accountError(400, 'INVALID_PAYLOAD');
    }
    $credential = trim((string) ($body['credential'] ?? ''));
    if ($credential === '' || substr_count($credential, '.') !== 2) {
        accountError(400, 'ID_TOKEN_MALFORMED');
    }

    try {
        $claims = socialVerifyOidcIdToken(
            $credential,
            'google',
            'https://www.googleapis.com/oauth2/v3/certs',
            $googleClientId,
            ['https://accounts.google.com', 'accounts.google.com'],
            ''
        );
        $subject       = (string) ($claims['sub'] ?? '');
        $email         = isset($claims['email']) ? (string) $claims['email'] : null;
        $emailVerified = ($claims['email_verified'] ?? false) === true;
        $displayName   = (string) ($claims['name'] ?? '');

        if ($subject === '' || !$emailVerified || $email === null || $email === '') {
            throw new RuntimeException('GOOGLE_EMAIL_UNVERIFIED');
        }

        $buyer = socialResolveOrCreateBuyer('google', $subject, $email, true, null, $displayName);
        socialEstablishBuyerSession($buyer, 'google');
        platformJson([
            'ok'   => true,
            'user' => [
                'id'    => $buyer['id'],
                'name'  => $buyer['name'],
                'email' => $buyer['email'],
                'phone' => $buyer['phone'],
                'role'  => 'buyer',
            ],
        ]);
        exit;
    } catch (Throwable $e) {
        $errCode = preg_match('/^[A-Z0-9_]{3,48}$/', $e->getMessage())
            ? $e->getMessage()
            : 'GOOGLE_TOKEN_INVALID';
        $status = $errCode === 'ADMIN_SOCIAL_LOGIN_DISABLED' ? 403 : 401;
        accountError($status, $errCode);
    }
}

// 2. OAuth start endpoint (Google, Facebook, Apple, Microsoft, X)
if ($action === 'start') {
    $provider = strtolower(trim((string) ($_GET['provider'] ?? '')));
    $mode     = strtolower(trim((string) ($_GET['mode'] ?? 'login'))) === 'register' ? 'register' : 'login';
    $redirect = socialSanitizeRedirect(isset($_GET['redirect']) ? (string) $_GET['redirect'] : '/account');

    if (!in_array($provider, IDEA_SOCIAL_OAUTH_PROVIDERS, true)) {
        socialRedirectError($mode, 'PROVIDER_UNSUPPORTED', $provider);
    }

    if (!socialCheckRateLimit('start:' . socialClientIpHash(), 30, 600)) {
        socialRedirectError($mode, 'RATE_LIMITED', $provider);
    }

    $state        = socialBase64UrlEncode(random_bytes(32));
    $stateHash    = hash('sha256', $state);
    $nonce        = socialBase64UrlEncode(random_bytes(24));
    $codeVerifier = socialBase64UrlEncode(random_bytes(48));
    $codeChallenge = socialBase64UrlEncode(hash('sha256', $codeVerifier, true));
    $now          = platformNow();
    $expiresAt    = $now + IDEA_OAUTH_STATE_TTL_MS;

    $authUrl = '';

    if ($provider === 'google') {
        $cfg = socialGoogleCredentials();
        if ($cfg === null) {
            socialRedirectError($mode, 'PROVIDER_NOT_CONFIGURED', $provider);
        }
        $authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
            'client_id'             => $cfg['client_id'],
            'redirect_uri'          => $cfg['redirect_uri'],
            'response_type'         => 'code',
            'scope'                 => 'openid email profile',
            'state'                 => $state,
            'nonce'                 => $nonce,
            'code_challenge'        => $codeChallenge,
            'code_challenge_method' => 'S256',
            'prompt'                => 'select_account',
        ], '', '&', PHP_QUERY_RFC3986);
    } elseif ($provider === 'facebook') {
        $cfg = socialFacebookCredentials();
        if ($cfg === null) {
            socialRedirectError($mode, 'PROVIDER_NOT_CONFIGURED', $provider);
        }
        $authUrl = 'https://www.facebook.com/v21.0/dialog/oauth?' . http_build_query([
            'client_id'     => $cfg['client_id'],
            'redirect_uri'  => $cfg['redirect_uri'],
            'response_type' => 'code',
            'scope'         => 'email,public_profile',
            'state'         => $state,
        ], '', '&', PHP_QUERY_RFC3986);
    } elseif ($provider === 'apple') {
        $cfg = socialAppleCredentials();
        if ($cfg === null) {
            socialRedirectError($mode, 'PROVIDER_NOT_CONFIGURED', $provider);
        }
        $authUrl = 'https://appleid.apple.com/auth/authorize?' . http_build_query([
            'client_id'     => $cfg['client_id'],
            'redirect_uri'  => $cfg['redirect_uri'],
            'response_type' => 'code',
            'response_mode' => 'form_post',
            'scope'         => 'name email',
            'state'         => $state,
            'nonce'         => $nonce,
        ], '', '&', PHP_QUERY_RFC3986);
    } elseif ($provider === 'microsoft') {
        $cfg = socialMicrosoftCredentials();
        if ($cfg === null) {
            socialRedirectError($mode, 'PROVIDER_NOT_CONFIGURED', $provider);
        }
        $authUrl = 'https://login.microsoftonline.com/' . rawurlencode($cfg['tenant']) . '/oauth2/v2.0/authorize?' . http_build_query([
            'client_id'             => $cfg['client_id'],
            'redirect_uri'          => $cfg['redirect_uri'],
            'response_type'         => 'code',
            'response_mode'         => 'query',
            'scope'                 => 'openid profile email',
            'state'                 => $state,
            'nonce'                 => $nonce,
            'code_challenge'        => $codeChallenge,
            'code_challenge_method' => 'S256',
            'prompt'                => 'select_account',
        ], '', '&', PHP_QUERY_RFC3986);
    } elseif ($provider === 'x') {
        $cfg = socialXCredentials();
        if ($cfg === null) {
            socialRedirectError($mode, 'PROVIDER_NOT_CONFIGURED', $provider);
        }
        $authUrl = 'https://x.com/i/oauth2/authorize?' . http_build_query([
            'client_id'             => $cfg['client_id'],
            'redirect_uri'          => $cfg['redirect_uri'],
            'response_type'         => 'code',
            'scope'                 => 'users.read tweet.read',
            'state'                 => $state,
            'code_challenge'        => $codeChallenge,
            'code_challenge_method' => 'S256',
        ], '', '&', PHP_QUERY_RFC3986);
    }

    accountQuery(
        'DELETE FROM idea_social_oauth_states WHERE expires_at < ?',
        [$now - 3600000]
    );
    accountQuery(
        'INSERT INTO idea_social_oauth_states
            (state_hash, provider, mode, redirect_path, code_verifier, nonce, ip_hash, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [$stateHash, $provider, $mode, $redirect, $codeVerifier, $nonce, socialClientIpHash(), $now, $expiresAt]
    );

    header('Location: ' . $authUrl, true, 302);
    exit;
}

// 3. OAuth callback endpoint (supports GET and Apple POST form_post)
if ($action === 'callback') {
    $provider = strtolower(trim((string) ($_GET['provider'] ?? $_POST['provider'] ?? '')));
    $params   = $_SERVER['REQUEST_METHOD'] === 'POST' ? array_merge($_GET, $_POST) : $_GET;
    $state    = trim((string) ($params['state'] ?? ''));
    $code     = trim((string) ($params['code'] ?? ''));
    $errParam = trim((string) ($params['error'] ?? ''));

    if (!in_array($provider, IDEA_SOCIAL_OAUTH_PROVIDERS, true)) {
        socialRedirectError('login', 'PROVIDER_UNSUPPORTED', $provider);
    }

    if ($state === '') {
        socialRedirectError('login', 'STATE_INVALID', $provider);
    }

    $stateHash = hash('sha256', $state);
    $rows = accountQuery(
        'SELECT state_hash, provider, mode, redirect_path, code_verifier, nonce, expires_at, used_at
           FROM idea_social_oauth_states
          WHERE state_hash = ? AND provider = ?
          LIMIT 1',
        [$stateHash, $provider]
    )->fetchAll(PDO::FETCH_ASSOC);

    if (!$rows) {
        socialRedirectError('login', 'STATE_INVALID', $provider);
    }
    $stateRow = $rows[0];
    $mode     = ((string) $stateRow['mode']) === 'register' ? 'register' : 'login';
    $redirect = socialSanitizeRedirect((string) $stateRow['redirect_path']);
    $now      = platformNow();

    if ($stateRow['used_at'] !== null || (int) $stateRow['expires_at'] < $now) {
        socialRedirectError($mode, 'STATE_EXPIRED', $provider);
    }

    // Atomic single-use state consumption
    accountQuery(
        'UPDATE idea_social_oauth_states SET used_at = ? WHERE state_hash = ? AND used_at IS NULL',
        [$now, $stateHash]
    );

    if ($errParam !== '') {
        $mapped = $errParam === 'access_denied' ? 'SOCIAL_CANCELLED' : 'PROVIDER_ERROR';
        socialRedirectError($mode, $mapped, $provider);
    }

    if ($code === '') {
        socialRedirectError($mode, 'CODE_MISSING', $provider);
    }

    try {
        $subject       = '';
        $email         = null;
        $emailVerified = false;
        $displayName   = '';

        if ($provider === 'google') {
            $cfg = socialGoogleCredentials();
            if ($cfg === null) {
                throw new RuntimeException('PROVIDER_NOT_CONFIGURED');
            }
            $tokenRes = socialHttpRequest(
                'POST',
                'https://oauth2.googleapis.com/token',
                ['Content-Type: application/x-www-form-urlencoded', 'Accept: application/json'],
                http_build_query([
                    'grant_type'    => 'authorization_code',
                    'code'          => $code,
                    'client_id'     => $cfg['client_id'],
                    'client_secret' => $cfg['client_secret'],
                    'redirect_uri'  => $cfg['redirect_uri'],
                    'code_verifier' => (string) $stateRow['code_verifier'],
                ])
            );
            $idToken = (string) ($tokenRes['json']['id_token'] ?? '');
            if ($tokenRes['status'] !== 200 || $idToken === '') {
                throw new RuntimeException('TOKEN_EXCHANGE_FAILED');
            }
            $claims = socialVerifyOidcIdToken(
                $idToken,
                'google',
                'https://www.googleapis.com/oauth2/v3/certs',
                $cfg['client_id'],
                ['https://accounts.google.com', 'accounts.google.com'],
                (string) $stateRow['nonce']
            );
            $subject       = (string) ($claims['sub'] ?? '');
            $email         = isset($claims['email']) ? (string) $claims['email'] : null;
            $emailVerified = ($claims['email_verified'] ?? false) === true;
            $displayName   = (string) ($claims['name'] ?? '');
            if ($subject === '' || !$emailVerified) {
                throw new RuntimeException('GOOGLE_EMAIL_UNVERIFIED');
            }
        } elseif ($provider === 'facebook') {
            $cfg = socialFacebookCredentials();
            if ($cfg === null) {
                throw new RuntimeException('PROVIDER_NOT_CONFIGURED');
            }
            $tokenRes = socialHttpRequest(
                'POST',
                'https://graph.facebook.com/v21.0/oauth/access_token',
                ['Content-Type: application/x-www-form-urlencoded', 'Accept: application/json'],
                http_build_query([
                    'client_id'     => $cfg['client_id'],
                    'client_secret' => $cfg['client_secret'],
                    'redirect_uri'  => $cfg['redirect_uri'],
                    'code'          => $code,
                ])
            );
            $accessToken = (string) ($tokenRes['json']['access_token'] ?? '');
            if ($tokenRes['status'] !== 200 || $accessToken === '') {
                throw new RuntimeException('TOKEN_EXCHANGE_FAILED');
            }
            $proof = hash_hmac('sha256', $accessToken, $cfg['client_secret']);
            $meUrl = 'https://graph.facebook.com/v21.0/me?' . http_build_query([
                'fields'          => 'id,name,email',
                'appsecret_proof' => $proof,
            ]);
            $meRes = socialHttpRequest('GET', $meUrl, [
                'Authorization: Bearer ' . $accessToken,
                'Accept: application/json',
            ]);
            if ($meRes['status'] !== 200 || !is_array($meRes['json'])) {
                throw new RuntimeException('PROFILE_FETCH_FAILED');
            }
            $subject       = (string) ($meRes['json']['id'] ?? '');
            $email         = isset($meRes['json']['email']) ? (string) $meRes['json']['email'] : null;
            $emailVerified = $email !== null && $email !== '';
            $displayName   = (string) ($meRes['json']['name'] ?? '');
            if ($subject === '') {
                throw new RuntimeException('PROFILE_INCOMPLETE');
            }
        } elseif ($provider === 'apple') {
            $cfg = socialAppleCredentials();
            if ($cfg === null) {
                throw new RuntimeException('PROVIDER_NOT_CONFIGURED');
            }
            $clientSecret = socialBuildAppleClientSecret($cfg);
            $tokenRes = socialHttpRequest(
                'POST',
                'https://appleid.apple.com/auth/token',
                ['Content-Type: application/x-www-form-urlencoded', 'Accept: application/json'],
                http_build_query([
                    'grant_type'    => 'authorization_code',
                    'code'          => $code,
                    'client_id'     => $cfg['client_id'],
                    'client_secret' => $clientSecret,
                    'redirect_uri'  => $cfg['redirect_uri'],
                ])
            );
            $idToken = (string) ($tokenRes['json']['id_token'] ?? '');
            if ($tokenRes['status'] !== 200 || $idToken === '') {
                throw new RuntimeException('TOKEN_EXCHANGE_FAILED');
            }
            $claims = socialVerifyOidcIdToken(
                $idToken,
                'apple',
                'https://appleid.apple.com/auth/keys',
                $cfg['client_id'],
                ['https://appleid.apple.com'],
                (string) $stateRow['nonce']
            );
            $subject       = (string) ($claims['sub'] ?? '');
            $email         = isset($claims['email']) ? (string) $claims['email'] : null;
            $evRaw         = $claims['email_verified'] ?? false;
            $emailVerified = ($evRaw === true || $evRaw === 'true');
            if (isset($params['user']) && is_string($params['user'])) {
                $appleUser = json_decode($params['user'], true);
                if (is_array($appleUser) && isset($appleUser['name']) && is_array($appleUser['name'])) {
                    $displayName = trim(
                        ((string) ($appleUser['name']['firstName'] ?? '')) . ' ' .
                        ((string) ($appleUser['name']['lastName'] ?? ''))
                    );
                }
            }
            if ($subject === '') {
                throw new RuntimeException('PROFILE_INCOMPLETE');
            }
        } elseif ($provider === 'microsoft') {
            $cfg = socialMicrosoftCredentials();
            if ($cfg === null) {
                throw new RuntimeException('PROVIDER_NOT_CONFIGURED');
            }
            $tokenRes = socialHttpRequest(
                'POST',
                'https://login.microsoftonline.com/' . rawurlencode($cfg['tenant']) . '/oauth2/v2.0/token',
                ['Content-Type: application/x-www-form-urlencoded', 'Accept: application/json'],
                http_build_query([
                    'grant_type'    => 'authorization_code',
                    'code'          => $code,
                    'client_id'     => $cfg['client_id'],
                    'client_secret' => $cfg['client_secret'],
                    'redirect_uri'  => $cfg['redirect_uri'],
                    'code_verifier' => (string) $stateRow['code_verifier'],
                    'scope'         => 'openid profile email',
                ])
            );
            $idToken = (string) ($tokenRes['json']['id_token'] ?? '');
            if ($tokenRes['status'] !== 200 || $idToken === '') {
                throw new RuntimeException('TOKEN_EXCHANGE_FAILED');
            }
            $claims = socialVerifyOidcIdToken(
                $idToken,
                'microsoft',
                'https://login.microsoftonline.com/common/discovery/v2.0/keys',
                $cfg['client_id'],
                ['https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0'],
                (string) $stateRow['nonce'],
                true
            );
            $subject       = (string) ($claims['sub'] ?? $claims['oid'] ?? '');
            $email         = isset($claims['email']) ? (string) $claims['email']
                           : (isset($claims['preferred_username']) && str_contains((string) $claims['preferred_username'], '@')
                             ? (string) $claims['preferred_username'] : null);
            $emailVerified = $email !== null && $email !== '';
            $displayName   = (string) ($claims['name'] ?? '');
            if ($subject === '') {
                throw new RuntimeException('PROFILE_INCOMPLETE');
            }
        } elseif ($provider === 'x') {
            $cfg = socialXCredentials();
            if ($cfg === null) {
                throw new RuntimeException('PROVIDER_NOT_CONFIGURED');
            }
            $basicAuth = base64_encode($cfg['client_id'] . ':' . $cfg['client_secret']);
            $tokenRes = socialHttpRequest(
                'POST',
                'https://api.x.com/2/oauth2/token',
                [
                    'Authorization: Basic ' . $basicAuth,
                    'Content-Type: application/x-www-form-urlencoded',
                    'Accept: application/json',
                ],
                http_build_query([
                    'grant_type'    => 'authorization_code',
                    'code'          => $code,
                    'redirect_uri'  => $cfg['redirect_uri'],
                    'code_verifier' => (string) $stateRow['code_verifier'],
                ])
            );
            $accessToken = (string) ($tokenRes['json']['access_token'] ?? '');
            if ($tokenRes['status'] !== 200 || $accessToken === '') {
                throw new RuntimeException('TOKEN_EXCHANGE_FAILED');
            }
            $meRes = socialHttpRequest(
                'GET',
                'https://api.x.com/2/users/me?user.fields=id,name,username,confirmed_email',
                ['Authorization: Bearer ' . $accessToken, 'Accept: application/json']
            );
            $data = $meRes['json']['data'] ?? null;
            if ($meRes['status'] !== 200 || !is_array($data)) {
                throw new RuntimeException('PROFILE_FETCH_FAILED');
            }
            $subject       = (string) ($data['id'] ?? '');
            $email         = isset($data['confirmed_email']) && $data['confirmed_email'] !== '' ? (string) $data['confirmed_email'] : null;
            $emailVerified = $email !== null;
            $displayName   = (string) ($data['name'] ?? $data['username'] ?? '');
            if ($subject === '') {
                throw new RuntimeException('PROFILE_INCOMPLETE');
            }
        }

        $buyer = socialResolveOrCreateBuyer($provider, $subject, $email, $emailVerified, null, $displayName);
        socialEstablishBuyerSession($buyer, $provider);
        header('Location: ' . $redirect, true, 302);
        exit;
    } catch (Throwable $e) {
        $errCode = preg_match('/^[A-Z0-9_]{3,48}$/', $e->getMessage())
            ? $e->getMessage()
            : 'SOCIAL_AUTH_FAILED';
        socialRedirectError($mode, $errCode, $provider);
    }
}

// 4. WhatsApp Business Verified Phone OTP — Send Code (POST + CSRF)
if ($action === 'whatsapp-send') {
    header('Content-Type: application/json; charset=utf-8');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        accountError(405, 'METHOD_NOT_ALLOWED');
    }
    socialVerifyCsrfFromHeader();

    $cfg = socialWhatsAppCredentials();
    if ($cfg === null) {
        accountError(503, 'PROVIDER_NOT_CONFIGURED');
    }

    $body = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($body)) {
        accountError(400, 'INVALID_PAYLOAD');
    }
    $phone = trim((string) ($body['phone'] ?? ''));
    if (!preg_match('/^\+[1-9][0-9]{7,14}$/', $phone)) {
        accountError(400, 'INVALID_PHONE');
    }

    $ipHash    = socialClientIpHash();
    $phoneHash = hash('sha256', 'idea-wa-phone|' . $phone);

    if (!socialCheckRateLimit('wa-ip:' . $ipHash, 10, 600) || !socialCheckRateLimit('wa-ph:' . $phoneHash, 3, 600)) {
        accountError(429, 'RATE_LIMITED');
    }

    $otpCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $pepper  = (string) platformSecret('IDEA_OTP_PEPPER');
    if ($pepper === '') {
        $pepper = hash('sha256', $cfg['access_token']);
    }
    $otpHash = hash_hmac('sha256', $phone . '|' . $otpCode, $pepper);

    // Send verified authentication template message via Meta WhatsApp Business Cloud API
    $waPayload = json_encode([
        'messaging_product' => 'whatsapp',
        'to'                => ltrim($phone, '+'),
        'type'              => 'template',
        'template'          => [
            'name'       => $cfg['template_name'],
            'language'   => ['code' => $cfg['template_lang']],
            'components' => [
                [
                    'type'       => 'body',
                    'parameters' => [
                        ['type' => 'text', 'text' => $otpCode],
                    ],
                ],
                [
                    'type'       => 'button',
                    'sub_type'   => 'url',
                    'index'      => '0',
                    'parameters' => [
                        ['type' => 'text', 'text' => $otpCode],
                    ],
                ],
            ],
        ],
    ], JSON_THROW_ON_ERROR);

    $waRes = socialHttpRequest(
        'POST',
        'https://graph.facebook.com/v21.0/' . rawurlencode($cfg['phone_number_id']) . '/messages',
        [
            'Authorization: Bearer ' . $cfg['access_token'],
            'Content-Type: application/json',
            'Accept: application/json',
        ],
        $waPayload
    );

    if ($waRes['status'] < 200 || $waRes['status'] >= 300) {
        accountError(502, 'WHATSAPP_DELIVERY_FAILED');
    }

    $now = platformNow();
    $otpId = bin2hex(random_bytes(16));
    accountQuery(
        'UPDATE idea_whatsapp_otps SET consumed_at = ? WHERE phone_hash = ? AND consumed_at IS NULL',
        [$now, $phoneHash]
    );
    accountQuery(
        'INSERT INTO idea_whatsapp_otps
            (id, phone_hash, phone_e164, code_hash, attempts, expires_at, created_at)
         VALUES (?, ?, ?, ?, 0, ?, ?)',
        [$otpId, $phoneHash, $phone, $otpHash, $now + IDEA_WA_OTP_TTL_MS, $now]
    );

    platformJson(['ok' => true, 'expiresInSeconds' => (int) (IDEA_WA_OTP_TTL_MS / 1000)]);
    exit;
}

// 5. WhatsApp Business Verified Phone OTP — Verify Code & Establish Buyer Session (POST + CSRF)
if ($action === 'whatsapp-verify') {
    header('Content-Type: application/json; charset=utf-8');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        accountError(405, 'METHOD_NOT_ALLOWED');
    }
    socialVerifyCsrfFromHeader();

    $cfg = socialWhatsAppCredentials();
    if ($cfg === null) {
        accountError(503, 'PROVIDER_NOT_CONFIGURED');
    }

    $body = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($body)) {
        accountError(400, 'INVALID_PAYLOAD');
    }
    $phone = trim((string) ($body['phone'] ?? ''));
    $code  = preg_replace('/\D/', '', (string) ($body['code'] ?? '')) ?? '';
    $name  = trim((string) ($body['name'] ?? ''));

    if (!preg_match('/^\+[1-9][0-9]{7,14}$/', $phone) || strlen($code) !== 6) {
        accountError(400, 'OTP_INVALID');
    }

    if (!socialCheckRateLimit('wa-verify:' . socialClientIpHash(), 20, 600)) {
        accountError(429, 'RATE_LIMITED');
    }

    $phoneHash = hash('sha256', 'idea-wa-phone|' . $phone);
    $rows = accountQuery(
        'SELECT id, phone_e164, code_hash, attempts, expires_at, consumed_at
           FROM idea_whatsapp_otps
          WHERE phone_hash = ? AND consumed_at IS NULL
          ORDER BY created_at DESC
          LIMIT 1',
        [$phoneHash]
    )->fetchAll(PDO::FETCH_ASSOC);

    if (!$rows) {
        accountError(400, 'OTP_EXPIRED');
    }
    $otpRow = $rows[0];
    $now = platformNow();

    if ((int) $otpRow['expires_at'] < $now) {
        accountQuery('UPDATE idea_whatsapp_otps SET consumed_at = ? WHERE id = ?', [$now, (string) $otpRow['id']]);
        accountError(400, 'OTP_EXPIRED');
    }

    if ((int) $otpRow['attempts'] >= IDEA_WA_OTP_MAX_ATTEMPTS) {
        accountQuery('UPDATE idea_whatsapp_otps SET consumed_at = ? WHERE id = ?', [$now, (string) $otpRow['id']]);
        accountError(429, 'RATE_LIMITED');
    }

    $pepper = (string) platformSecret('IDEA_OTP_PEPPER');
    if ($pepper === '') {
        $pepper = hash('sha256', $cfg['access_token']);
    }
    $expectedHash = hash_hmac('sha256', $phone . '|' . $code, $pepper);

    if (!hash_equals((string) $otpRow['code_hash'], $expectedHash)) {
        accountQuery(
            'UPDATE idea_whatsapp_otps SET attempts = attempts + 1 WHERE id = ?',
            [(string) $otpRow['id']]
        );
        accountError(401, 'OTP_INVALID');
    }

    accountQuery(
        'UPDATE idea_whatsapp_otps SET consumed_at = ? WHERE id = ?',
        [$now, (string) $otpRow['id']]
    );

    try {
        $buyer = socialResolveOrCreateBuyer(
            'whatsapp',
            $phone,
            null,
            false,
            $phone,
            $name !== '' ? $name : 'IDEA Customer'
        );
        socialEstablishBuyerSession($buyer, 'whatsapp');
        platformJson([
            'ok'   => true,
            'user' => [
                'id'    => $buyer['id'],
                'name'  => $buyer['name'],
                'email' => $buyer['email'],
                'phone' => $buyer['phone'],
                'role'  => 'buyer',
            ],
        ]);
        exit;
    } catch (Throwable $e) {
        $errCode = preg_match('/^[A-Z0-9_]{3,48}$/', $e->getMessage())
            ? $e->getMessage()
            : 'WHATSAPP_AUTH_FAILED';
        accountError(403, $errCode);
    }
}

accountError(400, 'UNKNOWN_ACTION');
