-- Keep public menu metadata independent from potentially large Base64 images.
-- Existing RPCs remain unchanged for backwards compatibility.
CREATE OR REPLACE FUNCTION public.get_public_menu_item_details(p_slug text, p_branch_slug text)
RETURNS SETOF jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', m.id,
    'created_at', m.created_at,
    'name', m.name,
    'price', m.price,
    'category_id', m.category_id,
    'description', m.description,
    'allergens', m.allergens,
    'tags', m.tags,
    'available', m.available,
    'tenant_id', m.tenant_id,
    'branch_id', m.branch_id,
    'recommendation_item_ids', m.recommendation_item_ids,
    'addon_options', m.addon_options,
    'free_addon_item_ids', m.free_addon_item_ids,
    'max_addons', m.max_addons
  )
  FROM public.menu_items AS m
  WHERE m.branch_id = public.resolve_branch_id(p_slug, p_branch_slug)
$$;

CREATE OR REPLACE FUNCTION public.get_public_menu_item_images(p_slug text, p_branch_slug text, p_item_ids uuid[])
RETURNS SETOF jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object('id', m.id, 'image', m.image)
  FROM public.menu_items AS m
  WHERE m.branch_id = public.resolve_branch_id(p_slug, p_branch_slug)
    AND m.id = ANY(COALESCE(p_item_ids, ARRAY[]::uuid[]))
    AND m.image IS NOT NULL
  LIMIT 8
$$;

REVOKE ALL ON FUNCTION public.get_public_menu_item_details(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_menu_item_images(text, text, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_menu_item_details(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_menu_item_images(text, text, uuid[]) TO anon, authenticated;
