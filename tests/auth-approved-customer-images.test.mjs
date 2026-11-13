import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

const css = readFileSync("src/app/pages/AccountEntry.css", "utf8");
const customer = readFileSync("src/app/pages/AccountEntry.tsx", "utf8");

test("customer approved night and day images exist with full lossless raster content", () => {
  const night = "public/images/auth/customer-night.webp";
  const day = "public/images/auth/customer-day.webp";
  for (const path of [night, day]) {
    assert.ok(statSync(path).size > 100_000, path + " must not be placeholder art");
  }
  assert.match(css, /background-image:url\('\/images\/auth\/customer-night\.webp'\)/);
  assert.match(css, /background-image:url\('\/images\/auth\/customer-day\.webp'\)/);
});

test("never distort supplied customer photographs or display old fake reference screenshot", () => {
  assert.match(css, /\.idea-auth-scene--customer \.idea-auth-photo\s*\{[^}]*background-size:cover/s);
  assert.doesNotMatch(css, /url\('\/images\/auth\/customer-reference\.jpg'\)/);
  assert.doesNotMatch(css, /background-size:\s*100%\s+100%/);
  assert.match(css, /\.idea-auth-scene--customer\.idea-auth-scene--light \.idea-auth-photo/);
});

test("customer account remains real HTML: inputs and submit, not a screenshot clickmap", () => {
  assert.match(customer, /<form className="idea-auth-panel" onSubmit=/);
  assert.match(customer, /<input id="auth-password"/);
  assert.match(customer, /<button className="idea-auth-submit" type="submit"/);
});

test("company registration uses the approved factory photos for both themes, with no image crop", () => {
  for (const name of ["business-night-20261112.webp", "business-day-20261112.webp"]) {
    const path = "public/images/auth/" + name;
    assert.ok(statSync(path).size > 100_000, path + " must contain the provided full photo");
    assert.ok(css.includes("url('/images/auth/" + name + "')"));
  }
  assert.match(css, /\.idea-auth-scene--business \.idea-auth-photo,[\s\S]*?background-size:contain;/);
  assert.doesNotMatch(css, /background:[^\n]*url\('\/images\/auth\/business-reference\.jpg'\)/);
  assert.doesNotMatch(css, /url\('\/images\/auth\/admin-reference\.jpg'\)/);
  assert.ok(css.includes("url('/images/auth/admin-day-20261113.webp')"));
  assert.ok(css.includes("url('/images/auth/admin-night-20261113.webp')"));
});
test("company registration form uses true translucent glass while keeping real inputs", () => {
  assert.match(css, /\.idea-auth-scene--business \.idea-auth-panel-wrap::before/);
  assert.match(css, /\.idea-auth-scene--business \.idea-auth-panel\s*\{[\s\S]*?backdrop-filter:blur\(22px\)/);
  assert.match(css, /\.idea-auth-scene--business \.idea-auth-copy\s*\{[\s\S]*?backdrop-filter:blur\(17px\)/);
  assert.doesNotMatch(css, /html\[lang="ar"\] \.idea-auth-scene:not\(\.idea-auth-scene--customer\)/);
});
