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
test("material cards preserve reference text order and keep actions intact",()=>{
  const card=src.slice(src.indexOf("function MaterialCard("));
  const maker=card.indexOf('<div className="idea-material-maker">');
  const name=card.indexOf('<Link className="idea-material-name-pill"');
  const meta=card.indexOf('<div className="idea-material-meta">');
  const quote=card.indexOf('className="idea-material-quote"');
  const visualize=card.indexOf('className="idea-material-visualize"');
  assert.ok(maker>=0 && maker<name && name<meta && meta<quote && quote<visualize,"brand, name, dimensions/reference and both actions remain in the requested order");
});
test("material swatches have restrained 3D depth, motion and reduced-motion support in both themes",()=>{
  for(const token of ["idea-material-orb-float","idea-material-orb-shine","perspective:1100px","translate3d(0,-7px,16px)",'[data-theme="dark"] .idea-material-orb','[data-theme="light"] .idea-material-orb','prefers-reduced-motion:reduce']) assert.ok(css.includes(token),token);
});
