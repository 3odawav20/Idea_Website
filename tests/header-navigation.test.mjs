import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=(path)=>readFileSync(path,"utf8");
const header=read("src/app/components/Header.tsx");
const styles=read("src/app/components/Header.css");
const layout=read("src/app/components/Layout.tsx");
const discovery=read("src/app/components/DiscoveryNavigation.tsx");

test("Two old horizontal navigation strips are not rendered separately",()=>{
  assert.doesNotMatch(layout,/DiscoveryNavigation|idea-discovery-nav-main/);
  assert.match(header,/<dialog[\s\S]*<DiscoveryNavigation onNavigate=/);
  assert.equal((header.match(/<DiscoveryNavigation/g)||[]).length,1);
  assert.match(styles,/\.idea-navigation-drawer \.idea-discovery-nav-main\{display:flex;flex-direction:column/);
  assert.match(styles,/\.idea-navigation-drawer \.idea-discovery-nav-utility\{display:grid/);
});
test("All the original top and bottom navigation links remain accessible",()=>{
  for(const link of [
    "/about","/collections/ceramics","/collections/porcelain",
    "/products?material=tiles","/products?format=large","/products?format=outdoor20",
    "/collections/sanitary-ware","/showrooms","/downloads","/projects","/journal","/contact","/products"
  ])assert.ok(discovery.includes(link), "Missing menu link "+link);
  assert.match(discovery,/onNavigate/);
  assert.match(discovery,/aria-expanded=\{open === item\.id\}/);
  assert.match(header,/aria-controls="idea-navigation-drawer"/);
});
test("Header remains translucent and animates to legible glass on scroll",()=>{
  assert.match(header,/window\.addEventListener\("scroll", onScroll, \{ passive: true \}\)/);
  assert.match(header,/idea-reference-header--home/);
  assert.match(header,/is-scrolled/);
  assert.match(styles,/\.idea-reference-header\{[\s\S]*?position:sticky/);
  assert.match(styles,/\.idea-reference-header\.is-scrolled/);
  assert.match(styles,/\.idea-navigation-drawer\[open\]\{animation:idea-menu-drop/);
  assert.match(styles,/@media\(prefers-reduced-motion:reduce\)/);
});
test("Menu supports Arabic RTL, modal dismissal, and retained account links",()=>{
  assert.match(header,/dir=\{locale === "ar" \? "rtl" : "ltr"\}/);
  assert.match(header,/onCancel=\{\(\) => setOpen\(false\)\}/);
  assert.match(header,/onClose=\{\(\) => setOpen\(false\)\}/);
  assert.match(header,/<DiscoveryNavigation onNavigate=\{\(\) => setOpen\(false\)\}/);
  assert.match(header,/Link to=\{account\}/);
  assert.match(header,/Link to="\/room-designer\/3d"/);
  assert.match(header,/Link to="\/ai-room-visualizer"/);
});
