import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const globals = readFileSync("src/styles/globals.css", "utf8");
const admin = readFileSync("src/app/pages/AdminStudio.css", "utf8");
const studio = readFileSync("src/app/pages/AiVisualizerStudio.css", "utf8");
const theme = readFileSync("src/app/theme/theme.tsx", "utf8");

test("global IDEA theme uses true white in light mode and neutral charcoal in dark", () => {
  assert.match(globals, /:root\s*\{[\s\S]*?--idea-bg:\s*#ffffff;/);
  assert.match(globals, /\[data-theme='dark'\]\s*\{[\s\S]*?--idea-bg:\s*#101010;/);
  assert.doesNotMatch(globals, /--idea-gold-sheen:\s*#d9e2ff/i);
  assert.match(theme, /document\.documentElement\.setAttribute\("data-theme", mode\)/);
});
test("AI workspace and atlas both respect light theme with readable dark text", () => {
  assert.match(studio, /\[data-theme="light"\]\s+\.idea-studio\s*\{[\s\S]*?--studio-bg:#ffffff;/);
  assert.match(studio, /\[data-theme="light"\]\s+\.idea-studio\s+\.idea-studio-library\s*\{[\s\S]*?color-scheme:light;/);
  assert.match(studio, /\[data-theme="light"\]\s+\.idea-studio-stage\s*\{/);
  assert.match(studio, /\[data-theme="light"\]\s+\.idea-studio\s+\.idea-studio-library\s+\.idea-atlas-card-body\s+strong\s*\{/);
  assert.match(studio, /\[data-theme="dark"\]\s+\.idea-studio\s*\{[\s\S]*?--studio-bg:#0c0c0c;/);
});
test("admin dashboard has an explicit light theme, not permanent navy", () => {
  assert.match(admin, /\[data-theme="light"\]\s+\.ids-root\s*\{[\s\S]*?--ids-bg:#ffffff;/);
  assert.match(admin, /\[data-theme="light"\]\s+\.ids-root\s+\.ids-sidebar/);
  assert.match(admin, /\[data-theme="light"\]\s+\.ids-root\s+\.ids-modal/);
  assert.match(admin, /\[data-theme="dark"\]\s+\.ids-root\s*\{[\s\S]*?--ids-bg:#0c0c0c;/);
  assert.match(admin, /color-scheme:light;/);
  assert.match(admin, /color-scheme:dark;/);
});
