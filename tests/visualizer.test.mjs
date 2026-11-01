import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const app = readFileSync("src/app/App.tsx", "utf8");
const page = readFileSync("src/app/pages/AiVisualizerStudio.tsx", "utf8");
const cards = readFileSync("src/app/components/ProductCard.tsx", "utf8");
const detail = readFileSync("src/app/pages/ProductDetail.tsx", "utf8");
const server = readFileSync("server/cpanel/api/visualize.php", "utf8");

test("one published studio route receives stable catalogue product IDs", () => {
  assert.match(app, /path="\/ai-room-visualizer" element=\{<AiVisualizerStudio/);
  assert.match(page, /searchParams\.get\("product"\)/);
  assert.match(cards, /encodeURIComponent\(product\.id\)/);
  assert.match(detail, /encodeURIComponent\(product\.id\)/);
});
test("frontend uses real asynchronous jobs and never manufactures a preview", () => {
  assert.match(page, /jobId/);
  assert.match(page, /setResult\(/);
  assert.match(page, /"\/api\/visualize\.php"/);
  assert.doesNotMatch(page, /GEMINI|generativelanguage|fake preview/i);
});
test("Runpod credentials remain server-only", () => {
  assert.doesNotMatch(page, /RUNPOD_API_KEY|api\.runpod\.ai/);
  assert.match(server, /getenv\(\$name\)/);
  assert.match(server, /RUNPOD_API_KEY/);
  assert.match(server, /\/auth\/v1\/user/);
  assert.match(server, /CURLOPT_SSL_VERIFYPEER=>true/);
});
test("server enforces five lifetime attempts with idempotent reservations", () => {
  assert.match(server, /REGULAR_LIFETIME_LIMIT = 5/);
  assert.match(server, /reserveAttempt/);
  assert.match(server, /idempotencyKey/);
  assert.match(server, /flock\(\$fp, LOCK_EX\)/);
  assert.match(server, /quota_exhausted/);
});
test("unsafe provider output is blocked and original pixels are composited through a mask", () => {
  assert.match(server, /return_edit_mask/);
  assert.match(server, /compositeVerified/);
  assert.match(server, /geometry_mismatch/);
  assert.match(server, /imagesetpixel\(\$original.*imagecolorat\(\$generated/s);
  assert.match(server, /watermark\(\$original\)/);
});
test("server PHP stays outside the static Vite public directory", () => {
  assert.equal(existsSync("public/api/visualize.php"), false);
  assert.equal(existsSync("server/cpanel/api/visualize.php"), true);
});
