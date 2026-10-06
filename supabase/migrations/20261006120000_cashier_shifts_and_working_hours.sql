-- ساعات دوام النشاط وجلسات الكاشير.
ALTER TABLE public.store
  ADD COLUMN IF NOT EXISTS workday_start time,
  ADD COLUMN IF NOT EXISTS workday_end time,
  ADD COLUMN IF NOT EXISTS workday_hours numeric(5,2);

CREATE TABLE IF NOT EXISTS public.cashier_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cashier_id uuid NOT NULL REFERENCES public.cashiers(id) ON DELETE RESTRICT,
  auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opening_cash numeric(12,2) NOT NULL DEFAULT 0 CHECK (opening_cash >= 0),
  closing_cash numeric(12,2),
  total_sales numeric(12,2) NOT NULL DEFAULT 0,
  cash_sales numeric(12,2) NOT NULL DEFAULT 0,
  card_sales numeric(12,2) NOT NULL DEFAULT 0,
  wallet_sales numeric(12,2) NOT NULL DEFAULT 0,
  transfer_sales numeric(12,2) NOT NULL DEFAULT 0,
  other_sales numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'open' AND closed_at IS NULL AND closing_cash IS NULL) OR (status = 'closed' AND closed_at IS NOT NULL AND closing_cash IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS cashier_sessions_tenant_created_idx ON public.cashier_sessions (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS cashier_sessions_cashier_created_idx ON public.cashier_sessions (cashier_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS cashier_sessions_one_open_per_cashier ON public.cashier_sessions (cashier_id) WHERE status = 'open';

ALTER TABLE public.cashier_sessions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.cashier_sessions TO authenticated;
DROP POLICY IF EXISTS cashier_sessions_select ON public.cashier_sessions;
CREATE POLICY cashier_sessions_select ON public.cashier_sessions FOR SELECT TO authenticated
  USING (public.tenant_match(tenant_id) AND (public.is_current_tenant_admin() OR auth_user_id = auth.uid()));
DROP POLICY IF EXISTS cashier_sessions_insert ON public.cashier_sessions;
CREATE POLICY cashier_sessions_insert ON public.cashier_sessions FOR INSERT TO authenticated
  WITH CHECK (public.tenant_match(tenant_id) AND auth_user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.cashiers c WHERE c.id = cashier_id AND c.auth_user_id = auth.uid() AND c.tenant_id = tenant_id
  ));
DROP POLICY IF EXISTS cashier_sessions_update ON public.cashier_sessions;
CREATE POLICY cashier_sessions_update ON public.cashier_sessions FOR UPDATE TO authenticated
  USING (public.tenant_match(tenant_id) AND (public.is_current_tenant_admin() OR auth_user_id = auth.uid()))
  WITH CHECK (public.tenant_match(tenant_id));

CREATE OR REPLACE FUNCTION public.open_cashier_session(p_opening_cash numeric DEFAULT 0)
RETURNS public.cashier_sessions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE result public.cashier_sessions;
BEGIN
  IF p_opening_cash IS NULL OR p_opening_cash < 0 THEN RAISE EXCEPTION 'Opening cash must be non-negative'; END IF;
  SELECT cs.* INTO result FROM public.cashier_sessions cs WHERE cs.auth_user_id = auth.uid() AND cs.status = 'open' LIMIT 1;
  IF result.id IS NOT NULL THEN RETURN result; END IF;
  INSERT INTO public.cashier_sessions (tenant_id, cashier_id, auth_user_id, opening_cash)
  SELECT c.tenant_id, c.id, auth.uid(), round(p_opening_cash, 2)
  FROM public.cashiers c
  WHERE c.auth_user_id = auth.uid()
  RETURNING * INTO result;
  IF result.id IS NULL THEN RAISE EXCEPTION 'Cashier profile not found'; END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.close_cashier_session(p_session_id uuid, p_closing_cash numeric, p_notes text DEFAULT NULL)
RETURNS public.cashier_sessions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE result public.cashier_sessions;
BEGIN
  IF p_closing_cash IS NULL OR p_closing_cash < 0 THEN RAISE EXCEPTION 'Closing cash must be non-negative'; END IF;
  SELECT cs.* INTO result FROM public.cashier_sessions cs
  WHERE cs.id = p_session_id AND cs.status = 'open' AND (cs.auth_user_id = auth.uid() OR public.is_current_tenant_admin())
  FOR UPDATE;
  IF result.id IS NULL THEN RAISE EXCEPTION 'Open cashier session not found'; END IF;
  WITH sales AS (
    SELECT
      COALESCE(sum(o.total_price), 0) AS total,
      COALESCE(sum(o.total_price) FILTER (WHERE o.payment_method = 'cash'), 0) AS cash,
      COALESCE(sum(o.total_price) FILTER (WHERE o.payment_method = 'card'), 0) AS card,
      COALESCE(sum(o.total_price) FILTER (WHERE o.payment_method = 'wallet'), 0) AS wallet,
      COALESCE(sum(o.total_price) FILTER (WHERE o.payment_method = 'transfer'), 0) AS transfer,
      COALESCE(sum(o.total_price) FILTER (WHERE o.payment_method = 'other' OR o.payment_method IS NULL), 0) AS other
    FROM public.orders o
    WHERE o.tenant_id = result.tenant_id
      AND o.status IN ('served', 'unclaimed')
      AND o.created_at >= result.opened_at
      AND o.created_at <= now()
      AND COALESCE(o.payment_status, 'unpaid') = 'paid'
  )
  UPDATE public.cashier_sessions cs SET
    status = 'closed', closed_at = now(), closing_cash = round(p_closing_cash, 2), notes = NULLIF(trim(p_notes), ''),
    total_sales = round(s.total, 2), cash_sales = round(s.cash, 2), card_sales = round(s.card, 2),
    wallet_sales = round(s.wallet, 2), transfer_sales = round(s.transfer, 2), other_sales = round(s.other, 2)
  FROM sales s WHERE cs.id = p_session_id RETURNING cs.* INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.open_cashier_session(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_cashier_session(uuid, numeric, text) TO authenticated;
