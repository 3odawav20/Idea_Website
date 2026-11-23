import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const account = readFileSync("src/app/pages/AccountEntry.tsx", "utf8");
const backend = readFileSync("src/app/backend/phpAccounts.ts", "utf8");

test("customer Google login uses PHP social auth rather than a build-time provider flag", () => {
  assert.match(account, /socialProviderStatus\(\)/);
  assert.match(account, /socialReady\?\.\[provider\]!==true/);
  assert.match(account, /SOCIAL_AUTH_API\+"\?action=start&provider="/);
  assert.doesNotMatch(account, /VITE_IDEA_AUTH_PROVIDERS/);
  assert.doesNotMatch(account, /"\/oauth\/"\+provider/);
});
test("OAuth redirect stays on HTTPS same origin and is not available to public admin signup", () => {
  assert.match(account, /url\.origin!==window\.location\.origin/);
  assert.match(account, /url\.protocol!=="https:"/);
  assert.match(account, /\{isCustomer&&<div className="idea-auth-social"/);
});
test("PHP provider status must be server-confirmed JSON", () => {
  assert.match(backend, /SOCIAL_AUTH_API = "\/api\/social-auth\.php"/);
  assert.match(backend, /\?action=providers/);
  assert.match(backend, /flags\?\.google === true/);
  assert.match(backend, /ACCOUNT_API_NON_JSON/);
});
