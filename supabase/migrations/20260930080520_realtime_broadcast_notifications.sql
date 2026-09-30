create or replace function public.broadcast_tenant_changes()
returns trigger
language plpgsql
security definer
set search_path = public, realtime
as $$
begin
  perform realtime.broadcast_changes(
    'tenant:' || coalesce(new.tenant_id, old.tenant_id)::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    new,
    old
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists orders_broadcast on public.orders;
create trigger orders_broadcast
after insert or update or delete on public.orders
for each row execute function public.broadcast_tenant_changes();

drop trigger if exists waiter_calls_broadcast on public.waiter_calls;
create trigger waiter_calls_broadcast
after insert or update or delete on public.waiter_calls
for each row execute function public.broadcast_tenant_changes();
