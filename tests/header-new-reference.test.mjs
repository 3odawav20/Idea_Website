import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const header = readFileSync("src/app/components/Header.tsx", "utf8");
const css = readFileSync("src/app/components/Header.css", "utf8");
const layout = readFileSync("src/app/components/Layout.tsx", "utf8");
const navigation = readFileSync("src/app/components/DiscoveryNavigation.tsx", "utf8");
const home = readFileSync("src/app/pages/Home.tsx", "utf8");

test("New Header: one transparent borderless blurred glass bar with logo, ticker and account icons", () => {
  assert.match(header, /idea-reference-header-row/);
  assert.match(header, /<IdeaLogo compact \/>/);
  assert.match(header, /idea-reference-ticker/);
  assert.match(header, /idea-reference-actions/);
  assert.match(header, /idea-menu-btn/);
  assert.match(css, /--idea-header-height:\s*52px/);
  assert.match(css, /background:\s*transparent/);
  assert.match(css, /border:\s*0/);
  assert.match(css, /backdrop-filter:\s*blur\(/);
  assert.doesNotMatch(css, /background:\s*#090909/);
  assert.doesNotMatch(layout, /<DiscoveryNavigation/);
});

test("New Header: seamlessly overlays full-bleed hero without solid fill or borders", () => {
  assert.match(header, /idea-reference-header--overlay/);
  assert.match(css, /\.idea-reference-header--overlay\s*\{[\s\S]*?margin-bottom:\s*calc\(-1 \* var\(--idea-header-height\)\)/);
  assert.match(home, /<HeroBrandFilm \/>/);
  assert.doesNotMatch(home, /<HeroCarousel \/>/);
});

test("New Header: all links remain inside accessible hamburger dialog", () => {
  assert.match(header, /aria-controls="idea-navigation-drawer"/);
  assert.match(header, /aria-haspopup="dialog"/);
  assert.match(header, /onCancel=\{\(\) => setOpen\(false\)\}/);
  assert.match(header, /<DiscoveryNavigation onNavigate=\{\(\) => setOpen\(false\)\}/);
  for (const route of ["/showrooms","/downloads","/projects","/journal","/contact","/products"]) {
    assert.ok(navigation.includes(route), route);
  }
  assert.match(css, /\.idea-navigation-drawer\[open\]\s*\{[\s\S]*?animation:\s*idea-menu-drop/);
});

test("New Header: iPhone, iPad, wide desktop and motion preferences", () => {
  assert.match(css, /@media\s*\(max-width:\s*1200px\)/);
  assert.match(css, /@media\s*\(max-width:\s*900px\)/);
  assert.match(css, /@media\s*\(max-width:\s*680px\)/);
  assert.match(css, /@media\s*\(max-width:\s*375px\)/);
  assert.match(css, /safe-area-inset-left/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /100dvh/);
  assert.match(css, /@supports not \(height:\s*100dvh\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(header, /dir=\{locale === "ar" \? "rtl" : "ltr"\}/);
});

test("Header does not call Supabase; real admin ticker needs existing MySQL contract", () => {
  assert.doesNotMatch(header, /supabase|<AnnouncementBar\b/i);
  assert.match(header, /PHP\/MySQL/);
  assert.match(header, /idea-catalogue-announcement/);
});
