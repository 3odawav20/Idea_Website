-- IDEA registration: individual buyers and reviewed business/supplier applications.
-- Apply after 20260915190000_marketplace_foundation.sql and 20260915193000_auth_workflows_and_storage.sql.
-- Untrusted signup metadata is never used to grant a supplier/admin role.

create table if not exists public.supplier_applications (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  company_name text not null check (char_length(company_name) between 2 and 150),
  contact_name text not null check (char_length(contact_name) between 1 and 120),
  contact_email text not null,
  contact_phone text not null check (char_length(contact_phone) between 3 and 35),
  company_type text not null default 'supplier'
    check (company_type in ('supplier', 'manufacturer', 'showroom')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  company_id uuid references public.companies(id) on delete set null,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists supplier_applications_status_idx
on public.supplier_applications(status, created_at desc);

alter table public.supplier_applications enable row level security;
drop policy if exists "supplier applications: own or admin read" on public.supplier_applications;
create policy "supplier applications: own or admin read"
  on public.supplier_applications for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
-- No INSERT/UPDATE/DELETE policies for unprivileged clients; requests are captured by the server trigger.
revoke all on public.supplier_applications from anon;
grant select on public.supplier_applications to authenticated;

create or replace function public.capture_idea_business_registration()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.raw_user_meta_data ->> 'requested_account_type' = 'business' then
    insert into public.supplier_applications
      (user_id, company_name, contact_name, contact_email, contact_phone, company_type)
    values (
      new.id,
      left(trim(coalesce(new.raw_user_meta_data ->> 'company_name', '')), 150),
      left(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 120),
      coalesce(new.email, ''),
      left(trim(coalesce(new.raw_user_meta_data ->> 'company_phone', '')), 35),
      case new.raw_user_meta_data ->> 'company_type'
        when 'manufacturer' then 'manufacturer'
        when 'showroom' then 'showroom'
        else 'supplier'
      end
    );
  end if;
  return new;
end;
$$;

-- Run after on_auth_user_created: that trigger creates public.profiles and the initial buyer role.
drop trigger if exists zzz_capture_idea_business_registration on auth.users;
create trigger zzz_capture_idea_business_registration
after insert on auth.users for each row
execute function public.capture_idea_business_registration();

create or replace function public.review_idea_supplier_application(
  p_user_id uuid, p_approve boolean
) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_application public.supplier_applications%rowtype;
  v_company uuid;
begin
  if not public.is_admin() then
    raise exception 'Administrator permission required' using errcode = '42501';
  end if;
  select * into v_application
  from public.supplier_applications
  where user_id = p_user_id
  for update;
  if not found then raise exception 'Supplier application not found'; end if;
  if v_application.status <> 'pending' then
    raise exception 'Application has already been reviewed';
  end if;

  if p_approve then
    insert into public.companies
      (legal_name, public_name, email, phone, status)
    values
      (v_application.company_name, v_application.company_name,
       v_application.contact_email, v_application.contact_phone, 'submitted')
    returning id into v_company;

    insert into public.company_members (company_id, user_id, member_role)
    values (v_company, p_user_id, 'owner');

    insert into public.user_roles (user_id, role, granted_by)
    values (p_user_id, 'supplier', auth.uid())
    on conflict (user_id) do update
      set role = 'supplier', granted_by = excluded.granted_by;

    update public.supplier_applications
    set status = 'approved', company_id = v_company,
        reviewed_by = auth.uid(), reviewed_at = now()
    where user_id = p_user_id;
    return 'approved';
  end if;

  update public.supplier_applications
  set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
  where user_id = p_user_id;
  return 'rejected';
end;
$$;

revoke all on function public.review_idea_supplier_application(uuid, boolean) from public, anon;
grant execute on function public.review_idea_supplier_application(uuid, boolean) to authenticated;