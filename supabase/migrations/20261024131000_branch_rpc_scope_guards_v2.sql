-- Public branch directory used by branch-aware menu and QR links.
DROP FUNCTION IF EXISTS public.get_public_branches(text);
CREATE OR REPLACE FUNCTION public.get_public_branches(p_slug text)
RETURNS TABLE(id uuid, tenant_id uuid, name text, slug text, is_active boolean, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$
  SELECT b.id, b.tenant_id, b.name, b.slug, b.is_active, b.created_at
  FROM public.branches b
  JOIN public.tenants t ON t.id = b.tenant_id
  WHERE lower(t.slug) = lower(trim(p_slug)) AND b.is_active
  ORDER BY b.created_at ASC;
$$;
REVOKE ALL ON FUNCTION public.get_public_branches(text) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_branches(text) TO anon;

-- Replace tenant-only category printer writes with branch-scoped writes.
DROP FUNCTION IF EXISTS public.save_category_print_route(uuid, boolean, text);
CREATE FUNCTION public.save_category_print_route(p_category_id uuid, p_separate_print boolean, p_printer_name text DEFAULT NULL, p_branch_id uuid DEFAULT NULL)
RETURNS public.categories LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result public.categories; v_tenant uuid := public.current_tenant_id(); v_branch uuid := COALESCE(p_branch_id, public.current_user_branch_id());
BEGIN
  IF auth.uid() IS NULL OR v_tenant IS NULL OR NOT public.is_current_tenant_admin() THEN RAISE EXCEPTION 'Manager role required' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.branches b WHERE b.id=v_branch AND b.tenant_id=v_tenant AND b.is_active) THEN RAISE EXCEPTION 'Branch is required' USING ERRCODE='42501'; END IF;
  IF length(COALESCE(trim(p_printer_name),'')) > 255 THEN RAISE EXCEPTION 'Printer name is too long'; END IF;
  UPDATE public.categories c SET separate_print=COALESCE(p_separate_print,c.separate_print), printer_name=NULLIF(trim(p_printer_name),'')
  WHERE c.id=p_category_id AND c.tenant_id=v_tenant AND c.branch_id=v_branch RETURNING c.* INTO result;
  IF result.id IS NULL THEN RAISE EXCEPTION 'Category not found in branch' USING ERRCODE='42501'; END IF;
  RETURN result;
