-- Save category printer routes atomically so a failed category cannot leave the store
-- with an unreported partial set of printer assignments.
CREATE OR REPLACE FUNCTION public.save_category_print_routes(p_routes jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  active_tenant_id uuid := public.current_tenant_id();
  requested_count integer;
  updated_count integer;
BEGIN
  IF auth.uid() IS NULL OR active_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Authenticated tenant session required' USING ERRCODE = '42501';
  END IF;
  IF NOT public.is_current_tenant_admin() AND NOT EXISTS (
    SELECT 1 FROM public.cashiers c
    WHERE c.auth_user_id = auth.uid() AND c.tenant_id = active_tenant_id
  ) THEN
    RAISE EXCEPTION 'Manager or cashier role required' USING ERRCODE = '42501';
  END IF;
  IF p_routes IS NULL OR jsonb_typeof(p_routes) <> 'array' THEN
    RAISE EXCEPTION 'Routes must be a JSON array';
  END IF;

  requested_count := jsonb_array_length(p_routes);
  IF requested_count > 500 THEN
    RAISE EXCEPTION 'Too many category routes';
  END IF;
  IF requested_count = 0 THEN
    RETURN 0;
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_routes) AS entry(value)
    WHERE jsonb_typeof(value) <> 'object'
       OR NOT (value ? 'category_id')
       OR NULLIF(value->>'category_id', '') IS NULL
       OR NOT (value ? 'separate_print')
       OR jsonb_typeof(value->'separate_print') <> 'boolean'
       OR ((value ? 'printer_name')
           AND value->'printer_name' <> 'null'::jsonb
           AND jsonb_typeof(value->'printer_name') <> 'string')
       OR length(COALESCE(trim(value->>'printer_name'), '')) > 255
  ) THEN
    RAISE EXCEPTION 'One or more category routes are invalid';
  END IF;
  IF EXISTS (
    SELECT value->>'category_id'
    FROM jsonb_array_elements(p_routes) AS entry(value)
    GROUP BY value->>'category_id'
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate category route';
  END IF;

  WITH routes AS (
    SELECT (value->>'category_id')::uuid AS category_id,
           (value->>'separate_print')::boolean AS separate_print,
           NULLIF(trim(value->>'printer_name'), '') AS printer_name
    FROM jsonb_array_elements(p_routes) AS entry(value)
  ), updated AS (
    UPDATE public.categories AS category
    SET separate_print = route.separate_print,
        printer_name = route.printer_name
    FROM routes AS route
    WHERE category.id = route.category_id
      AND category.tenant_id = active_tenant_id
    RETURNING category.id
  )
  SELECT count(*) INTO updated_count FROM updated;

  IF updated_count <> requested_count THEN
    RAISE EXCEPTION 'One or more categories are missing or belong to another tenant' USING ERRCODE = '42501';
  END IF;
  RETURN updated_count;
END;
$$;

REVOKE ALL ON FUNCTION public.save_category_print_routes(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_category_print_routes(jsonb) TO authenticated;
