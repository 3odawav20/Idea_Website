import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { numericIdeaCode, documentedManufacturer, tileFaceReference, tilesForArea } from "../src/app/data/productIdentity.ts";

const source = JSON.parse(readFileSync(new URL("../src/app/data/artceramic.json", import.meta.url), "utf8"));
function item(record) {
  return {
    id: String(record.id),
    collection: "ceramics",
    approved: true,
    manufacturerName: null,
    manufacturerVerified: false,
    source: {
      sourceId: "source-20",
      recordId: String(record.id),
      original: { tiles: record.tiles || [] },
    },
  };
}

test("all 475 imported Art Ceramic records have stable, unique numeric IDEA catalogue IDs", () => {
  assert.equal(source.length, 475);
  const codes = source.map(p => numericIdeaCode(item(p)));
  assert.ok(codes.every(code => /^\d{10}$/.test(code)));
  assert.equal(new Set(codes).size, codes.length);
  assert.equal(numericIdeaCode(item(source.find(p => String(p.id) === "95"))), "2000000095");
});

test("a source catalogue name never becomes a verified manufacturing factory", () => {
  const p = item(source[0]);
  assert.equal(documentedManufacturer(p), null);
  assert.equal(documentedManufacturer({ ...p, manufacturerName: "Example Factory", manufacturerVerified: false }), null);
  assert.equal(documentedManufacturer({ ...p, manufacturerName: "Verified Factory", manufacturerVerified: true }), "Verified Factory");
});

test("room ambient images are never substituted for actual tile face references", () => {
  const valid = source.map(item).filter(p => tileFaceReference(p));
  assert.ok(valid.length > 0);
  assert.ok(valid.every(p => /[_-]F\d+[_.-]/i.test(tileFaceReference(p))));
  const example = item(source[0]);
  example.source.original.tiles = [];
  assert.equal(tileFaceReference(example), null);
  assert.equal(tileFaceReference({ ...item(source[0]), collection: "faucets" }), null);
});

test("tile-area estimate preserves measurements, supports waste and refuses invalid numbers", () => {
  const value = tilesForArea(10, 600, 1200, 10);
  assert.equal(value.tiles, 16);
  assert.ok(Math.abs(value.requestedSqm - 11) < 0.00001);
  assert.equal(tilesForArea(0, 600, 1200, 10), null);
  assert.equal(tilesForArea(10, 0, 1200, 10), null);
  assert.equal(tilesForArea(10, 600, 1200, 45), null);
});