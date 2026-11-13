import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,statSync} from "node:fs";
const css=readFileSync("src/app/pages/AccountEntry.css","utf8");
const tsx=readFileSync("src/app/pages/AccountEntry.tsx","utf8");
test("admin day and night photos are real repository assets",()=>{
  for(const photo of ["admin-day-20261113.webp","admin-night-20261113.webp"]){
    assert.ok(statSync("public/images/auth/"+photo).size>100000);
    assert.ok(css.includes("url('/images/auth/"+photo+"')"));
  }
});
test("admin never layers old Arabic artboard beneath translated text",()=>{
  assert.doesNotMatch(css,/url\('\/images\/auth\/admin-reference\.jpg'\)/);
  assert.match(tsx,/\{!isAdmin&&<div className="idea-auth-copy">/);
  assert.match(css,/\.idea-auth-scene--admin \.idea-auth-photo\{[\s\S]*?background-size:contain;/);
  assert.match(css,/\.idea-auth-scene--admin \.idea-auth-copy\{display:none\}/);
});
test("business account caption follows selected locale and page mode",()=>{
  assert.doesNotMatch(tsx,/>COMPANY REGISTRATION \(B2B\)<\/small>/);
  assert.match(tsx,/isRegister\?tr\("تسجيل شركة \(B2B\)","Company registration \(B2B\)"\):tr\("دخول الشركة \(B2B\)","Business sign in \(B2B\)"\)/);
});
test("secure same-origin PHP account API URLs are accepted on HTTPS hosts",()=>{
  assert.match(tsx,/API\.startsWith\("\/"\) && !API\.startsWith\("\/\/"\)/);
  assert.match(tsx,/window\.location\.protocol==="https:"/);
});
test("real localized admin form, authentication actions, and all locale modes remain",()=>{
  assert.match(tsx,/isAdmin\?tr\("دخول لوحة التحكم","Enter control center"\)/);
  assert.match(tsx,/onSubmit=\{e=>void onSubmit\(e\)\}/);
  assert.match(tsx,/locale==="ar"\?"rtl":"ltr"/);
});
