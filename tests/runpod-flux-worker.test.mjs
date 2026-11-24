import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const worker = readFileSync("runpod/flux2-klein/handler.py", "utf8");
const docker = readFileSync("runpod/flux2-klein/Dockerfile", "utf8");
const requirements = readFileSync("runpod/flux2-klein/requirements.txt", "utf8");
const adapter = readFileSync("server/cpanel/idea-accounts-api/platform-ai.php", "utf8");
const candidate = JSON.parse(readFileSync("runpod/flux2-klein/endpoint-candidate.json", "utf8"));

test("worker independently passes room and selected material to official Flux2KleinPipeline", () => {
  assert.match(worker, /from diffusers import Flux2KleinPipeline/);
  assert.match(worker, /image=\[room_reference, material_reference\]/);
  assert.match(worker, /num_inference_steps=4/);
  assert.match(worker, /guidance_scale=1\.0/);
  assert.match(worker, /black-forest-labs\/FLUX\.2-klein-4B/);
  assert.match(worker, /idea-qwen-mask-v1/);
  assert.match(worker, /idea-flux2-klein-mask-v2/);
});

test("worker segments floor and walls, estimates depth, verifies output geometry and returns a white-on-black mask", () => {
  assert.match(worker, /SEGMENTATION_ID/);
  assert.match(worker, /"floor"/);
  assert.match(worker, /"walls"/);
  assert.match(worker, /DEPTH_ID/);
  assert.match(worker, /_perspective_texture/);
  assert.match(worker, /_validate_mask/);
  assert.match(worker, /Image\.fromarray\(\(union\.astype\(np\.uint8\) \* 255\)/);
  assert.match(worker, /protected_pixels_preserved/);
});

test("MySQL adapter defaults to the legacy request, stores opt-in FLUX version per job, and idempotently reserves jobs", () => {
  assert.match(adapter, /idea-qwen-mask-v1/);
  assert.match(adapter, /idea-flux2-klein-mask-v2/);
  assert.match(adapter, /black-forest-labs\/FLUX\.2-klein-4B/);
  assert.match(adapter, /_worker_contract/);
  assert.match(adapter, /_idempotency_key/);
  assert.match(adapter, /_request_fingerprint/);
  assert.match(adapter, /_runpod_stage/);
});

test("candidate endpoint preserves endpoint/scaling and explicitly prevents automatic cutover", () => {
  assert.equal(candidate.endpointId, "5lvjvfqqbkw3c7");
  assert.equal(candidate.productionCutoverApproved, false);
  assert.equal(candidate.workers.min, 0);
  assert.equal(candidate.workers.max, 1);
  assert.equal(candidate.cache.loadOncePerWorker, true);
  assert.equal(candidate.gpuRecommendation.status.startsWith("REQUIRES"), true);
  assert.match(docker, /HF_HOME=\/runpod-volume\/huggingface-cache/);
  assert.match(docker, /MODEL_NAME=black-forest-labs\/FLUX\.2-klein-4B/);
  assert.match(requirements, /diffusers\.git@5b58188bb8cf838e0b4b5a11208f7de59e67ed64/);
  assert.equal(existsSync("runpod/flux2-klein/handler.py"), true);
});
