import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const catalogue = JSON.parse(read("../src/app/data/artceramic.json"));
const upgrades = JSON.parse(read("../src/app/data/artceramicPhotoUpgrades.json"));

test("Art Ceramic source records have unique IDs and storefront slugs", () => {
  assert.equal(catalogue.length, 475);
  assert.equal(new Set(catalogue.map(x => String(x.id))).size, catalogue.length);
  assert.equal(new Set(catalogue.map(x => x.slug)).size, catalogue.length);
});

test("each catalogue record has sourced name, measurable dimensions and an HTTPS main image", () => {
  for (const p of catalogue) {
    assert.ok(p.name.trim(), "Missing name: "+p.id);
    assert.match(p.size, /^\d+(?:\.\d+)?[xX]\d+(?:\.\d+)?$/, "Dimension: "+p.id);
    assert.match(p.image, /^https:\/\//, "Image URL: "+p.id);
    assert.ok(Array.isArray(p.tiles), "Gallery: "+p.id);
  }
});

test("every published upgrade references exactly its own source medium image path", () => {
  const byId = new Map(catalogue.map(x => [String(x.id), x]));
  for (const [id, photo] of Object.entries(upgrades)) {
    const record = byId.get(id);
    assert.ok(record, "Unknown product id "+id);
    assert.equal(photo.large, record.image.replace("/medium_", "/large_"), "Large: "+id);
    if (photo.original) {
      assert.equal(photo.original, record.image.replace("/medium_", "/"), "Original: "+id);
    }
  }
});

test("product photos preserve source colour and full framing on mobile", () => {
  const css = read("../src/styles/globals.css");
  const card = read("../src/app/components/ProductCard.tsx");
  const detail = read("../src/app/pages/ProductDetail.tsx");
  assert.match(css, /\.idea-vivid-image\s*\{\s*filter:\s*none;/);
  assert.match(card, /objectFit:\s*"contain"/);
  assert.match(detail, /objectFit:\s*"contain"/);
  assert.match(detail, /useEffect\(\(\) => \{ setActiveImg\(0\); setFailedImages\(\[\]\); \}, \[slug\]\)/);
});
