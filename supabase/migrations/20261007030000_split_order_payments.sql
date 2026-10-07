-- Split tender support: one order may be settled by cash and card/network together.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cash_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS card_amount numeric(12,2);

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IS NULL OR payment_method IN ('cash', 'card', 'split', 'wallet', 'transfer', 'other'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_split_amounts_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_split_amounts_check
  CHECK (
    (payment_method = 'split' AND cash_amount IS NOT NULL AND card_amount IS NOT NULL AND cash_amount >= 0 AND card_amount >= 0 AND round(cash_amount + card_amount, 2) = round(total_price, 2))
    OR (payment_method IS NULL OR payment_method <> 'split')
  );

COMMENT ON COLUMN public.orders.cash_amount IS 'Cash portion of a split payment; populated with the full amount for cash-only POS sales.';
COMMENT ON COLUMN public.orders.card_amount IS 'Card/network portion of a split payment; populated with the full amount for card-only POS sales.';

-- Keep cashier closeout totals accurate when split tender is used.
CREATE OR REPLACE FUNCTION public.close_cashier_session(p_session_id uuid, p_closing_cash numeric, p_notes text DEFAULT NULL)
RETURNS public.cashier_sessions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE result public.cashier_sessions;
BEGIN
  IF p_closing_cash IS NULL OR p_closing_cash < 0 THEN RAISE EXCEPTION 'Closing cash must be non-negative'; END IF;
  SELECT cs.* INTO result FROM public.cashier_sessions cs
  WHERE cs.id = p_session_id AND cs.status = 'open' AND (cs.auth_user_id = auth.uid() OR public.is_current_tenant_admin()) FOR UPDATE;
  IF result.id IS NULL THEN RAISE EXCEPTION 'Open cashier session not found'; END IF;
  WITH sales AS (
    SELECT
      COALESCE(sum(o.total_price), 0) AS total,
      COALESCE(sum(CASE WHEN o.payment_method = 'split' THEN COALESCE(o.cash_amount, 0) ELSE o.total_price END) FILTER (WHERE o.payment_method = 'cash' OR o.payment_method = 'split'), 0) AS cash,
      COALESCE(sum(CASE WHEN o.payment_method = 'split' THEN COALESCE(o.card_amount, 0) ELSE o.total_price END) FILTER (WHERE o.payment_method = 'card' OR o.payment_method = 'split'), 0) AS card,
      COALESCE(sum(o.total_price) FILTER (WHERE o.payment_method = 'wallet'), 0) AS wallet,
      COALESCE(sum(o.total_price) FILTER (WHERE o.payment_method = 'transfer'), 0) AS transfer,
      COALESCE(sum(o.total_price) FILTER (WHERE o.payment_method = 'other' OR o.payment_method IS NULL), 0) AS other
    FROM public.orders o
    WHERE o.tenant_id = result.tenant_id AND o.status IN ('served', 'unclaimed')
      AND COALESCE(o.payment_status, 'unpaid') = 'paid' AND o.created_at >= result.opened_at AND o.created_at <= now()
  )
  UPDATE public.cashier_sessions cs SET status = 'closed', closed_at = now(), closing_cash = round(p_closing_cash, 2), notes = NULLIF(trim(p_notes), ''), total_sales = round(s.total, 2), cash_sales = round(s.cash, 2), card_sales = round(s.card, 2), wallet_sales = round(s.wallet, 2), transfer_sales = round(s.transfer, 2), other_sales = round(s.other, 2) FROM sales s WHERE cs.id = result.id RETURNING cs.* INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.close_cashier_session(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.close_cashier_session(uuid, numeric, text) TO authenticated;
