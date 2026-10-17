<?php
declare(strict_types=1);
if (realpath($_SERVER['SCRIPT_FILENAME']??'') === __FILE__) { http_response_code(404); exit; }
function customerMayGenerate(mixed $roleRows, mixed $companyRows): bool {
    return is_array($roleRows) && count($roleRows) === 1
        && ($roleRows[0]['role'] ?? null) === 'buyer'
        && is_array($companyRows) && count($companyRows) === 0;
}
