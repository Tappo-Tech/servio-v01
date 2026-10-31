-- Restrict cashier updates to orders belonging to the authenticated cashier's session.
-- Admins retain tenant-scoped management access.
DROP POLICY IF EXISTS orders_staff_update ON public.orders;
CREATE POLICY orders_staff_update ON public.orders
  FOR UPDATE TO authenticated
  USING (
    public.tenant_match(tenant_id)
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
  )
  WITH CHECK (
    public.tenant_match(tenant_id)
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

-- The session row must belong to the cashier's actual tenant and branch.
DROP POLICY IF EXISTS cashier_sessions_insert ON public.cashier_sessions;
CREATE POLICY cashier_sessions_insert ON public.cashier_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.tenant_match(tenant_id)
    AND auth_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.cashiers c
      WHERE c.id = cashier_id
        AND c.auth_user_id = auth.uid()
        AND c.tenant_id = cashier_sessions.tenant_id
        AND c.branch_id = cashier_sessions.branch_id
        AND c.is_active
    )
  );
