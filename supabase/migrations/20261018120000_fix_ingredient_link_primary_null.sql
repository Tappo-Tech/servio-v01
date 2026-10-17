-- إصلاح ربط المواد: مقارنة UUID مع NULL تنتج NULL، بينما is_primary إلزامي.
-- عند عدم وجود مكوّن رئيسي، خزّن false حتى ينجح حفظ روابط المكونات.
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
  v_tenant_id uuid;
  v_item public.menu_items%ROWTYPE;
  v_exists boolean;
  v_primary_ingredient_id uuid;
  v_requested_id uuid;
BEGIN
  v_tenant_id := public.current_tenant_id();
  IF v_tenant_id IS NULL OR NOT public.is_current_tenant_admin() THEN
    RAISE EXCEPTION 'Not authorized to manage menu items'
      USING ERRCODE = '42501';
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

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.unnest(COALESCE(p_ingredient_ids, ARRAY[]::uuid[])) AS requested(ingredient_id)
    LEFT JOIN public.menu_ingredients ingredient
      ON ingredient.id = requested.ingredient_id AND ingredient.tenant_id = v_tenant_id
    WHERE requested.ingredient_id IS NOT NULL AND ingredient.id IS NULL
  ) THEN
    RAISE EXCEPTION 'One or more ingredients do not belong to this tenant' USING ERRCODE = '22023';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.menu_items mi
    WHERE mi.id = v_item.id AND mi.tenant_id = v_tenant_id
    FOR UPDATE
  ) INTO v_exists;

  IF v_exists THEN
    SELECT relation.ingredient_id INTO v_primary_ingredient_id
    FROM public.menu_item_ingredients relation
    WHERE relation.tenant_id = v_tenant_id
      AND relation.menu_item_id = v_item.id
      AND relation.is_primary
    LIMIT 1;

    UPDATE public.menu_items AS mi
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
    WHERE mi.id = v_item.id AND mi.tenant_id = v_tenant_id;
  ELSE
    v_primary_ingredient_id := NULL;
    INSERT INTO public.menu_items (
      id, name, price, category_id, description, image, allergens, tags, available,
      recommendation_item_ids, addon_options, free_addon_item_ids, max_addons, tenant_id
    ) VALUES (
      v_item.id, v_item.name, v_item.price, COALESCE(v_item.category_id, 'all'),
      v_item.description, v_item.image, v_item.allergens, v_item.tags,
      COALESCE(v_item.available, true),
      COALESCE(v_item.recommendation_item_ids, ARRAY[]::uuid[]),
      COALESCE(v_item.addon_options, ARRAY[]::text[]),
      COALESCE(v_item.free_addon_item_ids, ARRAY[]::uuid[]),
      COALESCE(v_item.max_addons, 0), v_tenant_id
    );
  END IF;

  IF v_primary_ingredient_id IS NOT NULL AND NOT (v_primary_ingredient_id = ANY(COALESCE(p_ingredient_ids, ARRAY[]::uuid[]))) THEN
    v_primary_ingredient_id := NULL;
  END IF;
  DELETE FROM public.menu_item_ingredients relation
  WHERE relation.tenant_id = v_tenant_id AND relation.menu_item_id = v_item.id;

  FOR v_requested_id IN
    SELECT DISTINCT requested.ingredient_id
    FROM pg_catalog.unnest(COALESCE(p_ingredient_ids, ARRAY[]::uuid[])) AS requested(ingredient_id)
    WHERE requested.ingredient_id IS NOT NULL
  LOOP
    INSERT INTO public.menu_item_ingredients (tenant_id, menu_item_id, ingredient_id, is_primary)
    VALUES (
      v_tenant_id,
      v_item.id,
      v_requested_id,
      COALESCE(v_requested_id = v_primary_ingredient_id, false)
    );
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.save_menu_item_with_ingredients(jsonb, uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_menu_item_with_ingredients(jsonb, uuid[]) TO authenticated;
