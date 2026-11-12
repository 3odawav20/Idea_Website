import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const social = readFileSync("src/app/components/AccountSocialMethods.tsx", "utf8");
const entry = readFileSync("src/app/pages/AccountEntry.tsx", "utf8");
const css = readFileSync("src/app/pages/AccountEntry.css", "utf8");

test("all five OAuth providers and phone use customer, business and admin entry pages", () => {
  for (const provider of ["google", "apple", "facebook", "twitter", "azure"])
    assert.ok(social.includes('id: "' + provider + '"'), provider);
  assert.match(social, /idea-auth-provider--phone/);
  assert.match(entry, /<AccountSocialMethods audience=\{audience\} mode=\{mode\} api=\{API\} consent=\{consent\}/);
  assert.doesNotMatch(entry, /showSocial\(/);
});
test("unauthorized providers are disabled and never silently bypass the PHP account backend", () => {
  assert.match(social, /\/auth\/providers/);
  assert.match(social, /disabled=\{!isReady \|\| busy\}/);
  assert.match(social, /disabled=\{!phoneReady \|\| busy\}/);
  assert.match(social, /credentials: "include"/);
  assert.match(social, /status\.phone === true/);
  assert.doesNotMatch(social, /localStorage\.setItem|sessionStorage\.setItem/);
  assert.doesNotMatch(social, /signInWithOAuth|supabase/);
});
test("registration honors consent and all entry animations honor reduced motion", () => {
  assert.match(social, /"customer" \| "business" \| "admin"/);
  assert.match(social, /mode === "register" && !consent/);
  assert.match(social, /result\.ok !== true/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /idea-auth-copy-enter/);
});

test("entry source contains no accidental replacement markers", () => {
  assert.doesNotMatch(entry, /old social config/);
  assert.doesNotMatch(entry, /showSocial\(/);
});
