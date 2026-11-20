<?php
declare(strict_types=1);

require_once __DIR__ . '/../server/cpanel/api/marketplace-price-policy.php';

function expectPriceVisibility(bool $expected, string $companyId, string $companyRole, string $case): void {
    $row = ['id' => 'product-test', 'private_price_cents' => 12345, 'currency' => 'EGP'];
    $visible = mpCanViewPrivatePrice($companyId, $companyRole);
    $filtered = mpApplyCataloguePricePolicy($row, $companyId, $companyRole);
    if ($visible !== $expected || array_key_exists('private_price_cents', $filtered) !== $expected || array_key_exists('currency', $filtered) !== $expected) {
        throw new RuntimeException('Private-price visibility policy failed: ' . $case);
    }
}

$companyId = str_repeat('a', 32);
expectPriceVisibility(false, '', '', 'anonymous/public');
expectPriceVisibility(false, '', 'admin', 'admin-wide search');
expectPriceVisibility(false, $companyId, 'buyer', 'buyer company query');
expectPriceVisibility(false, $companyId, 'supplier', 'supplier without company membership');
expectPriceVisibility(false, $companyId, 'viewer', 'read-only staff');
expectPriceVisibility(true, $companyId, 'owner', 'authorized company owner');
expectPriceVisibility(true, $companyId, 'manager', 'authorized company manager');

echo "MARKETPLACE_PRIVATE_PRICE_POLICY_PASS buyer=redacted admin-wide=redacted owner=own-company manager=own-company\n";
