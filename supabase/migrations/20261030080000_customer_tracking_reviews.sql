-- Customer device tracking, Google review link, and public invoice data.
ALTER TABLE public.store
  ADD COLUMN IF NOT EXISTS google_maps_review_url text;

COMMENT ON COLUMN public.store.google_maps_review_url IS
  'Public Google Maps review URL shown to guests after ordering.';

CREATE OR REPLACE FUNCTION public.update_current_store_settings(p_store jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
  v_tenant_id uuid := public.current_tenant_id();
  v_name text;
  v_slug text;
  v_currency text;
  v_review_url text;
  v_store public.store%ROWTYPE;
BEGIN
  IF v_tenant_id IS NULL OR NOT public.is_current_tenant_admin() THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE='42501';
  END IF;
  IF p_store IS NULL OR pg_catalog.jsonb_typeof(p_store) <> 'object' THEN
    RAISE EXCEPTION 'Store settings payload is invalid' USING ERRCODE='22023';
  END IF;
  v_name := pg_catalog.btrim(COALESCE(p_store->>'store_name',''));
  v_slug := pg_catalog.lower(pg_catalog.btrim(COALESCE(p_store->>'store_slug','')));
  v_currency := COALESCE(NULLIF(pg_catalog.btrim(p_store->>'currency'),''),'SAR');
  v_review_url := NULLIF(pg_catalog.btrim(COALESCE(p_store->>'google_maps_review_url','')), '');
  IF v_name='' THEN RAISE EXCEPTION 'Store name is required' USING ERRCODE='22023'; END IF;
  IF v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN RAISE EXCEPTION 'Invalid store slug' USING ERRCODE='22023'; END IF;
  IF v_currency NOT IN ('SAR','AED','USD') THEN RAISE EXCEPTION 'Unsupported store currency' USING ERRCODE='22023'; END IF;
  IF v_review_url IS NOT NULL AND v_review_url !~ '^https?://' THEN
    RAISE EXCEPTION 'Google Maps review URL must start with http or https' USING ERRCODE='22023';
  END IF;

  UPDATE public.store
  SET store_name=v_name,
      store_slug=v_slug,
      phone=NULLIF(pg_catalog.btrim(COALESCE(p_store->>'phone','')), ''),
      email=NULLIF(pg_catalog.btrim(COALESCE(p_store->>'email','')), ''),
      currency=v_currency,
      address=NULLIF(pg_catalog.btrim(COALESCE(p_store->>'address','')), ''),
      receipt_footer=NULLIF(pg_catalog.btrim(COALESCE(p_store->>'receipt_footer','')), ''),
      logo_url=NULLIF(p_store->>'logo_url',''),
      google_maps_review_url=v_review_url
  WHERE tenant_id=v_tenant_id
  RETURNING * INTO v_store;
  IF v_store.id IS NULL THEN RAISE EXCEPTION 'Store settings were not found' USING ERRCODE='P0002'; END IF;
  UPDATE public.tenants SET name=v_store.store_name,slug=v_store.store_slug,logo_url=v_store.logo_url WHERE id=v_tenant_id;
  RETURN pg_catalog.to_jsonb(v_store);
END; $$;

GRANT EXECUTE ON FUNCTION public.update_current_store_settings(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_public_order_tracking(
  p_slug text,
  p_order_id uuid,
  p_tracking_token text
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE result jsonb;
BEGIN
  IF p_order_id IS NULL OR nullif(p_tracking_token,'') IS NULL THEN RETURN NULL; END IF;
  SELECT jsonb_build_object(
    'order_id', o.id,
    'status', o.status,
    'table_number', o.table_number,
    'created_at', o.created_at,
    'completed_at', o.completed_at,
    'total_price', o.total_price,
    'items', COALESCE(o.items, '[]'::jsonb)
  ) INTO result
  FROM public.orders o
  JOIN public.tenants t ON t.id=o.tenant_id
  WHERE o.id=p_order_id
    AND t.slug=lower(trim(p_slug))
    AND o.tracking_token_hash=encode(extensions.digest(p_tracking_token,'sha256'),'hex')
  LIMIT 1;
  RETURN result;
END; $$;

REVOKE ALL ON FUNCTION public.get_public_order_tracking(text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_order_tracking(text,uuid,text) TO anon,authenticated;
