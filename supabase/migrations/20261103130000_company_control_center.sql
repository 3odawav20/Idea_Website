-- IDEA company control center: tenant isolation, pricing privacy, delegated access.
-- DEPENDENCY: marketplace_foundation.sql, auth_workflows_and_storage.sql
-- This migration must be applied to the selected live database before enabling UI writes.
-- No demo users, fictitious products, new admin accounts or public prices are created.

alter table public.company_members
  add column if not exists revoked_at timestamptz;

alter table public.supplier_listings
  add column if not exists brand_name text,
  add column if not exists manufacturer_name text;
alter table public.supplier_listings
  add column if not exists approved_for_storefront boolean not null default false;

-- A company may manage its own ACTIVE flag but cannot bypass IDEA's product
-- image/spec/rights review simply by writing approved_for_storefront=true.
create or replace function public.guard_idea_supplier_publication()
returns trigger language plpgsql security invoker
set search_path = public, pg_temp as $$
begin
  if tg_op='INSERT' then
    if new.approved_for_storefront and not public.is_admin() then
      raise exception 'Only platform admins can approve a public listing'
        using errcode='42501';
    end if;
  elsif new.approved_for_storefront is distinct from old.approved_for_storefront then
    if not public.is_admin() then
      raise exception 'Only platform admins can approve a public listing'
        using errcode='42501';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists guard_idea_supplier_publication
  on public.supplier_listings;
create trigger guard_idea_supplier_publication
  before insert or update on public.supplier_listings
  for each row execute function public.guard_idea_supplier_publication();

alter table public.supplier_listings
  add constraint supplier_listings_brand_length
    check (brand_name is null or char_length(btrim(brand_name)) between 1 and 140),
  add constraint supplier_listings_manufacturer_length
    check (manufacturer_name is null or char_length(btrim(manufacturer_name)) between 1 and 160);
create index if not exists supplier_listings_brand_company_idx
  on public.supplier_listings(company_id, brand_name);

-- Replacing the old membership helper makes revocation immediate for ALL RLS
-- policies that rely on it (including RFQ and supplier quote access).
create or replace function public.is_company_member(target_company uuid)
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.company_members m
    join public.companies c on c.id=m.company_id
    where m.company_id = target_company and m.user_id = auth.uid()
      and m.revoked_at is null and c.status not in ('suspended','rejected')
  );
$$;

create or replace function public.company_is_owner(target_company uuid)
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.company_members m
    where m.company_id=target_company and m.user_id=auth.uid()
      and m.member_role='owner' and m.revoked_at is null
  );
$$;

create or replace function public.can_manage_company(target_company uuid)
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select public.is_admin() or exists (
    select 1 from public.company_members m
    join public.companies c on c.id=m.company_id
    where m.company_id=target_company and m.user_id=auth.uid()
      and m.member_role in ('owner','manager') and m.revoked_at is null
      and c.status='verified'
  );
$$;

-- CRITICAL: the pre-existing companies: members update policy let ANY MEMBER
-- change status='verified' and thus self-approve, or suspend other tenants.
-- Remove it and allow only platform administrators to modify company records.
drop policy if exists "companies: members update" on public.companies;
drop policy if exists "companies: platform admin update" on public.companies;
create policy "companies: platform admin update" on public.companies
  for update to authenticated using (public.is_admin())
  with check (public.is_admin());
revoke update on public.companies from anon;
grant update on public.companies to authenticated;

-- Revoke company membership self-edits. Membership and role changes only
-- happen via guarded SECURITY DEFINER functions below.
revoke insert, update, delete on public.company_members from anon, authenticated;
grant select on public.company_members to authenticated;

