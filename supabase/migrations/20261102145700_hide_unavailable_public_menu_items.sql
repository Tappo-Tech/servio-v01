-- The public menu must match the server-side order availability guard.
-- Hide items disabled directly or linked to an unavailable/missing inventory ingredient.
CREATE OR REPLACE FUNCTION public.get_public_menu_item_details(p_slug text, p_branch_slug text)
RETURNS SETOF jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    AND m.available IS TRUE
    AND NOT EXISTS (
      SELECT 1
      FROM public.menu_item_ingredients AS relation
      LEFT JOIN public.menu_ingredients AS ingredient
        ON ingredient.id = relation.ingredient_id
       AND ingredient.tenant_id = relation.tenant_id
       AND ingredient.branch_id = relation.branch_id
      WHERE relation.menu_item_id = m.id
        AND relation.tenant_id = m.tenant_id
        AND relation.branch_id = m.branch_id
        AND (ingredient.id IS NULL OR ingredient.available IS NOT TRUE)
    );
$function$;

REVOKE ALL ON FUNCTION public.get_public_menu_item_details(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_menu_item_details(text, text) TO anon, authenticated;
