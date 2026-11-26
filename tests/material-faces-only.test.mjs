import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const studio = readFileSync("src/app/pages/AiVisualizerStudio.tsx", "utf8");
const catalogue = JSON.parse(readFileSync("src/app/data/artceramic.json", "utf8"));

test("AI catalogue only shows supplier-original product face images", () => {
  assert.match(studio, /function materialFaces\(product: Product\)/);
  assert.match(studio, /product\.source\?\.original\?\.tiles/);
  assert.match(studio, /materialFaces\(product\)\.length > 0/);
  assert.match(studio, /src=\{materialFaces\(product\)\[0\]\}/);
  assert.doesNotMatch(studio, /src=\{product\.image\}/);
});
test("model receives the chosen original tile face, not a room/lifestyle photograph", () => {
  assert.match(studio, /fetch\(selectedFaceImage,/);
  assert.doesNotMatch(studio, /fetch\(selectedProduct\.image,/);
  assert.match(studio, /form\.append\("material", reference,/);
  assert.match(studio, /setFaceIndex\(index\)/);
  assert.match(studio, /selectedFaceImage \? <img src=\{selectedFaceImage\}/);
});
test("existing supplier catalogue records all have actual source face references", () => {
  assert.equal(catalogue.length, 475);
  for (const product of catalogue) {
    assert.ok(product.tiles.length > 0, "missing tile face for " + product.id);
    for (const url of product.tiles) {
      assert.match(url, /^https:\/\/.+\.(png|jpg|jpeg|webp)(?:\?.*)?$/i);
    }
  }
  const product527 = catalogue.find((p) => p.id === "527");
  assert.ok(product527);
  assert.match(product527.tiles[0], /ACACIA_GREY_F\d+/i);
  assert.match(product527.image, /_AMB_/i);
});
