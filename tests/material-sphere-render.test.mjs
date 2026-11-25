import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sphere = readFileSync(new URL("../src/app/components/MaterialSphere.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../src/app/pages/Home.tsx", import.meta.url), "utf8");
const catalogue = readFileSync(new URL("../src/app/pages/MaterialCatalogue.tsx", import.meta.url), "utf8");
const sphereCss = readFileSync(new URL("../src/app/components/MaterialSphere.css", import.meta.url), "utf8");
const homeCss = readFileSync(new URL("../src/app/pages/Home.css", import.meta.url), "utf8");
const catalogueCss = readFileSync(new URL("../src/app/pages/MaterialCatalogue.css", import.meta.url), "utf8");

test("material spheres use spherical UV mapping and directional lighting", () => {
  for (const token of ["Math.atan2", "Math.asin", "Math.sqrt(1 - radiusSquared)", "diffuse", "specular", "putImageData"]) {
    assert.ok(sphere.includes(token), token);
  }
  assert.ok(sphere.includes("getImageData"), "source material pixels are mapped onto the sphere");
  assert.ok(sphere.includes("data-rendered"), "the original source image remains available as a fallback");
});

test("homepage and marketplace share the same sphere renderer and cached source faces", () => {
  assert.ok(home.includes("localMaterialFace(product.id)"));
  assert.ok(home.includes("<MaterialSphere"));
  assert.ok(catalogue.includes("localMaterialFace(product.id)"));
  assert.ok(catalogue.includes("<MaterialSphere"));
  assert.ok(catalogue.includes("product.source?.original?.tiles?.[0]"));
});

test("featured shelf uses verified catalogue products and retains marketplace actions", () => {
  for (const id of ['"484"', '"546"', '"39"', '"492"']) assert.ok(catalogue.includes(id), id);
  for (const action of ["addToQuote(product.id, unit)", "/ai-room-visualizer?product=", "idea-material-catalogue-grid"]) {
    assert.ok(catalogue.includes(action), action);
  }
  assert.ok(catalogue.includes("toggleFavorite(product.id)"));
  assert.ok(catalogue.includes("toggleCompare(product.id)"));
});

test("sphere fallbacks, both themes, responsive cards and reduced-motion support remain intact", () => {
  assert.ok(sphereCss.includes('data-rendered="true"'));
  assert.ok(homeCss.includes("prefers-reduced-motion: reduce"));
  assert.ok(catalogueCss.includes('[data-theme="dark"] .idea-material-featured'));
  assert.ok(catalogueCss.includes('[data-theme="dark"] .idea-material-orb'));
  assert.ok(catalogueCss.includes("repeat(4, minmax(0, 1fr))"));
  assert.ok(catalogueCss.includes("repeat(2, minmax(0, 1fr))"));
  assert.ok(catalogueCss.includes("prefers-reduced-motion: reduce"));
});


test("catalogue follows the reference layout and places finish, brand, name, size and code under each sphere", () => {
  assert.ok(catalogue.includes("idea-material-main-layout"));
  assert.ok(catalogue.includes("idea-material-catalogue-intro"));
  assert.ok(catalogue.includes("idea-material-search-field"));
  assert.ok(catalogue.includes("idea-filter-chips"));
  assert.ok(catalogue.includes("selectMaterialCategory(item.key)"));
  assert.ok(catalogue.includes("aria-pressed={isActive}"));
  assert.ok(catalogue.includes("bestPriceLabel(locale)"));
  assert.ok(catalogue.includes("tryInAiLabel(locale)"));
  const card = catalogue.slice(catalogue.indexOf("function MaterialCard("));
  assert.ok(card.indexOf("idea-material-finish") < card.indexOf("idea-material-maker"));
  assert.ok(card.indexOf("idea-material-maker") < card.indexOf("idea-material-name"));
  assert.ok(card.indexOf("idea-material-name") < card.indexOf("idea-material-meta"));
  assert.ok(catalogueCss.includes("grid-template-columns: repeat(4, minmax(0, 1fr))"));
  assert.ok(catalogueCss.includes("background: transparent"));
});
