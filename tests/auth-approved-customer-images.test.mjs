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

test("company and admin approved screens remain intact while updating customer art", () => {
  assert.match(css, /url\('\/images\/auth\/business-reference\.jpg'\)/);
  assert.match(css, /url\('\/images\/auth\/admin-reference\.jpg'\)/);
});
