import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { transformSync } from "esbuild";

const ts = readFileSync("src/app/data/storefrontDistinct.ts", "utf8");
const js = transformSync(ts, { loader: "ts", format: "esm", target: "es2020" }).code;
const { distinctStorefrontProducts } = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);
const product = (id, name, manufacturer, face, color) => ({
  id, collection: "ceramics", brand: "Art Ceramic", manufacturer,
  name: { en: name }, model: name, source: {
    provider: "Art Ceramic catalogue export",
    original: { name, color, tiles: face ? [face] : [] }
  }
});

test("same catalogue maker and identical tile face appear just once", () => {
  const wall = product("527", "Acacia Grey", undefined, "https://tiles.test/acacia.jpg", "Grey");
  const floor = product("560", "Acacia Grey - Floor", undefined, "https://tiles.test/acacia.jpg", "Grey");
  assert.deepEqual(distinctStorefrontProducts([wall,floor]),[wall]);
  assert.equal(wall.id, "527");
  assert.equal(floor.id, "560"); // original products are unchanged
});

test("same-maker colour variants of one design do not repeat in public grids", () => {
  const beige = product("479","Africa Beige",undefined,"https://tiles.test/africa-beige.jpg","Beige");
  const brown = product("480","Africa Brown",undefined,"https://tiles.test/africa-brown.jpg","Brown");
  assert.deepEqual(distinctStorefrontProducts([beige,brown]),[beige]);
});

test("different verified manufacturers remain separate, even for identical face art", () => {
  const face="https://tiles.test/shared.jpg";
  const a=product("1","Acacia Grey","Factory A",face,"Grey");
  const b=product("2","Acacia Grey","Factory B",face,"Grey");
  assert.deepEqual(distinctStorefrontProducts([a,b]),[a,b]);
});

test("distinct designs with the same manufacturer remain separate", () => {
  const a=product("1","Acacia Grey",undefined,"https://tiles.test/acacia.jpg","Grey");
  const b=product("2","Amazon Beige",undefined,"https://tiles.test/amazon.jpg","Beige");
  assert.deepEqual(distinctStorefrontProducts([a,b]),[a,b]);
});

test("filtering before grouping still retrieves a specific floor or colour variant", () => {
  const a=product("527","Acacia Grey",undefined,"https://tiles.test/a.jpg","Grey");
  const floor=product("560","Acacia Grey - Floor",undefined,"https://tiles.test/a.jpg","Grey");
  assert.deepEqual(distinctStorefrontProducts([a,floor].filter(x=>x.name.en.includes("Floor"))),[floor]);
});

test("current Art Ceramic source's homepage sample never repeats a design", () => {
  const raw=JSON.parse(readFileSync("src/app/data/artceramic.json","utf8"));
  const all=raw.filter(x=>x.name && x.size && x.image).map(x=>product(x.id,x.name,undefined,x.tiles?.[0],x.color));
  const featured=distinctStorefrontProducts(all.sort((a,b)=>a.name.en.localeCompare(b.name.en))).slice(0,4);
  assert.equal(new Set(featured.map(x=>x.name.en.replace(/\\s*[-–]\\s*Floor$/i,"").trim())).size,4);
  assert.equal(featured[0].name.en,"Acacia Grey");
  assert.equal(featured[1].name.en,"Africa Beige");
  assert.ok(all.length>featured.length);
});
