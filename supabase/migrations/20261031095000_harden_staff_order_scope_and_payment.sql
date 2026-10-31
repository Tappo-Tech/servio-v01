-- Staff orders must belong to the current tenant/branch and, for cashiers,
-- to the caller's currently open session.
DROP POLICY IF EXISTS orders_staff_insert ON public.orders;
CREATE POLICY orders_staff_insert
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  public.tenant_match(tenant_id)
  AND branch_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.branches b
    WHERE b.id = orders.branch_id
      AND b.tenant_id = orders.tenant_id
      AND b.is_active
  )
  AND (
    public.is_current_tenant_admin()
    OR EXISTS (
      SELECT 1
      FROM public.cashier_sessions cs
      JOIN public.cashiers c ON c.id = cs.cashier_id
      WHERE cs.id = orders.cashier_session_id
        AND cs.tenant_id = orders.tenant_id
        AND cs.branch_id = orders.branch_id
        AND cs.auth_user_id = auth.uid()
        AND cs.status = 'open'
        AND c.auth_user_id = auth.uid()
        AND c.is_active
    )
  )
);

CREATE OR REPLACE FUNCTION public.guard_unpaid_completion_state()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'served' AND COALESCE(NEW.payment_status, 'unpaid') <> 'paid' THEN
    NEW.status := 'awaiting_payment';
    NEW.is_completed := false;
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_guard_unpaid_completion_state ON public.orders;
CREATE TRIGGER orders_guard_unpaid_completion_state
BEFORE INSERT OR UPDATE OF status, payment_status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.guard_unpaid_completion_state();
