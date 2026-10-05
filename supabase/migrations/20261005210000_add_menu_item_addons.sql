-- خيارات إضافية مجانية ضمن السعر الحالي، مع حد أقصى للاختيارات في كل صنف.
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS addon_options text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS free_addon_item_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS max_addons smallint NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.menu_items'::regclass
      AND conname = 'menu_items_max_addons_check'
  ) THEN
    ALTER TABLE public.menu_items
      ADD CONSTRAINT menu_items_max_addons_check
      CHECK (
        max_addons BETWEEN 0 AND 20
        AND max_addons <= cardinality(COALESCE(addon_options, '{}'::text[]))
                           + cardinality(COALESCE(free_addon_item_ids, '{}'::uuid[]))
      );
  END IF;
END;
$$;

COMMENT ON COLUMN public.menu_items.addon_options IS
  'Optional customer-selectable named add-ons included in the existing menu item price.';
COMMENT ON COLUMN public.menu_items.free_addon_item_ids IS
  'Menu item IDs that may be selected for free only as add-ons to this parent menu item.';
COMMENT ON COLUMN public.menu_items.max_addons IS
  'Maximum number of configured add-on choices selectable for a single parent menu item, from 0 to 20.';
