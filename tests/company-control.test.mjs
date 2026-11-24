import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const app = read("src/app/App.tsx");
const marketplace = read("server/cpanel/api/marketplace.php");
const dashboardApi = read("src/app/backend/dashboardApi.ts");
const center = read("src/app/pages/CompanyControlCenter.tsx");
const growth = read("src/app/pages/BusinessGrowth.tsx");
const ticker = read("src/app/components/AnnouncementBar.tsx");
const search = read("src/app/pages/AdminCodeLookup.tsx");

test("business and admin dashboards use separate role-guarded routes", () => {
  assert.match(app, /ProtectedRoute roles=\{\["admin"\]\}/);
  assert.match(app, /ProtectedRoute roles=\{\["business"\]\}/);
  for (const route of [
    'path="companies" element={<CompanyControlCenter mode="admin" />}',
    'path="products" element={<CompanyControlCenter mode="supplier" />}',
    'path="sales" element={<CompanyRevenueReport mode="admin" />}',
    'path="sales" element={<CompanyRevenueReport mode="supplier" />}',
    'path="announcements" element={<AdminAnnouncementEditor />}',
    'path="advertising" element={<BusinessAdvertising mode="admin" />}',
    'path="ads" element={<BusinessAdvertising mode="supplier" />}',
    'path="search" element={<AdminCodeLookup />}',
    'path="/business/apply" element={<CompanyApplication />}',
  ]) assert.ok(app.includes(route), route);
  assert.match(center, /session\?\.role === "admin"/);
  assert.match(center, /mode === "supplier" && session\.role !== "business"/);
  assert.match(center, /PHP_MARKETPLACE_API|fetchMarketplaceBootstrap/);
});

test("company access is scoped to ownership or active staff; privileged actions remain admin-only", () => {
  assert.match(marketplace, /function mpRole\(/);
  assert.match(marketplace, /owner_id=\?\s*'?,?\s*\[\$companyId,\$u\['id'\]\]/);
  assert.match(marketplace, /idea_company_staff WHERE company_id=\? AND user_id=\? AND active=1/);
  assert.match(marketplace, /function mpNeedCompany\(array \$u,string \$companyId,bool \$ownerOnly=false\)/);
  assert.match(marketplace, /\$ownerOnly&&!in_array\(\$role,\['owner','admin'\],true\)/);
  assert.match(marketplace, /if\(!\$admin\)accountError\(403,'ADMIN_REQUIRED'\)/);
  assert.match(marketplace, /\$staff\['role'\]==='admin'/);
  assert.match(marketplace, /'scope'=>'this_company_only'/);
});

test("public product publication requires a verified company and separate platform approval", () => {
  assert.match(marketplace, /p\.active=1 AND c\.status='verified' AND m\.approved_for_storefront=1/);
  assert.match(marketplace, /if\(\$yes&&\$row\['status'\]!=='verified'\)accountError\(409,'COMPANY_NOT_VERIFIED'\)/);
  assert.match(marketplace, /'approval'=>'pending_platform_admin_review'/);
  assert.match(marketplace, /if\(\$active&&\(\$row\['status'\]!=='verified'\|\|!\(bool\)\$row\['approved_for_storefront'\]\)\)accountError\(403,'ADMIN_APPROVAL_REQUIRED'\)/);
  assert.match(marketplace, /approved_for_storefront=\?,admin_notes=\?/);
  assert.match(center, /setAdminProductApproval/);
});

test("private prices are removed from public catalogue responses and never fabricated as sales", () => {
  assert.match(marketplace, /if\(!\$authorized\)\{unset\(\$r\['private_price_cents'\],\$r\['admin_notes'\]\);\}/);
  assert.match(marketplace, /function mpSales\(/);
  assert.match(marketplace, /elseif\(\$u\['role'\]!=='admin'\)accountError\(403,'ADMIN_REQUIRED'\)/);
  assert.match(marketplace, /o\.payment_status='paid'/);
  assert.match(marketplace, /pm\.status='paid'/);
  assert.match(marketplace, /'basis'=>'captured_payments_only'/);
  assert.match(marketplace, /never treat quotes or unpaid COD as revenue/);
  assert.doesNotMatch(growth, /Math\.random/);
});

test("announcements are published only through an admin action and schedule-filtered for public use", () => {
  assert.match(marketplace, /if\(!\$all\)\$sql\.=\s*" WHERE state='published' AND \(start_at IS NULL OR start_at<=\?\) AND \(end_at IS NULL OR end_at>\?\)"/i);
  assert.match(marketplace, /if\(\$action==='ticker-save'\)[\s\S]*?if\(!\$admin\)accountError\(403,'ADMIN_REQUIRED'\)/);
  assert.match(marketplace, /\['draft','published','archived'\]/);
  assert.match(dashboardApi, /saveMarketplaceTicker/);
  assert.match(ticker, /PHP_MARKETPLACE_API|fetchMarketplaceBootstrap|ticker/);
  const header = read("src/app/components/Header.tsx");
  assert.doesNotMatch(header, /<AnnouncementBar\b|supabase/i);
});

test("admin-only code search may include private fields; public search strips them and uses metadata matching", () => {
  assert.match(marketplace, /\$admin=\$u&&\$u\['role'\]==='admin'/);
  assert.match(marketplace, /mpCatalogueRows\(\$u,\$q,'',\(bool\)\$admin,100\)/);
  assert.match(marketplace, /unset\(\$r\['private_price_cents'\],\$r\['admin_notes'\]\)/);
  assert.match(marketplace, /'metadata_comparison_not_visual_embedding'/);
  assert.match(search, /supplier_listing_private_prices|private_price_cents|searchMarketplaceCatalogue/);
  assert.match(read("src/app/pages/Products.tsx"), /similarProducts/);
  assert.match(read("src/app/pages/ProductDetail.tsx"), /similarProducts/);
});

test("ad packages remain unpublished by default; suppliers submit requests without authorizing publication", () => {
  assert.match(marketplace, /WHERE is_published=1/);
  assert.match(marketplace, /if\(\$action==='package-save'\)[\s\S]*?if\(!\$admin\)accountError\(403,'ADMIN_REQUIRED'\)/);
  assert.match(marketplace, /if\(!is_int\(\$price\).*\$published\)/);
  assert.match(marketplace, /if\(\$action==='ad-request'\)[\s\S]*?'pending'[\s\S]*?'video_requires_admin_spec_review'=>true/);
  assert.match(marketplace, /if\(\$action==='ad-review'\)[\s\S]*?if\(!\$admin\)accountError\(403,'ADMIN_REQUIRED'\)/);
  assert.match(marketplace, /'publishing_separate'=>true/);
  assert.match(dashboardApi, /saveMarketplaceAdPackage|submitMarketplaceAdRequest|reviewMarketplaceAdRequest/);
});

test("marketplace operations are routed through same-origin PHP APIs with CSRF-protected writes", () => {
  assert.equal(dashboardApi.includes('"/api/marketplace.php"'), true);
  assert.match(dashboardApi, /phpPostJson\(PHP_MARKETPLACE_API/);
  assert.match(marketplace, /accountSession\(\)/);
  assert.match(marketplace, /accountCsrf\(\)/);
  assert.match(marketplace, /accountQuery\(/);
  assert.match(marketplace, /\$_SERVER\['REQUEST_METHOD'\]/);
});
