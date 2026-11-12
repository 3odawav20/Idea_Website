import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const hero = readFileSync("src/app/components/HeroBrandFilm.css", "utf8");
const header = readFileSync("src/app/components/Header.css", "utf8");
const globals = readFileSync("src/styles/globals.css", "utf8");
const home = readFileSync("src/app/pages/Home.css", "utf8");

test("cinematic hero fills the viewport below the header on desktop and mobile", () => {
  assert.match(hero, /height:\s*calc\(100svh - 52px\)/);
  assert.match(hero, /height:\s*calc\(100svh - 54px\)/);
  assert.doesNotMatch(hero, /height:\s*min\(78svh/);
  assert.doesNotMatch(hero, /max-height:\s*1200px/);
});

test("day orange glass and night dark glass retain visible logos and subtle black type shadows", () => {
  assert.match(header, /html\[data-theme="light"\] \.idea-reference-header/);
  assert.match(header, /html\[data-theme="dark"\] \.idea-reference-header/);
  assert.match(header, /background-color:\s*rgba\(171,\s*58,\s*1,\s*\.45\)/);
  assert.match(header, /background-color:\s*rgba\(10,\s*10,\s*12,\s*\.38\)/);
  assert.match(header, /backdrop-filter:\s*blur\(24px\)/);
  assert.match(header, /\.idea-reference-header::before/);
  assert.match(header, /\.idea-reference-header::after/);
  assert.match(header, /background-image: linear-gradient/);
  assert.match(header, /text-shadow:\s*0 1px 3px rgba\(0,0,0/);
  assert.match(header, /html\[data-theme="light"\] \.idea-reference-logo\s*\{\s*background:\s*transparent/);
  assert.match(header, /html\[data-theme="light"\] \.idea-reference-logo img\s*\{[\s\S]*?drop-shadow/);
  assert.doesNotMatch(header, /html\[data-theme="light"\] \.idea-reference-logo\s*\{\s*background:\s*#090909/);
});

test("subtle editorial colour grade only; original material and product assets untouched", () => {
  assert.match(hero, /saturate\(1\.14\) contrast\(1\.055\) brightness\(1\.025\)/);
  assert.match(home, /Editorial-only colour refinement/);
  assert.match(home, /saturate\(1\.12\) contrast\(1\.045\) brightness\(1\.02\)/);
  assert.doesNotMatch(home, /idea-product-card|idea-room3d-material-face|idea-vivid-image/);
  assert.match(globals, /\.idea-vivid-image\s*\{\s*filter:\s*none/);
});

test("no obsolete orange browser scrollbar; native scrolling remains operable", () => {
  assert.match(globals, /scrollbar-color:\s*rgba\(116,116,116/);
  assert.match(globals, /::-webkit-scrollbar-thumb\s*\{\s*background:\s*rgba\(116,116,116/);
  assert.doesNotMatch(globals, /::-webkit-scrollbar-thumb\s*\{\s*background:\s*var\(--idea-gold-deep\)/);
});
