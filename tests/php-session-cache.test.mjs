import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source=readFileSync("src/app/backend/phpAccounts.ts","utf8");
test("CSRF endpoint bypasses hosting Nginx cache with fresh cryptographic nonce",()=>{
  assert.match(source,/const nonce = crypto\.randomUUID\(\)/);
  assert.match(source,/action=session&nonce=/);
  assert.match(source,/encodeURIComponent\(nonce\)/);
  assert.match(source,/credentials:"same-origin", cache:"no-store"/);
  assert.match(source,/"Cache-Control": "no-cache, no-store"/);
});
