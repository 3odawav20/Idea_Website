import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const hero = readFileSync("src/app/components/HeroBrandFilm.css", "utf8");
const header = readFileSync("src/app/components/Header.css", "utf8");
const globals = readFileSync("src/styles/globals.css", "utf8");
const home = readFileSync("src/app/pages/Home.css", "utf8");

test("cinematic hero fills the viewport behind the transparent header on desktop and mobile", () => {
  const headerTsx = readFileSync("src/app/components/Header.tsx", "utf8");
  assert.match(hero, /\.idea-editorial-hero\.idea-film-ready\s*\{[^}]*height:\s*100svh;/);
  assert.match(hero, /@media\s*\(max-width: 767px\)\s*\{\s*\.idea-editorial-hero\.idea-film-ready\s*\{[^}]*height:\s*100svh;/);
  assert.match(header, /\.idea-reference-header--overlay\s*\{\s*margin-bottom:\s*calc\(-1 \* var\(--idea-header-height\)\)/);
  assert.match(headerTsx, /const isOverlayRoute\s*=\s*isHome\s*\|\|/);
  assert.doesNotMatch(hero, /height:\s*min\(78svh/);
  assert.doesNotMatch(hero, /max-height:\s*1200px/);
});

test("transparent adaptive glass retains visible logos and type shadows in both themes", () => {
  assert.match(header, /html\[data-theme="light"\] \.idea-reference-header/);
  assert.match(header, /html\[data-theme="dark"\] \.idea-reference-header/);
  assert.match(header, /\.idea-reference-header\s*\{[^}]*background:\s*transparent;[^}]*background-color:\s*transparent;[^}]*background-image:\s*none;/);
  assert.match(header, /backdrop-filter:\s*blur\(22px\)\s*saturate\(/);
  assert.match(header, /backdrop-filter:\s*blur\(26px\)\s*saturate\(/);
  assert.match(header, /\.idea-reference-header::before,\s*\.idea-reference-header::after\s*\{\s*display:\s*none;\s*content:\s*none;/);
  assert.match(header, /text-shadow:\s*0 1px 10px rgba\(0,\s*0,\s*0/);
  assert.match(header, /\.idea-reference-logo\s*\{[^}]*background:\s*transparent/);
  assert.match(header, /html\[data-theme="light"\] \.idea-reference-logo img\s*\{[^}]*drop-shadow/);
  assert.match(globals, /--idea-gold:\s*#fd6401/);
  assert.doesNotMatch(header, /rgba\(171,\s*58,\s*1,\s*\.45\)|rgba\(10,\s*10,\s*12,\s*\.38\)/);
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
