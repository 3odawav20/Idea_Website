import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
const app=read("src/app/App.tsx");
const center=read("src/app/pages/CompanyControlCenter.tsx");
const growth=read("src/app/pages/BusinessGrowth.tsx");
const auth=read("src/app/components/SocialAuth.tsx");
const search=read("src/app/pages/AdminCodeLookup.tsx");
const php=read("server/cpanel/api/marketplace.php");
const api=read("src/app/backend/dashboardApi.ts");
const mysql=read("server/cpanel/migrations/20261103_idea_marketplace_mysql.sql");

test("business company and admin routes are separate, role-guarded and navigable",()=>{
  assert.match(app, /ProtectedRoute roles=\{\["admin"\]\}/);
  assert.match(app, /ProtectedRoute roles=\{\["business"\]\}/);
  for(const route of [
    'path="companies" element={<CompanyControlCenter mode="admin" />}',
    'path="products" element={<CompanyControlCenter mode="supplier" />}',
    'path="sales" element={<CompanyRevenueReport mode="admin" />}',
    'path="sales" element={<CompanyRevenueReport mode="supplier" />}',
    'path="announcements" element={<AdminAnnouncementEditor />}',
    'path="advertising" element={<BusinessAdvertising mode="admin" />}',
    'path="ads" element={<BusinessAdvertising mode="supplier" />}',
    'path="search" element={<AdminCodeLookup />}',
    'path="/business/apply" element={<CompanyApplication />}'
  ])assert.ok(app.includes(route),route);
  assert.match(center,/session\.role\s*!==\s*"business"/);
  assert.match(center,/submitCompanyVerification\(/);
  assert.match(php,/function mpNeedCompany/);
  assert.match(php,/COMPANY_ACCESS_DENIED/);
});
test("company owner cannot grant platform admin or suspend another company",()=>{
  assert.match(php,/if\(!\$role\|\|\(\$ownerOnly&&!in_array\(\$role,\['owner','admin'\],true\)\)\)accountError\(403,'COMPANY_ACCESS_DENIED'\)/);
  assert.match(php,/if\(!\$staff\|\|\$staff\['role'\]==='admin'\)accountError/);
  assert.match(php,/if\(\$action==='company-suspend'\|\|\$action==='company-status'\)\{\s*if\(!\$admin\)accountError\(403,'ADMIN_REQUIRED'\)/);
  assert.match(mysql,/UNIQUE KEY uq_idea_company_staff\(company_id,user_id\)/);
});
test("listing publication is platform admin-controlled, not merely active flag",()=>{
  assert.match(mysql,/approved_for_storefront TINYINT\(1\) NOT NULL DEFAULT 0/);
  assert.match(php,/p.active=1 AND c.status='verified' AND m.approved_for_storefront=1/);
  assert.match(php,/ADMIN_APPROVAL_REQUIRED/);
  assert.match(center,/approved_for_storefront/);
});
test("private prices and promotions never public; no fabricated sales",()=>{
  assert.match(mysql,/private_price_cents BIGINT UNSIGNED NULL/);
  assert.match(php,/if\(!\$authorized\)\{unset\(\$r\['private_price_cents'\],\$r\['admin_notes'\]\);\}/);
  assert.match(growth,/fetchConfirmedSales\(period, id\)/);
  assert.match(growth,/const id = companies\.some/);
  assert.match(api,/phpGet\(PHP_MARKETPLACE_API, "sales", \{ month, company_id: companyId \}\)/);
  assert.match(php,/if\(\$company!==\x27\x27\)mpNeedCompany\(\$u,\$company\)/);
  assert.match(php,/o\.payment_status=\x27paid\x27/);
  assert.match(php,/pm\.status=\x27paid\x27/);
  assert.match(php,/COUNT\(DISTINCT oi\.order_id\)/);
  assert.match(php,/refund_accounting.*separate_reconciliation_required/);
  assert.match(growth,/Not reconciled/);
  assert.match(growth,/لا يتم اختلاق أرقام من عروض الأسعار/);
  assert.doesNotMatch(growth,/Math\.random/);
});
test("public announcements are read from the PHP/MySQL ticker contract",()=>{
  assert.ok(growth.includes("saveMarketplaceTicker("));
  assert.ok(growth.includes('state: "draft"'));
  assert.ok(php.includes("state='published' AND (start_at IS NULL OR start_at<=?)"));
  assert.ok(php.includes("if($action==='ticker-save'){"));
  assert.ok(php.includes("if($action==='ticker'&&$method==='GET')"));
  assert.ok(mysql.includes("CREATE TABLE IF NOT EXISTS idea_marketplace_announcements"));
  assert.ok(api.includes("export async function fetchPublicMarketplaceTicker"));
  assert.ok(api.includes('phpGet(PHP_MARKETPLACE_API, "ticker")'));
  const header = read("src/app/components/Header.tsx");
  assert.ok(header.includes("fetchPublicMarketplaceTicker"));
  assert.ok(header.includes("idea-catalogue-announcement"));
  assert.doesNotMatch(header,/supabase/i);
  assert.match(read("src/app/components/Header.css"),/position:\s*sticky/);
});
test("MySQL ad requests remain available without dormant external media placements",()=>{
  const home = read("src/app/pages/Home.tsx");
  assert.doesNotMatch(home,/SponsoredHeroVideo|SponsoredCollectionCards/);
  // The PHP path accepts briefs, not media uploads or external budgets. Do not claim
  // the legacy upload/fee workflow is migrated until a real server contract exists.
  assert.match(growth,/submitMarketplaceAdRequest\(/);
  assert.match(growth,/reviewMarketplaceAdRequest\(/);
  assert.match(growth,/fetchMarketplaceAdRequests\(companyId\)/);
  assert.match(php,/INVALID_MEDIA_KIND/);
  assert.match(php,/video_requires_admin_spec_review/);
  assert.match(php,/publishing_separate/);
  assert.match(mysql,/private_storage_key CHAR\(64\)/);
  assert.match(mysql,/1920x1080/);
  assert.doesNotMatch(growth,/service_fee_percent|supabaseClient/);
  assert.doesNotMatch(api.match(/export async function submitMarketplaceAdRequest[\s\S]*?\n\}/)[0],/media_url|budget|private_storage_key/);
});
test("code and brand search preserves admin-only prices, similar items never invent price matches",()=>{
  assert.match(search,/session\?\.role !== "admin"/);
  assert.match(search,/searchMarketplaceCatalogue\(code\.trim\(\)\)/);
  assert.match(search,/private_price_cents/);
  assert.match(search,/price: null/);
  assert.match(php,/if\(!\$authorized\)\{unset\(\$r\['private_price_cents'\],\$r\['admin_notes'\]\);\}/);
  assert.match(php,/metadata_comparison_not_visual_embedding/);
  assert.match(search,/ideaInternalCode/);
  assert.match(read("src/app/pages/Products.tsx"),/similarProducts/);
  assert.match(read("src/app/pages/ProductDetail.tsx"),/similarProducts/);
  assert.match(read("src/app/data/recommendations.ts"),/not visual AI or unverified price matching/);
});
test("social login requires server-configured PHP providers; unconfigured buttons stay disabled",()=>{
  for(const provider of ["google","facebook","apple","x","microsoft","whatsapp"])
    assert.ok(auth.includes('id: "'+provider+'"'));
  assert.match(auth,/socialProviderDetails\(\)/);
  assert.match(auth,/setProviderReady\(info\.providers\)/);
  assert.match(auth,/setProviderReady\(null\)/);
  assert.match(auth,/providerReady\?\.\[id\] === true/);
  assert.match(auth,/disabled=\{!isReady \|\| pending !== null \|\| waBusy\}/);
  assert.match(auth,/getSocialAuthStartUrl\(provider as PhpOAuthProvider, mode, redirectTo\)/);
  assert.match(auth,/window\.location\.assign\(targetUrl\)/);
  assert.match(auth,/provider === "whatsapp"/); // no fake OAuth for unimplemented WhatsApp OTP
  assert.doesNotMatch(auth,/signInWithPopup|signInWithOAuth|signInWithOtp/);
  const php=read("src/app/backend/phpAccounts.ts");
  assert.match(php,/\?action=providers/);
  assert.match(php,/new URLSearchParams\(\{\s*action: "start",\s*provider,\s*mode,\s*redirect: sanitizeSocialRedirect\(redirectTo\)/);
  assert.match(php,/credentials: "same-origin"/);
});


test("ad package prices are administrator-editable and remain unpublished until confirmed",()=>{
  assert.match(growth,/saveMarketplaceAdPackage\(/);
  assert.match(growth,/updatePackage/);
  assert.match(growth,/if \(!isAdmin\) return/);
  assert.match(php,/if\(\$action==='package-save'\)\{\s*if\(!\$admin\)accountError\(403,'ADMIN_REQUIRED'\)/);
  assert.match(php,/WHERE is_published=1/);
  assert.match(mysql,/is_published TINYINT\(1\) NOT NULL DEFAULT 0/);
  assert.match(mysql,/250000,7,[^\n]+,0,0/);
  assert.match(mysql,/450000,14,[^\n]+,0,0/);
  assert.match(mysql,/900000,7,[^\n]+,0,0/);
  assert.match(growth,/نشر السعر/);
});
test("logins route verified platform admin and supplier to appropriate workspaces",()=>{
  const content=read("src/app/pages/AccountEntry.tsx");
  assert.match(content,/await authenticatePhp\(/);
  assert.match(content,/await refresh\(\)/);
  assert.match(content,/verifiedSession\.role!==expectedRole/);
  assert.ok(content.includes('navigate(role==="admin"?"/admin":role==="supplier"?"/business":"/account")'));
});
test("company ad request can never self-authorize public media",()=>{
  const requestHandler=php.slice(php.indexOf("if($action==='ad-request')"),php.indexOf("if($action==='ad-review')"));
  assert.match(requestHandler,/mpNeedCompany\(\$u,\$company\)/);
  assert.match(requestHandler,/is_published=1/);
  assert.match(requestHandler,/VALUES\(\?,\?,\?,\?,\?,\?,\?,'pending',\?,\?\)/);
  assert.doesNotMatch(requestHandler,/media_url|private_storage_key|publishing_separate/);
  assert.match(php,/if\(\$action==='ad-review'\)\{\s*if\(!\$admin\)accountError\(403,'ADMIN_REQUIRED'\)/);
  assert.match(php,/publishing_separate'=>true/);
});
