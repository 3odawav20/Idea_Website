import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const page = readFileSync("src/app/pages/AiVisualizerStudio.tsx", "utf8");
const phpClient = readFileSync("src/app/backend/phpAccounts.ts", "utf8");
const patch = readFileSync("scripts/patch-live-visualizer-result.py", "utf8");
test("visualizer uses authenticated PHP/MySQL job helpers and never sends a third-party token", () => {
  assert.doesNotMatch(page, /supabase|Authorization: `Bearer|visualize\.php/);
  assert.match(page, /createPlatformAiJob/);
  assert.match(page, /downloadPlatformAiResult/);
  assert.match(phpClient, /await getPhpSession\(\)/);
  assert.match(phpClient, /"X-CSRF-Token": session\.csrf/);
  assert.match(phpClient, /credentials: "same-origin"/);
});
test("visualizer normalizes against the actual PHP upload limits", () => {
  assert.match(page, /MAX_BYTES = 8 \* 1024 \* 1024/);
  assert.match(page, /MAX_PIXELS = 10_000_000/);
});
test("live patch preserves existing mask validation and reads the JPEG result", () => {
  assert.match(patch, /result\.jpg/);
  assert.match(patch, /IMAGETYPE_JPEG/);
  assert.match(patch, /imagepng\(\$image/);
  assert.match(patch, /hashlib\.sha256\(raw\)/);
});
