import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ownerMatte = readFileSync("src/styles/owner-matte.css", "utf8");
const smoked = readFileSync("public/assets/idea-smoked-glass-20261124.css", "utf8");
const subscriptions = readFileSync("src/app/pages/Subscriptions.tsx", "utf8");
const collections = readFileSync("src/app/pages/Collections.tsx", "utf8");
const productCard = readFileSync("src/app/components/ProductCard.tsx", "utf8");

test("unified header-glass cards define balanced optical blur, visible borders, subtle elevation and inner tab contrast in both themes", () => {
  assert.match(ownerMatte, /html\[data-theme="light"\]\s*\{[\s\S]*?--idea-card-blur:\s*22px;/);
  assert.match(ownerMatte, /html\[data-theme="light"\]\s*\{[\s\S]*?--idea-card-sat:\s*1\.35;/);
  assert.match(ownerMatte, /html\[data-theme="dark"\]\s*\{[\s\S]*?--idea-card-blur:\s*22px;/);
  assert.match(ownerMatte, /html\[data-theme="dark"\]\s*\{[\s\S]*?--idea-card-sat:\s*1\.35;/);

  // Visible rims & subtle depth shadows in both light and dark
  assert.match(ownerMatte, /--idea-glass-rim:\s*inset/);
  assert.match(ownerMatte, /--idea-glass-depth:/);
  assert.match(ownerMatte, /backdrop-filter:\s*blur\(var\(--idea-card-blur\)\)\s+saturate\(var\(--idea-card-sat\)\)/);

  // Inner tab trays & active tabs have dedicated contrast rims
  assert.match(ownerMatte, /--idea-gt-tray-rim:/);
  assert.match(ownerMatte, /--idea-gt-active-rim:/);

  // Dark smoked-glass stylesheet stays harmonized with airy dark frosted glass (not muddy black)
  assert.match(smoked, /--idea-glass-card-bg:\s*rgba\(255,\s*255,\s*255,\s*\.068\)/);
  assert.match(smoked, /--idea-glass-edge:\s*rgba\(255,\s*255,\s*255,\s*\.17\)/);
});

test("hero/home and non-hero page cards are wired into the unified header-glass card system", () => {
  const requiredSelectors = [
    ".idea-usp > a",
    ".idea-discovery-search",
    ".idea-home-featured-card",
    ".idea-home-resource-grid > a",
    ".idea-destination-grid > a",
    ".idea-home-journal > a",
    ".idea-home-newsletter",
    ".idea-material-featured-card",
    ".idea-material-card",
    ".idea-product-card",
    ".idea-plan-card",
    ".idea-collection-card",
    ".idea-legal-hub-card",
    ".idea-dash-kpi",
    ".ids-panel",
  ];
  for (const sel of requiredSelectors) {
    assert.ok(ownerMatte.includes(sel), `owner-matte.css must cover ${sel}`);
  }

  assert.match(subscriptions, /className=\{`idea-plan-card glass-card/);
  assert.match(collections, /className="idea-collection-card"/);
  assert.match(collections, /className="idea-collection-card-caption"/);
  assert.match(productCard, /className="idea-product-card idea-material-sheet glass-card"/);
});
