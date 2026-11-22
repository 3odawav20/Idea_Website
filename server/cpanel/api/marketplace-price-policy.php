<?php
declare(strict_types=1);

function mpCanViewPrivatePrice(string $companyId, string $companyRole): bool {
    return $companyId !== '' && in_array($companyRole, ['owner', 'manager'], true);
}

function mpApplyCataloguePricePolicy(array $row, string $companyId, string $companyRole): array {
    if (!mpCanViewPrivatePrice($companyId, $companyRole)) {
        unset($row['private_price_cents'], $row['currency']);
    }
    return $row;
}
