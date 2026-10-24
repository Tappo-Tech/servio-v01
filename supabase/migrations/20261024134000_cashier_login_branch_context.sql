DROP FUNCTION IF EXISTS public.verify_cashier_login(text,text,text);
CREATE FUNCTION public.verify_cashier_login(p_tenant_slug text,p_username text,p_pin text)
RETURNS TABLE(id uuid,tenant_id uuid,branch_id uuid,full_name text,username text,role text,auth_user_id uuid)
LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
  SELECT cashier.id,cashier.tenant_id,cashier.branch_id,cashier.full_name,cashier.username,cashier.role,cashier.auth_user_id
  FROM public.cashiers cashier JOIN public.tenants tenant ON tenant.id=cashier.tenant_id
  WHERE tenant.slug=lower(btrim(p_tenant_slug)) AND cashier.username=lower(btrim(p_username)) AND cashier.is_active IS TRUE AND cashier.pin_hash=extensions.crypt(p_pin,cashier.pin_hash) LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.verify_cashier_login(text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.verify_cashier_login(text,text,text) TO service_role;
