import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const app = readFileSync("src/app/App.tsx", "utf8");
const page = readFileSync("src/app/pages/AiVisualizerStudio.tsx", "utf8");
const layout = readFileSync("src/app/components/Layout.tsx", "utf8");
const cards = readFileSync("src/app/components/ProductCard.tsx", "utf8");
const detail = readFileSync("src/app/pages/ProductDetail.tsx", "utf8");
const server = readFileSync("server/cpanel/idea-accounts-api/visualize.php", "utf8");
const platformAi = readFileSync("server/cpanel/idea-accounts-api/platform-ai.php", "utf8");

test("one published studio route receives stable catalogue product IDs", () => {
  assert.match(app, /path="\/ai-room-visualizer" element=\{<AiVisualizerStudio/);
  assert.match(page, /searchParams\.get\("product"\)/);
  assert.match(cards, /encodeURIComponent\(product\.id\)/);
  assert.match(detail, /encodeURIComponent\(product\.id\)/);
  assert.match(page, /to=/);
});
test("frontend uses real asynchronous PHP/MySQL jobs and never manufactures a preview", () => {
  assert.match(page, /jobId/);
  assert.match(page, /setResult\(/);
  assert.match(page, /"\/api\/visualize\.php"/);
  assert.doesNotMatch(page, /GEMINI|generativelanguage|fake preview/i);
});
test("Runpod credentials remain server-only and PHP session authentication is used", () => {
  assert.doesNotMatch(page, /RUNPOD_API_KEY|api\.runpod\.ai/);
  assert.match(server, /platformSecret\('RUNPOD_API_KEY'\)/);
  assert.match(server, /platformSecret\('RUNPOD_ENDPOINT_ID'\)/);
  assert.match(server, /accountSession\(\)/);
  assert.match(server, /accountUser\(\)/);
  assert.doesNotMatch(server, /IDEA_SUPABASE_URL|supabaseUrl|auth\/v1\/user/i);
  assert.match(platformAi, /api\.runpod\.ai\/v2\//);
});
test("MySQL AI enforces five buyer lifetime attempts and unlimited platform admins", () => {
  assert.match(platformAi, /function platformAiLimit/);
  assert.match(platformAi, /if\(\$role==='admin'\)return null/);
  assert.match(platformAi, /if\(\$role==='buyer'\)\{accountCustomer\(\$u\);return 5;\}/);
  assert.match(platformAi, /accountError\(403,'AI_ACCOUNT_REQUIRED'\)/);
  assert.match(platformAi, /platformTransaction/);
});
test("unsafe provider output is blocked and verified masks protect original pixels", () => {
  assert.match(platformAi, /platformAiVerifiedMaskComposite/);
  assert.match(platformAi, /platformAiDecodedOutput/);
  assert.match(platformAi, /RUNPOD_MASK_UNSAFE|RUNPOD_MASK_WORKER_REQUIRED/);
  assert.match(platformAi, /RUNPOD_DIMENSIONS_CHANGED/);
});
test("legacy Supabase visualizer is absent and the MySQL PHP adapter stays outside Vite public assets", () => {
  assert.equal(existsSync("public/api/visualize.php"), false);
  assert.equal(existsSync("server/cpanel/api/visualize.php"), false);
  assert.equal(existsSync("server/cpanel/idea-accounts-api/visualize.php"), true);
});
test("mobile image normalization respects the MySQL adapter's server-side limits", () => {
  assert.match(page, /Math\.sqrt\(MAX_PIXELS \/ \(w \* h\)\)/);
  assert.match(page, /Math\.floor\(w \* scale\)/);
  assert.match(page, /Math\.floor\(h \* scale\)/);
  assert.match(page, /ctx\.drawImage\(image, 0, 0, width, height\)/);
  assert.match(page, /blob\.size <= MAX_BYTES/);
  assert.match(page, /await prepareUpload\(file\)/);
  assert.match(page, /setPhoto\(prepared\.file\)/);
  assert.match(server, /8388608/);
  assert.match(server, /10000000/);
});
test("walls and floor have independent catalogue selections and one logical MySQL job", () => {
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


test("third-party Roomvo assistant is absent while IDEA visualizer remains routed", () => {
  assert.match(app, /path="\/ai-room-visualizer" element=\{<AiVisualizerStudio/);
  assert.doesNotMatch(layout, /RoomvoAssistant|roomvo\.com|roomvoAssistant/i);
  assert.equal(existsSync("src/app/components/RoomvoAssistant.tsx"), false);
  assert.equal(existsSync("src/app/components/RoomvoAssistant.css"), false);
});
