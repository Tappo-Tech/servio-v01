-- Keep exact decimal sales in closeout and assert payment-method reconciliation.
CREATE OR REPLACE FUNCTION public.close_cashier_session(
  p_session_id uuid,
  p_closing_cash numeric,
  p_notes text DEFAULT NULL
)
RETURNS public.cashier_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  result public.cashier_sessions;
  v_total numeric;
  v_cash numeric;
  v_card numeric;
  v_wallet numeric;
  v_transfer numeric;
  v_other numeric;
BEGIN
  IF p_closing_cash IS NULL OR p_closing_cash < 0 THEN
    RAISE EXCEPTION 'Closing cash must be non-negative';
  END IF;
  SELECT cs.* INTO result
  FROM public.cashier_sessions cs
  WHERE cs.id = p_session_id
    AND cs.status = 'open'
    AND (cs.auth_user_id = auth.uid() OR public.is_current_tenant_admin())
  FOR UPDATE;
  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Open cashier session not found';
  END IF;

  SELECT
    COALESCE(sum(o.total_price), 0),
    COALESCE(sum(CASE WHEN o.payment_method = 'cash' THEN o.total_price WHEN o.payment_method = 'split' THEN COALESCE(o.cash_amount, 0) ELSE 0 END), 0),
    COALESCE(sum(CASE WHEN o.payment_method = 'card' THEN o.total_price WHEN o.payment_method = 'split' THEN COALESCE(o.card_amount, 0) ELSE 0 END), 0),
    COALESCE(sum(o.total_price) FILTER (WHERE o.payment_method = 'wallet'), 0),
    COALESCE(sum(o.total_price) FILTER (WHERE o.payment_method = 'transfer'), 0),
    COALESCE(sum(o.total_price) FILTER (WHERE o.payment_method = 'other' OR o.payment_method IS NULL), 0)
  INTO v_total, v_cash, v_card, v_wallet, v_transfer, v_other
  FROM public.orders o
  WHERE o.cashier_session_id = result.id
    AND o.status IN ('served', 'unclaimed')
    AND COALESCE(o.payment_status, 'unpaid') = 'paid';

  IF v_total <> v_cash + v_card + v_wallet + v_transfer + v_other THEN
    RAISE EXCEPTION 'SHIFT_PAYMENT_RECONCILIATION_MISMATCH';
  END IF;

  UPDATE public.cashier_sessions cs
  SET status = 'closed',
      closed_at = now(),
      closing_cash = p_closing_cash,
      notes = NULLIF(trim(p_notes), ''),
      total_sales = v_total,
      cash_sales = v_cash,
      card_sales = v_card,
      wallet_sales = v_wallet,
      transfer_sales = v_transfer,
      other_sales = v_other
  WHERE cs.id = p_session_id
  RETURNING cs.* INTO result;
  RETURN result;
END;
$$;
