-- Public, source-backed identity corrections and private administrator pricing.
-- This migration intentionally keeps prices out of public catalogue records.

alter table public.catalogue_admin_overrides
  add column if not exists manufacturer text,
  add column if not exists model text,
  add column if not exists code text;

alter table public.catalogue_admin_overrides
  add constraint catalogue_override_manufacturer_length
    check (manufacturer is null or length(btrim(manufacturer)) between 1 and 140),
  add constraint catalogue_override_model_length
    check (model is null or length(btrim(model)) between 1 and 220),
  add constraint catalogue_override_code_length
    check (code is null or length(btrim(code)) between 1 and 140);

create table if not exists public.catalogue_admin_prices (
  product_id text primary key,
  price numeric(14, 2) not null check (price >= 0),
  currency text not null default 'EGP' check (currency = 'EGP'),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);

alter table public.catalogue_admin_prices enable row level security;

drop policy if exists "idea_admin_prices_select" on public.catalogue_admin_prices;
create policy "idea_admin_prices_select" on public.catalogue_admin_prices
  for select to authenticated using (public.is_admin());

drop policy if exists "idea_admin_prices_insert" on public.catalogue_admin_prices;
create policy "idea_admin_prices_insert" on public.catalogue_admin_prices
  for insert to authenticated with check (public.is_admin());

drop policy if exists "idea_admin_prices_update" on public.catalogue_admin_prices;
create policy "idea_admin_prices_update" on public.catalogue_admin_prices
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "idea_admin_prices_delete" on public.catalogue_admin_prices;
create policy "idea_admin_prices_delete" on public.catalogue_admin_prices
  for delete to authenticated using (public.is_admin());

revoke all on public.catalogue_admin_prices from anon;
grant select, insert, update, delete on public.catalogue_admin_prices to authenticated;
