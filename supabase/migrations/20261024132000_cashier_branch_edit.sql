CREATE OR REPLACE FUNCTION public.update_cashier(
  p_cashier_id uuid,
  p_full_name text,
  p_username text,
  p_pin text DEFAULT NULL,
  p_branch_id uuid DEFAULT NULL
)
RETURNS TABLE(id uuid, full_name text, username text, branch_id uuid, is_active boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_tenant uuid := public.current_tenant_id(); v_branch uuid := p_branch_id; v_pin_hash text;
BEGIN
  IF v_tenant IS NULL OR NOT public.is_current_tenant_admin() THEN RAISE EXCEPTION 'Admin role required' USING ERRCODE='42501'; END IF;
  IF v_branch IS NULL OR NOT EXISTS (SELECT 1 FROM public.branches b WHERE b.id=v_branch AND b.tenant_id=v_tenant AND b.is_active) THEN RAISE EXCEPTION 'Branch not found' USING ERRCODE='42501'; END IF;
  IF length(btrim(coalesce(p_full_name,''))) < 2 OR btrim(coalesce(p_username,'')) !~ '^[A-Za-z0-9._-]{3,40}$' THEN RAISE EXCEPTION 'Cashier name or username is invalid'; END IF;
  IF p_pin IS NOT NULL AND p_pin !~ '^[0-9]{4,6}$' THEN RAISE EXCEPTION 'PIN is invalid'; END IF;
  IF p_pin IS NOT NULL THEN v_pin_hash := extensions.crypt(p_pin, extensions.gen_salt('bf')); END IF;
  RETURN QUERY UPDATE public.cashiers c SET full_name=btrim(p_full_name), username=lower(btrim(p_username)), branch_id=v_branch, pin_hash=COALESCE(v_pin_hash,c.pin_hash)
    WHERE c.id=p_cashier_id AND c.tenant_id=v_tenant
    RETURNING c.id,c.full_name,c.username,c.branch_id,c.is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cashier not found' USING ERRCODE='P0002'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.update_cashier(uuid,text,text,text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_cashier(uuid,text,text,text,uuid) TO authenticated;
DROP FUNCTION IF EXISTS public.create_cashier(text,text,text);
REVOKE ALL ON FUNCTION public.create_cashier(text,text,text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_cashier(text,text,text,uuid) TO authenticated;