-- Hide suspended companies' listings from anonymous/public viewers,
-- and prevent company reps from editing until approved again.
drop policy if exists "listings: public active read" on public.supplier_listings;
drop policy if exists "listings: company write" on public.supplier_listings;
drop policy if exists "listings: scoped read" on public.supplier_listings;
drop policy if exists "listings: manager insert" on public.supplier_listings;
drop policy if exists "listings: manager update" on public.supplier_listings;
drop policy if exists "listings: manager delete" on public.supplier_listings;
create policy "listings: scoped read" on public.supplier_listings
  for select using (
    public.is_admin() or public.is_company_member(company_id)
    or (active and approved_for_storefront and exists (
      select 1 from public.companies c
      where c.id=company_id and c.status='verified'
    ))
  );
create policy "listings: manager insert" on public.supplier_listings
  for insert to authenticated with check (public.can_manage_company(company_id));
create policy "listings: manager update" on public.supplier_listings
  for update to authenticated using (public.can_manage_company(company_id))
  with check (public.can_manage_company(company_id));
create policy "listings: manager delete" on public.supplier_listings
  for delete to authenticated using (public.can_manage_company(company_id));
grant select on public.supplier_listings to anon,authenticated;
grant insert,update,delete on public.supplier_listings to authenticated;

-- Company-specific prices are NEVER returned by public catalogue queries.
-- They are accessible only to the same company's verified owner/manager or a
-- platform admin. This table is separate from public.catalog_products and
-- public.catalogue_admin_prices (which stays platform-admin-only).
create or replace function public.can_view_company_listing_price(target_listing uuid)
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select public.is_admin() or exists (
    select 1 from public.supplier_listings l
    where l.id=target_listing and public.can_manage_company(l.company_id)
  );
$$;

create table if not exists public.supplier_listing_private_prices (
  listing_id uuid primary key references public.supplier_listings(id) on delete cascade,
  price_egp numeric(14,2) not null check (price_egp >= 0),
  updated_by uuid default auth.uid(),
  updated_at timestamptz not null default now()
);
alter table public.supplier_listing_private_prices enable row level security;
alter table public.supplier_listing_private_prices force row level security;
drop policy if exists "company_price_read" on public.supplier_listing_private_prices;
drop policy if exists "company_price_insert" on public.supplier_listing_private_prices;
drop policy if exists "company_price_update" on public.supplier_listing_private_prices;
drop policy if exists "company_price_delete" on public.supplier_listing_private_prices;
create policy "company_price_read" on public.supplier_listing_private_prices
  for select to authenticated
  using (public.can_view_company_listing_price(listing_id));
create policy "company_price_insert" on public.supplier_listing_private_prices
  for insert to authenticated
  with check (public.can_view_company_listing_price(listing_id));
create policy "company_price_update" on public.supplier_listing_private_prices
  for update to authenticated
  using (public.can_view_company_listing_price(listing_id))
  with check (public.can_view_company_listing_price(listing_id));
create policy "company_price_delete" on public.supplier_listing_private_prices
  for delete to authenticated
  using (public.can_view_company_listing_price(listing_id));
revoke all on public.supplier_listing_private_prices from anon;
grant select,insert,update,delete on public.supplier_listing_private_prices to authenticated;

create table if not exists public.supplier_listing_private_promotions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.supplier_listings(id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 180),
  offer_price_egp numeric(14,2) not null check (offer_price_egp >= 0),
  starts_at date,
  ends_at date,
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplier_promo_valid_dates
    check (starts_at is null or ends_at is null or starts_at <= ends_at)
);
create index if not exists supplier_promos_listing_idx
  on public.supplier_listing_private_promotions(listing_id);
alter table public.supplier_listing_private_promotions enable row level security;
alter table public.supplier_listing_private_promotions force row level security;
drop policy if exists "company_promo_read" on public.supplier_listing_private_promotions;
drop policy if exists "company_promo_insert" on public.supplier_listing_private_promotions;
drop policy if exists "company_promo_update" on public.supplier_listing_private_promotions;
drop policy if exists "company_promo_delete" on public.supplier_listing_private_promotions;
create policy "company_promo_read" on public.supplier_listing_private_promotions
  for select to authenticated
  using (public.can_view_company_listing_price(listing_id));
