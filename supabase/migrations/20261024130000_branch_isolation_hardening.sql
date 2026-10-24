-- Harden branch isolation: remove legacy public RPC overloads and scope shift history.
DROP FUNCTION IF EXISTS public.get_public_categories(text);
DROP FUNCTION IF EXISTS public.get_public_menu_items(text);
DROP FUNCTION IF EXISTS public.get_public_tables(text);
DROP FUNCTION IF EXISTS public.create_public_order(text, jsonb, numeric, text, text);
DROP FUNCTION IF EXISTS public.create_public_waiter_call(text, text, text);
DROP FUNCTION IF EXISTS public.create_public_feedback(text, text, numeric, text[], text);

DROP FUNCTION IF EXISTS public.list_cashier_sessions(integer);
CREATE FUNCTION public.list_cashier_sessions(
  p_limit integer DEFAULT 100,
  p_branch_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid, tenant_id uuid, branch_id uuid, cashier_id uuid, auth_user_id uuid,
  opened_at timestamptz, closed_at timestamptz, status text, opening_cash numeric,
  closing_cash numeric, total_sales numeric, cash_sales numeric, card_sales numeric,
  wallet_sales numeric, transfer_sales numeric, other_sales numeric, notes text,
  created_at timestamptz, cashier_name text, cashier_username text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$
  SELECT cs.id, cs.tenant_id, cs.branch_id, cs.cashier_id, cs.auth_user_id,
         cs.opened_at, cs.closed_at, cs.status, cs.opening_cash, cs.closing_cash,
         cs.total_sales, cs.cash_sales, cs.card_sales, cs.wallet_sales,
         cs.transfer_sales, cs.other_sales, cs.notes, cs.created_at,
         c.full_name, c.username
  FROM public.cashier_sessions cs
  JOIN public.cashiers c ON c.id = cs.cashier_id AND c.tenant_id = cs.tenant_id
  WHERE public.tenant_match(cs.tenant_id)
    AND (
      cs.auth_user_id = auth.uid()
      OR (public.is_current_tenant_admin()
          AND (p_branch_id IS NULL OR cs.branch_id = p_branch_id))
    )
  ORDER BY cs.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 500));
$$;
GRANT EXECUTE ON FUNCTION public.list_cashier_sessions(integer, uuid) TO authenticated;
