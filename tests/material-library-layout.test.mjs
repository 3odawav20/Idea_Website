import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src=readFileSync(new URL("../src/app/pages/MaterialCatalogue.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/app/pages/MaterialCatalogue.css",import.meta.url),"utf8");
test("material browsing retains sourced faces and marketplace actions",()=>{
  for(const name of ["localMaterialFace(product.id)","product.source?.original?.tiles?.[0]","toggleFavorite(product.id)","toggleCompare(product.id)","addToQuote(product.id, unit)","/ai-room-visualizer?product=","distinctStorefrontProducts(filtered)"]) assert.ok(src.includes(name),name);
});
test("material browsing keeps URL formats, usage, texture, brand and accessible sidebar",()=>{
  for(const name of ["isLargeFormat(product)","isOutdoor20mm(product)","params.get(\"usage\")","params.get(\"texture\")","params.get(\"brand\")","aria-expanded={filtersOpen}","aria-current={number === page"]) assert.ok(src.includes(name),name);
  assert.match(css,/\.idea-material-layout\{display:grid;grid-template-columns:220px minmax\(0,1fr\)/);
  assert.ok(css.includes("repeat(2,minmax(0,1fr))"));
  assert.ok(css.includes('[data-theme="dark"]'));
});
