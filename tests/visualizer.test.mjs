import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const app = readFileSync("src/app/App.tsx", "utf8");
const page = readFileSync("src/app/pages/AiVisualizerStudio.tsx", "utf8");
const cards = readFileSync("src/app/components/ProductCard.tsx", "utf8");
const detail = readFileSync("src/app/pages/ProductDetail.tsx", "utf8");
const server = readFileSync("server/cpanel/api/visualize.php", "utf8");

test("one published studio route replaces the old placeholder", () => {
  assert.match(app, /path="\/ai-room-visualizer" element=\{<AiVisualizerStudio/);
  assert.doesNotMatch(app, /element=\{<AiVisualizer\s*\/>/);
});
test("catalogue product selection survives navigation by stable product ID", () => {
  assert.match(page, /searchParams\.get\("product"\)/);
  assert.match(cards, /encodeURIComponent\(product\.id\)/);
  assert.match(detail, /encodeURIComponent\(product\.id\)/);
});
test("generation never creates a fake preview and requires actual image response", () => {
  assert.match(page, /if \(!response\.ok \|\| !data\?\.image\)/);
  assert.match(page, /setResult\(data\.image\)/);
  assert.match(page, /"\/api\/visualize\.php"/);
});
test("Gemini credentials remain server-only and authentication is validated", () => {
  assert.doesNotMatch(page, /GEMINI_API_KEY|x-goog-api-key|generativelanguage\.googleapis/);
  assert.match(server, /getenv\('GEMINI_API_KEY'\)/);
  assert.match(server, /\/auth\/v1\/user/);
  assert.match(server, /is_uploaded_file/);
  assert.match(server, /CURLOPT_SSL_VERIFYPEER=>true/);
});
test("server PHP is not in static Vite public directory", () => {
  assert.equal(existsSync("public/api/visualize.php"), false);
  assert.equal(existsSync("server/cpanel/api/visualize.php"), true);
});
