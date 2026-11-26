-- IDEA marketplace foundation. Apply with the Supabase CLI/dashboard migration runner.
-- This migration contains no catalogue data and no secrets.

create extension if not exists pgcrypto;

create type public.idea_role as enum ('buyer', 'supplier', 'admin');
create type public.company_status as enum ('draft', 'submitted', 'verified', 'rejected', 'suspended');
create type public.request_status as enum ('draft', 'submitted', 'awaiting_quotes', 'quotes_received', 'offer_selected', 'closed', 'cancelled');
create type public.quote_status as enum ('draft', 'submitted', 'accepted', 'rejected', 'expired');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  phone text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role public.idea_role not null default 'buyer',
  granted_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  public_name text not null,
  description text,
  email text,
  phone text,
  logo_path text,
  status public.company_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null default 'owner' check (member_role in ('owner', 'manager', 'sales')),
  primary key (company_id, user_id)
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  label text not null,
  governorate text not null,
  address_line text not null,
  phone text,
  created_at timestamptz not null default now(),
  check ((profile_id is not null)::int + (company_id is not null)::int = 1)
);

create table public.catalog_products (
  id text primary key,
  source_id text not null,
  source_url text not null,
  product_url text,
  source_payload jsonb not null,
  imported_at timestamptz not null default now()
);

create table public.supplier_listings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  catalog_product_id text references public.catalog_products(id) on delete set null,
  title text not null,
  sku text,
  availability text,
  minimum_order_quantity numeric check (minimum_order_quantity is null or minimum_order_quantity >= 0),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index supplier_listings_company_idx on public.supplier_listings(company_id);

create table public.buyer_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id),
  governorate text not null,
  destination text,
  delivery_date date,
  project_type text,
  notes text,
  status public.request_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index buyer_requests_buyer_idx on public.buyer_requests(buyer_id, created_at desc);

create table public.buyer_request_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.buyer_requests(id) on delete cascade,
  catalog_product_id text references public.catalog_products(id) on delete set null,
  requested_quantity numeric not null check (requested_quantity > 0),
  unit text not null check (unit in ('sqm', 'pieces')),
  variant_label text
);

create table public.request_recipients (
  request_id uuid not null references public.buyer_requests(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, company_id)
);

create table public.request_images (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.buyer_requests(id) on delete cascade,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create table public.supplier_quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.buyer_requests(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  status public.quote_status not null default 'draft',
  currency text not null default 'EGP' check (currency = 'EGP'),
  availability text,
  lead_time_days integer check (lead_time_days is null or lead_time_days >= 0),
  minimum_order_quantity numeric check (minimum_order_quantity is null or minimum_order_quantity >= 0),
  notes text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, company_id)
);

create table public.supplier_quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.supplier_quotes(id) on delete cascade,
  request_item_id uuid not null references public.buyer_request_items(id) on delete cascade,
  quoted_quantity numeric not null check (quoted_quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  total_price numeric generated always as (quoted_quantity * unit_price) stored
);

create table public.favorites (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  catalog_product_id text not null references public.catalog_products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, catalog_product_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  reference_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_profile_idx on public.notifications(profile_id, created_at desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin');
$$;
create or replace function public.is_company_member(target_company uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.company_members where company_id = target_company and user_id = auth.uid());
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.addresses enable row level security;
alter table public.catalog_products enable row level security;
alter table public.supplier_listings enable row level security;
alter table public.buyer_requests enable row level security;
alter table public.buyer_request_items enable row level security;
alter table public.request_recipients enable row level security;
alter table public.request_images enable row level security;
alter table public.supplier_quotes enable row level security;
alter table public.supplier_quote_items enable row level security;
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles: self read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles: self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "roles: self read" on public.user_roles for select using (user_id = auth.uid() or public.is_admin());
create policy "companies: public verified read" on public.companies for select using (status = 'verified' or public.is_company_member(id) or public.is_admin());
create policy "companies: members update" on public.companies for update using (public.is_company_member(id) or public.is_admin());
create policy "members: own company read" on public.company_members for select using (user_id = auth.uid() or public.is_company_member(company_id) or public.is_admin());
create policy "catalog: public read" on public.catalog_products for select using (true);
create policy "listings: public active read" on public.supplier_listings for select using (active or public.is_company_member(company_id) or public.is_admin());
create policy "listings: company write" on public.supplier_listings for all using (public.is_company_member(company_id) or public.is_admin()) with check (public.is_company_member(company_id) or public.is_admin());
create policy "requests: buyer read" on public.buyer_requests for select using (buyer_id = auth.uid() or exists (select 1 from public.request_recipients rr where rr.request_id = id and public.is_company_member(rr.company_id)) or public.is_admin());
create policy "requests: buyer create" on public.buyer_requests for insert with check (buyer_id = auth.uid());
create policy "requests: buyer update" on public.buyer_requests for update using (buyer_id = auth.uid() or public.is_admin());
create policy "request items: authorized read" on public.buyer_request_items for select using (exists (select 1 from public.buyer_requests r where r.id = request_id and (r.buyer_id = auth.uid() or public.is_admin() or exists (select 1 from public.request_recipients rr where rr.request_id = r.id and public.is_company_member(rr.company_id)))));
create policy "favorites: own" on public.favorites for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "notifications: own" on public.notifications for select using (profile_id = auth.uid() or public.is_admin());
create policy "notifications: own update" on public.notifications for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "quotes: routed read" on public.supplier_quotes for select using (public.is_company_member(company_id) or exists (select 1 from public.buyer_requests r where r.id = request_id and r.buyer_id = auth.uid()) or public.is_admin());
create policy "quotes: routed write" on public.supplier_quotes for all using (public.is_company_member(company_id) or public.is_admin()) with check (public.is_company_member(company_id) or public.is_admin());
create policy "quote items: authorized read" on public.supplier_quote_items for select using (exists (select 1 from public.supplier_quotes q where q.id = quote_id and (public.is_company_member(q.company_id) or public.is_admin() or exists (select 1 from public.buyer_requests r where r.id = q.request_id and r.buyer_id = auth.uid()))));

-- Service-role-only mutation tables: imports, recipient matching, audit and storage metadata.
-- Their RLS policies intentionally deny direct browser writes.
