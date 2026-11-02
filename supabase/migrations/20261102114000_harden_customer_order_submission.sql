-- Strip image/metadata fields on the server too, so legacy or stale clients cannot
-- put large image data into orders.items. Preserve fields used by validation and receipts.
CREATE OR REPLACE FUNCTION public.compact_public_order_items(p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog
AS $$
DECLARE v_items jsonb;
BEGIN
  IF pg_catalog.jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RETURN COALESCE(p_items, '[]'::jsonb);
  END IF;

  SELECT COALESCE(
    pg_catalog.jsonb_agg(
      CASE
        WHEN pg_catalog.jsonb_typeof(entry.value) <> 'object' THEN entry.value
        ELSE pg_catalog.jsonb_build_object(
          'id', entry.value -> 'id',
          'cartItemId', entry.value -> 'cartItemId',
          'name', entry.value -> 'name',
          'quantity', entry.value -> 'quantity',
          'price', entry.value -> 'price',
          'category_id', entry.value -> 'category_id',
          'selected_addons', CASE
            WHEN pg_catalog.jsonb_typeof(entry.value -> 'selected_addons') = 'array' THEN (
              SELECT COALESCE(
                pg_catalog.jsonb_agg(
                  CASE
                    WHEN pg_catalog.jsonb_typeof(addon.value) = 'object'
                      THEN pg_catalog.jsonb_build_object('id', addon.value -> 'id', 'name', addon.value -> 'name')
                    ELSE addon.value
                  END ORDER BY addon.ordinality
                ),
                '[]'::jsonb
              )
              FROM pg_catalog.jsonb_array_elements(entry.value -> 'selected_addons') WITH ORDINALITY AS addon(value, ordinality)
            )
            WHEN entry.value ? 'selected_addons' THEN entry.value -> 'selected_addons'
            ELSE '[]'::jsonb
          END
        )
      END ORDER BY entry.ordinality
    ),
    '[]'::jsonb
  ) INTO v_items
  FROM pg_catalog.jsonb_array_elements(p_items) WITH ORDINALITY AS entry(value, ordinality);

  RETURN v_items;
END;
$$;
REVOKE ALL ON FUNCTION public.compact_public_order_items(jsonb) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_public_order_with_tracking(
  p_slug text,
  p_items jsonb,
  p_total_price numeric,
  p_table_number text,
  p_notes text,
  p_branch_slug text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_catalog
AS $$
DECLARE
  result public.orders;
  target_tenant_id uuid;
  target_branch_id uuid;
  normalized_table text := NULLIF(pg_catalog.btrim(p_table_number), '');
  safe_items jsonb;
  tracking_token text;
BEGIN
  SELECT t.id INTO target_tenant_id
  FROM public.tenants t
  WHERE t.slug = pg_catalog.lower(pg_catalog.btrim(p_slug))
  LIMIT 1;
  target_branch_id := public.resolve_branch_id(p_slug, p_branch_slug);
  IF target_tenant_id IS NULL OR target_branch_id IS NULL THEN
    RAISE EXCEPTION 'Tenant or branch not found';
  END IF;

  -- QR table numbers are validated against this exact branch. A customer may also
  -- order without a table, and cashier QR orders use the explicit cashier marker.
  IF normalized_table IS NULL OR normalized_table = 'غير محدد' THEN
    normalized_table := 'غير محدد';
  ELSIF normalized_table <> 'كاشير' AND NOT EXISTS (
    SELECT 1 FROM public."table" tb
    WHERE tb.tenant_id = target_tenant_id
      AND tb.branch_id = target_branch_id
      AND tb.table_number::text = normalized_table
  ) THEN
    RAISE EXCEPTION 'Invalid table number for this branch' USING ERRCODE = '22023';
  END IF;

  safe_items := public.compact_public_order_items(COALESCE(p_items, '[]'::jsonb));
  tracking_token := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');

  INSERT INTO public.orders (
    tenant_id, branch_id, items, total_price, table_number, notes,
    status, is_completed, completed_at, tracking_token_hash
  ) VALUES (
    target_tenant_id,
    target_branch_id,
    safe_items,
    COALESCE(p_total_price, 0),
    normalized_table,
    NULLIF(pg_catalog.btrim(COALESCE(p_notes, '')), ''),
    'pending', false, NULL,
    pg_catalog.encode(extensions.digest(tracking_token, 'sha256'), 'hex')
  ) RETURNING * INTO result;

  RETURN pg_catalog.jsonb_build_object(
    'order_id', result.id,
    'tracking_token', tracking_token,
    'status', result.status,
    'created_at', result.created_at,
    'total_price', result.total_price,
    'table_number', result.table_number
  );
END;
$$;

-- Preserve compatibility for older clients that call the five-argument overload.
CREATE OR REPLACE FUNCTION public.create_public_order_with_tracking(
  p_slug text,
  p_items jsonb,
  p_total_price numeric,
  p_table_number text,
  p_notes text
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions, pg_catalog
AS $$
  SELECT public.create_public_order_with_tracking(p_slug, p_items, p_total_price, p_table_number, p_notes, 'main');
$$;

REVOKE ALL ON FUNCTION public.create_public_order_with_tracking(text, jsonb, numeric, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_order_with_tracking(text, jsonb, numeric, text, text, text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.create_public_order_with_tracking(text, jsonb, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_order_with_tracking(text, jsonb, numeric, text, text) TO anon, authenticated;
