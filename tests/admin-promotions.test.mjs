import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql=readFileSync("supabase/migrations/20261103021500_private_admin_promotions.sql","utf8");
const screen=readFileSync("src/app/pages/AdminPromotions.tsx","utf8");
const routes=readFileSync("src/app/App.tsx","utf8");
const admin=readFileSync("src/app/pages/AdminStudio.tsx","utf8");

test("private financial schema enables enforced RLS and rejects anon access",()=>{
  assert.match(sql,/create table if not exists public\.catalogue_admin_promotions/i);
  assert.match(sql,/enable row level security/i);
  assert.match(sql,/force row level security/i);
  assert.match(sql,/revoke all on public\.catalogue_admin_promotions from anon/i);
  assert.match(sql,/for select to authenticated using \(public\.is_admin\(\)\)/i);
  assert.match(sql,/for insert to authenticated with check \(public\.is_admin\(\) and created_by = auth\.uid\(\)\)/i);
  assert.match(sql,/for update to authenticated using \(public\.is_admin\(\)\)/i);
  assert.match(sql,/for delete to authenticated using \(public\.is_admin\(\)\)/i);
  assert.match(sql,/review_status in \('draft','verified','rejected'\)/i);
});
test("admin-only multi-offer screen never publishes a draft as a storefront promotion",()=>{
  assert.match(screen,/session\?\.role!=="admin"/);
  assert.match(screen,/\.from\("catalogue_admin_promotions"\)/);
  assert.match(screen,/review_status:"draft"/);
  assert.match(screen,/source_product_url/);
  assert.match(screen,/Promotional price|Offer price/);
  assert.doesNotMatch(screen,/localStorage\.setItem|public\.catalogue_admin_promotions|service_role/i);
  assert.match(routes,/<Route element=\{<ProtectedRoute roles=\{\["admin"\]\} \/>/);
  assert.match(routes,/<Route path="promotions" element=\{<AdminPromotions \/>/);
  assert.match(admin,/\/admin\/promotions/);
});
test("catalogue target matches 2,000 verified products per category",()=>{
  assert.match(admin,/const TARGET_PER_MATERIAL=2000/);
  assert.match(admin,/8,000 total target/);
  assert.doesNotMatch(admin,/6,000 total minimum|Minimum 1,500 individually verified/);
});
