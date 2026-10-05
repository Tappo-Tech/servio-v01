-- تتبع عام آمن لطلب واحد: لا يُكشف الطلب إلا برمز عشوائي قوي يُعاد مرة واحدة عند الإنشاء.
alter table public.orders
  add column if not exists tracking_token_hash text;

comment on column public.orders.tracking_token_hash is
  'SHA-256 digest of a one-order public tracking token; never returned by public RPCs.';

create or replace function public.create_public_order_with_tracking(
  p_slug text,
  p_items jsonb,
  p_total_price numeric,
  p_table_number text,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  result public.orders;
  target_tenant_id uuid;
  tracking_token text;
begin
  select t.id
    into target_tenant_id
    from public.tenants t
   where t.slug = lower(trim(p_slug))
   limit 1;

  if target_tenant_id is null then
    raise exception 'Tenant not found';
  end if;

  -- 256-bit random bearer secret; only its digest is persisted in the orders table.
  tracking_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.orders (
    tenant_id, items, total_price, table_number, notes,
    status, is_completed, completed_at, tracking_token_hash
  ) values (
    target_tenant_id,
    case when jsonb_typeof(coalesce(p_items, '[]'::jsonb)) = 'array'
      then coalesce(p_items, '[]'::jsonb)
      else '[]'::jsonb
    end,
    round(coalesce(p_total_price, 0), 2),
    coalesce(nullif(trim(p_table_number), ''), 'غير محدد'),
    nullif(trim(coalesce(p_notes, '')), ''),
    'pending',
    false,
    null,
    encode(extensions.digest(tracking_token, 'sha256'), 'hex')
  )
  returning * into result;

  return jsonb_build_object(
    'order_id', result.id,
    'tracking_token', tracking_token,
    'status', result.status,
    'created_at', result.created_at,
    'total_price', result.total_price,
    'table_number', result.table_number
  );
end;
$$;

create or replace function public.get_public_order_tracking(
  p_slug text,
  p_order_id uuid,
  p_tracking_token text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  result jsonb;
begin
  if p_order_id is null or nullif(p_tracking_token, '') is null then
    return null;
  end if;

  -- لا نعيد إلا حالة هذا الطلب وتوقيته؛ لا أصناف أو بيانات عميل أو طلبات أخرى.
  select jsonb_build_object(
      'order_id', o.id,
      'status', o.status,
      'table_number', o.table_number,
      'created_at', o.created_at,
      'completed_at', o.completed_at
    )
    into result
    from public.orders o
    join public.tenants t on t.id = o.tenant_id
   where o.id = p_order_id
     and t.slug = lower(trim(p_slug))
     and o.tracking_token_hash = encode(extensions.digest(p_tracking_token, 'sha256'), 'hex')
   limit 1;

  return result;
end;
$$;

revoke all on function public.create_public_order_with_tracking(text, jsonb, numeric, text, text)
  from public, anon, authenticated;
grant execute on function public.create_public_order_with_tracking(text, jsonb, numeric, text, text)
  to anon, authenticated;

revoke all on function public.get_public_order_tracking(text, uuid, text)
  from public, anon, authenticated;
grant execute on function public.get_public_order_tracking(text, uuid, text)
  to anon, authenticated;
