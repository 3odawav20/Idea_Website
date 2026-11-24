import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const screen = read("src/app/pages/AdminPromotions.tsx");
const routes = read("src/app/App.tsx");
const admin = read("src/app/pages/AdminStudio.tsx");
const marketplace = read("server/cpanel/api/marketplace.php");
const api = read("src/app/backend/dashboardApi.ts");

test("admin-only supplier pricing stays behind the PHP session role gate", () => {
  assert.match(screen, /session\?\.role !== "admin"/);
  assert.match(screen, /fetchMarketplaceBootstrap/);
  assert.match(screen, /fetchCompanyProducts/);
  assert.match(screen, /private_price_cents/);
  assert.match(screen, /Private Supplier Prices/);
  assert.match(screen, /never exposed on the public storefront/);
  assert.doesNotMatch(screen, /localStorage\.setItem|service_role|catalogue_admin_promotions/);
  assert.match(routes, /<Route element=\{<ProtectedRoute roles=\{\["admin"\]\} \/>/);
  assert.match(routes, /<Route path="promotions" element=\{<AdminPromotions \/>/);
  assert.match(admin, /\/admin\/promotions/);
  assert.match(api, /fetchCompanyProducts/);
});

test("supplier prices and draft listings cannot publish themselves", () => {
  assert.match(marketplace, /if\(!\$authorized\)\{unset\(\$r\['private_price_cents'\],\$r\['admin_notes'\]\);\}/);
  assert.match(marketplace, /'approval'=>'pending_platform_admin_review'/);
  assert.match(marketplace, /if\(\$active&&\(\$row\['status'\]!=='verified'\|\|!\(bool\)\$row\['approved_for_storefront'\]\)\)accountError\(403,'ADMIN_APPROVAL_REQUIRED'\)/);
  assert.match(marketplace, /p\.active=1 AND c\.status='verified' AND m\.approved_for_storefront=1/);
  assert.doesNotMatch(screen, /public\.catalogue_admin_promotions|promotion-publish/);
});

test("catalogue release target remains 2,000 verified products for each of four materials", () => {
  assert.match(admin, /const MIN_PER_MATERIAL = 2000/);
  assert.match(admin, /8,000 total target/);
  assert.match(admin, /4 × 2,000 verified products/);
  assert.doesNotMatch(admin, /6,000 total minimum|Minimum 1,500 individually verified/);
});
