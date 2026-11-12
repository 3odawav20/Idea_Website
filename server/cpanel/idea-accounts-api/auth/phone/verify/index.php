<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/_phone.php';

$config = ideaPhoneConfig();
$data = ideaPhoneRequest($config);
$phone = $data['phone'] ?? null;
$code = $data['code'] ?? null;
$audience = $data['audience'] ?? null;
$intent = $data['intent'] ?? null;

if (!is_string($phone) || !preg_match('/^\+[1-9]\d{7,14}$/D', $phone) ||
    !is_string($code) || !preg_match('/^\d{4,8}$/D', $code)) ideaPhoneFail(422, 'INVALID_VERIFICATION');
if (!in_array($audience, ['customer','business','admin'], true) ||
    !in_array($intent, ['login','register'], true)) ideaPhoneFail(422, 'INVALID_REQUEST');

$remoteIp = (string)($_SERVER['REMOTE_ADDR'] ?? '');
if (!filter_var($remoteIp, FILTER_VALIDATE_IP)) ideaPhoneFail(403, 'INVALID_CLIENT');
$privateRoot = dirname(ideaPhonePrivatePath(getenv('IDEA_OAUTH_CONFIG_FILE') ?: '/home/lsenet5/idea_private/oauth-config.php'));
ideaPhoneRateLimit('sms_verify_ip', $remoteIp, 18, 3600, $privateRoot);
ideaPhoneRateLimit('sms_verify_phone', $phone, 12, 3600, $privateRoot);

ideaPhoneSession();
$pending = $_SESSION['idea_sms_request'] ?? null;
if (!is_array($pending) ||
    !hash_equals((string)($pending['phone'] ?? ''), $phone) ||
    ($pending['audience'] ?? null) !== $audience ||
    ($pending['intent'] ?? null) !== $intent ||
    (int)($pending['expires'] ?? 0) < time()) {
    unset($_SESSION['idea_sms_request']);
    session_write_close();
    ideaPhoneFail(401, 'VERIFICATION_EXPIRED');
}
if ((int)($pending['attempts'] ?? 0) >= 5) {
    unset($_SESSION['idea_sms_request']);
    session_write_close();
    ideaPhoneFail(429, 'PLEASE_TRY_LATER');
}
$_SESSION['idea_sms_request']['attempts']++;
session_write_close();

$result = ideaPhoneTwilio('/VerificationCheck', ['To' => $phone, 'Code' => $code], $config['sms']);
if (($result['status'] ?? null) !== 'approved') ideaPhoneFail(401, 'VERIFICATION_NOT_APPROVED');

// An approved SMS proves phone possession, NOT an IDEA account role.
// The private adapter MUST map the verified number to the real MySQL user,
// enforce approvals/admin MFA, rotate the existing real PHP session and return
// its effective server-derived role. Do not create a parallel user store here.
$login = ideaAuthLoginVerifiedPhone($phone, $audience, $intent);
if (!is_array($login) || ($login['ok'] ?? false) !== true ||
    !is_string($login['role'] ?? null)) ideaPhoneFail(403, 'ACCOUNT_NOT_AUTHORIZED');

$role = $login['role'] === 'buyer' ? 'customer' : $login['role'];
if (!in_array($role, ['customer','business','admin'], true)) ideaPhoneFail(403, 'ACCOUNT_NOT_AUTHORIZED');
if ($role === 'admin' && ($login['mfa_verified'] ?? false) !== true) ideaPhoneFail(403, 'ADMIN_MFA_REQUIRED');

ideaPhoneSession();
unset($_SESSION['idea_sms_request']);
session_write_close();
ideaPhoneSuccess(['role' => $role]);
