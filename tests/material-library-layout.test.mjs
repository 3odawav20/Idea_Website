import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/app/pages/MaterialCatalogue.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/app/pages/MaterialCatalogue.css", import.meta.url), "utf8");
const home = readFileSync(new URL("../src/app/pages/Home.tsx", import.meta.url), "utf8");
const orb = readFileSync(new URL("../src/app/components/MaterialOrb.css", import.meta.url), "utf8");

test("material browsing retains sourced faces and marketplace actions", () => {
  for (const name of [
    "localMaterialFace(product.id)",
    "product.source?.original?.tiles?.[0]",
    "toggleFavorite(product.id)",
    "toggleCompare(product.id)",
    "addToQuote(product.id, unit)",
    "/ai-room-visualizer?product=",
    "distinctStorefrontProducts(filtered)",
  ]) assert.ok(src.includes(name), name);
});

test("material browsing keeps URL filters, tabs, pagination and responsive layouts", () => {
  for (const name of [
    'params.get("usage")',
    'params.get("texture")',
    'params.get("brand")',
    '<details className="idea-material-facet"',
    "<summary>{label}",
    "aria-current={number === page ? "page" : undefined}",
  ]) assert.ok(src.includes(name), name);
  assert.ok(src.includes('<input type="checkbox" checked={value === item}'), "filter options remain selectable");
  assert.ok(css.includes(".idea-material-catalogue-layout"), "catalogue layout remains responsive");
  assert.ok(css.includes(".idea-material-featured-grid"), "featured material row is present");
  assert.ok(css.includes("repeat(2,minmax(0,1fr))"));
  assert.ok(css.includes('[data-theme="dark"]'));
});

test("material cards preserve reference text order and keep actions intact", () => {
  const card = src.slice(src.indexOf("function MaterialCard("));
  const maker = card.indexOf('<div className="idea-material-maker">');
  const name = card.indexOf('<Link className="idea-material-name-pill"');
  const meta = card.indexOf('<div className="idea-material-meta">');
  const quote = card.indexOf('className="idea-material-quote"');
  const visualize = card.indexOf('className="idea-material-visualize"');
  assert.ok(maker >= 0 && maker < name && name < meta && meta < quote && quote < visualize,
    "brand, name, dimensions/reference and both actions remain in the requested order");
});

test("shared material orbs have dimensional lighting, motion and reduced-motion support", () => {
  for (const token of [
    "idea-surface-orb-float",
    "idea-surface-orb-shine",
    "perspective: 1100px",
    "translate3d(0,-7px,16px)",
    '[data-theme="dark"] .idea-surface-orb',
    '[data-theme="light"] .idea-surface-orb',
    "prefers-reduced-motion: reduce",
  ]) assert.ok(orb.includes(token), token);
  assert.ok(src.includes('<MaterialOrb src={image} alt="" className="idea-surface-orb--catalogue" />'));
  assert.ok(home.includes('<MaterialOrb src={image} alt="" className="idea-surface-orb--home" />'));
});

test("featured materials and homepage use the same supplier-face sphere presentation", () => {
  assert.ok(src.includes("distinctStorefrontProducts(products).slice(0, 4)"));
  assert.ok(src.includes("<FeaturedMaterialCard"));
  assert.ok(src.includes("localMaterialFace(product.id) || product.source?.original?.tiles?.[0] || product.image"));
  assert.ok(home.includes("localMaterialFace(product.id) || product.source?.original?.tiles?.[0] || product.image"));
  assert.ok(home.includes("idea-home-featured-actions"));
  assert.ok(home.includes("ideaInternalCode(product)"));
  assert.ok(home.includes("addToQuote(product.id, unit)"));
});
