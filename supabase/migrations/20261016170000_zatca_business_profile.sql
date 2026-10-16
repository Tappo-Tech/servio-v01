-- Additive business-profile fields for ZATCA invoice readiness.
-- Existing tenants and workflows remain valid; no production data is rewritten.
ALTER TABLE public.store
  ADD COLUMN IF NOT EXISTS commercial_registration_number text,
  ADD COLUMN IF NOT EXISTS street_name text,
  ADD COLUMN IF NOT EXISTS building_number text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'SA';

COMMENT ON COLUMN public.store.commercial_registration_number IS 'Seller commercial registration identifier (CRN) used as the ZATCA seller ID when applicable.';
COMMENT ON COLUMN public.store.street_name IS 'Saudi National Address street name for the seller invoice address.';
COMMENT ON COLUMN public.store.building_number IS 'Four-digit seller building number required in the Saudi invoice address.';
COMMENT ON COLUMN public.store.district IS 'Seller address district (KSA-3).';
COMMENT ON COLUMN public.store.city IS 'Seller address city (BT-37).';
COMMENT ON COLUMN public.store.postal_code IS 'Five-digit seller postal code (BT-38).';
COMMENT ON COLUMN public.store.country_code IS 'ISO 3166-1 alpha-2 seller country; Saudi Arabia is SA.';

-- Keep the existing RPC unchanged for deployed clients. New sign-ups use this
-- versioned function so the new profile fields are inserted atomically with tenant/store.
CREATE OR REPLACE FUNCTION public.create_tenant_for_registration_v2(
  p_name text,
  p_slug text,
  p_phone text,
  p_email text,
  p_tax_number text,
  p_currency text,
  p_commercial_registration_number text,
  p_street_name text,
  p_building_number text,
  p_district text,
  p_city text,
  p_postal_code text,
  p_country_code text DEFAULT 'SA'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  normalized_vat text := regexp_replace(coalesce(p_tax_number, ''), '\s', '', 'g');
  normalized_building text := trim(coalesce(p_building_number, ''));
BEGIN
  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'Tenant name is required';
  END IF;
  IF p_slug IS NULL OR lower(trim(p_slug)) !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Invalid slug';
  END IF;
  IF normalized_vat !~ '^3[0-9]{13}3$' THEN
    RAISE EXCEPTION 'Saudi VAT number must contain 15 digits and start and end with 3';
  END IF;
  IF nullif(trim(coalesce(p_commercial_registration_number, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Commercial registration number is required';
  END IF;
  IF nullif(trim(coalesce(p_street_name, '')), '') IS NULL
     OR nullif(normalized_building, '') IS NULL
     OR normalized_building !~ '^[0-9]{4}$'
     OR nullif(trim(coalesce(p_district, '')), '') IS NULL
     OR nullif(trim(coalesce(p_city, '')), '') IS NULL
     OR nullif(trim(coalesce(p_postal_code, '')), '') IS NULL
     OR trim(coalesce(p_postal_code, '')) !~ '^[0-9]{5}$'
     OR upper(trim(coalesce(p_country_code, ''))) <> 'SA' THEN
    RAISE EXCEPTION 'Complete Saudi seller address is required';
  END IF;

  INSERT INTO public.tenants (name, slug)
  VALUES (trim(p_name), lower(trim(p_slug)))
  RETURNING id INTO new_id;

  INSERT INTO public.store (
    tenant_id, store_name, store_slug, phone, email, tax_number, currency,
    commercial_registration_number, street_name, building_number, district,
    city, postal_code, country_code
  ) VALUES (
    new_id, trim(p_name), lower(trim(p_slug)), nullif(trim(p_phone), ''),
    nullif(trim(p_email), ''), normalized_vat,
    coalesce(nullif(trim(p_currency), ''), 'SAR'),
    trim(p_commercial_registration_number), trim(p_street_name), normalized_building,
    trim(p_district), trim(p_city), trim(p_postal_code), 'SA'
  );

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_tenant_for_registration_v2(text, text, text, text, text, text, text, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_tenant_for_registration_v2(text, text, text, text, text, text, text, text, text, text, text, text, text) TO anon, authenticated;
