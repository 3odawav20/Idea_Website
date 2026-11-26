import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const auth=readFileSync("src/app/pages/Auth.tsx","utf8");
const entry=readFileSync("src/app/pages/AccountEntry.tsx","utf8");
const php=readFileSync("src/app/backend/phpAccounts.ts","utf8");
test("account entry is PHP/MySQL only and authenticates server-verified roles",()=>{
  assert.doesNotMatch(auth+entry,/supabaseClient|requireSupabase|supabase\.auth/i);
  assert.match(entry,/await authenticatePhp\(/);
  assert.match(entry,/verifiedSession\.role!==expectedRole/);
  assert.match(php,/\/api\/accounts\.php/);
  assert.match(php,/X-CSRF-Token/);
  assert.match(php,/credentials: "same-origin"/);
});
test("account errors surface and busy state is reset",()=>{
  assert.ok(entry.includes("ACCOUNT_API_NON_JSON"));
  assert.ok(entry.includes("ACCOUNT_SESSION_MISSING"));
  assert.match(entry,/setError\(messages\[reason\]\|\|reason\)/);
  assert.match(entry,/finally\{setBusy\(false\);\}/);
  assert.match(entry,/role="alert"/);
});
test("unused legacy auth project configuration and storage helper are absent",()=>{
  assert.equal(existsSync("utils/supabase/info.tsx"),false);
  assert.equal(existsSync("src/app/backend/storage.ts"),false);
});
