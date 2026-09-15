-- Production auth, workflow RPCs and private request-reference storage.
-- Apply after 20260915190000_marketplace_foundation.sql.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, phone)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(new.email, new.phone, 'IDEA Member'), '@', 1)),
    nullif(new.phone, '')
  ) on conflict (id) do nothing;

  -- Every self-registered account begins as a buyer. There is deliberately no
  -- browser-write policy for user_roles; supplier/admin roles are granted by
  -- a controlled server-side process only.
  insert into public.user_roles (user_id, role) values (new.id, 'buyer')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create policy "profiles: self insert" on public.profiles
for insert with check (id = auth.uid());

create policy "request items: buyer create" on public.buyer_request_items
for insert with check (exists (
  select 1 from public.buyer_requests r where r.id = request_id and r.buyer_id = auth.uid()
));
create policy "request recipients: routed read" on public.request_recipients
for select using (exists (
  select 1 from public.buyer_requests r where r.id = request_id and
  (r.buyer_id = auth.uid() or public.is_company_member(company_id) or public.is_admin())
));
create policy "request images: authorized read" on public.request_images
for select using (exists (
  select 1 from public.buyer_requests r where r.id = request_id and
  (r.buyer_id = auth.uid() or public.is_admin())
));
create policy "request images: buyer create" on public.request_images
for insert with check (exists (
  select 1 from public.buyer_requests r where r.id = request_id and r.buyer_id = auth.uid()
));
create policy "quote items: supplier write" on public.supplier_quote_items
for all using (exists (
  select 1 from public.supplier_quotes q where q.id = quote_id and (public.is_company_member(q.company_id) or public.is_admin())
)) with check (exists (
  select 1 from public.supplier_quotes q where q.id = quote_id and (public.is_company_member(q.company_id) or public.is_admin())
));

create or replace function public.create_buyer_request(
  p_governorate text,
  p_destination text,
  p_delivery_date date,
  p_project_type text,
  p_notes text,
  p_items jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_request_id uuid; v_item jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'buyer') then
    raise exception 'Only buyer accounts can create requests';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'At least one request item is required'; end if;
  insert into public.buyer_requests (buyer_id, governorate, destination, delivery_date, project_type, notes, status)
  values (auth.uid(), p_governorate, nullif(p_destination, ''), p_delivery_date, nullif(p_project_type, ''), nullif(p_notes, ''), 'submitted')
  returning id into v_request_id;
  for v_item in select value from jsonb_array_elements(p_items) loop
    insert into public.buyer_request_items (request_id, catalog_product_id, requested_quantity, unit, variant_label)
    values (v_request_id, nullif(v_item ->> 'productId', ''), (v_item ->> 'quantity')::numeric, v_item ->> 'unit', nullif(v_item ->> 'variantLabel', ''));
  end loop;
  perform public.match_request_suppliers(v_request_id);
  insert into public.notifications (profile_id, type, title, body, reference_id)
  values (auth.uid(), 'rfq_created', 'Request submitted', 'Your request has been submitted to eligible suppliers.', v_request_id);
  return v_request_id;
end;
$$;

create or replace function public.match_request_suppliers(p_request_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.buyer_requests where id = p_request_id and buyer_id = auth.uid()) and not public.is_admin() then
    raise exception 'Not authorized to match this request';
  end if;
  insert into public.request_recipients (request_id, company_id)
  select distinct p_request_id, l.company_id
  from public.supplier_listings l
  join public.companies c on c.id = l.company_id and c.status = 'verified'
  join public.buyer_request_items i on i.request_id = p_request_id
  where l.active and (l.catalog_product_id = i.catalog_product_id or l.catalog_product_id is null)
  on conflict do nothing;
  update public.buyer_requests set status = case when exists (select 1 from public.request_recipients where request_id = p_request_id) then 'awaiting_quotes' else 'submitted' end, updated_at = now() where id = p_request_id;
end;
$$;

create or replace function public.submit_supplier_quote(
  p_request_id uuid, p_availability text, p_lead_time_days integer, p_minimum_order_quantity numeric, p_notes text, p_expires_at timestamptz, p_items jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_company_id uuid; v_quote_id uuid; v_item jsonb;
begin
  select rr.company_id into v_company_id from public.request_recipients rr
  where rr.request_id = p_request_id and public.is_company_member(rr.company_id) limit 1;
  if v_company_id is null then raise exception 'No supplier assignment for this request'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'At least one quote item is required'; end if;
  insert into public.supplier_quotes (request_id, company_id, status, availability, lead_time_days, minimum_order_quantity, notes, expires_at)
  values (p_request_id, v_company_id, 'submitted', nullif(p_availability, ''), p_lead_time_days, p_minimum_order_quantity, nullif(p_notes, ''), p_expires_at)
  on conflict (request_id, company_id) do update set status = 'submitted', availability = excluded.availability, lead_time_days = excluded.lead_time_days, minimum_order_quantity = excluded.minimum_order_quantity, notes = excluded.notes, expires_at = excluded.expires_at, updated_at = now()
  returning id into v_quote_id;
  delete from public.supplier_quote_items where quote_id = v_quote_id;
  for v_item in select value from jsonb_array_elements(p_items) loop
    insert into public.supplier_quote_items (quote_id, request_item_id, quoted_quantity, unit_price)
    select v_quote_id, i.id, (v_item ->> 'quantity')::numeric, (v_item ->> 'unitPrice')::numeric
    from public.buyer_request_items i where i.id = (v_item ->> 'requestItemId')::uuid and i.request_id = p_request_id;
  end loop;
  update public.buyer_requests set status = 'quotes_received', updated_at = now() where id = p_request_id;
  insert into public.notifications (profile_id, type, title, body, reference_id)
  select buyer_id, 'quote_received', 'New supplier quotation', 'A supplier has submitted a quotation for your request.', p_request_id from public.buyer_requests where id = p_request_id;
  return v_quote_id;
end;
$$;

revoke all on function public.create_buyer_request(text, text, date, text, text, jsonb) from public;
revoke all on function public.match_request_suppliers(uuid) from public;
revoke all on function public.submit_supplier_quote(uuid, text, integer, numeric, text, timestamptz, jsonb) from public;
grant execute on function public.create_buyer_request(text, text, date, text, text, jsonb) to authenticated;
grant execute on function public.submit_supplier_quote(uuid, text, integer, numeric, text, timestamptz, jsonb) to authenticated;

insert into storage.buckets (id, name, public) values ('request-references', 'request-references', false)
on conflict (id) do update set public = false;
create policy "request files: own upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'request-references' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "request files: own read" on storage.objects for select to authenticated using (
  bucket_id = 'request-references' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "request files: own delete" on storage.objects for delete to authenticated using (
  bucket_id = 'request-references' and (storage.foldername(name))[1] = auth.uid()::text
);
