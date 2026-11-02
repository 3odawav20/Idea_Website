import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const studio = readFileSync("src/app/pages/AiVisualizerStudio.tsx", "utf8");
const css = readFileSync("src/app/pages/AiVisualizerStudio.css", "utf8");
const imported = JSON.parse(readFileSync("src/app/data/artceramic.json", "utf8"));

test("IDEA material atlas uses actual sourced catalogue products", () => {
  assert.ok(Array.isArray(imported) && imported.length > 0, "source catalogue must have products");
  assert.match(studio, /const materialLibrary = useMemo/);
  assert.match(studio, /products\.filter/);
  assert.match(studio, /product\.status !== "sample"/);
  assert.match(studio, /product\.collection === "ceramics"/);
  assert.match(studio, /product\.collection === "porcelain"/);
  assert.match(studio, /product\.collection === "marble"/);
  assert.doesNotMatch(studio, /SAMPLE_PRODUCTS/);
});
test("marble-effect discovery is not incorrectly labelled natural marble", () => {
  assert.match(studio, /marble-look/);
  assert.match(studio, /isMarbleLook/);
  assert.match(studio, /Marble effect/);
  assert.match(studio, /Natural marble differs from marble-effect tile/);
});
test("atlas has discovery filters and a responsive paginated catalogue", () => {
  for (const field of ["atlasBrand", "atlasTexture", "atlasFinish", "atlasSize", "atlasColor", "search"]) {
    assert.ok(studio.includes(field), "missing facet: " + field);
  }
  assert.match(studio, /visibleAtlasProducts = eligibleProducts\.slice/);
  assert.match(studio, /setAtlasVisibleCount\(\(count\) => count \+ 24\)/);
  assert.match(studio, /aria-pressed=\{atlasGroup === group\}/);
  assert.match(css, /idea-atlas-facets/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
test("chosen material deep-links to the original room visualizer", () => {
  assert.match(studio, /setSearchParams\(\{ product: id \}/);
  assert.match(studio, /scrollIntoView/);
  assert.match(studio, /form\.append\("productId", selectedProduct\.id\)/);
  assert.match(studio, /form\.append\("material", reference/);
  assert.doesNotMatch(studio, /generativelanguage|Gemini API key|VITE_GEMINI/i);
});