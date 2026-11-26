import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("obsolete external database directory and client must not return",()=>{
  assert.equal(existsSync("supabase"),false);
  assert.equal(existsSync("src/app/backend/supabaseClient.ts"),false);
  assert.equal(existsSync("server/cpanel/api/visualize.php"),false);
  assert.doesNotMatch(readFileSync("server/cpanel/idea-accounts-api/visualize.php","utf8"),/IDEA_SUPABASE_URL|supabaseUrl|auth\/v1\/user/i);
  const pkg=JSON.parse(readFileSync("package.json","utf8"));
  assert.equal(Object.hasOwn(pkg.dependencies||{},"@supabase/supabase-js"),false);
  assert.equal(readFileSync(".env.example","utf8").includes("VITE_SUPABASE"),false);
  assert.equal(readFileSync("pnpm-lock.yaml","utf8").includes("@supabase/"),false);
  assert.equal(existsSync("bun.lock"),false);
  for (const file of ["firebase-applet-config.json","firebase-blueprint.json","firestore.rules","src/lib/firebase-admin.ts","src/middleware/auth.ts","src/db","server.ts","utils/supabase"]) assert.equal(existsSync(file),false,file);
  assert.doesNotMatch(JSON.stringify(pkg.dependencies),/firebase|supabase/i);
  assert.doesNotMatch(readFileSync("pnpm-lock.yaml","utf8"),/firebase|supabase/i);
  assert.doesNotMatch(readFileSync("src/app/pages/ProductDetail.tsx","utf8"),/supabase|catalogue_admin_prices/i);
});
