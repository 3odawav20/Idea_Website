import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(file)=>readFileSync(file,"utf8");
const studio=read("src/app/pages/Room3DStudio.tsx");
const fixtures=read("src/app/pages/Room3DFixtures.ts");
const lighting=read("src/app/pages/Room3DLighting.tsx");
const gallery=read("src/app/pages/Room3DMaterialGallery.tsx");
const css=read("src/app/pages/Room3DMaterialGallery.css");

test("scene picker includes genuinely populated bathroom and living layouts",()=>{
  assert.match(lighting,/RoomMode = "empty" \| "kitchen" \| "bathroom" \| "living"/);
  assert.match(fixtures,/case "bathroom": return/);
  assert.match(fixtures,/case "living": return/);
  assert.match(studio,/fixturePreset\(next\)/);
});
test("fixture selector adds, drags, duplicates, removes and rotates objects",()=>{
  for(const operation of ["setFixtures","setSelectedFixture","addFixture","editFixture","deleteFixture","duplicateFixture"]){
    assert.ok(studio.includes(operation),"missing fixture operation "+operation);
  }
  assert.match(studio,/pointermove/);
  assert.match(studio,/intersectPlane/);
  assert.match(studio,/positionFixture\(group,dragging.fixture,dims\)/);
  for(const kind of ["bathtub","basin","bath-faucet","kitchen-faucet","kitchen-sink","sofa","coffee-table","shower","mirror","door","window"]){
    assert.ok(fixtures.includes('"' +kind+'"'),"missing "+kind);
  }
  assert.match(studio,/version:4,dimensions:dims,ceiling,tileChoice,sizeChoice,roomMode,lighting,fixtures/);
});
test("material library preserves source-backed material data and user pan",()=>{
  assert.match(gallery,/source\?\.original\?\.tiles/);
  assert.match(gallery,/localMaterialFace/);
  assert.match(gallery,/products\.filter/);
  assert.match(gallery,/category==="tiles"/);
  assert.match(gallery,/IntersectionObserver/);
  assert.match(gallery,/setLimit\(prev=>Math\.min\(filtered\.length,prev\+48\)\)/);
  assert.match(gallery,/scrollLeft/);
  assert.match(gallery,/scrollTop/);
  assert.match(gallery,/createPortal\(gallery,document\.body\)/);
  assert.match(css,/overflow-x:auto;overflow-y:auto/);
  assert.match(css,/grid-template-columns:repeat\(7/);
});
test("IDEA 3D header uses real orange/white identity",()=>{
  const style=read("src/app/pages/Room3DStudio.css");
  assert.match(studio,/idea-room3d-heading-brand/);
  assert.match(studio,/idea-room3d-heading-title/);
  assert.match(style,/color:#fd6401/);
  assert.match(style,/text-shadow/);
});
