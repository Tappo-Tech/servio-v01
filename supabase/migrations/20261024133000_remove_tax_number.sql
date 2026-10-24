-- SERVIO prints internal receipts and kitchen tickets, not tax invoices.
ALTER TABLE public.store DROP COLUMN IF EXISTS tax_number;

DROP FUNCTION IF EXISTS public.create_tenant_for_registration(text,text,text,text,text,text);
CREATE FUNCTION public.create_tenant_for_registration(
  p_name text,
  p_slug text,
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_currency text DEFAULT 'SAR'
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $$
DECLARE new_id uuid;
BEGIN
  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN RAISE EXCEPTION 'Tenant name is required'; END IF;
  IF p_slug IS NULL OR lower(trim(p_slug)) !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN RAISE EXCEPTION 'Invalid slug'; END IF;
  INSERT INTO public.tenants(name,slug) VALUES(trim(p_name),lower(trim(p_slug))) RETURNING id INTO new_id;
  INSERT INTO public.store(tenant_id,store_name,store_slug,phone,email,currency)
  VALUES(new_id,trim(p_name),lower(trim(p_slug)),NULLIF(trim(p_phone),''),NULLIF(trim(p_email),''),COALESCE(NULLIF(trim(p_currency),''),'SAR'));
  RETURN new_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.create_tenant_for_registration(text,text,text,text,text) TO anon;

CREATE OR REPLACE FUNCTION public.update_current_store_settings(p_store jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_tenant_id uuid:=public.current_tenant_id(); v_name text; v_slug text; v_currency text; v_store public.store%ROWTYPE;
BEGIN
  IF v_tenant_id IS NULL OR NOT public.is_current_tenant_admin() THEN RAISE EXCEPTION 'Admin role required' USING ERRCODE='42501'; END IF;
  IF p_store IS NULL OR pg_catalog.jsonb_typeof(p_store)<>'object' THEN RAISE EXCEPTION 'Store settings payload is invalid' USING ERRCODE='22023'; END IF;
  v_name:=pg_catalog.btrim(COALESCE(p_store->>'store_name','')); v_slug:=pg_catalog.lower(pg_catalog.btrim(COALESCE(p_store->>'store_slug',''))); v_currency:=COALESCE(NULLIF(pg_catalog.btrim(p_store->>'currency'),''),'SAR');
  IF v_name='' THEN RAISE EXCEPTION 'Store name is required' USING ERRCODE='22023'; END IF;
  IF v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN RAISE EXCEPTION 'Invalid store slug' USING ERRCODE='22023'; END IF;
  IF v_currency NOT IN ('SAR','AED','USD') THEN RAISE EXCEPTION 'Unsupported store currency' USING ERRCODE='22023'; END IF;
  UPDATE public.store SET store_name=v_name,store_slug=v_slug,phone=NULLIF(pg_catalog.btrim(COALESCE(p_store->>'phone','')),''),email=NULLIF(pg_catalog.btrim(COALESCE(p_store->>'email','')), ''),currency=v_currency,address=NULLIF(pg_catalog.btrim(COALESCE(p_store->>'address','')), ''),receipt_footer=NULLIF(pg_catalog.btrim(COALESCE(p_store->>'receipt_footer','')), ''),logo_url=NULLIF(p_store->>'logo_url','') WHERE tenant_id=v_tenant_id RETURNING * INTO v_store;
  IF v_store.id IS NULL THEN RAISE EXCEPTION 'Store settings were not found' USING ERRCODE='P0002'; END IF;
  UPDATE public.tenants SET name=v_store.store_name,slug=v_store.store_slug,logo_url=v_store.logo_url WHERE id=v_tenant_id;
  RETURN pg_catalog.to_jsonb(v_store);
END; $$;
GRANT EXECUTE ON FUNCTION public.update_current_store_settings(jsonb) TO authenticated;