create policy "company_promo_insert" on public.supplier_listing_private_promotions
  for insert to authenticated
  with check (public.can_view_company_listing_price(listing_id));
create policy "company_promo_update" on public.supplier_listing_private_promotions
  for update to authenticated
  using (public.can_view_company_listing_price(listing_id))
  with check (public.can_view_company_listing_price(listing_id));
create policy "company_promo_delete" on public.supplier_listing_private_promotions
  for delete to authenticated
  using (public.can_view_company_listing_price(listing_id));
revoke all on public.supplier_listing_private_promotions from anon;
grant select,insert,update,delete on public.supplier_listing_private_promotions to authenticated;

-- Guard against SQL privilege escalation: clients may not invoke these definer
-- routines anonymously. All role changes occur only in approved functions.
revoke all on function public.company_is_owner(uuid) from public,anon;
revoke all on function public.can_manage_company(uuid) from public,anon;
revoke all on function public.can_view_company_listing_price(uuid) from public,anon;
grant execute on function public.company_is_owner(uuid) to authenticated;
grant execute on function public.can_manage_company(uuid) to authenticated;
grant execute on function public.can_view_company_listing_price(uuid) to authenticated;

-- Self-service applications are NOT automatically approved or granted supplier
-- role. Authenticated users can submit one pending membership only.
create or replace function public.apply_for_idea_company(
  p_legal_name text, p_public_name text, p_email text default null
) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  new_company uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if char_length(btrim(coalesce(p_legal_name,''))) not between 2 and 160
     or char_length(btrim(coalesce(p_public_name,''))) not between 2 and 160
  then raise exception 'Valid legal and public names required'; end if;
  if exists(select 1 from public.company_members m
            where m.user_id=auth.uid() and m.member_role='owner'
              and m.revoked_at is null)
  then raise exception 'This account already owns a company application'; end if;
  insert into public.companies(legal_name,public_name,email,status)
    values(btrim(p_legal_name),btrim(p_public_name),nullif(btrim(p_email),''),
           'submitted') returning id into new_company;
  insert into public.company_members(company_id,user_id,member_role)
    values(new_company,auth.uid(),'owner');
  return new_company;
end;
$$;
revoke all on function public.apply_for_idea_company(text,text,text) from public,anon;
grant execute on function public.apply_for_idea_company(text,text,text) to authenticated;

-- Admin: approve, suspend, reject or return company to submitted.
-- Approved owners/managers become supplier-role accounts automatically.
create or replace function public.admin_set_idea_company_status(
  p_company uuid, p_status public.company_status
) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if not public.is_admin() then
    raise exception 'Platform administrator required' using errcode='42501';
  end if;
  if p_status not in ('verified','suspended','rejected','submitted') then
    raise exception 'Unsupported company status';
  end if;
  update public.companies
    set status=p_status,updated_at=now() where id=p_company;
  if not found then raise exception 'Company not found'; end if;
  if p_status='verified' then
    insert into public.user_roles(user_id,role,granted_by)
    select m.user_id, 'supplier', auth.uid()
      from public.company_members m
      where m.company_id=p_company and m.revoked_at is null
        and m.member_role in ('owner','manager')
    on conflict(user_id) do update
      set role=case when public.user_roles.role='admin' then 'admin'::public.idea_role
                    else 'supplier'::public.idea_role end,
          granted_by=excluded.granted_by;
  end if;
end;
$$;
revoke all on function public.admin_set_idea_company_status(uuid,public.company_status)
  from public,anon;
grant execute on function public.admin_set_idea_company_status(uuid,public.company_status)
  to authenticated;

