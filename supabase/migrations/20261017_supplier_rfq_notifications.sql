-- IDEA supplier quote-request notifications.
-- INSTALL ONLY after marketplace_foundation and auth_workflows migrations.
-- Verified suppliers assigned to RFQs receive a private notification to each
-- company member; RLS already restricts viewing notifications to that user.
create or replace function public.idea_notify_supplier_rfq()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  insert into public.notifications(profile_id,type,title,body,reference_id)
  select distinct cm.user_id, 'buyer_request_received',
    'New buyer request','A buyer has requested prices from your company.',new.request_id
  from public.company_members cm
  where cm.company_id=new.company_id;
  return new;
end;
$$;
drop trigger if exists idea_notify_supplier_rfq_after_assign on public.request_recipients;
create trigger idea_notify_supplier_rfq_after_assign
 after insert on public.request_recipients
 for each row execute function public.idea_notify_supplier_rfq();
revoke all on function public.idea_notify_supplier_rfq() from public,anon,authenticated;
-- Trigger calls as definer and does not require the browser to insert notices.
