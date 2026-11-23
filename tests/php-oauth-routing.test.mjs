import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(path,"utf8");

test("OAuth callback waits for server-side session hydration", () => {
  const app=read("src/app/App.tsx");
  const backend=read("src/app/backend/db.tsx");
  assert.match(app,/const \{ session, loading \} = useBackend\(\)/);
  assert.match(app,/if \(loading\) return/);
  assert.ok(app.indexOf("if (loading) return") < app.indexOf("if (!session) return <Navigate"));
  assert.match(backend,/getPhpSession\(\)/);
  assert.match(backend,/refresh\(\)\.finally\(\(\) => setLoading\(false\)\)/);
});
test("Dashboard children cannot redirect while OAuth session is loading", () => {
  const customer=read("src/app/pages/Account.tsx");
  const business=read("src/app/pages/Business.tsx");
  assert.doesNotMatch(customer,/if \(!session\) nav\("\/login"\)/);
  assert.doesNotMatch(business,/if \(!session\) nav\("\/login"\)/);
});
test("Wrong account role routes to its own dashboard", () => {
  const app=read("src/app/App.tsx");
  assert.match(app,/session\.role === "admin" \? "\/admin"/);
  assert.match(app,/session\.role === "business" \? "\/business"/);
  assert.match(app,/return <Navigate to=\{ownDashboard\} replace/);
});