END; $$;
GRANT EXECUTE ON FUNCTION public.save_category_print_route(uuid, boolean, text, uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.save_category_print_routes(jsonb);
CREATE FUNCTION public.save_category_print_routes(p_routes jsonb, p_branch_id uuid DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_tenant uuid:=public.current_tenant_id(); v_branch uuid:=COALESCE(p_branch_id,public.current_user_branch_id()); requested_count integer; updated_count integer;
BEGIN
  IF v_tenant IS NULL OR NOT public.is_current_tenant_admin() THEN RAISE EXCEPTION 'Manager role required' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.branches b WHERE b.id=v_branch AND b.tenant_id=v_tenant AND b.is_active) THEN RAISE EXCEPTION 'Branch is required'; END IF;
  IF p_routes IS NULL OR jsonb_typeof(p_routes)<>'array' THEN RAISE EXCEPTION 'Routes must be a JSON array'; END IF;
  requested_count:=jsonb_array_length(p_routes); IF requested_count=0 THEN RETURN 0; END IF;
  WITH routes AS (SELECT (value->>'category_id')::uuid category_id,(value->>'separate_print')::boolean separate_print,NULLIF(trim(value->>'printer_name'),'') printer_name FROM jsonb_array_elements(p_routes) entry(value)), updated AS (UPDATE public.categories c SET separate_print=r.separate_print,printer_name=r.printer_name FROM routes r WHERE c.id=r.category_id AND c.tenant_id=v_tenant AND c.branch_id=v_branch RETURNING c.id) SELECT count(*) INTO updated_count FROM updated;
  IF updated_count<>requested_count THEN RAISE EXCEPTION 'One or more categories are missing or belong to another branch' USING ERRCODE='42501'; END IF;
  RETURN updated_count;
END; $$;
GRANT EXECUTE ON FUNCTION public.save_category_print_routes(jsonb, uuid) TO authenticated;

-- Scope ingredient availability changes to the selected branch.
DROP FUNCTION IF EXISTS public.set_menu_ingredient_availability(uuid, boolean);
CREATE FUNCTION public.set_menu_ingredient_availability(p_ingredient_id uuid, p_available boolean, p_branch_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_tenant uuid:=public.current_tenant_id(); v_branch uuid:=COALESCE(p_branch_id,public.current_user_branch_id()); v_count integer;
BEGIN
  IF v_tenant IS NULL OR (NOT public.is_current_tenant_admin() AND NOT EXISTS (SELECT 1 FROM public.cashiers c WHERE c.auth_user_id=auth.uid() AND c.tenant_id=v_tenant AND c.branch_id=v_branch AND c.is_active)) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
  IF p_available IS NULL OR v_branch IS NULL THEN RAISE EXCEPTION 'Availability and branch are required'; END IF;
  UPDATE public.menu_ingredients SET available=p_available WHERE id=p_ingredient_id AND tenant_id=v_tenant AND branch_id=v_branch;
  GET DIAGNOSTICS v_count=ROW_COUNT; IF v_count=0 THEN RAISE EXCEPTION 'Ingredient not found in branch' USING ERRCODE='P0002'; END IF;
END; $$;
GRANT EXECUTE ON FUNCTION public.set_menu_ingredient_availability(uuid, boolean, uuid) TO authenticated;

-- Ensure a saved item cannot point at a category from another branch.
CREATE OR REPLACE FUNCTION public.save_menu_item_with_ingredients(p_item jsonb,p_ingredient_ids uuid[] DEFAULT ARRAY[]::uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_tenant_id uuid:=public.current_tenant_id(); v_branch_id uuid; v_item public.menu_items%ROWTYPE; v_exists boolean; v_primary uuid;
BEGIN
 IF v_tenant_id IS NULL OR NOT public.is_current_tenant_admin() THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 v_item:=pg_catalog.jsonb_populate_record(NULL::public.menu_items,p_item); v_branch_id:=COALESCE(v_item.branch_id,(SELECT b.id FROM public.branches b WHERE b.tenant_id=v_tenant_id AND b.slug='main' LIMIT 1));
 IF v_item.id IS NULL THEN v_item.id:=pg_catalog.gen_random_uuid(); END IF; v_item.name:=pg_catalog.btrim(v_item.name);
 IF v_item.name IS NULL OR v_item.name='' OR v_item.price IS NULL OR v_item.price<0 THEN RAISE EXCEPTION 'Menu item name and a non-negative price are required'; END IF;
 IF v_branch_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.branches b WHERE b.id=v_branch_id AND b.tenant_id=v_tenant_id AND b.is_active) THEN RAISE EXCEPTION 'Branch is required'; END IF;
 IF COALESCE(v_item.category_id,'all') <> 'all' AND NOT EXISTS(SELECT 1 FROM public.categories c WHERE c.id=v_item.category_id AND c.tenant_id=v_tenant_id AND c.branch_id=v_branch_id) THEN RAISE EXCEPTION 'Category does not belong to branch'; END IF;
 IF EXISTS(SELECT 1 FROM pg_catalog.unnest(COALESCE(p_ingredient_ids,ARRAY[]::uuid[])) r LEFT JOIN public.menu_ingredients i ON i.id=r AND i.tenant_id=v_tenant_id AND i.branch_id=v_branch_id WHERE r IS NOT NULL AND i.id IS NULL) THEN RAISE EXCEPTION 'Ingredient does not belong to branch'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.menu_items mi WHERE mi.id=v_item.id AND mi.tenant_id=v_tenant_id AND mi.branch_id=v_branch_id FOR UPDATE) INTO v_exists;
 IF v_exists THEN SELECT x.ingredient_id INTO v_primary FROM public.menu_item_ingredients x WHERE x.tenant_id=v_tenant_id AND x.branch_id=v_branch_id AND x.menu_item_id=v_item.id AND x.is_primary LIMIT 1;
  UPDATE public.menu_items SET name=v_item.name,price=v_item.price,category_id=COALESCE(v_item.category_id,'all'),description=v_item.description,image=v_item.image,allergens=v_item.allergens,tags=v_item.tags,available=COALESCE(v_item.available,true),recommendation_item_ids=COALESCE(v_item.recommendation_item_ids,ARRAY[]::uuid[]),addon_options=COALESCE(v_item.addon_options,ARRAY[]::text[]),free_addon_item_ids=COALESCE(v_item.free_addon_item_ids,ARRAY[]::uuid[]),max_addons=COALESCE(v_item.max_addons,0) WHERE id=v_item.id AND tenant_id=v_tenant_id AND branch_id=v_branch_id;
 ELSE INSERT INTO public.menu_items(id,name,price,category_id,description,image,allergens,tags,available,recommendation_item_ids,addon_options,free_addon_item_ids,max_addons,tenant_id,branch_id) VALUES(v_item.id,v_item.name,v_item.price,COALESCE(v_item.category_id,'all'),v_item.description,v_item.image,v_item.allergens,v_item.tags,COALESCE(v_item.available,true),COALESCE(v_item.recommendation_item_ids,ARRAY[]::uuid[]),COALESCE(v_item.addon_options,ARRAY[]::text[]),COALESCE(v_item.free_addon_item_ids,ARRAY[]::uuid[]),COALESCE(v_item.max_addons,0),v_tenant_id,v_branch_id); END IF;
 DELETE FROM public.menu_item_ingredients WHERE menu_item_id=v_item.id AND tenant_id=v_tenant_id AND branch_id=v_branch_id;
 INSERT INTO public.menu_item_ingredients(tenant_id,branch_id,menu_item_id,ingredient_id,is_primary) SELECT v_tenant_id,v_branch_id,v_item.id,x,false FROM pg_catalog.unnest(COALESCE(p_ingredient_ids,ARRAY[]::uuid[])) x;
END; $$;
GRANT EXECUTE ON FUNCTION public.save_menu_item_with_ingredients(jsonb,uuid[]) TO authenticated;
