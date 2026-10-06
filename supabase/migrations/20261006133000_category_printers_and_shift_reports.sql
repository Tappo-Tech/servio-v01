-- Persist each category's printer queue at tenant scope so cashier devices reuse the assignment.
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS printer_name text;

COMMENT ON COLUMN public.categories.printer_name IS
  'Preferred receipt queue name for this category; a QZ Tray queue with the same name must exist on each cashier device.';

-- Managers and cashiers may update only the print-routing fields through this RPC.
CREATE OR REPLACE FUNCTION public.save_category_print_route(
  p_category_id uuid,
  p_separate_print boolean,
  p_printer_name text DEFAULT NULL
)
RETURNS public.categories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result public.categories;
  active_tenant_id uuid := public.current_tenant_id();
  clean_printer_name text := NULLIF(trim(p_printer_name), '');
BEGIN
  IF auth.uid() IS NULL OR active_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Authenticated tenant session required' USING ERRCODE = '42501';
  END IF;
  IF NOT public.is_current_tenant_admin() AND NOT EXISTS (
    SELECT 1 FROM public.cashiers c
    WHERE c.auth_user_id = auth.uid() AND c.tenant_id = active_tenant_id
  ) THEN
    RAISE EXCEPTION 'Manager or cashier role required' USING ERRCODE = '42501';
  END IF;
  IF length(COALESCE(clean_printer_name, '')) > 255 THEN
    RAISE EXCEPTION 'Printer name is too long';
  END IF;

  UPDATE public.categories c
  SET separate_print = COALESCE(p_separate_print, c.separate_print),
      printer_name = clean_printer_name
  WHERE c.id = p_category_id AND c.tenant_id = active_tenant_id
  RETURNING c.* INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Category not found in active tenant' USING ERRCODE = '42501';
  END IF;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.save_category_print_route(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_category_print_route(uuid, boolean, text) TO authenticated;

-- The cashiers table is intentionally not directly readable by a cashier; this RPC
-- returns shift rows and cashier display names only for the signed-in tenant/user.
CREATE OR REPLACE FUNCTION public.list_cashier_sessions(p_limit integer DEFAULT 100)
RETURNS TABLE (
  id uuid,
  tenant_id uuid,
  cashier_id uuid,
  auth_user_id uuid,
  opened_at timestamptz,
  closed_at timestamptz,
  status text,
  opening_cash numeric,
  closing_cash numeric,
  total_sales numeric,
  cash_sales numeric,
  card_sales numeric,
  wallet_sales numeric,
  transfer_sales numeric,
  other_sales numeric,
  notes text,
  created_at timestamptz,
  cashier_name text,
  cashier_username text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT cs.id, cs.tenant_id, cs.cashier_id, cs.auth_user_id,
         cs.opened_at, cs.closed_at, cs.status, cs.opening_cash, cs.closing_cash,
         cs.total_sales, cs.cash_sales, cs.card_sales, cs.wallet_sales,
         cs.transfer_sales, cs.other_sales, cs.notes, cs.created_at,
         c.full_name, c.username
  FROM public.cashier_sessions cs
  JOIN public.cashiers c ON c.id = cs.cashier_id AND c.tenant_id = cs.tenant_id
  WHERE public.tenant_match(cs.tenant_id)
    AND (public.is_current_tenant_admin() OR cs.auth_user_id = auth.uid())
  ORDER BY cs.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 500));
$$;
REVOKE ALL ON FUNCTION public.list_cashier_sessions(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_cashier_sessions(integer) TO authenticated;
