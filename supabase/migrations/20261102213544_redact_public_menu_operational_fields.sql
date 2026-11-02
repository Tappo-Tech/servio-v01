-- Keep legacy RPC row shapes while withholding internal routing settings and bulk images.
CREATE OR REPLACE FUNCTION public.get_public_categories(p_slug text, p_branch_slug text)
RETURNS SETOF public.categories
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT pg_catalog.jsonb_populate_record(
    NULL::public.categories,
    pg_catalog.to_jsonb(category) - 'printer_name' - 'separate_print' - 'split_print'
  )
  FROM public.categories AS category
  JOIN public.branches AS owner_branch
    ON owner_branch.id = category.branch_id
   AND owner_branch.tenant_id = category.tenant_id
  WHERE owner_branch.id = public.resolve_branch_id(p_slug, p_branch_slug);
$$;

CREATE OR REPLACE FUNCTION public.get_public_menu_items(p_slug text, p_branch_slug text)
RETURNS SETOF public.menu_items
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT pg_catalog.jsonb_populate_record(
    NULL::public.menu_items,
    pg_catalog.to_jsonb(item) - 'image'
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

REVOKE ALL ON FUNCTION public.get_public_categories(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_menu_items(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_categories(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_menu_items(text, text) TO anon, authenticated;
