import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const page = readFileSync("src/app/pages/AiVisualizerStudio.tsx", "utf8");
const patch = readFileSync("scripts/patch-live-visualizer-result.py", "utf8");
test("visualizer uses the live PHP session and CSRF, not a third-party token", () => {
  assert.doesNotMatch(page, /supabase|Authorization: `Bearer/);
  assert.match(page, /await getPhpSession\(\)/);
  assert.match(page, /"X-CSRF-Token": token/);
  assert.match(page, /credentials: "same-origin"/);
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
