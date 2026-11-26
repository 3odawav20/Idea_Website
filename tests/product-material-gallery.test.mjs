import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("src/app/pages/ProductDetail.tsx", "utf8");
const css = readFileSync("src/app/pages/ProductDetail.css", "utf8");

test("product hero shows original tile material faces rather than a room scene", () => {
  assert.match(page, /product\.source\?\.original\?\.tiles/);
  assert.match(page, /const heroImage = gallery\[activeImg\]/);
  assert.match(page, /src=\{heroImage\}/);
  assert.match(page, /idea-material-hero-photo/);
  assert.match(page, /no architectural scenes|no room renders|بدون صور غرف/i);
});
test("technical features remain source-grounded and private quote stays private", () => {
  assert.match(page, /product\.sizes\.map/);
  assert.match(page, /product\.finish/);
  assert.match(page, /addToQuote\(product\.id,unit\)/);
  assert.match(page, /session\?\.role==="admin"&&adminPrice/);
  assert.doesNotMatch(page, /1\.44\s?(?:sqm|m²)|31981-31979|9\.8 MM/);
});
test("image viewer supports keyboard close, zoom and touch pan", () => {
  assert.match(page, /aria-modal="true"/);
  assert.match(page, /key==="Escape"/);
  assert.match(page, /key==="Tab"/);
  assert.match(page, /onPointerDown/);
  assert.match(page, /onPointerMove/);
  assert.match(page, /setZoom/);
  assert.match(css, /idea-material-lightbox/);
  assert.match(css, /touch-action:none/);
});
test("responsive white product sheet separates product image and features", () => {
  assert.match(css, /idea-material-hero-layout/);
  assert.match(css, /background:#faf9f6/);
  assert.match(css, /idea-technical-grid\{grid-template-columns:repeat\(2/);
  assert.match(css, /@media\(max-width:540px\)/);
});
