-- Provision the tenant/store/profile only after Auth exists, atomically.
CREATE OR REPLACE FUNCTION public.ensure_profile_for_current_user()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  metadata jsonb;
  metadata_tenant_id uuid;
  result public.profiles;
  new_tenant_id uuid;
  registration_name text;
  registration_slug text;
  registration_email text;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Unauthenticated'; END IF;
  SELECT raw_user_meta_data INTO metadata FROM auth.users WHERE id = current_user_id;
  BEGIN metadata_tenant_id := nullif(metadata->>'tenant_id', '')::uuid; EXCEPTION WHEN invalid_text_representation THEN metadata_tenant_id := NULL; END;
  SELECT * INTO result FROM public.profiles WHERE id = current_user_id LIMIT 1;
  IF result.id IS NOT NULL THEN RETURN result; END IF;

  IF metadata_tenant_id IS NULL THEN
    registration_name := nullif(trim(metadata->>'store_name'), '');
    registration_slug := lower(nullif(trim(metadata->>'store_slug'), ''));
    registration_email := lower(nullif(trim((SELECT email FROM auth.users WHERE id = current_user_id)), ''));
    IF registration_name IS NULL OR length(registration_name) < 2 THEN RAISE EXCEPTION 'Tenant name is required'; END IF;
    IF registration_slug IS NULL OR registration_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN RAISE EXCEPTION 'Invalid slug'; END IF;
    INSERT INTO public.tenants(name, slug) VALUES (registration_name, registration_slug) RETURNING id INTO new_tenant_id;
    INSERT INTO public.store(tenant_id, store_name, store_slug, phone, email, currency)
    VALUES (new_tenant_id, registration_name, registration_slug, NULLIF(trim(metadata->>'phone'), ''), registration_email, COALESCE(NULLIF(trim(metadata->>'currency'), ''), 'SAR'));
    metadata_tenant_id := new_tenant_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = metadata_tenant_id) THEN RAISE EXCEPTION 'Tenant profile is missing'; END IF;
  INSERT INTO public.profiles (id, tenant_id, full_name, phone, role)
  VALUES (current_user_id, metadata_tenant_id, COALESCE(NULLIF(metadata->>'full_name', ''), 'مدير'), NULLIF(metadata->>'phone', ''), CASE WHEN metadata->>'role' = 'cashier' THEN 'cashier' ELSE 'admin' END)
  RETURNING * INTO result;
  RETURN result;
END;
$$;
