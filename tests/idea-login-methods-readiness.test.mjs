import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const entry = readFileSync("src/app/pages/AccountEntry.tsx","utf8");
const social = readFileSync("src/app/components/AccountSocialMethods.tsx","utf8");
const php = readFileSync("server/cpanel/idea-accounts-api/auth/providers/index.php","utf8");

test("customer and supplier pages share actual server-checked methods; admin has no public enrollment",()=>{
  assert.match(entry,/import \{ AccountSocialMethods \}/);
  assert.match(entry,/!isAdmin\s*&&\s*<AccountSocialMethods audience=\{audience\}/);
  assert.match(social,/if \(audience === "admin"\) return null/);
  assert.match(social,/mode === "register" && !consent/);
});

test("Google, Facebook and phone OTP are explicit, fail-closed until PHP backend verifies readiness",()=>{
  assert.match(social,/id: "google"/);
  assert.match(social,/id: "apple"/);
  assert.match(social,/id: "facebook"/);
  assert.match(social,/PROVIDERS\.slice\(0,3\)\.map\(renderProvider\)/);
  assert.match(social,/PROVIDERS\.slice\(3\)\.map\(renderProvider\)/);
  assert.match(social,/will not work until official provider setup/);
  assert.match(social,/phoneReady/);
  assert.match(social,/setReady\(new Set\(\)\)/);
  assert.match(social,/setPhoneReady\(false\)/);
  assert.match(social,/status\.phone === true/);
  assert.match(social,/Array\.isArray\(status\.providers\)/);
  assert.match(social,/disabled=\{!isReady \|\| busy\}/);
  assert.match(social,/disabled=\{!phoneReady \|\| busy\}/);
});

test("provider readiness accepts no unverified claim and never leaks identity secrets",()=>{
  assert.match(php,/\$providers = \[\];/);
  assert.match(php,/\$phone = false;/);
  assert.match(php,/bridge_verified/);
  assert.match(php,/e2e_verified/);
  assert.match(php,/\$bridgeReady/);
  assert.match(php,/is_file\(\$handler\) && is_file\(\$callback\)/);
  assert.match(php,/\$phoneHandlersPresent/);
  assert.doesNotMatch(php,/echo.*client_secret/i);
});

test("canonical paths do not rely on Apache directory redirects for OAuth/OTP",()=>{
  assert.match(social,/\/auth\/providers\//);
  assert.match(social,/\/auth\/phone\/start\//);
  assert.match(social,/\/auth\/phone\/verify\//);
  assert.match(social,/\/oauth\//);
  assert.match(social,/credentials: "include"/);
  assert.match(social,/redirect: "error"/);
});

test("phone verification never trusts client role; PHP/MySQL server confirmation required",()=>{
  assert.match(social,/result\.ok !== true/);
  assert.match(social,/Server did not confirm an eligible account role/);
  assert.match(social,/result\.role === "buyer" \? "customer"/);
  assert.match(social,/result\.role === "supplier" \? "business"/);
  assert.match(social,/\["customer","business"\]\.includes/);
  assert.match(entry,/data\.role==="buyer"\?"customer"/);
  assert.match(entry,/data\.role==="supplier"\?"business"/);
  assert.match(entry,/window\.location\.protocol==="https:"/);
  assert.match(social,/const E164 =/);
  assert.doesNotMatch(social,/supabase\.auth/);
});
