import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('glass-tabs.css is imported globally and implements borderless real optical glass + .glass-card hover scale', () => {
  const indexCss = read('src/styles/index.css');
  assert.match(indexCss, /@import\s+['"]\.\/glass-tabs\.css['"];/, 'index.css must import glass-tabs.css');

  const css = read('src/styles/glass-tabs.css');

  // Optical glass fundamentals: backdrop-filter + webkit prefix, borderless transparent tabs & editable inputs
  assert.match(css, /backdrop-filter:\s*blur\(var\(--idea-gt-blur\)\)\s+saturate\(/);
  assert.match(css, /-webkit-backdrop-filter:\s*blur\(var\(--idea-gt-blur\)\)\s+saturate\(/);
  assert.match(css, /backdrop-filter:\s*blur\(var\(--idea-gt-input-blur\)\)\s+saturate\(/);
  assert.match(css, /\.glass-card\s*\{[\s\S]*?transition:/);
  assert.match(css, /\.glass-card:hover\s*\{[\s\S]*?transform:\s*scale\(/);

  // Both light and dark themes explicitly defined
  assert.match(css, /\[data-theme="light"\]/);
  assert.match(css, /\[data-theme="dark"\]/);

  // Accessibility, fallbacks, reduced motion
  assert.match(css, /@supports\s+not\s+\(\(backdrop-filter:\s*blur\(2px\)\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /:focus-visible/);
});

test('glass-tabs.css targets every tab bar and tab control across IDEA', () => {
  const css = read('src/styles/glass-tabs.css');
  const requiredSelectors = [
    '.idea-glass-tablist',
    '.idea-glass-tab',
    '[role="tablist"]',
    '[role="tab"]',
    '.idea-discovery-tabs',
    '.idea-chip',
    '.idea-catalogue-pagination button',
    '.idea-product-section-nav',
    '.idea-material-face-selector',
    '.idea-studio-view-tabs',
    '.idea-studio-choice',
    '.idea-atlas-categories',
    '.idea-room3d-material-tabs',
    '.idea-room3d-pills',
    '.idea-lighting-segments',
    '.idea-dash-nav',
    '.idea-admin-tabs',
    '.ids-navlink',
    '.icc-brands',
    '.idea-header-languages',
    '.idea-sf-swatch',
  ];

  for (const selector of requiredSelectors) {
    assert.ok(css.includes(selector), `glass-tabs.css must style ${selector}`);
  }
});

test('TSX tab components wire idea-glass-tab classes without opaque inline overrides', () => {
  const uiTsx = read('src/app/components/ui.tsx');
  assert.match(uiTsx, /className=\{`idea-glass-tab idea-chip\$\{active \? " is-active" : ""\}`\}/);
  assert.match(uiTsx, /aria-pressed=\{Boolean\(active\)\}/);

  const productsTsx = read('src/app/pages/Products.tsx');
  assert.match(productsTsx, /className="idea-glass-tablist idea-glass-tablist--wrap"/);

  const subsTsx = read('src/app/pages/Subscriptions.tsx');
  assert.match(subsTsx, /className="idea-glass-tablist"\s+role="tablist"/);
  assert.match(subsTsx, /role="tab"/);
  assert.match(subsTsx, /className=\{`idea-glass-tab\$\{interval === x \? " is-active" : ""\}`\}/);

  const dashTsx = read('src/app/components/dash.tsx');
  assert.match(dashTsx, /className=\{`idea-dash-rail\$\{mobileOpen \? " is-open" : ""\}`\}/);
  assert.match(dashTsx, /className="idea-dash-nav idea-glass-tablist idea-glass-tablist--vertical"/);
  assert.match(dashTsx, /idea-glass-tab idea-dash-tab/);

  const adminTsx = read('src/app/pages/Admin.tsx');
  assert.match(adminTsx, /className="idea-admin-tabs idea-glass-tablist"/);

  const surfaceStylesTsx = read('src/app/pages/SurfaceStyles.tsx');
  assert.match(surfaceStylesTsx, /idea-sf-swatches idea-glass-tablist/);
  assert.match(surfaceStylesTsx, /idea-sf-swatch idea-glass-tab/);
  assert.doesNotMatch(surfaceStylesTsx, /\.idea-sf-swatch:hover[\s\S]*!important/);
});