-- Owner can delegate to a pre-existing confirmed user account.
-- The owner cannot grant platform-admin role; this only grants company scope.
create or replace function public.company_invite_idea_manager(
  p_company uuid,p_email text
) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare invitee uuid;
begin
  if not (public.is_admin() or public.company_is_owner(p_company)) then
    raise exception 'Company owner required' using errcode='42501'; end if;
  if not exists(select 1 from public.companies
                where id=p_company and status='verified') then
    raise exception 'Company must be verified'; end if;
  select id into invitee from auth.users
    where lower(email)=lower(btrim(p_email))
      and email_confirmed_at is not null limit 1;
  if invitee is null then raise exception 'Confirmed IDEA account not found'; end if;
  if exists(select 1 from public.company_members
    where company_id=p_company and user_id=invitee and member_role='owner') then
    raise exception 'Cannot change owner membership via manager invitation'; end if;
  insert into public.company_members(company_id,user_id,member_role,revoked_at)
    values(p_company,invitee,'manager',null)
  on conflict(company_id,user_id) do update
    set member_role='manager',revoked_at=null;
  insert into public.user_roles(user_id,role,granted_by)
    values(invitee,'supplier',auth.uid())
  on conflict(user_id) do update
    set role=case when public.user_roles.role='admin' then 'admin'::public.idea_role
                  else 'supplier'::public.idea_role end,
        granted_by=excluded.granted_by;
end;
$$;
revoke all on function public.company_invite_idea_manager(uuid,text) from public,anon;
grant execute on function public.company_invite_idea_manager(uuid,text) to authenticated;

-- Owner/admin can suspend delegated managers. Last owner stays protected.
create or replace function public.company_set_idea_member_access(
  p_company uuid,p_user uuid,p_enabled boolean
) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare old_role text;
begin
  if not (public.is_admin() or public.company_is_owner(p_company)) then
    raise exception 'Owner or platform admin required' using errcode='42501'; end if;
  select member_role into old_role from public.company_members
    where company_id=p_company and user_id=p_user for update;
  if old_role is null then raise exception 'Company member not found'; end if;
  if old_role='owner' then
    raise exception 'Owner account requires platform account-recovery workflow';
  end if;
  update public.company_members
    set revoked_at=case when p_enabled then null else now() end
    where company_id=p_company and user_id=p_user;
end;
$$;
revoke all on function public.company_set_idea_member_access(uuid,uuid,boolean)
  from public,anon;
grant execute on function public.company_set_idea_member_access(uuid,uuid,boolean)
  to authenticated;

-- The existing supplier role is not global administrator. Admin-only catalogue
-- pricing remains in separate admin RLS tables, never included in listings.


-- Reporting only confirmed/paid actual sales, NEVER quotes, estimates or
-- Shopify supplier website catalogue sales.
create table if not exists public.idea_confirmed_sales (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  source_order_id text not null,
  paid_at timestamptz not null,
  gross_egp numeric(14,2) not null check (gross_egp >= 0),
  refund_egp numeric(14,2) not null default 0
    check (refund_egp >= 0 and refund_egp <= gross_egp),
  currency text not null default 'EGP' check(currency='EGP'),
  evidence_url text not null check (evidence_url ~ '^https://[^[:space:]]+$'),
  recorded_by uuid default auth.uid(),
  recorded_at timestamptz not null default now(),
  unique(company_id,source_order_id)
);
create index if not exists idea_confirmed_sales_company_month_idx
  on public.idea_confirmed_sales(company_id,paid_at desc);
alter table public.idea_confirmed_sales enable row level security;
alter table public.idea_confirmed_sales force row level security;
drop policy if exists "idea_paid_orders_scoped_read" on public.idea_confirmed_sales;
drop policy if exists "idea_paid_orders_admin_insert" on public.idea_confirmed_sales;
drop policy if exists "idea_paid_orders_admin_update" on public.idea_confirmed_sales;
drop policy if exists "idea_paid_orders_admin_delete" on public.idea_confirmed_sales;
create policy "idea_paid_orders_scoped_read" on public.idea_confirmed_sales
  for select to authenticated using(
    public.is_admin() or public.can_manage_company(company_id)
  );
