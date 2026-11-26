<?php
declare(strict_types=1);
/**
 * Bounded runtime checks of the real PHP/MySQL AI entitlement boundary.
 * No live database, provider keys, network request or production users.
 */
class AiRoleDenied extends RuntimeException {}
function accountError(int $status, string $code): never {
    throw new AiRoleDenied($code, $status);
}
function accountCustomer(array $user): void {
    if (($user['role'] ?? '') !== 'buyer') throw new RuntimeException('Unexpected accountCustomer call');
}
function accountCompany(array $user): void {
    throw new RuntimeException('Supplier/company authorization should NEVER be reached by the AI adapter');
}
function accountQuery(string $sql, array $params = []): object {
    if (!str_contains($sql, 'COUNT(*) FROM idea_ai_jobs')) {
        throw new RuntimeException('Unexpected query from role policy test: ' . $sql);
    }
    return new class {
        public function fetchColumn(): int { return 0; }
    };
}
function platformFeatures(): array { return ['payments' => ['configured' => false]]; }

require_once __DIR__ . '/../server/cpanel/idea-accounts-api/platform-ai.php';

function requireTrue(bool $value, string $why): void {
    if (!$value) throw new RuntimeException($why);
}
function expectForbidden(callable $action, string $label): void {
    try { $action(); }
    catch (AiRoleDenied $error) {
        requireTrue($error->getCode() === 403, $label . ' should return HTTP 403');
        requireTrue($error->getMessage() === 'AI_ACCOUNT_REQUIRED', $label . ' should fail closed');
        return;
    }
    throw new RuntimeException($label . ' must be forbidden');
}
$admin = ['id' => 'admin-test', 'role' => 'admin'];
$buyer = ['id' => 'buyer-test', 'role' => 'buyer'];
$supplier = ['id' => 'supplier-test', 'role' => 'supplier'];
$anon = ['id' => '', 'role' => ''];
requireTrue(platformAiLimit($admin) === null, 'Admin must have unlimited lifetime usage');
requireTrue(platformAiLimit($buyer) === 5, 'Registered buyer must have five lifetime attempts');
$adminQuota = platformAiAction('ai-quota', [], $admin);
requireTrue($adminQuota['unlimited'] === true && $adminQuota['limit'] === null &&
    $adminQuota['remaining'] === null, 'Admin quota API must report unlimited');
$buyerQuota = platformAiAction('ai-quota', [], $buyer);
requireTrue($buyerQuota['unlimited'] === false && $buyerQuota['limit'] === 5 &&
    $buyerQuota['remaining'] === 5 && $buyerQuota['period'] === 'lifetime',
    'Buyer quota must report five lifetime attempts');
foreach ([$supplier, $anon, ['id'=>'unknown-test','role'=>'guest']] as $denied) {
    $label = ($denied['role'] ?: 'anonymous');
    expectForbidden(fn() => platformAiLimit($denied), $label . ' limit');
    foreach (['ai-quota','ai-history','ai-job','ai-create','ai-process'] as $action) {
        expectForbidden(fn() => platformAiAction($action, [], $denied), $label . ' ' . $action);
    }
    expectForbidden(fn() => platformAiDownload($denied, 'unused-job'), $label . ' download');
}
echo "AI_MYSQL_ROLE_POLICY_PASS admin=unlimited buyer=5_supplier=denied anonymous=denied\n";
