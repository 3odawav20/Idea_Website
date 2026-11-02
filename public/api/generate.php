<?php
declare(strict_types=1);
// Legacy image route disabled. The authenticated IDEA platform API uses Runpod only.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
http_response_code(410);
echo json_encode(['error'=>'RUNPOD_ONLY_USE_PLATFORM_API']);