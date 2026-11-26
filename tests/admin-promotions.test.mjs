import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mysql=readFileSync("server/cpanel/migrations/20261103_idea_marketplace_mysql.sql","utf8");
const screen=readFileSync("src/app/pages/AdminPromotions.tsx","utf8");
const routes=readFileSync("src/app/App.tsx","utf8");
const admin=readFileSync("src/app/pages/AdminStudio.tsx","utf8");
const php=readFileSync("server/cpanel/api/marketplace.php","utf8");
const api=readFileSync("src/app/backend/dashboardApi.ts","utf8");

test("MySQL private price metadata is scoped by PHP authorization",()=>{
  assert.match(mysql,/CREATE TABLE IF NOT EXISTS idea_marketplace_product_meta/);
  assert.match(mysql,/private_price_cents BIGINT UNSIGNED NULL/);
  assert.match(mysql,/UNIQUE KEY uq_idea_company_product_code\(company_id,product_code\)/);
  assert.match(php,/if\(!\$authorized\)\{unset\(\$r\['private_price_cents'\],\$r\['admin_notes'\]\);\}/);
  assert.match(php,/mpNeedCompany\(\$u,\$company\);\s*mpOut\(\['products'=>mpCatalogueRows/);
});
test("admin-only private price review cannot publish a draft or mutate storefront records",()=>{
  assert.match(screen,/session\?\.role\s*!==\s*"admin"/);
  assert.match(screen,/fetchMarketplaceBootstrap\(\)/);
  assert.match(screen,/fetchCompanyProducts\(c\.id\)/);
  assert.match(screen,/private_price_cents/);
  assert.match(screen,/product\.approved_for_storefront/);
  assert.match(api,/phpGet\(PHP_MARKETPLACE_API, "products", \{ company_id: companyId \}\)/);
  assert.match(php,/mpNeedCompany\(\$u,\$company\);\s*mpOut\(\['products'=>mpCatalogueRows/);
  assert.match(php,/if\(!\$authorized\)\{unset\(\$r\['private_price_cents'\],\$r\['admin_notes'\]\);\}/);
  assert.match(php,/p.active=1 AND c.status='verified' AND m.approved_for_storefront=1/);
  assert.doesNotMatch(screen,/saveCompanyProduct|approveCompanyProduct|phpPostJson/);
  assert.doesNotMatch(screen,/localStorage\.setItem|public\.catalogue_admin_promotions|service_role/i);
  assert.match(routes,/<Route element=\{<ProtectedRoute roles=\{\["admin"\]\} \/>/);
  assert.match(routes,/<Route path="promotions" element=\{<AdminPromotions \/>/);
  assert.match(admin,/\/admin\/promotions/);
});
test("catalogue target matches 2,000 verified products per category",()=>{
  assert.match(admin,/const (?:MIN|TARGET)_PER_MATERIAL\s*=\s*2000\s*;/);
  assert.match(admin,/8,000 total target/);
  assert.doesNotMatch(admin,/6,000 total minimum|Minimum 1,500 individually verified/);
});
