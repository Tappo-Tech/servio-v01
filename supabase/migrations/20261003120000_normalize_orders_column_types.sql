-- Keep the order payload as one JSON document (an array), matching the app payload.
alter table public.orders
  alter column items type jsonb
  using coalesce(to_jsonb(items), '[]'::jsonb);

alter table public.orders
  alter column items set default '[]'::jsonb,
  alter column items set not null,
  alter column total_price type numeric(12,2)
    using round(coalesce(total_price, 0), 2),
  alter column total_price set default 0,
  alter column total_price set not null,
  alter column table_number set default 'غير محدد',
  alter column table_number set not null,
  alter column status set default 'pending',
  alter column status set not null,
  alter column is_completed set default false,
  alter column is_completed set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column completed_at drop default;

alter table public.orders drop constraint if exists orders_items_json_array_check;
alter table public.orders add constraint orders_items_json_array_check
  check (jsonb_typeof(items) = 'array');

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'preparing', 'ready', 'served', 'unclaimed', 'cancelled'));

create or replace function public.create_public_order(
  p_slug text,
  p_items jsonb,
  p_total_price numeric,
  p_table_number text,
  p_notes text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.orders;
begin
  insert into public.orders (tenant_id, items, total_price, table_number, notes, status, is_completed, completed_at)
  select
    t.id,
    case when jsonb_typeof(coalesce(p_items, '[]'::jsonb)) = 'array'
      then coalesce(p_items, '[]'::jsonb)
      else '[]'::jsonb
    end,
    round(coalesce(p_total_price, 0), 2),
    coalesce(nullif(trim(p_table_number), ''), 'غير محدد'),
    nullif(trim(coalesce(p_notes, '')), ''),
    'pending',
    false,
    null
  from public.tenants t
  where t.slug = lower(trim(p_slug))
  returning * into result;

  if result.id is null then raise exception 'Tenant not found'; end if;
  return result;
end;
$$;

revoke all on function public.create_public_order(text, jsonb, numeric, text, text) from public, anon, authenticated;
grant execute on function public.create_public_order(text, jsonb, numeric, text, text) to anon, authenticated;
