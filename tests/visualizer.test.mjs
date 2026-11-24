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
  assert.match(page, /to=\{`\/product\/\$\{product\.slug\}`\}/);
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

test("oversized mobile images are normalized before upload without cropping or relaxing PHP limits", () => {
  assert.match(page, /Math\.sqrt\(MAX_PIXELS \/ \(w \* h\)\)/);
  assert.match(page, /Math\.floor\(w \* scale\)/);
  assert.match(page, /Math\.floor\(h \* scale\)/);
  assert.match(page, /ctx\.drawImage\(image, 0, 0, width, height\)/);
  assert.match(page, /blob\.size <= MAX_BYTES/);
  assert.match(page, /await prepareUpload\(file\)/);
  assert.match(page, /setPhoto\(prepared\.file\)/);
  assert.match(server, /MAX_PIXELS = 12000000/);
  assert.match(server, /MAX_IMAGE_BYTES = 12 \* 1024 \* 1024/);
});

test("walls and floor have independent catalogue selections and one logical job", () => {
  const liveAdapter = readFileSync("server/cpanel/idea-accounts-api/visualize.php", "utf8");
  const surfaces = readFileSync("server/cpanel/idea-accounts-api/platform-ai-surfaces.php", "utf8");
  assert.match(page, /Record<MaterialSurface, SurfaceSelection>/);
  assert.match(page, /for \(const target of targets\)/);
  assert.match(liveAdapter, /platformAiSurfaceFace\(\$product,\(int\)\$face\)/);
  assert.match(liveAdapter, /'independent_surfaces'=>2/);
  assert.match(surfaces, /target_surface.*=>.*\$target/);
  assert.match(surfaces, /platformAiSurfaceSavePng\(\$result, \$dir\.'/);
  assert.equal((surfaces.match(/INSERT INTO idea_ai_jobs/g) || []).length, 1);
  assert.ok(surfaces.indexOf("accountRate('ai-create'") < surfaces.indexOf("return platformTransaction("),
    "the production rate limiter opens its own transaction");
});
