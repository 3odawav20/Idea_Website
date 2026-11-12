import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(p)=>readFileSync(p,"utf8");
const controls=read("src/app/pages/Room3DLighting.tsx");
const realism=read("src/app/pages/Room3DRealism.ts");
const studio=read("src/app/pages/Room3DStudio.tsx");
const router=read("src/app/App.tsx");

test("lighting controls provide a color picker, live power and camera exposure, and on/off",()=>{
  assert.match(controls,/type="color"/);
  assert.match(controls,/type="range"/);
  assert.match(controls,/daylightPower/);
  assert.match(controls,/settings\.enabled/);
  assert.match(controls,/settings\.shadows/);
  assert.match(controls,/onSettingsChange/);
  for(const preset of ["daylight","warm","neutral","sunset","blue","purple"]){
    assert.ok(controls.includes('key:"'+preset+'"'),"missing "+preset+" preset");
  }
});

test("the new renderer uses physically based tile reflection rather than overexposed static lights",()=>{
  assert.match(realism,/ACESFilmicToneMapping/);
  assert.match(realism,/RoomEnvironment/);
  assert.match(realism,/renderer\.toneMappingExposure=settings\.exposure/);
  assert.match(realism,/spot\.color\.copy\(color\)/);
  assert.match(realism,/scene\.environmentIntensity/);
  assert.match(studio,/MeshPhysicalMaterial/);
  assert.match(studio,/clearcoatRoughness/);
  assert.doesNotMatch(studio,/new THREE\.HemisphereLight\(0xf8f7f2,0x485560,2\.2\)/);
});

test("tile textures are laid at manufacturer dimensions, not arbitrary square repeats",()=>{
  assert.match(studio,/a\/tw/);
  assert.match(studio,/b\/th/);
  assert.match(studio,/makeTileNormalMap\(across,high\)/);
  assert.match(studio,/materialSize\(product,sizeChoice\[id\]\)/);
  assert.match(studio,/roughness=lighting\.finish/);
});

test("kitchen is explicitly a generic mode and does not invent manufacturer models",()=>{
  assert.match(controls,/RoomMode = "empty" \| "kitchen"/);
  assert.match(studio,/roomMode==="kitchen"/);
  assert.match(studio,/changeSceneMode/);
  assert.doesNotMatch(studio,/africa beige|fashion carrara/i);
  assert.match(studio,/const changeSceneMode=\(next:RoomMode\)=>\{/);
  assert.match(studio,/setRoomMode\(next\)/);
  assert.match(studio,/fixtureLayouts\.current\[roomMode\]=fixtures/);
  assert.match(realism,/IDEA_GENERIC_KITCHEN/);
  assert.match(realism,/makeKitchenWoodTexture/);
  assert.match(realism,/makeKitchenStoneTexture/);
  assert.match(router,/room-designer\/3d/);
});

test("light sliders update an existing canvas without rebuilding all room geometry",()=>{
  assert.match(studio,/useEffect\(\(\)=>\{\s*const state=sceneRef\.current;\s*if\(state\)updateLightRig/);
  assert.match(studio,/lighting\.finish\]\);/);
  assert.match(studio,/\[lighting,roomMode,dims\.width,dims\.length,dims\.height\]/);
  assert.match(realism,/kitchenStrip\.material\.color\.copy\(color\)/);
});
