-- Do not round the client total before the order trigger verifies it.
-- The server trigger remains the final authority for item prices and totals.
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
  normalized_table text := nullif(trim(p_table_number), '');
  tracking_token text;
BEGIN
  SELECT t.id INTO target_tenant_id FROM public.tenants t WHERE t.slug = lower(trim(p_slug)) LIMIT 1;
  target_branch_id := public.resolve_branch_id(p_slug, p_branch_slug);
  IF target_tenant_id IS NULL OR target_branch_id IS NULL THEN RAISE EXCEPTION 'Tenant or branch not found'; END IF;
  IF normalized_table IS NULL OR normalized_table = 'غير محدد' OR NOT EXISTS (SELECT 1 FROM public."table" tb WHERE tb.tenant_id = target_tenant_id AND tb.branch_id = target_branch_id AND tb.table_number::text = normalized_table) THEN
    RAISE EXCEPTION 'A valid table number is required for customer tracking' USING ERRCODE = '22023';
  END IF;
  tracking_token := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO public.orders (tenant_id, branch_id, items, total_price, table_number, notes, status, is_completed, completed_at, tracking_token_hash)
  VALUES (target_tenant_id, target_branch_id, CASE WHEN jsonb_typeof(coalesce(p_items, '[]'::jsonb)) = 'array' THEN coalesce(p_items, '[]'::jsonb) ELSE '[]'::jsonb END, coalesce(p_total_price, 0), normalized_table, nullif(trim(coalesce(p_notes, '')), ''), 'pending', false, null, encode(extensions.digest(tracking_token, 'sha256'), 'hex'))
  RETURNING * INTO result;
  RETURN jsonb_build_object('order_id', result.id, 'tracking_token', tracking_token, 'status', result.status, 'created_at', result.created_at, 'total_price', result.total_price, 'table_number', result.table_number);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_public_order_with_tracking(
  p_slug text,
  p_items jsonb,
  p_total_price numeric,
  p_table_number text,
  p_notes text
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
  normalized_table text := nullif(trim(p_table_number), '');
  tracking_token text;
BEGIN
  SELECT t.id INTO target_tenant_id FROM public.tenants t WHERE t.slug = lower(trim(p_slug)) LIMIT 1;
  target_branch_id := public.resolve_branch_id(p_slug, 'main');
  IF target_tenant_id IS NULL OR target_branch_id IS NULL THEN RAISE EXCEPTION 'Tenant or branch not found'; END IF;
  IF normalized_table IS NULL OR normalized_table = 'غير محدد' OR NOT EXISTS (SELECT 1 FROM public."table" tb WHERE tb.tenant_id = target_tenant_id AND tb.branch_id = target_branch_id AND tb.table_number::text = normalized_table) THEN
    RAISE EXCEPTION 'A valid table number is required for customer tracking' USING ERRCODE = '22023';
  END IF;
  tracking_token := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO public.orders (tenant_id, branch_id, items, total_price, table_number, notes, status, is_completed, completed_at, tracking_token_hash)
  VALUES (target_tenant_id, target_branch_id, CASE WHEN jsonb_typeof(coalesce(p_items, '[]'::jsonb)) = 'array' THEN coalesce(p_items, '[]'::jsonb) ELSE '[]'::jsonb END, coalesce(p_total_price, 0), normalized_table, nullif(trim(coalesce(p_notes, '')), ''), 'pending', false, null, encode(extensions.digest(tracking_token, 'sha256'), 'hex'))
  RETURNING * INTO result;
  RETURN jsonb_build_object('order_id', result.id, 'tracking_token', tracking_token, 'status', result.status, 'created_at', result.created_at, 'total_price', result.total_price, 'table_number', result.table_number);
END;
$$;
