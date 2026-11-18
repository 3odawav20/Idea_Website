import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const load = path => readFileSync(resolve(process.cwd(), path), "utf8");
const app = load("src/app/components/AskIdea.tsx");
const css = load("src/app/components/AskIdea.css");
const layout = load("src/app/components/Layout.tsx");
const build = load("scripts/build-cpanel.mjs");
const php = load("server/cpanel/api/ask-idea.php");
const catalogue = JSON.parse(load("src/app/data/artceramic.json"));

test("ask IDEA is mounted in site layout and uses existing approved IDEA logo", () => {
  assert.match(layout, /import \{ AskIdea \} from "\.\/AskIdea"/);
  assert.match(layout, /<AskIdea \/>/);
  assert.match(app, /<IdeaLogo compact \/>/);
  assert.match(app, /aria-label="Ask IDEA"/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test("ask IDEA uses canonical product source, safe links and honest offline mode", () => {
  assert.ok(catalogue.length >= 400);
  assert.match(app, /artceramic\.json/);
  assert.match(app, /encodeURIComponent\(product\.slug\)/);
  assert.match(app, /AI unavailable/);
  assert.match(app, /aria-expanded=\{open\}/);
  assert.match(app, /credentials: "same-origin"/);
  assert.doesNotMatch(app, /RUNPOD_API_KEY|sk-[A-Za-z0-9]{10}/);
});

test("server-only chat endpoint validates origin, input, rate limits and safe provider host", () => {
  assert.match(php, /ORIGIN_NOT_ALLOWED/);
  assert.match(php, /REQUEST_TOO_LARGE/);
  assert.match(php, /TOO_MANY_REQUESTS/);
  assert.match(php, /api\.runpod\.ai/);
  assert.match(php, /RUNPOD_API_KEY/);
  assert.match(php, /CATALOGUE_NOT_DEPLOYED/);
  assert.doesNotMatch(php, /Access-Control-Allow-Origin: \*/);
});

test("cPanel packaging includes assistant endpoint and canonical product catalogue", () => {
  assert.match(build, /api\/ask-idea\.php/);
  assert.match(build, /data\/idea-catalogue\.json/);
});