import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
const sql=read("supabase/migrations/20261103130000_company_control_center.sql");
const marketplace=read("server/cpanel/api/marketplace.php");
const pricePolicy=read("server/cpanel/api/marketplace-price-policy.php");
const app=read("src/app/App.tsx");
const center=read("src/app/pages/CompanyControlCenter.tsx");
const growth=read("src/app/pages/BusinessGrowth.tsx");
const banner=read("src/app/components/SponsoredHeroVideo.tsx");
const auth=read("src/app/components/SocialAuth.tsx");
const search=read("src/app/pages/AdminCodeLookup.tsx");

test("business company and admin routes are separate, role-guarded and navigable",()=>{
  assert.match(app, /ProtectedRoute roles=\{\["admin"\]\}/);
  assert.match(app, /ProtectedRoute roles=\{\["supplier"\]\}/);
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
  assert.match(center,/session\.role !== "supplier"/);
  assert.match(center,/BLOCKED: the verified PHP\/MySQL company API and schema are not available/);
  assert.doesNotMatch(center,/requireSupabase|supabase/i);
});
test("PHP company authorization scopes owner, manager, and platform-admin actions",()=>{
  assert.match(marketplace,/function mpRole\(array \$u,string \$companyId\): string/);
  assert.match(marketplace,/SELECT id FROM idea_companies WHERE id=\? AND owner_id=\?/);
  assert.match(marketplace,/SELECT role FROM idea_company_staff WHERE company_id=\? AND user_id=\? AND active=1/);
  assert.match(marketplace,/\['admin','owner','manager'\]/);
  assert.match(marketplace,/if\(\$action==='company-suspend'\|\|\$action==='company-status'\)\{\s*if\(!\$admin\)accountError\(403,'ADMIN_REQUIRED'\)/);
  assert.match(marketplace,/if\(\$action==='product-approval'\)\{\s*if\(!\$admin\)accountError\(403,'ADMIN_REQUIRED'\)/);
  assert.match(marketplace,/\$ownerOnly&&!in_array\(\$role,\['owner','admin'\],true\)/);
});
test("public listing activation requires verified-company and platform-approval state",()=>{
  assert.match(marketplace,/if\(\$action==='product-approval'\)\{\s*if\(!\$admin\)accountError\(403,'ADMIN_REQUIRED'\)/);
  assert.match(marketplace,/if\(\$yes&&\$row\['status'\]!=='verified'\)accountError\(409,'COMPANY_NOT_VERIFIED'\)/);
  assert.match(marketplace,/if\(\$active&&\(\$row\['status'\]!=='verified'\|\|!\(bool\)\$row\['approved_for_storefront'\]\)\)/);
  assert.match(marketplace,/SET active=0/);
  assert.doesNotMatch(center,/approved_for_storefront|\.from\(|\.rpc\(/);
});
test("private prices stay scoped to company owners or managers; sales are captured-payment-only",()=>{
  assert.match(pricePolicy,/\$companyId !== '' && in_array\(\$companyRole, \['owner', 'manager'\], true\)/);
  assert.match(pricePolicy,/unset\(\$row\['private_price_cents'\], \$row\['currency'\]\)/);
  assert.equal((marketplace.match(/mpApplyCataloguePricePolicy\(/g)||[]).length,1);
  assert.match(marketplace,/mpCatalogueRows\(\$u,\$q,'',\(bool\)\$admin,100\)/);
  assert.match(marketplace,/if\(\$action==='products'\)/);
  assert.match(marketplace,/mpNeedCompany\(\$u,\$company\)/);
  assert.match(marketplace,/mpCatalogueRows\(\$u,'',\$company,true,500\)/);
  assert.match(growth,/response\.basis!=="captured_payments_only"/);
  assert.match(growth,/لن نختلق مبيعات/);
  assert.doesNotMatch(growth,/Math\.random/);
});
test("legacy SQL privacy migration is not presented as live; PHP sales count captured payments only",()=>{
  for(const name of ["supplier_listing_private_prices","supplier_listing_private_promotions","idea_confirmed_sales"]){
    assert.ok(sql.includes("alter table public."+name+" enable row level security"));
    assert.ok(sql.includes("alter table public."+name+" force row level security"));
    assert.ok(sql.includes("revoke all on public."+name+" from anon"));
  }
  assert.match(marketplace,/o\.payment_status='paid'/);
  assert.match(marketplace,/pm\.status='paid'/);
  assert.match(marketplace,/'basis'=>'captured_payments_only'/);
  assert.match(growth,/response\.basis!=="captured_payments_only"/);
  assert.doesNotMatch(growth,/idea_company_sales_summary|Math\.random/);
});
test("admin ticker edits use the PHP contract; the live header does not mount the legacy Supabase ticker",()=>{
  assert.match(growth,/apiFetch<unknown>\("\/api\/marketplace\.php\?action=ticker-save"/);
  assert.match(growth,/requireSavedId\(result\)/);
  assert.doesNotMatch(growth,/idea_site_announcements/);
  assert.match(marketplace,/if\(\$action==='ticker'&&\$method==='GET'\)/);
  assert.match(marketplace,/if\(\$action==='ticker-save'\)\{\s*if\(!\$admin\)accountError\(403,'ADMIN_REQUIRED'\)/);
  assert.match(marketplace,/INSERT INTO idea_marketplace_announcements/);
  const header = read("src/app/components/Header.tsx");
  assert.match(header,/idea-catalogue-announcement/);
  assert.doesNotMatch(header,/<AnnouncementBar\b|supabase/i);
  assert.match(read("src/app/components/Header.css"),/position:sticky/);
  assert.match(read("src/app/components/AnnouncementBar.css"),/prefers-reduced-motion/);
});
test("site media is sanitized; budgets are private and uploads stay private",()=>{
  assert.match(sql,/create table if not exists public\.idea_public_campaign_placements/);
  assert.match(banner,/idea_public_campaign_placements/);
  assert.doesNotMatch(banner,/proposed_budget_egp/);
  assert.match(sql,/public=false,file_size_limit=41943040/);
  assert.match(sql,/idea_creatives_company_upload/);
  assert.match(sql,/if current_ad\.placement in \('google_ads','meta_ads'\)/);
  assert.match(growth,/validateMedia/);
  assert.match(growth,/1920\|\|metadata\.h!==1080/);
  assert.match(growth,/service_fee_percent:15/);
  assert.match(growth,/idea_set_ad_status/);
});
test("code and brand search preserves admin-only prices, similar items never invent price matches",()=>{
  assert.match(search,/catalogue_admin_prices/);
  assert.match(search,/supplier_listing_private_prices/);
  assert.match(search,/ideaInternalCode/);
  assert.match(read("src/app/pages/Products.tsx"),/similarProducts/);
  assert.match(read("src/app/pages/ProductDetail.tsx"),/similarProducts/);
  assert.match(read("src/app/data/recommendations.ts"),/not visual AI or unverified price matching/);
});
test("social login requires server-configured PHP providers; unconfigured buttons stay disabled",()=>{
  for(const provider of ["google","facebook","apple","x","microsoft","whatsapp"])
    assert.ok(auth.includes('id: "'+provider+'"'));
  assert.match(auth,/socialProviderStatus\(\)/);
  assert.match(auth,/providerReady\?\.\[item\.id\] === true/);
  assert.match(auth,/disabled=\{!enabled \|\| pending !== null\}/);
  assert.match(auth,/SOCIAL_AUTH_API \+ "\?action=start&provider="/);
  assert.match(auth,/provider === "whatsapp"/); // no fake OAuth for unimplemented WhatsApp OTP
  assert.doesNotMatch(auth,/signInWithPopup|signInWithOAuth|signInWithOtp/);
  const php=read("src/app/backend/phpAccounts.ts");
  assert.match(php,/\?action=providers/);
  assert.match(php,/credentials: "same-origin"/);
});


test("ad package prices are administrator-editable and remain unpublished until confirmed",()=>{
  assert.match(sql,/create table if not exists public\.idea_ad_package_rates/);
  assert.match(sql,/alter table public\.idea_ad_package_rates force row level security/);
  assert.match(sql,/for select to authenticated using\(is_published or public\.is_admin\(\)\)/);
  assert.match(sql,/with check\(public\.is_admin\(\)\)/);
  assert.match(sql,/from anon/);
  assert.match(sql,/2500,7,false/);
  assert.match(sql,/4500,14,false/);
  assert.match(sql,/9000,7,false/);
  assert.match(growth,/idea_ad_package_rates/);
  assert.match(growth,/updateRate/);
  assert.match(growth,/نشر السعر/);
});
test("login accepts and routes only the PHP-confirmed platform roles",()=>{
  const content=read("src/app/pages/AccountEntry.tsx");
  const rolePolicy=read("src/app/backend/authValidation.ts");
  assert.match(content,/authenticatePhp\("login"/);
  assert.match(content,/const returnedRole=account\.user\?\.role/);
  assert.match(content,/const expectedRole=isAdmin\?"admin":isBusiness\?"supplier":"buyer"/);
  assert.match(content,/const route=resolvePostAuthRoute\(returnedRole\)/);
  assert.match(rolePolicy,/role === "admin"\) return "\/admin"/);
  assert.match(rolePolicy,/role === "supplier"\) return "\/business"/);
  assert.doesNotMatch(content,/from\("user_roles"\)/);
});
test("company ad request can never self-authorize public media",()=>{
  assert.match(sql,/media_url is null or public\.is_admin\(\)/);
  assert.match(growth,/media_url:isAdmin\?\(creativeUrl\.trim\(\)\|\|null\):null/);
  assert.match(sql,/if current_ad\.placement in \('google_ads','meta_ads'\)/);
  assert.equal((sql.match(/create or replace function public\.idea_set_ad_status\(/g)||[]).length,1);
});
