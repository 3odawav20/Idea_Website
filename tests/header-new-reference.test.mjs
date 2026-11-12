import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const header = readFileSync("src/app/components/Header.tsx", "utf8");
const css = readFileSync("src/app/components/Header.css", "utf8");
const layout = readFileSync("src/app/components/Layout.tsx", "utf8");
const navigation = readFileSync("src/app/components/DiscoveryNavigation.tsx", "utf8");
const home = readFileSync("src/app/pages/Home.tsx", "utf8");

test("New Header: one opaque black bar with logo, ticker and account icons", () => {
  assert.match(header, /idea-reference-header-row/);
  assert.match(header, /<IdeaLogo compact \/>/);
  assert.match(header, /idea-reference-ticker/);
  assert.match(header, /idea-reference-actions/);
  assert.match(header, /idea-menu-btn/);
  assert.match(css, /--idea-header-height:52px/);
  assert.match(css, /background:#090909/);
  assert.doesNotMatch(layout, /<DiscoveryNavigation/);
});

test("New Header: hero starts below the bar, without legacy white navigation", () => {
  assert.match(css, /\.idea-reference-header--home\{margin-bottom:0\}/);
  assert.doesNotMatch(css, /margin-bottom:calc\(-1 \* var\(--idea-header-height\)\)/);
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
  assert.match(css, /\.idea-navigation-drawer\[open\]\{animation:idea-menu-drop/);
});

test("New Header: iPhone, iPad, wide desktop and motion preferences", () => {
  assert.match(css, /@media\(max-width:1200px\)/);
  assert.match(css, /@media\(max-width:900px\)/);
  assert.match(css, /@media\(max-width:680px\)/);
  assert.match(css, /@media\(max-width:375px\)/);
  assert.match(css, /safe-area-inset-left/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /100dvh/);
  assert.match(css, /@supports not \(height:100dvh\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /min-height:44px/);
  assert.match(header, /dir=\{locale === "ar" \? "rtl" : "ltr"\}/);
});

test("Header does not call Supabase; real admin ticker needs existing MySQL contract", () => {
  assert.doesNotMatch(header, /supabase|<AnnouncementBar\b/i);
  assert.match(header, /PHP\/MySQL/);
  assert.match(header, /idea-catalogue-announcement/);
});
