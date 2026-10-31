-- Printer routing is a branch-scoped operational setting; active cashiers can save it from the cashier surface.
CREATE OR REPLACE FUNCTION public.save_category_print_routes(p_routes jsonb, p_branch_id uuid DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
  v_tenant uuid := public.current_tenant_id();
  v_branch uuid := COALESCE(p_branch_id, public.current_user_branch_id());
  requested_count integer;
  updated_count integer;
BEGIN
  IF v_tenant IS NULL OR NOT (
    public.is_current_tenant_admin()
    OR EXISTS (SELECT 1 FROM public.cashiers c WHERE c.auth_user_id=auth.uid() AND c.tenant_id=v_tenant AND c.branch_id=v_branch AND c.is_active)
  ) THEN RAISE EXCEPTION 'Manager or active cashier role required' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.branches b WHERE b.id=v_branch AND b.tenant_id=v_tenant AND b.is_active) THEN RAISE EXCEPTION 'Branch is required'; END IF;
  IF p_routes IS NULL OR jsonb_typeof(p_routes)<>'array' THEN RAISE EXCEPTION 'Routes must be a JSON array'; END IF;
  requested_count:=jsonb_array_length(p_routes); IF requested_count=0 THEN RETURN 0; END IF;
  WITH routes AS (
    SELECT (value->>'category_id')::uuid category_id,(value->>'separate_print')::boolean separate_print,
      NULLIF(trim(value->>'printer_name'),'') printer_name,(value->>'split_print')::boolean split_print
    FROM jsonb_array_elements(p_routes) entry(value)
  ), updated AS (
    UPDATE public.categories c SET separate_print=COALESCE(r.separate_print,c.separate_print),
      printer_name=CASE WHEN r.printer_name IS NULL THEN NULL ELSE r.printer_name END,
      split_print=COALESCE(r.split_print,c.split_print)
    FROM routes r WHERE c.id=r.category_id AND c.tenant_id=v_tenant AND c.branch_id=v_branch RETURNING c.id
  ) SELECT count(*) INTO updated_count FROM updated;
  IF updated_count<>requested_count THEN RAISE EXCEPTION 'One or more categories are missing or belong to another branch' USING ERRCODE='42501'; END IF;
  RETURN updated_count;
END;
$$;
