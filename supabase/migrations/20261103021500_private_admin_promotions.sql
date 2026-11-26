-- IDEA supplier promotions and purchase prices remain administrator-private.
-- This table never creates a public-facing discount or product publication.
-- Run only on the connected IDEA Supabase project after reviewing its role model.
create table if not exists public.catalogue_admin_promotions (
    id uuid primary key default gen_random_uuid(),
    product_id text not null check (length(btrim(product_id)) between 1 and 160),
    source_id text not null check (length(btrim(source_id)) between 1 and 80),
    source_product_url text not null check (source_product_url ~ '^https://[^[:space:]]+$'),
    offer_label text not null check (length(btrim(offer_label)) between 1 and 220),
    standard_price numeric(14,2) check (standard_price is null or standard_price >= 0),
    promotional_price numeric(14,2) not null check (promotional_price >= 0),
    currency text not null default 'EGP' check (currency = 'EGP'),
    starts_at date,
    ends_at date,
    review_status text not null default 'draft'
      check (review_status in ('draft','verified','rejected')),
    created_by uuid not null default auth.uid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint promo_price_not_above_regular
      check (standard_price is null or promotional_price <= standard_price),
    constraint valid_promo_window
      check (starts_at is null or ends_at is null or starts_at <= ends_at)
);
create index if not exists idea_admin_promos_product_id
  on public.catalogue_admin_promotions(product_id);
create index if not exists idea_admin_promos_status
  on public.catalogue_admin_promotions(review_status);

alter table public.catalogue_admin_promotions enable row level security;
alter table public.catalogue_admin_promotions force row level security;

drop policy if exists "idea_admin_promotions_read" on public.catalogue_admin_promotions;
create policy "idea_admin_promotions_read" on public.catalogue_admin_promotions
  for select to authenticated using (public.is_admin());

drop policy if exists "idea_admin_promotions_insert" on public.catalogue_admin_promotions;
create policy "idea_admin_promotions_insert" on public.catalogue_admin_promotions
  for insert to authenticated with check (public.is_admin() and created_by = auth.uid());

drop policy if exists "idea_admin_promotions_update" on public.catalogue_admin_promotions;
create policy "idea_admin_promotions_update" on public.catalogue_admin_promotions
  for update to authenticated using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "idea_admin_promotions_delete" on public.catalogue_admin_promotions;
create policy "idea_admin_promotions_delete" on public.catalogue_admin_promotions
  for delete to authenticated using (public.is_admin());

revoke all on public.catalogue_admin_promotions from anon;
grant select, insert, update, delete on public.catalogue_admin_promotions to authenticated;
