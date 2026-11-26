import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const studio = readFileSync("src/app/pages/AiVisualizerStudio.tsx", "utf8");
const css = readFileSync("src/app/pages/AiVisualizerStudio.css", "utf8");
const imported = JSON.parse(readFileSync("src/app/data/artceramic.json", "utf8"));
const localFaces = JSON.parse(readFileSync("src/app/data/materialFaceCache.json", "utf8"));
const home = readFileSync("src/app/pages/Home.tsx", "utf8");

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
  for (const field of ["atlasTexture", "atlasFinish", "atlasSize", "atlasColor", "search"]) {
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

test("all 475 catalogue products have a local material face for the visualizer", () => {
  assert.equal(imported.length, 475);
  assert.equal(Object.keys(localFaces).length, 475);
  assert.ok(imported.every((product) => Boolean(localFaces[product.id])), "every product needs a local material face");
  assert.ok(Object.values(localFaces).every((face) => existsSync("public" + face)), "every cached local material face must exist");
});

test("AI visualizer uses IDEA spheres and hides supplier identity", () => {
  assert.match(studio, /import \{ MaterialSphere \}/);
  assert.match(studio, /<MaterialSphere/);
  assert.match(studio, /All Products/);
  assert.doesNotMatch(studio, /atlasBrand|productMaker|sourceSku|Supplier SKU|manufacturer name not localized/i);
  assert.match(css, /idea-studio-material-orb/);
  assert.match(css, /\[data-theme="dark"\] \.idea-studio/);
});

test("Home no longer repeats the material carousel; the full picker stays in AI Visualizer", () => {
  assert.doesNotMatch(home, /SurfaceMaterialStrip/);
  assert.match(studio, /id="idea-material-atlas"/);
});
