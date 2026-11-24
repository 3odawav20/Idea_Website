import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src=readFileSync(new URL("../src/app/pages/MaterialCatalogue.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/app/pages/MaterialCatalogue.css",import.meta.url),"utf8");
test("material browsing retains sourced faces and marketplace actions",()=>{
  for(const name of ["localMaterialFace(product.id)","product.source?.original?.tiles?.[0]","toggleFavorite(product.id)","toggleCompare(product.id)","addToQuote(product.id, unit)","/ai-room-visualizer?product=","distinctStorefrontProducts(filtered)"]) assert.ok(src.includes(name),name);
});
test("material browsing keeps URL formats, usage, texture, brand and accessible filter disclosures",()=>{
  for(const name of ["isLargeFormat(product)","isOutdoor20mm(product)","params.get(\"usage\")","params.get(\"texture\")","params.get(\"brand\")","<details className=\"idea-material-facet\"","<summary>{label}","aria-current={number === page"]) assert.ok(src.includes(name),name);
  assert.ok(src.includes("<input type=\"checkbox\" checked={value === item}"),"filter options remain selectable with native checkboxes");
  assert.ok(css.includes(".idea-material-layout{display:block}"),"current catalogue layout remains the compact filter-row design");
  assert.ok(css.includes("repeat(2,minmax(0,1fr))"));
  assert.ok(css.includes('[data-theme="dark"]'));
});
