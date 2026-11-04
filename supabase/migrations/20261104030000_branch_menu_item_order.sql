-- Branch-local menu display ordering. Existing rows receive a stable per-branch order.
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS sort_order integer;

WITH ranked AS (
  SELECT id, row_number() OVER (
    PARTITION BY tenant_id, branch_id ORDER BY created_at ASC NULLS LAST, id ASC
  ) - 1 AS position
  FROM public.menu_items
)
UPDATE public.menu_items AS item SET sort_order = ranked.position
FROM ranked WHERE ranked.id = item.id AND item.sort_order IS NULL;

ALTER TABLE public.menu_items ALTER COLUMN sort_order SET DEFAULT 0;
ALTER TABLE public.menu_items ALTER COLUMN sort_order SET NOT NULL;
CREATE INDEX IF NOT EXISTS menu_items_branch_order_idx
  ON public.menu_items (tenant_id, branch_id, sort_order, created_at, id);

-- New entries append within their own branch; never derive scope from client input alone.
CREATE OR REPLACE FUNCTION public.assign_menu_item_order_on_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.sort_order IS NULL OR NEW.sort_order = 0 THEN
    SELECT COALESCE(MAX(item.sort_order) + 1, 0) INTO NEW.sort_order
    FROM public.menu_items AS item
    WHERE item.tenant_id = NEW.tenant_id AND item.branch_id = NEW.branch_id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.assign_menu_item_order_on_insert() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS menu_items_assign_order_on_insert ON public.menu_items;
CREATE TRIGGER menu_items_assign_order_on_insert
  BEFORE INSERT ON public.menu_items FOR EACH ROW
  EXECUTE FUNCTION public.assign_menu_item_order_on_insert();

-- The manager may submit only a complete permutation of the selected branch's items.
CREATE OR REPLACE FUNCTION public.save_menu_item_order(p_item_ids uuid[], p_branch_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_tenant_id uuid := public.current_tenant_id();
  v_item_count integer;
  v_requested_count integer;
BEGIN
  IF auth.uid() IS NULL OR v_tenant_id IS NULL OR NOT public.is_current_tenant_admin() THEN
    RAISE EXCEPTION 'Manager role required' USING ERRCODE = '42501';
  END IF;
  IF p_branch_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.branches b
    WHERE b.id = p_branch_id AND b.tenant_id = v_tenant_id AND b.is_active
  ) THEN RAISE EXCEPTION 'Branch is required' USING ERRCODE = '42501'; END IF;
  IF p_item_ids IS NULL OR cardinality(p_item_ids) > 5000
     OR EXISTS (SELECT 1 FROM unnest(p_item_ids) AS ids(id) WHERE id IS NULL)
     OR cardinality(p_item_ids) <> (SELECT count(DISTINCT id) FROM unnest(p_item_ids) AS ids(id)) THEN
    RAISE EXCEPTION 'Invalid item order' USING ERRCODE = '22023';
  END IF;
  SELECT count(*) INTO v_item_count FROM public.menu_items item
  WHERE item.tenant_id = v_tenant_id AND item.branch_id = p_branch_id;
  v_requested_count := cardinality(p_item_ids);
  IF v_requested_count <> v_item_count OR EXISTS (
    SELECT 1 FROM unnest(p_item_ids) AS ids(id)
    LEFT JOIN public.menu_items item ON item.id = ids.id
      AND item.tenant_id = v_tenant_id AND item.branch_id = p_branch_id
    WHERE item.id IS NULL
  ) THEN RAISE EXCEPTION 'Items must belong to the selected branch' USING ERRCODE = '42501'; END IF;
  UPDATE public.menu_items item SET sort_order = requested.ordinality - 1
  FROM unnest(p_item_ids) WITH ORDINALITY AS requested(id, ordinality)
  WHERE item.id = requested.id AND item.tenant_id = v_tenant_id AND item.branch_id = p_branch_id;
END;
$$;
REVOKE ALL ON FUNCTION public.save_menu_item_order(uuid[], uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_menu_item_order(uuid[], uuid) TO authenticated;

-- Preserve the existing public visibility/ingredient checks and redacted JSON shape.
-- sort_order is the only new public field; internal image and operational fields remain withheld.
CREATE OR REPLACE FUNCTION public.get_public_menu_item_details(p_slug text, p_branch_slug text)
RETURNS SETOF jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT pg_catalog.jsonb_build_object(
    'id', item.id, 'created_at', item.created_at, 'name', item.name,
    'price', item.price, 'category_id', item.category_id, 'description', item.description,
    'allergens', item.allergens, 'tags', item.tags, 'available', item.available,
    'tenant_id', item.tenant_id, 'branch_id', item.branch_id,
    'sort_order', item.sort_order,
    'recommendation_item_ids', item.recommendation_item_ids,
    'addon_options', item.addon_options, 'free_addon_item_ids', item.free_addon_item_ids,
    'max_addons', item.max_addons
  )
  FROM public.menu_items AS item
  JOIN public.branches AS owner_branch
    ON owner_branch.id = item.branch_id AND owner_branch.tenant_id = item.tenant_id
  WHERE owner_branch.id = public.resolve_branch_id(p_slug, p_branch_slug)
    AND item.available IS TRUE
    AND NOT EXISTS (
      SELECT 1 FROM public.menu_item_ingredients AS relation
      LEFT JOIN public.menu_ingredients AS ingredient
        ON ingredient.id = relation.ingredient_id
       AND ingredient.tenant_id = relation.tenant_id
       AND ingredient.branch_id = relation.branch_id
      WHERE relation.menu_item_id = item.id
        AND (relation.tenant_id IS DISTINCT FROM item.tenant_id
          OR relation.branch_id IS DISTINCT FROM item.branch_id
          OR ingredient.id IS NULL OR ingredient.available IS NOT TRUE)
    )
  ORDER BY item.sort_order ASC, item.created_at ASC NULLS LAST, item.id ASC;
$$;
REVOKE ALL ON FUNCTION public.get_public_menu_item_details(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_menu_item_details(text, text) TO anon, authenticated;
