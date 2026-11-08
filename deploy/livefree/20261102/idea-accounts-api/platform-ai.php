<?php
// Historical deployment adapter deliberately retired.
// See server/cpanel/idea-accounts-api/platform-ai.php for the approved
// Runpod-only Qwen candidate. Do not deploy this historical stub.
http_response_code(503);
header('Content-Type: application/json');
echo json_encode(['code'=>'LEGACY_ADAPTER_RETIRED']);
