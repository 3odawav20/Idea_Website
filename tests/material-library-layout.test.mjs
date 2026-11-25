import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src=readFileSync(new URL("../src/app/pages/MaterialCatalogue.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/app/pages/MaterialCatalogue.css",import.meta.url),"utf8");
test("material browsing retains sourced faces and marketplace actions",()=>{
  for(const name of ["localMaterialFace(product.id)","product.source?.original?.tiles?.[0]","toggleFavorite(product.id)","toggleCompare(product.id)","addToQuote(product.id, unit)","/ai-room-visualizer?product=","distinctStorefrontProducts(filtered)"]) assert.ok(src.includes(name),name);
});
test("material browsing keeps URL formats, usage, texture, brand and accessible filter disclosures",()=>{
  const filters=readFileSync(new URL("../src/lib/catalogue-filters.ts",import.meta.url),"utf8");
  for(const name of ["isLargeFormat(product)","isOutdoor20mm(product)"]) assert.ok(filters.includes(name),name);
  for(const name of ["filterCatalogueProduct(product,","params.get(\"usage\")","params.get(\"texture\")","params.get(\"brand\")","aria-current={number === page","idea-filter-panel","role=\"group\"","aria-pressed={isActive}","selectMaterialCategory(item.key)","updateFilter(\"format\","]) assert.ok(src.includes(name),name);
  assert.match(src, /<button\s+[^>]*type="button"[^>]*idea-filter-chip[^>]*aria-pressed=\{isActive\}/s, "filter chips remain keyboard-operable toggle buttons");
  assert.ok(src.includes("idea-material-main-layout"),"the reference catalogue uses a left intro and right results layout");
  assert.ok(css.includes("grid-template-columns: minmax(245px, .82fr) minmax(0, 3.18fr)"),"desktop catalogue keeps the reference two-column layout");
  assert.ok(css.includes("repeat(2,minmax(0,1fr))"));
  assert.ok(css.includes('[data-theme="dark"]'));
});
test("material cards preserve reference text order and keep actions intact",()=>{
  const card=src.slice(src.indexOf("function MaterialCard("));
  const finish=card.indexOf('className="idea-material-finish"');
  const maker=card.indexOf('<div className="idea-material-maker">');
  const name=card.search(/<Link\s+className="idea-material-name"/);
  const meta=card.indexOf('<div className="idea-material-meta">');
  const quote=card.indexOf('className="idea-material-quote"');
  const visualize=card.indexOf('className="idea-material-visualize"');
  assert.ok(finish>=0 && finish<maker && maker<name && name<meta && meta<quote && quote<visualize,"finish, brand, name, dimensions/reference and both actions remain in the requested order");
});
test("material swatches have restrained 3D depth, motion and reduced-motion support in both themes",()=>{
  for(const token of ["idea-material-orb-float","idea-material-orb-shine","perspective:1100px","translate3d(0,-7px,16px)",'[data-theme="dark"] .idea-material-orb','[data-theme="light"] .idea-material-orb','prefers-reduced-motion:reduce']) assert.ok(css.includes(token),token);
});


test("material product names are plain reference typography, never orange glass pills",()=>{
  const card=src.slice(src.indexOf("function MaterialCard("));
  assert.ok(card.includes('className="idea-material-name"'));
  assert.ok(!card.includes("idea-material-name-pill"));
  assert.ok(css.includes(".idea-material-card-body .idea-material-name {"));
  assert.ok(css.includes("[data-theme=\"dark\"] .idea-material-finish"));
});
const home=readFileSync(new URL("../src/app/pages/Home.tsx",import.meta.url),"utf8");
const homeCss=readFileSync(new URL("../src/app/pages/Home.css",import.meta.url),"utf8");
test("homepage featured products use the same source face, text hierarchy and working quote/AI actions",()=>{
  for(const token of ["localMaterialFace(product.id)","ideaInternalCode(product)","idea-home-featured-finish","idea-home-featured-maker","idea-home-featured-name","idea-home-featured-meta","addToQuote(product.id, unit)","/ai-room-visualizer?product="]) assert.ok(home.includes(token),token);
  assert.ok(!home.includes("idea-material-name-pill"),"homepage product names must not render as orange pills");
  for(const token of [".idea-home-featured-name",".idea-home-featured-maker",".idea-home-featured-meta",".idea-home-featured-actions","[data-theme=\"dark\"] .idea-home-material-sphere"]) assert.ok(homeCss.includes(token),token);
});


test("reference toolbar includes a working grid/list view switch and the full-width featured shelf", () => {
  assert.ok(src.includes("setViewMode(\"grid\")"));
  assert.ok(src.includes("setViewMode(\"list\")"));
  assert.ok(src.includes("viewMode === \"list\""));
  assert.ok(css.includes(".idea-material-view-toggle"));
  assert.ok(css.includes(".idea-material-grid.is-list"));
  assert.ok(css.includes("max-width: 1510px"));
  assert.ok(css.includes("padding: 20px max(24px, calc((100% - 1340px) / 2)) 32px"));
});

test("catalogue CTA reports the full source catalogue count rather than deduplicated storefront cards", () => {
  assert.match(src, /aria-label=\{\x60\$\{copy\.cta\} \(\$\{products\.length\.toLocaleString\(locale\)\}\)\x60\}/);
  assert.ok(!src.includes("results.length.toLocaleString(locale)"));
});


test("material filter overflow stays icon-only and orb styling avoids an artificial outline", () => {
  assert.ok(src.includes("<SlidersHorizontal"));
  assert.ok(css.includes(".idea-material-more-filters summary"));
  assert.ok(css.includes(".idea-material-card-media { aspect-ratio: 1.18; }"));
  assert.ok(css.includes(".idea-material-featured::before { width: 10%; }"));
  assert.ok(css.includes("border: 0"));
});


test("both storefront themes use high-contrast small copy and restrained text depth", () => {
  const globals = readFileSync(new URL("../src/styles/globals.css", import.meta.url), "utf8");
  assert.match(globals, /--idea-text-muted: #000000;/);
  assert.match(globals, /--idea-text-faint: #000000;/);
  assert.match(globals, /--idea-text: #ffffff;/);
  assert.match(globals, /--idea-text-muted: #ffffff;/);
  assert.match(globals, /--idea-text-faint: #ffffff;/);
  assert.match(globals, /--idea-readable-text-shadow: 0 1px 0/);
  assert.ok(css.includes("Approved high-contrast catalogue typography"));
  assert.ok(homeCss.includes("Product metadata stays readable"));
});
