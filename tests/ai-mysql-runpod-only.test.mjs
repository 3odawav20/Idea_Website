import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = p => readFileSync(p, "utf8");
const mysql = read("server/cpanel/idea-accounts-api/platform-ai.php");
const old = read("deploy/livefree/20261102/idea-accounts-api/platform-ai.php");
const qwen = read("server/cpanel/api/visualize.php");
const front = read("src/app/pages/AiVisualizerStudio.tsx");

test("deployable PHP AI adapters contain no Gemini API or Google image model fallback", () => {
  for (const source of [mysql, old, qwen]) {
    assert.doesNotMatch(source, /GEMINI_API_KEY|generativelanguage\.googleapis\.com|google-nano-banana|gemini_model|:generateContent/i);
  }
  assert.match(old, /LEGACY_ADAPTER_RETIRED/);
  assert.doesNotMatch(front, /generativelanguage|GEMINI_API_KEY/);
});
test("MySQL tenant AI uses Qwen worker contract, not assumed model availability", () => {
  assert.match(mysql, /RUNPOD_WORKER_CONTRACT'\)!=='idea-qwen-mask-v1'/);
  assert.match(mysql, /RUNPOD_ENDPOINT_ID/);
  assert.match(mysql, /Qwen\/Qwen-Image-Edit-2511/);
  assert.match(mysql, /api\.runpod\.ai\/v2\//);
  assert.match(mysql, /RUNPOD_WORKER_NOT_VERIFIED/);
  assert.match(mysql, /RUNPOD_MASK_WORKER_REQUIRED/);
});
test("client cannot direct output to external image URLs or bypass masked composition", () => {
  assert.match(mysql, /platformAiDecodedOutput/);
  assert.match(mysql, /platformAiVerifiedMaskComposite/);
  assert.match(mysql, /RUNPOD_DIMENSIONS_CHANGED/);
  assert.match(mysql, /RUNPOD_MASK_UNSAFE/);
  assert.match(mysql, /return_edit_mask'=>true/);
  assert.match(mysql, /preserve_unmasked_pixels'=>true/);
  assert.doesNotMatch(mysql, /CURL_FOLLOWLOCATION.*true/);
});
test("MySQL AI permits buyers five lifetime attempts, admins unlimited, suppliers forbidden", () => {
  assert.match(mysql, /if\(\$role==='admin'\)return null/);
  assert.match(mysql, /if\(\$role==='buyer'\)\{accountCustomer\(\$u\);return 5;\}/);
  assert.doesNotMatch(mysql, /\$role==='supplier'.*\$limit=5/);
  assert.match(mysql, /accountError\(403,'AI_ACCOUNT_REQUIRED'\)/);
  assert.match(mysql, /function platformAiAction\(string \$a,array \$d,array \$u\): array\{[\s\S]*?\$limit=platformAiLimit\(\$u\)/);
  assert.match(mysql, /function platformAiDownload\(array \$u,string \$id\): never\{\s*platformAiLimit\(\$u\)/);
  assert.match(mysql, /if\(\$limit!==null\)accountRate\('ai-create',10,3600\)/);
  assert.match(mysql, /if\(\$limit!==null&&\$all>=/);
  assert.match(mysql, /'period'=>'lifetime'/);
  assert.equal((mysql.match(/state IN \('queued','processing','completed'\)/g)||[]).length,2, 'Failed and cancelled jobs must not consume lifetime attempts');
  assert.match(mysql, /platformTransaction/);
  assert.match(mysql, /AI_SUBSCRIPTION_REQUIRED/);
});
test("the original job system and previous staged files remain distinguishable", () => {
  assert.ok(existsSync("server/cpanel/api/visualize.php"));
  assert.ok(existsSync("server/cpanel/idea-accounts-api/platform-ai.php"));
  assert.match(qwen, /IDEA_SUPABASE_URL/);
  assert.match(mysql, /idea_ai_jobs/);
  // The MySQL adapter is NOT a complete application. Do not silently ship it
  // without the original account platform and database schema.
  const build = read("scripts/build-cpanel.mjs");
  assert.doesNotMatch(build, /idea-accounts-api\/platform-ai/);
});
test("Runpod generation never blocks an entire image request and polls accepted jobs", () => {
  assert.doesNotMatch(mysql, /\/runsync/);
  assert.match(mysql, /'\/run'/);
  assert.match(mysql, /'\/status\/'/);
  assert.match(mysql, /function platformAiPollJob/);
  assert.match(mysql, /if\(\$a==='ai-job'\)return platformAiPollJob/);
  assert.match(mysql, /RUNPOD_QUEUE_REJECTED/);
  assert.match(mysql, /_runpod_job_id/);
});
test("Qwen surface input is a strict floor, walls or both enum", () => {
  assert.match(mysql, /'target_surface'=>in_array/);
  assert.match(mysql, /\?'floor':\(in_array/);
  assert.match(mysql, /\?'walls':'both'/);
  assert.match(mysql, /INVALID_SURFACE/);
});

test("Runpod polling is ownership scoped, bounded and fails closed", () => {
  assert.match(mysql, /platformAiJob\(\$u,\$id\)/);
  assert.match(mysql, /CURLOPT_FOLLOWLOCATION=>false/);
  assert.match(mysql, /CURLOPT_SSL_VERIFYPEER=>true/);
  assert.match(mysql, /CURLOPT_WRITEFUNCTION/);
  assert.match(mysql, /RUNPOD_SUBMISSION_INTERRUPTED/);
  assert.match(mysql, /RUNPOD_VERIFICATION_FAILED/);
  assert.match(mysql, /state='failed'/);
});
