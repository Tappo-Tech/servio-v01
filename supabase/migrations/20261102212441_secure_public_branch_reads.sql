-- Guard public branch reads against rows whose tenant_id does not own branch_id.
CREATE OR REPLACE FUNCTION public.get_public_categories(p_slug text, p_branch_slug text)
RETURNS SETOF public.categories
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT category.*
  FROM public.categories AS category
  JOIN public.branches AS owner_branch
    ON owner_branch.id = category.branch_id
   AND owner_branch.tenant_id = category.tenant_id
  WHERE owner_branch.id = public.resolve_branch_id(p_slug, p_branch_slug);
$$;

CREATE OR REPLACE FUNCTION public.get_public_menu_items(p_slug text, p_branch_slug text)
RETURNS SETOF public.menu_items
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT item.*
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

CREATE OR REPLACE FUNCTION public.get_public_tables(p_slug text, p_branch_slug text)
RETURNS SETOF public."table"
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT table_row.*
  FROM public."table" AS table_row
  JOIN public.branches AS owner_branch
    ON owner_branch.id = table_row.branch_id
   AND owner_branch.tenant_id = table_row.tenant_id
  WHERE owner_branch.id = public.resolve_branch_id(p_slug, p_branch_slug);
$$;

REVOKE ALL ON FUNCTION public.get_public_categories(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_menu_items(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_tables(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_categories(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_menu_items(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_tables(text, text) TO anon, authenticated;
