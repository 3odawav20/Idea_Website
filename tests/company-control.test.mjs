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
  assert.match(center,/session\.role!=="business"/);
  assert.match(center,/apply_for_idea_company/);
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
  assert.match(growth,/idea_company_sales_summary/);
  assert.match(sql,/language sql stable security invoker/);
  assert.match(sql,/revoke all on function public.idea_company_sales_summary\(date\) from public,anon/);
  assert.match(growth,/لن نختلق مبيعات/);
  assert.doesNotMatch(growth,/Math\.random/);
});
test("announcement ticker is admin managed, translated, sticky and mobile safe",()=>{
  assert.match(sql,/create policy "idea_announcements_read"/);
  assert.match(sql,/is_published and \(starts_at is null/);
  assert.match(growth,/idea_site_announcements/);
  assert.match(ticker,/idea_site_announcements/);
  assert.match(ticker,/locale==="ar"\?a\.title_ar/);
  assert.match(read("src/app/components/Header.tsx"),/<AnnouncementBar\b/);
  assert.match(read("src/app/components/Header.css"),/position:sticky/);
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
test("social login requires configured provider, not fake working buttons",()=>{
  for(const provider of ["google","facebook","apple","twitter","azure"])
    assert.ok(auth.includes('id:"'+provider+'"'));
  assert.match(auth,/VITE_AUTH_PROVIDERS/);
  assert.match(auth,/signInWithOAuth/);
  assert.match(auth,/signInWithOtp/);
  assert.match(auth,/verifyOtp/);
  assert.doesNotMatch(auth,/whatsapp/);
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
test("logins route verified platform admin and supplier to appropriate workspaces",()=>{
  const content=read("src/app/pages/Auth.tsx");
  assert.match(content,/from\("user_roles"\)\.select\("role"\)/);
  assert.match(content,/verifiedRole\?\.role === "admin" \? "\/admin"/);
  assert.match(content,/verifiedRole\?\.role === "supplier" \? "\/business"/);
});
test("company ad request can never self-authorize public media",()=>{
  assert.match(sql,/media_url is null or public\.is_admin\(\)/);
  assert.match(growth,/media_url:isAdmin\?\(creativeUrl\.trim\(\)\|\|null\):null/);
  assert.match(sql,/if current_ad\.placement in \('google_ads','meta_ads'\)/);
  assert.equal((sql.match(/create or replace function public\.idea_set_ad_status\(/g)||[]).length,1);
});
