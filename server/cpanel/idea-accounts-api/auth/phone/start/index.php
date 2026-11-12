<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/_phone.php';

$config = ideaPhoneConfig();
$data = ideaPhoneRequest($config);
$phone = $data['phone'] ?? null;
$audience = $data['audience'] ?? null;
$intent = $data['intent'] ?? null;
if (!is_string($phone) || !preg_match('/^\+[1-9]\d{7,14}$/D', $phone)) ideaPhoneFail(422, 'INVALID_PHONE');
if (!in_array($audience, ['customer','business','admin'], true) ||
    !in_array($intent, ['login','register'], true)) ideaPhoneFail(422, 'INVALID_REQUEST');
if ($audience === 'admin' && $intent === 'register') ideaPhoneFail(403, 'ADMIN_SELF_REGISTRATION_DISABLED');

$privateRoot = dirname(ideaPhonePrivatePath(getenv('IDEA_OAUTH_CONFIG_FILE') ?: '/home/lsenet5/idea_private/oauth-config.php'));
$remoteIp = (string)($_SERVER['REMOTE_ADDR'] ?? '');
if (!filter_var($remoteIp, FILTER_VALIDATE_IP)) ideaPhoneFail(403, 'INVALID_CLIENT');
ideaPhoneRateLimit('sms_start_ip', $remoteIp, 8, 3600, $privateRoot);
ideaPhoneRateLimit('sms_start_phone', $phone, 4, 3600, $privateRoot);

ideaPhoneSession();
session_regenerate_id(true);
$_SESSION['idea_sms_request'] = [
    'phone' => $phone,
    'audience' => $audience,
    'intent' => $intent,
    'expires' => time()+600,
    'attempts' => 0,
];
session_write_close();

$result = ideaPhoneTwilio('/Verifications', ['To' => $phone, 'Channel' => 'sms'], $config['sms']);
if (($result['status'] ?? null) !== 'pending') ideaPhoneFail(502, 'SMS_PROVIDER_UNAVAILABLE');
ideaPhoneSuccess(['message' => 'If this number is eligible, a code will be delivered.']);
