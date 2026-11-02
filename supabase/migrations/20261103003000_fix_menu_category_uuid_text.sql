-- menu_items.category_id is intentionally text because it supports the
-- sentinel value 'all', while categories.id is uuid. Never compare them
-- directly: PostgreSQL raises operator does not exist uuid = text.
CREATE OR REPLACE FUNCTION public.save_menu_item_with_ingredients(
  p_item jsonb,
  p_ingredient_ids uuid[] DEFAULT ARRAY[]::uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid := public.current_tenant_id();
  v_branch_id uuid;
  v_item public.menu_items%ROWTYPE;
  v_exists boolean;
BEGIN
  IF v_tenant_id IS NULL OR NOT public.is_current_tenant_admin() THEN
    RAISE EXCEPTION 'Not authorized to manage menu items' USING ERRCODE = '42501';
  END IF;
  IF p_item IS NULL OR pg_catalog.jsonb_typeof(p_item) <> 'object' THEN
    RAISE EXCEPTION 'Menu item payload is invalid' USING ERRCODE = '22023';
  END IF;

  v_item := pg_catalog.jsonb_populate_record(NULL::public.menu_items, p_item);
  IF v_item.id IS NULL THEN v_item.id := pg_catalog.gen_random_uuid(); END IF;
  v_item.name := pg_catalog.btrim(v_item.name);
  IF v_item.name IS NULL OR v_item.name = '' OR v_item.price IS NULL OR v_item.price < 0 THEN
    RAISE EXCEPTION 'Menu item name and a non-negative price are required' USING ERRCODE = '22023';
  END IF;

  v_branch_id := COALESCE(v_item.branch_id, (SELECT b.id FROM public.branches b WHERE b.tenant_id = v_tenant_id AND b.slug = 'main' LIMIT 1));
  IF v_branch_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.branches b
    WHERE b.id = v_branch_id AND b.tenant_id = v_tenant_id AND b.is_active
  ) THEN
    RAISE EXCEPTION 'Branch is required' USING ERRCODE = '42501';
  END IF;

  -- Compare text-to-text to support both UUID category ids and 'all'.
  IF COALESCE(v_item.category_id, 'all') <> 'all' AND NOT EXISTS (
    SELECT 1 FROM public.categories c
    WHERE c.id::text = v_item.category_id
      AND c.tenant_id = v_tenant_id
      AND c.branch_id = v_branch_id
  ) THEN
    RAISE EXCEPTION 'Category does not belong to branch' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.unnest(COALESCE(p_ingredient_ids, ARRAY[]::uuid[])) AS requested(ingredient_id)
    LEFT JOIN public.menu_ingredients ingredient
      ON ingredient.id = requested.ingredient_id
      AND ingredient.tenant_id = v_tenant_id
      AND ingredient.branch_id = v_branch_id
    WHERE requested.ingredient_id IS NOT NULL AND ingredient.id IS NULL
  ) THEN
    RAISE EXCEPTION 'One or more ingredients do not belong to this branch' USING ERRCODE = '22023';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.menu_items mi
    WHERE mi.id = v_item.id AND mi.tenant_id = v_tenant_id AND mi.branch_id = v_branch_id
    FOR UPDATE
  ) INTO v_exists;

  IF v_exists THEN
    UPDATE public.menu_items
    SET name = v_item.name,
        price = v_item.price,
        category_id = COALESCE(v_item.category_id, 'all'),
        description = v_item.description,
        image = v_item.image,
        allergens = v_item.allergens,
        tags = v_item.tags,
        available = COALESCE(v_item.available, true),
        recommendation_item_ids = COALESCE(v_item.recommendation_item_ids, ARRAY[]::uuid[]),
        addon_options = COALESCE(v_item.addon_options, ARRAY[]::text[]),
        free_addon_item_ids = COALESCE(v_item.free_addon_item_ids, ARRAY[]::uuid[]),
        max_addons = COALESCE(v_item.max_addons, 0)
    WHERE id = v_item.id AND tenant_id = v_tenant_id AND branch_id = v_branch_id;
  ELSE
    INSERT INTO public.menu_items (
      id, name, price, category_id, description, image, allergens, tags, available,
      recommendation_item_ids, addon_options, free_addon_item_ids, max_addons, tenant_id, branch_id
    ) VALUES (
      v_item.id, v_item.name, v_item.price, COALESCE(v_item.category_id, 'all'), v_item.description,
      v_item.image, v_item.allergens, v_item.tags, COALESCE(v_item.available, true),
      COALESCE(v_item.recommendation_item_ids, ARRAY[]::uuid[]),
      COALESCE(v_item.addon_options, ARRAY[]::text[]),
      COALESCE(v_item.free_addon_item_ids, ARRAY[]::uuid[]),
      COALESCE(v_item.max_addons, 0), v_tenant_id, v_branch_id
    );
  END IF;

  DELETE FROM public.menu_item_ingredients
  WHERE menu_item_id = v_item.id AND tenant_id = v_tenant_id AND branch_id = v_branch_id;
  INSERT INTO public.menu_item_ingredients (tenant_id, branch_id, menu_item_id, ingredient_id, is_primary)
  SELECT v_tenant_id, v_branch_id, v_item.id, requested.ingredient_id, false
  FROM pg_catalog.unnest(COALESCE(p_ingredient_ids, ARRAY[]::uuid[])) AS requested(ingredient_id);
END;
$$;

REVOKE ALL ON FUNCTION public.save_menu_item_with_ingredients(jsonb, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_menu_item_with_ingredients(jsonb, uuid[]) TO authenticated;
