-- IDEA Command Center — admin-only product metadata corrections.
-- Apply manually to the active Supabase project BEFORE enabling edits.
-- No privileged service-role key is exposed to browsers.
create table if not exists public.catalogue_admin_overrides (
  product_id text primary key,
  visible boolean not null default true,
  name_en text not null check (length(btrim(name_en)) between 1 and 220),
  brand text not null check (length(btrim(brand)) between 1 and 140),
  collection text not null check (collection in ('ceramics','porcelain','tiles','marble')),
  image_url text not null check (image_url like '/images/%' or image_url ~ '^https://[^[:space:]]+/'),
  source_proof_url text not null check (source_proof_url ~ '^https://[^[:space:]]+/'),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);
create index if not exists catalogue_admin_overrides_material_idx
  on public.catalogue_admin_overrides(collection);
alter table public.catalogue_admin_overrides enable row level security;
drop policy if exists "idea_override_public_select" on public.catalogue_admin_overrides;
create policy "idea_override_public_select" on public.catalogue_admin_overrides
  for select to anon, authenticated using (true);
drop policy if exists "idea_override_admin_insert" on public.catalogue_admin_overrides;
create policy "idea_override_admin_insert" on public.catalogue_admin_overrides
  for insert to authenticated with check (public.is_admin());
drop policy if exists "idea_override_admin_update" on public.catalogue_admin_overrides;
create policy "idea_override_admin_update" on public.catalogue_admin_overrides
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "idea_override_admin_delete" on public.catalogue_admin_overrides;
create policy "idea_override_admin_delete" on public.catalogue_admin_overrides
  for delete to authenticated using (public.is_admin());
grant select on public.catalogue_admin_overrides to anon, authenticated;
grant insert, update, delete on public.catalogue_admin_overrides to authenticated;

create table if not exists public.catalogue_admin_audit (
  id bigint generated always as identity primary key,
  product_id text not null,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  actor_id uuid,
  before_record jsonb,
  after_record jsonb,
  created_at timestamptz not null default now()
);
create index if not exists catalogue_admin_audit_latest_idx
  on public.catalogue_admin_audit(created_at desc);
alter table public.catalogue_admin_audit enable row level security;
drop policy if exists "idea_admin_audit_read" on public.catalogue_admin_audit;
create policy "idea_admin_audit_read" on public.catalogue_admin_audit
  for select to authenticated using (public.is_admin());
revoke all on public.catalogue_admin_audit from anon;
grant select on public.catalogue_admin_audit to authenticated;

create or replace function public.log_idea_catalogue_admin_change()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    new.updated_at := now();
    new.updated_by := auth.uid();
  end if;
  insert into public.catalogue_admin_audit(product_id, action, actor_id, before_record, after_record)
  values (
    case when tg_op = 'DELETE' then old.product_id else new.product_id end,
    tg_op,
    auth.uid(),
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
drop trigger if exists idea_catalogue_admin_override_audit on public.catalogue_admin_overrides;
create trigger idea_catalogue_admin_override_audit
  before insert or update or delete on public.catalogue_admin_overrides
  for each row execute function public.log_idea_catalogue_admin_change();

-- Note: storefront catalogue entries remain bundled; these corrections are
-- read through the public RLS SELECT policy. New products require a separate
-- approved import workflow. Overrides cannot create new SKUs.
