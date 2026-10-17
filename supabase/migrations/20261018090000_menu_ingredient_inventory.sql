-- مواد المنيو وروابطها بالأصناف. IF NOT EXISTS يحافظ على قواعد البيانات
-- التي سبق أن أُنشئت فيها هذه الجداول يدويًا، ويجعل المايغريشن قابلًا للتطبيق بأمان.
CREATE TABLE IF NOT EXISTS public.menu_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menu_item_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES public.menu_ingredients(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, menu_item_id, ingredient_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS menu_ingredients_tenant_name_key
  ON public.menu_ingredients (tenant_id, lower(btrim(name)));
CREATE INDEX IF NOT EXISTS menu_ingredients_tenant_id_idx
  ON public.menu_ingredients (tenant_id);
CREATE INDEX IF NOT EXISTS menu_item_ingredients_tenant_id_idx
  ON public.menu_item_ingredients (tenant_id);
CREATE INDEX IF NOT EXISTS menu_item_ingredients_menu_item_id_idx
  ON public.menu_item_ingredients (menu_item_id);
CREATE INDEX IF NOT EXISTS menu_item_ingredients_ingredient_id_idx
  ON public.menu_item_ingredients (ingredient_id);
CREATE UNIQUE INDEX IF NOT EXISTS menu_item_ingredients_one_primary_key
  ON public.menu_item_ingredients (tenant_id, menu_item_id)
  WHERE is_primary;

ALTER TABLE public.menu_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS menu_ingredients_tenant_select ON public.menu_ingredients;
CREATE POLICY menu_ingredients_tenant_select
  ON public.menu_ingredients FOR SELECT TO authenticated
  USING (public.tenant_match(tenant_id));
DROP POLICY IF EXISTS menu_ingredients_admin_insert ON public.menu_ingredients;
CREATE POLICY menu_ingredients_admin_insert
  ON public.menu_ingredients FOR INSERT TO authenticated
  WITH CHECK (public.tenant_match(tenant_id) AND public.is_current_tenant_admin());
DROP POLICY IF EXISTS menu_ingredients_admin_update ON public.menu_ingredients;
CREATE POLICY menu_ingredients_admin_update
  ON public.menu_ingredients FOR UPDATE TO authenticated
  USING (public.tenant_match(tenant_id) AND public.is_current_tenant_admin())
  WITH CHECK (public.tenant_match(tenant_id) AND public.is_current_tenant_admin());
DROP POLICY IF EXISTS menu_ingredients_admin_delete ON public.menu_ingredients;
CREATE POLICY menu_ingredients_admin_delete
  ON public.menu_ingredients FOR DELETE TO authenticated
  USING (public.tenant_match(tenant_id) AND public.is_current_tenant_admin());

DROP POLICY IF EXISTS menu_item_ingredients_tenant_select ON public.menu_item_ingredients;
CREATE POLICY menu_item_ingredients_tenant_select
  ON public.menu_item_ingredients FOR SELECT TO authenticated
  USING (public.tenant_match(tenant_id));
DROP POLICY IF EXISTS menu_item_ingredients_admin_insert ON public.menu_item_ingredients;
CREATE POLICY menu_item_ingredients_admin_insert
  ON public.menu_item_ingredients FOR INSERT TO authenticated
  WITH CHECK (public.tenant_match(tenant_id) AND public.is_current_tenant_admin());
DROP POLICY IF EXISTS menu_item_ingredients_admin_update ON public.menu_item_ingredients;
CREATE POLICY menu_item_ingredients_admin_update
  ON public.menu_item_ingredients FOR UPDATE TO authenticated
  USING (public.tenant_match(tenant_id) AND public.is_current_tenant_admin())
  WITH CHECK (public.tenant_match(tenant_id) AND public.is_current_tenant_admin());
DROP POLICY IF EXISTS menu_item_ingredients_admin_delete ON public.menu_item_ingredients;
CREATE POLICY menu_item_ingredients_admin_delete
  ON public.menu_item_ingredients FOR DELETE TO authenticated
  USING (public.tenant_match(tenant_id) AND public.is_current_tenant_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_ingredients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_item_ingredients TO authenticated;
REVOKE ALL ON public.menu_ingredients, public.menu_item_ingredients FROM anon;

-- لا تسمح بربط مادة وصنف تابعين إلى مستأجرين مختلفين حتى لو حُملت معرّفات UUID.
CREATE OR REPLACE FUNCTION public.validate_menu_item_ingredient_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.menu_items mi
    WHERE mi.id = NEW.menu_item_id AND mi.tenant_id = NEW.tenant_id
  ) OR NOT EXISTS (
    SELECT 1 FROM public.menu_ingredients ingredient
    WHERE ingredient.id = NEW.ingredient_id AND ingredient.tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION 'Ingredient and menu item must belong to the same tenant'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_menu_item_ingredient_tenant() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS menu_item_ingredients_tenant_consistency ON public.menu_item_ingredients;
CREATE TRIGGER menu_item_ingredients_tenant_consistency
  BEFORE INSERT OR UPDATE ON public.menu_item_ingredients
  FOR EACH ROW EXECUTE FUNCTION public.validate_menu_item_ingredient_tenant();

-- حفظ الصنف وروابط مواده في معاملة واحدة، مع التحقق من المستأجر ودور المدير.
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
    VALUES (v_tenant_id, v_item.id, v_requested_id, v_requested_id = v_primary_ingredient_id);
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.save_menu_item_with_ingredients(jsonb, uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_menu_item_with_ingredients(jsonb, uuid[]) TO authenticated;

-- الكاشير يستطيع تغيير حالة التوفر فقط؛ لا يملك إضافة المواد أو تعديل أسمائها.
CREATE OR REPLACE FUNCTION public.set_menu_ingredient_availability(
  p_ingredient_id uuid,
  p_available boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid;
  v_row_count integer;
  v_is_cashier boolean;
BEGIN
  v_tenant_id := public.current_tenant_id();
  SELECT EXISTS (
    SELECT 1 FROM public.profiles profile
    WHERE profile.id = auth.uid()
      AND profile.tenant_id = v_tenant_id
      AND profile.role::text = 'cashier'
  ) INTO v_is_cashier;

  IF v_tenant_id IS NULL OR (NOT public.is_current_tenant_admin() AND NOT v_is_cashier) THEN
    RAISE EXCEPTION 'Not authorized to change ingredient availability' USING ERRCODE = '42501';
  END IF;
  IF p_available IS NULL THEN
    RAISE EXCEPTION 'Availability is required' USING ERRCODE = '22023';
  END IF;

  UPDATE public.menu_ingredients ingredient
  SET available = p_available
  WHERE ingredient.id = p_ingredient_id AND ingredient.tenant_id = v_tenant_id;
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  IF v_row_count = 0 THEN
    RAISE EXCEPTION 'Ingredient not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.set_menu_ingredient_availability(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_menu_ingredient_availability(uuid, boolean) TO authenticated;

-- لا تعرض المنيو العام أي صنف يدويًا موقوف أو يعتمد على مادة نافدة/غير قابلة للتحقق.
CREATE OR REPLACE FUNCTION public.get_public_menu_items(p_slug text)
RETURNS SETOF public.menu_items
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT mi.*
  FROM public.menu_items mi
  JOIN public.tenants tenant ON tenant.id = mi.tenant_id
  WHERE tenant.slug = pg_catalog.lower(pg_catalog.btrim(p_slug))
    AND mi.available IS TRUE
    AND NOT EXISTS (
      SELECT 1
      FROM public.menu_item_ingredients relation
      LEFT JOIN public.menu_ingredients ingredient
        ON ingredient.id = relation.ingredient_id
       AND ingredient.tenant_id = relation.tenant_id
      WHERE relation.menu_item_id = mi.id
        AND relation.tenant_id = mi.tenant_id
        AND (ingredient.id IS NULL OR ingredient.available IS NOT TRUE)
    );
$$;
REVOKE ALL ON FUNCTION public.get_public_menu_items(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_menu_items(text) TO anon, authenticated;

-- مزامنة تغييرات المواد وعلاقاتها بين أجهزة المدير والكاشير داخل نشاط واحد.
DROP TRIGGER IF EXISTS broadcast_menu_ingredients_menu_catalog_change ON public.menu_ingredients;
CREATE TRIGGER broadcast_menu_ingredients_menu_catalog_change
  AFTER INSERT OR UPDATE OR DELETE ON public.menu_ingredients
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_menu_catalog_change();
DROP TRIGGER IF EXISTS broadcast_menu_item_ingredients_menu_catalog_change ON public.menu_item_ingredients;
CREATE TRIGGER broadcast_menu_item_ingredients_menu_catalog_change
  AFTER INSERT OR UPDATE OR DELETE ON public.menu_item_ingredients
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_menu_catalog_change();

-- تحقق خادميًا عند إنشاء الطلب أو تغيير أصنافه حتى لا يتجاوز الطلب المنيو/مزامنة الكاشير.
CREATE OR REPLACE FUNCTION public.prevent_order_with_unavailable_menu_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_line jsonb;
  v_raw_id text;
  v_menu_item_id uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.items IS NOT DISTINCT FROM OLD.items THEN
    RETURN NEW;
  END IF;
  IF NEW.items IS NULL OR pg_catalog.jsonb_typeof(NEW.items) <> 'array' OR pg_catalog.jsonb_array_length(NEW.items) = 0 THEN
    RAISE EXCEPTION 'Order must contain menu items' USING ERRCODE = '22023';
  END IF;

  FOR v_line IN SELECT value FROM pg_catalog.jsonb_array_elements(NEW.items) AS line(value)
  LOOP
    IF pg_catalog.jsonb_typeof(v_line) <> 'object' THEN
      RAISE EXCEPTION 'Order contains an invalid menu item' USING ERRCODE = '22023';
    END IF;
    v_raw_id := COALESCE(NULLIF(v_line ->> 'id', ''), NULLIF(v_line ->> 'menu_item_id', ''));
    IF v_raw_id IS NULL THEN
      RAISE EXCEPTION 'Order contains an invalid menu item' USING ERRCODE = '22023';
    END IF;
    BEGIN
      v_menu_item_id := v_raw_id::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Order contains an invalid menu item' USING ERRCODE = '22023';
    END;

    IF NOT EXISTS (
      SELECT 1
      FROM public.menu_items mi
      WHERE mi.id = v_menu_item_id
        AND mi.tenant_id = NEW.tenant_id
        AND mi.available IS TRUE
        AND NOT EXISTS (
          SELECT 1
          FROM public.menu_item_ingredients relation
          LEFT JOIN public.menu_ingredients ingredient
            ON ingredient.id = relation.ingredient_id
           AND ingredient.tenant_id = relation.tenant_id
          WHERE relation.menu_item_id = mi.id
            AND relation.tenant_id = mi.tenant_id
            AND (ingredient.id IS NULL OR ingredient.available IS NOT TRUE)
        )
    ) THEN
      RAISE EXCEPTION 'MENU_ITEM_UNAVAILABLE' USING ERRCODE = 'P0001';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.prevent_order_with_unavailable_menu_items() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS orders_prevent_unavailable_menu_items ON public.orders;
CREATE TRIGGER orders_prevent_unavailable_menu_items
  BEFORE INSERT OR UPDATE OF items ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.prevent_order_with_unavailable_menu_items();
