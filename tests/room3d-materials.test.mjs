import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const studio=readFileSync("src/app/pages/Room3DStudio.tsx","utf8");
const gallery=readFileSync("src/app/pages/Room3DMaterialGallery.tsx","utf8");

test("3D studio keeps orbit and interactive lighting from PR #79",()=>{
  assert.match(studio,/OrbitControls/);
  assert.match(studio,/<Room3DLighting/);
  assert.match(studio,/<Room3DMaterialGallery/);
});

test("Material catalogue uses tile faces rather than room or showroom product photos",()=>{
  assert.match(gallery,/source\?\.original\?\.tiles/);
  assert.doesNotMatch(gallery,/(?:product|p)\.image\b/);
  assert.match(gallery,/localFaces/);
  assert.doesNotMatch(studio,/<div className="idea-room3d-demo-list"/);
  assert.doesNotMatch(studio,/<div className="idea-room3d-fixture-list"/);
});

test("Physical tile size comes from verified widthMm and heightMm per selected surface",()=>{
  assert.match(gallery,/Number\.isFinite\(size\.widthMm\)/);
  assert.match(gallery,/Number\.isFinite\(size\.heightMm\)/);
  assert.match(studio,/materialSize\(product,sizeChoice\[id\]\)/);
  assert.match(studio,/const tw=s\.widthMm!\/1000,th=s\.heightMm!\/1000/);
  assert.match(studio,/sizeChoice\.floor,sizeChoice\.back,sizeChoice\.left,sizeChoice\.right/);
  assert.match(studio,/tileChoice,sizeChoice,roomMode,lighting/);
});
