import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("obsolete external database directory and client must not return",()=>{
  assert.equal(existsSync("supabase"),false);
  assert.equal(existsSync("src/app/backend/supabaseClient.ts"),false);
  const pkg=JSON.parse(readFileSync("package.json","utf8"));
  assert.equal(Object.hasOwn(pkg.dependencies||{},"@supabase/supabase-js"),false);
  assert.doesNotMatch(readFileSync(".env.example","utf8"),/VITE_SUPABASE/);
  assert.doesNotMatch(readFileSync("pnpm-lock.yaml","utf8"),/@supabase\\//);
  assert.doesNotMatch(readFileSync("bun.lock","utf8"),/@supabase\\//);
  assert.doesNotMatch(readFileSync("src/app/pages/ProductDetail.tsx","utf8"),/supabase|catalogue_admin_prices/i);
});
