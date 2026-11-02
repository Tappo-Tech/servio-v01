-- Store one or more ordered daily shift periods while preserving legacy workday fields.
ALTER TABLE public.store
  ADD COLUMN IF NOT EXISTS workday_shifts jsonb;

UPDATE public.store
SET workday_shifts = CASE
  WHEN workday_start IS NOT NULL AND workday_end IS NOT NULL THEN
    pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
      'start', pg_catalog.to_char(workday_start, 'HH24:MI'),
      'end', pg_catalog.to_char(workday_end, 'HH24:MI')
    ))
  ELSE '[]'::jsonb
END
WHERE workday_shifts IS NULL;

ALTER TABLE public.store
  ALTER COLUMN workday_shifts SET DEFAULT '[]'::jsonb,
  ALTER COLUMN workday_shifts SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conname = 'store_workday_shifts_array_check'
      AND conrelid = 'public.store'::regclass
  ) THEN
    ALTER TABLE public.store
      ADD CONSTRAINT store_workday_shifts_array_check
      CHECK (pg_catalog.jsonb_typeof(workday_shifts) = 'array');
  END IF;
END;
$$;

COMMENT ON COLUMN public.store.workday_shifts IS
  'Ordered local-time shift periods for a workday, as an array of {start,end} objects.';

-- Public menu reads must not expose manually disabled items or items whose linked stock is out.
CREATE OR REPLACE FUNCTION public.get_public_menu_items(p_slug text, p_branch_slug text)
RETURNS SETOF public.menu_items
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT item.*
  FROM public.menu_items AS item
  WHERE item.branch_id = public.resolve_branch_id(p_slug, p_branch_slug)
    AND item.available IS TRUE
    AND NOT EXISTS (
      SELECT 1
      FROM public.menu_item_ingredients AS relation
      LEFT JOIN public.menu_ingredients AS ingredient
        ON ingredient.id = relation.ingredient_id
       AND ingredient.tenant_id = relation.tenant_id
       AND ingredient.branch_id = relation.branch_id
      WHERE relation.menu_item_id = item.id
        AND relation.tenant_id = item.tenant_id
        AND relation.branch_id = item.branch_id
        AND (ingredient.id IS NULL OR ingredient.available IS NOT TRUE)
    );
$$;

REVOKE ALL ON FUNCTION public.get_public_menu_items(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_menu_items(text, text) TO anon, authenticated;