create policy "idea_paid_orders_admin_insert" on public.idea_confirmed_sales
  for insert to authenticated with check(public.is_admin());
create policy "idea_paid_orders_admin_update" on public.idea_confirmed_sales
  for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "idea_paid_orders_admin_delete" on public.idea_confirmed_sales
  for delete to authenticated using(public.is_admin());
revoke all on public.idea_confirmed_sales from anon;
grant select,insert,update,delete on public.idea_confirmed_sales to authenticated;

-- Public announcement ticker: only admin may create or publish. The public
-- read path never exposes messages that aren't published.
create table if not exists public.idea_site_announcements (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null check(char_length(btrim(title_ar)) between 3 and 180),
  title_en text not null check(char_length(btrim(title_en)) between 3 and 180),
  title_fr text,
  target_path text check(target_path is null or target_path ~ '^/[^/]' ),
  is_published boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.idea_site_announcements enable row level security;
drop policy if exists "idea_announcements_read" on public.idea_site_announcements;
drop policy if exists "idea_announcements_admin_read" on public.idea_site_announcements;
drop policy if exists "idea_announcements_admin_insert" on public.idea_site_announcements;
drop policy if exists "idea_announcements_admin_update" on public.idea_site_announcements;
drop policy if exists "idea_announcements_admin_delete" on public.idea_site_announcements;
create policy "idea_announcements_read" on public.idea_site_announcements
  for select to anon,authenticated
  using(is_published and (starts_at is null or starts_at<=now())
    and (ends_at is null or ends_at>=now()));
create policy "idea_announcements_admin_read" on public.idea_site_announcements
  for select to authenticated using(public.is_admin());
create policy "idea_announcements_admin_insert" on public.idea_site_announcements
  for insert to authenticated with check(public.is_admin());
create policy "idea_announcements_admin_update" on public.idea_site_announcements
  for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "idea_announcements_admin_delete" on public.idea_site_announcements
  for delete to authenticated using(public.is_admin());
grant select on public.idea_site_announcements to anon,authenticated;
grant insert,update,delete on public.idea_site_announcements to authenticated;

-- Campaign requests: suppliers create drafts with media metadata only; a
-- platform admin reviews and publishes. No campaign auto-spend is possible.
create table if not exists public.idea_company_ad_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  placement text not null check(placement in
     ('home_hero_video','home_topline','new_collections','google_ads','meta_ads')),
  title_ar text not null check(char_length(btrim(title_ar)) between 3 and 180),
  title_en text,
  media_url text check(media_url is null or media_url ~ '^https://[^[:space:]]+$'),
  landing_path text check(landing_path is null or landing_path ~ '^/[^/]' ),
  message text,
  proposed_budget_egp numeric(14,2) check(proposed_budget_egp is null or proposed_budget_egp>=0),
  service_fee_percent numeric(5,2) not null default 15.00
    check(service_fee_percent between 0 and 100),
  status text not null default 'draft'
    check(status in ('draft','submitted','approved','rejected','live','paused')),
  admin_notes text,
  created_by uuid not null default auth.uid(),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idea_ads_company_status_idx
  on public.idea_company_ad_requests(company_id,status);
alter table public.idea_company_ad_requests enable row level security;
alter table public.idea_company_ad_requests force row level security;
drop policy if exists "idea_ads_scoped_read" on public.idea_company_ad_requests;
drop policy if exists "idea_ads_scoped_insert" on public.idea_company_ad_requests;
drop policy if exists "idea_ads_admin_update" on public.idea_company_ad_requests;
create policy "idea_ads_scoped_read" on public.idea_company_ad_requests
  for select to authenticated
  using(public.is_admin() or public.is_company_member(company_id));
create policy "idea_ads_scoped_insert" on public.idea_company_ad_requests
  for insert to authenticated with check(
    public.can_manage_company(company_id)
    and status='draft'
    and created_by=auth.uid()
    and (media_url is null or public.is_admin())
    and service_fee_percent=15.00
  );
create policy "idea_ads_admin_update" on public.idea_company_ad_requests
  for update to authenticated using(public.is_admin()) with check(public.is_admin());
revoke all on public.idea_company_ad_requests from anon;
grant select,insert,update on public.idea_company_ad_requests to authenticated;

-- No arbitrary media URL can be live without separate business-creative and
-- rights approval; the admin controls the final status and media validation.



-- Publicly visible campaign placements are deliberately in a separate table.
-- Never grant anon SELECT on private proposed budgets, requester info or fees.
create table if not exists public.idea_public_campaign_placements (
  campaign_id uuid primary key references public.idea_company_ad_requests(id)
    on delete cascade,
  placement text not null,
  title_ar text not null,
  title_en text,
  media_url text,
  landing_path text,
  published_at timestamptz not null default now()
);
alter table public.idea_public_campaign_placements enable row level security;
drop policy if exists "idea_public_ads_read" on public.idea_public_campaign_placements;
drop policy if exists "idea_public_ads_admin_write" on public.idea_public_campaign_placements;
create policy "idea_public_ads_read" on public.idea_public_campaign_placements
  for select to anon,authenticated using(true);
create policy "idea_public_ads_admin_write" on public.idea_public_campaign_placements
  for all to authenticated using(public.is_admin()) with check(public.is_admin());
grant select on public.idea_public_campaign_placements to anon,authenticated;
grant insert,update,delete on public.idea_public_campaign_placements to authenticated;

-- Synchronize ONLY approved fields when platform admin explicitly chooses live.



-- Private campaign files. Never make unapproved supplier media public.
alter table public.idea_company_ad_requests
  add column if not exists media_storage_path text;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('idea_ad_creatives','idea_ad_creatives',false,41943040,
  array['image/jpeg','image/png','image/webp','video/mp4'])
on conflict(id) do update
set public=false,file_size_limit=41943040,
  allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "idea_creatives_company_upload" on storage.objects;
drop policy if exists "idea_creatives_company_read" on storage.objects;
create policy "idea_creatives_company_upload" on storage.objects
  for insert to authenticated with check(
    bucket_id='idea_ad_creatives'
    and split_part(name,'/',1) ~
      '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and public.can_manage_company(split_part(name,'/',1)::uuid)
  );
create policy "idea_creatives_company_read" on storage.objects
  for select to authenticated using(
    bucket_id='idea_ad_creatives'
    and (public.is_admin() or (
      split_part(name,'/',1) ~
       '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and public.is_company_member(split_part(name,'/',1)::uuid)
    ))
  );

-- This RPC only publishes website placements. Google/Meta ads NEVER launch
-- without real platform OAuth/ads-account ownership + independent budgets.
create or replace function public.idea_set_ad_status(p_id uuid,p_status text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare current_ad public.idea_company_ad_requests%rowtype;
begin
  if not public.is_admin() then raise exception 'Admin required' using errcode='42501';end if;
  if p_status not in ('approved','rejected','live','paused') then raise exception 'Invalid ad status';end if;
  select * into current_ad from public.idea_company_ad_requests where id=p_id for update;
  if not found then raise exception 'Ad not found';end if;
  if p_status='live' then
    if current_ad.placement in ('google_ads','meta_ads') then
      raise exception 'External advertising requires a connected, confirmed platform campaign';
    end if;
    if current_ad.media_url is null or current_ad.title_ar is null then
      raise exception 'Approved public media URL must be provided for website ad';
    end if;
    if not exists(select 1 from public.companies where id=current_ad.company_id and status='verified') then
      raise exception 'Company must be verified before placement is live';
    end if;
    insert into public.idea_public_campaign_placements
      (campaign_id,placement,title_ar,title_en,media_url,landing_path)
    values(current_ad.id,current_ad.placement,current_ad.title_ar,
      current_ad.title_en,current_ad.media_url,current_ad.landing_path)
    on conflict(campaign_id) do update set
      placement=excluded.placement,title_ar=excluded.title_ar,
      title_en=excluded.title_en,media_url=excluded.media_url,
      landing_path=excluded.landing_path,published_at=now();
  else
    delete from public.idea_public_campaign_placements where campaign_id=p_id;
  end if;
  update public.idea_company_ad_requests set status=p_status,updated_at=now() where id=p_id;
end;$$;
revoke all on function public.idea_set_ad_status(uuid,text) from public,anon;
grant execute on function public.idea_set_ad_status(uuid,text) to authenticated;


-- IDEA's OWN website advertising inventory (not Google/Meta auction prices).
-- Values below are proposed admin-editable DRAFTS, never claimed market rates.
-- No public price is shown until the platform administrator publishes a rate.
create table if not exists public.idea_ad_package_rates (
  placement text primary key check (placement in
    ('home_topline','new_collections','home_hero_video')),
  title_ar text not null,
  title_en text not null,
  base_rate_egp numeric(14,2) not null check (base_rate_egp >= 0),
  duration_days integer not null check(duration_days between 1 and 365),
  is_published boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.idea_ad_package_rates enable row level security;
alter table public.idea_ad_package_rates force row level security;
drop policy if exists "idea_ad_rates_view" on public.idea_ad_package_rates;
drop policy if exists "idea_ad_rates_insert" on public.idea_ad_package_rates;
drop policy if exists "idea_ad_rates_edit" on public.idea_ad_package_rates;
create policy "idea_ad_rates_view" on public.idea_ad_package_rates
  for select to authenticated using(is_published or public.is_admin());
create policy "idea_ad_rates_insert" on public.idea_ad_package_rates
  for insert to authenticated with check(public.is_admin());
create policy "idea_ad_rates_edit" on public.idea_ad_package_rates
  for update to authenticated using(public.is_admin())
  with check(public.is_admin());
revoke all on public.idea_ad_package_rates from anon;
grant select,insert,update on public.idea_ad_package_rates to authenticated;
insert into public.idea_ad_package_rates
  (placement,title_ar,title_en,base_rate_egp,duration_days,is_published)
values
  ('home_topline','الشريط الإعلاني العلوي','Top line',2500,7,false),
  ('new_collections','منتجات في المجموعات الجديدة','New collections',4500,14,false),
  ('home_hero_video','فيديو هيرو الصفحة الرئيسية','Homepage hero video',9000,7,false)
on conflict (placement) do nothing;


-- SQL-level aggregation avoids missing transactions when a company has more
-- than PostgREST's default 1,000 visible records in one calendar month.
-- SECURITY INVOKER is intentional: underlying idea_confirmed_sales RLS
-- still limits each supplier to their own company's confirmed transactions.
create or replace function public.idea_company_sales_summary(p_month date)
returns table (
  company_id uuid,
  order_count bigint,
  gross_egp numeric,
  refund_egp numeric
)
language sql stable security invoker set search_path=public,pg_temp as $$
  select s.company_id, count(*)::bigint,
         coalesce(sum(s.gross_egp),0)::numeric,
         coalesce(sum(s.refund_egp),0)::numeric
    from public.idea_confirmed_sales s
    where s.paid_at >= (date_trunc('month',p_month::timestamp) at time zone 'Africa/Cairo')
      and s.paid_at < ((date_trunc('month',p_month::timestamp)+interval '1 month') at time zone 'Africa/Cairo')
    group by s.company_id;
$$;
revoke all on function public.idea_company_sales_summary(date) from public,anon;
grant execute on function public.idea_company_sales_summary(date) to authenticated;
