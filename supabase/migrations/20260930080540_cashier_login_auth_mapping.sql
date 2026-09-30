drop function if exists public.verify_cashier_login(text, text, text);

create or replace function public.verify_cashier_login(
  p_tenant_slug text,
  p_username text,
  p_pin text
)
returns table (id uuid, tenant_id uuid, full_name text, username text, role text, auth_user_id uuid)
language sql
security definer
set search_path = public
as $$
  select c.id, c.tenant_id, c.full_name, c.username, c.role, c.auth_user_id
  from public.cashiers c
  join public.tenants t on t.id = c.tenant_id
  where t.slug = lower(trim(p_tenant_slug))
    and c.username = lower(trim(p_username))
    and c.pin_hash = extensions.crypt(p_pin, c.pin_hash)
  limit 1;
$$;
