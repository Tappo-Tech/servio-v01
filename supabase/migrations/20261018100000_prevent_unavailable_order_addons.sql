-- لا تسمح بتجاوز حالة نفاد المادة باختيار الصنف المتوقف كمكمّل مجاني قديم.
-- يظل هذا تغييرًا إضافيًا منفصلًا عن مايغريشن المخزون الذي سبق تطبيقه.
CREATE OR REPLACE FUNCTION public.prevent_order_with_unavailable_menu_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_line jsonb;
  v_addon jsonb;
  v_raw_id text;
  v_menu_item_id uuid;
  v_raw_addon_id text;
  v_addon_item_id uuid;
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

    IF pg_catalog.jsonb_typeof(v_line -> 'selected_addons') = 'array' THEN
      FOR v_addon IN
        SELECT value FROM pg_catalog.jsonb_array_elements(v_line -> 'selected_addons') AS selected(value)
      LOOP
        IF pg_catalog.jsonb_typeof(v_addon) <> 'object' THEN
          RAISE EXCEPTION 'Order contains an invalid add-on' USING ERRCODE = '22023';
        END IF;
        v_raw_addon_id := COALESCE(NULLIF(v_addon ->> 'id', ''), NULLIF(v_addon ->> 'menu_item_id', ''));
        -- الإضافات النصية المخصصة تحمل id=null؛ لا تمثل صنفًا مستقلًا في المنيو.
        IF v_raw_addon_id IS NULL THEN CONTINUE; END IF;
        BEGIN
          v_addon_item_id := v_raw_addon_id::uuid;
        EXCEPTION WHEN invalid_text_representation THEN
          RAISE EXCEPTION 'Order contains an invalid add-on' USING ERRCODE = '22023';
        END;

        IF NOT EXISTS (
          SELECT 1
          FROM public.menu_items addon_item
          WHERE addon_item.id = v_addon_item_id
            AND addon_item.tenant_id = NEW.tenant_id
            AND addon_item.available IS TRUE
            AND NOT EXISTS (
              SELECT 1
              FROM public.menu_item_ingredients relation
              LEFT JOIN public.menu_ingredients ingredient
                ON ingredient.id = relation.ingredient_id
               AND ingredient.tenant_id = relation.tenant_id
              WHERE relation.menu_item_id = addon_item.id
                AND relation.tenant_id = addon_item.tenant_id
                AND (ingredient.id IS NULL OR ingredient.available IS NOT TRUE)
            )
        ) THEN
          RAISE EXCEPTION 'MENU_ITEM_UNAVAILABLE' USING ERRCODE = 'P0001';
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.prevent_order_with_unavailable_menu_items() FROM PUBLIC, anon, authenticated;
