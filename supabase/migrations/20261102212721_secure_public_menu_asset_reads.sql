-- The current public menu uses separate details/image RPCs; scope them to the branch owner too.
CREATE OR REPLACE FUNCTION public.get_public_menu_item_details(p_slug text, p_branch_slug text)
RETURNS SETOF jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT pg_catalog.jsonb_build_object(
    'id', item.id,
    'created_at', item.created_at,
    'name', item.name,
    'price', item.price,
    'category_id', item.category_id,
    'description', item.description,
    'allergens', item.allergens,
    'tags', item.tags,
    'available', item.available,
    'tenant_id', item.tenant_id,
    'branch_id', item.branch_id,
    'recommendation_item_ids', item.recommendation_item_ids,
    'addon_options', item.addon_options,
    'free_addon_item_ids', item.free_addon_item_ids,
    'max_addons', item.max_addons
  )
  FROM public.menu_items AS item
  JOIN public.branches AS owner_branch
    ON owner_branch.id = item.branch_id
   AND owner_branch.tenant_id = item.tenant_id
  WHERE owner_branch.id = public.resolve_branch_id(p_slug, p_branch_slug)
    AND item.available IS TRUE
    AND NOT EXISTS (
      SELECT 1
      FROM public.menu_item_ingredients AS relation
      LEFT JOIN public.menu_ingredients AS ingredient
        ON ingredient.id = relation.ingredient_id
       AND ingredient.tenant_id = relation.tenant_id
       AND ingredient.branch_id = relation.branch_id
      WHERE relation.menu_item_id = item.id
        AND (
          relation.tenant_id IS DISTINCT FROM item.tenant_id
          OR relation.branch_id IS DISTINCT FROM item.branch_id
          OR ingredient.id IS NULL
          OR ingredient.available IS NOT TRUE
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.get_public_menu_item_images(p_slug text, p_branch_slug text, p_item_ids uuid[])
RETURNS SETOF jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT pg_catalog.jsonb_build_object('id', item.id, 'image', item.image)
  FROM public.menu_items AS item
  JOIN public.branches AS owner_branch
    ON owner_branch.id = item.branch_id
   AND owner_branch.tenant_id = item.tenant_id
  WHERE owner_branch.id = public.resolve_branch_id(p_slug, p_branch_slug)
    AND item.id = ANY(COALESCE(p_item_ids, ARRAY[]::uuid[]))
    AND item.image IS NOT NULL
    AND item.available IS TRUE
    AND NOT EXISTS (
      SELECT 1
      FROM public.menu_item_ingredients AS relation
      LEFT JOIN public.menu_ingredients AS ingredient
        ON ingredient.id = relation.ingredient_id
       AND ingredient.tenant_id = relation.tenant_id
       AND ingredient.branch_id = relation.branch_id
      WHERE relation.menu_item_id = item.id
        AND (
          relation.tenant_id IS DISTINCT FROM item.tenant_id
          OR relation.branch_id IS DISTINCT FROM item.branch_id
          OR ingredient.id IS NULL
          OR ingredient.available IS NOT TRUE
        )
    )
  LIMIT 8;
$$;

REVOKE ALL ON FUNCTION public.get_public_menu_item_details(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_menu_item_images(text, text, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_menu_item_details(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_menu_item_images(text, text, uuid[]) TO anon, authenticated;
