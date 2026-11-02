-- Keep menu writes in SECURITY DEFINER functions so manager RLS and branch
-- scoping are consistent. Cashiers receive only the availability operation.
CREATE OR REPLACE FUNCTION public.set_menu_item_availability(
  p_item_id uuid,
  p_available boolean,
  p_branch_id uuid DEFAULT NULL
)
RETURNS public.menu_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid := public.current_tenant_id();
  v_branch_id uuid := COALESCE(p_branch_id, public.current_user_branch_id());
  v_item public.menu_items;
BEGIN
  IF auth.uid() IS NULL OR v_tenant_id IS NULL OR p_available IS NULL OR v_branch_id IS NULL THEN
    RAISE EXCEPTION 'Availability and branch are required' USING ERRCODE = '22023';
  END IF;
  IF NOT public.is_current_tenant_admin()
     AND NOT public.is_active_cashier_in_branch(v_tenant_id, v_branch_id) THEN
    RAISE EXCEPTION 'Not authorized to change item availability' USING ERRCODE = '42501';
  END IF;
  UPDATE public.menu_items
  SET available = p_available
  WHERE id = p_item_id AND tenant_id = v_tenant_id AND branch_id = v_branch_id
  RETURNING * INTO v_item;
  IF v_item.id IS NULL THEN
    RAISE EXCEPTION 'Menu item not found in branch' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_item;
END;
$$;

REVOKE ALL ON FUNCTION public.set_menu_item_availability(uuid, boolean, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_menu_item_availability(uuid, boolean, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_menu_item(
  p_item_id uuid,
  p_branch_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid := public.current_tenant_id();
  v_branch_id uuid := COALESCE(p_branch_id, public.current_user_branch_id());
  v_count integer;
BEGIN
  IF v_tenant_id IS NULL OR NOT public.is_current_tenant_admin() OR v_branch_id IS NULL THEN
    RAISE EXCEPTION 'Manager role and branch are required' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.menu_item_ingredients
  WHERE menu_item_id = p_item_id AND tenant_id = v_tenant_id AND branch_id = v_branch_id;
  DELETE FROM public.menu_items
  WHERE id = p_item_id AND tenant_id = v_tenant_id AND branch_id = v_branch_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count = 0 THEN
    RAISE EXCEPTION 'Menu item not found in branch' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_menu_item(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_menu_item(uuid, uuid) TO authenticated;
