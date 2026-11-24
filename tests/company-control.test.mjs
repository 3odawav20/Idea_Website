import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
const sql=read("supabase/migrations/20261103130000_company_control_center.sql");
const app=read("src/app/App.tsx");
const center=read("src/app/pages/CompanyControlCenter.tsx");
const growth=read("src/app/pages/BusinessGrowth.tsx");
const ticker=read("src/app/components/AnnouncementBar.tsx");
const banner=read("src/app/components/SponsoredHeroVideo.tsx");
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
  assert.match(sql,/public\.company_is_owner\(p_company\)/);
  assert.match(sql,/member_role in \('owner','manager'\)/);
  assert.match(sql,/if not public\.is_admin\(\)/);
  assert.match(sql,/admin_set_idea_company_status/);
  assert.match(sql,/set revoked_at=case when p_enabled then null else now\(\) end/);
  assert.match(sql,/drop policy if exists "companies: members update"/);
  assert.match(sql,/create policy "companies: platform admin update"/);
  assert.match(sql,/role=case when public\.user_roles\.role='admin' then 'admin'/);
  assert.match(sql,/status='verified'/);
});
test("listing publication is platform admin-controlled, not merely active flag",()=>{
  assert.match(sql,/approved_for_storefront boolean not null default false/);
  assert.match(sql,/guard_idea_supplier_publication/);
  assert.match(sql,/active and approved_for_storefront/);
  assert.match(sql,/create policy "listings: manager update"/);
  assert.match(center,/approved_for_storefront/);
});
test("private prices and promotions never public; no fabricated sales",()=>{
  for(const name of ["supplier_listing_private_prices","supplier_listing_private_promotions","idea_confirmed_sales"]){
    assert.ok(sql.includes("alter table public."+name+" enable row level security"));
    assert.ok(sql.includes("alter table public."+name+" force row level security"));
    assert.ok(sql.includes("revoke all on public."+name+" from anon"));
  }
  assert.match(sql,/unique\(company_id,source_order_id\)/);
  assert.match(sql,/refund_egp <= gross_egp/);
  assert.match(growth,/fetchConfirmedSales\(period, id\)/);
  assert.match(growth,/const id = companies\.some/);
  assert.match(api,/phpGet\(PHP_MARKETPLACE_API, "sales", \{ month, company_id: companyId \}\)/);
  assert.match(php,/if\(\$company!==\x27\x27\)mpNeedCompany\(\$u,\$company\)/);
  assert.match(php,/o\.payment_status=\x27paid\x27/);
  assert.match(php,/pm\.status=\x27paid\x27/);
  assert.match(php,/COUNT\(DISTINCT oi\.order_id\)/);
  assert.match(php,/refund_accounting.*separate_reconciliation_required/);
  assert.match(growth,/Not reconciled/);
  assert.match(sql,/language sql stable security invoker/);
  assert.match(sql,/revoke all on function public.idea_company_sales_summary\(date\) from public,anon/);
  assert.match(growth,/لا يتم اختلاق أرقام من عروض الأسعار/);
  assert.doesNotMatch(growth,/Math\.random/);
});
test("admin announcement implementation remains staged; live header never reads Supabase",()=>{
  // The legacy Supabase schema/editor is source-only pending verified PHP/MySQL migration.
  assert.match(sql,/create policy "idea_announcements_read"/);
  assert.match(sql,/is_published and \(starts_at is null/);
  assert.match(growth,/saveMarketplaceTicker\(/);
  assert.match(growth,/state: "draft"/);
  assert.match(php,/state=\x27published\x27 AND \(start_at IS NULL OR start_at<=\?\)/);
  assert.match(php,/if\(\$action===\x27ticker-save\x27\)\{\s*if\(!\$admin\)accountError\(403,\x27ADMIN_REQUIRED\x27\)/);
  assert.match(mysql,/state VARCHAR\(24\) NOT NULL DEFAULT \x27draft\x27/);
  assert.match(ticker,/idea_site_announcements/);
  assert.match(ticker,/locale==="ar"\?a\.title_ar/);
  const header = read("src/app/components/Header.tsx");
  assert.match(header,/idea-catalogue-announcement/);
  assert.doesNotMatch(header,/<AnnouncementBar\b|supabase/i);
  assert.match(read("src/app/components/Header.css"),/position:\s*sticky/);
  assert.match(read("src/app/components/AnnouncementBar.css"),/prefers-reduced-motion/);
  assert.match(read("src/app/components/AnnouncementBar.css"),/max-width:640px/);
});
test("site media is sanitized; budgets are private and uploads stay private",()=>{
  assert.match(sql,/create table if not exists public\.idea_public_campaign_placements/);
  assert.match(banner,/idea_public_campaign_placements/);
  assert.doesNotMatch(banner,/proposed_budget_egp/);
  assert.match(sql,/public=false,file_size_limit=41943040/);
  assert.match(sql,/idea_creatives_company_upload/);
  assert.match(sql,/if current_ad\.placement in \('google_ads','meta_ads'\)/);
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
  assert.match(sql,/create table if not exists public\.idea_ad_package_rates/);
  assert.match(sql,/alter table public\.idea_ad_package_rates force row level security/);
  assert.match(sql,/for select to authenticated using\(is_published or public\.is_admin\(\)\)/);
  assert.match(sql,/with check\(public\.is_admin\(\)\)/);
  assert.match(sql,/from anon/);
  assert.match(sql,/2500,7,false/);
  assert.match(sql,/4500,14,false/);
  assert.match(sql,/9000,7,false/);
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
  const content=read("src/app/pages/Auth.tsx");
  assert.match(content,/from\("user_roles"\)\.select\("role"\)/);
  assert.match(content,/verifiedRole\?\.role === "admin" \? "\/admin"/);
  assert.match(content,/verifiedRole\?\.role === "supplier" \? "\/business"/);
});
test("company ad request can never self-authorize public media",()=>{
  assert.match(sql,/media_url is null or public\.is_admin\(\)/);
  const requestHandler=php.slice(php.indexOf("if($action==='ad-request')"),php.indexOf("if($action==='ad-review')"));
  assert.match(requestHandler,/mpNeedCompany\(\$u,\$company\)/);
  assert.match(requestHandler,/is_published=1/);
  assert.match(requestHandler,/VALUES\(\?,\?,\?,\?,\?,\?,\?,'pending',\?,\?\)/);
  assert.doesNotMatch(requestHandler,/media_url|private_storage_key|publishing_separate/);
  assert.match(php,/if\(\$action==='ad-review'\)\{\s*if\(!\$admin\)accountError\(403,'ADMIN_REQUIRED'\)/);
  assert.match(php,/publishing_separate'=>true/);
  assert.match(sql,/if current_ad\.placement in \('google_ads','meta_ads'\)/);
  assert.equal((sql.match(/create or replace function public\.idea_set_ad_status\(/g)||[]).length,1);
});
