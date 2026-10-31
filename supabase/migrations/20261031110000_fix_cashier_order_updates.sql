-- SECURITY DEFINER helper: RLS on public.cashiers must not make policy checks fail
-- with permission denied for authenticated cashier sessions.
CREATE OR REPLACE FUNCTION public.is_active_cashier_in_branch(p_tenant_id uuid, p_branch_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cashiers c
    WHERE c.auth_user_id = auth.uid()
      AND c.tenant_id = p_tenant_id
      AND c.branch_id = p_branch_id
      AND c.is_active IS TRUE
  )
  AND EXISTS (
    SELECT 1
    FROM public.cashier_sessions s
    WHERE s.auth_user_id = auth.uid()
      AND s.tenant_id = p_tenant_id
      AND s.branch_id = p_branch_id
      AND s.status = 'open'
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_cashier_in_branch(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_cashier_in_branch(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_current_cashier_session(p_session_id uuid, p_tenant_id uuid, p_branch_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cashier_sessions s
    JOIN public.cashiers c ON c.id = s.cashier_id
    WHERE s.id = p_session_id
      AND s.auth_user_id = auth.uid()
      AND s.tenant_id = p_tenant_id
      AND s.branch_id = p_branch_id
      AND s.status = 'open'
      AND c.auth_user_id = auth.uid()
      AND c.is_active IS TRUE
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_cashier_session(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_cashier_session(uuid, uuid, uuid) TO authenticated;

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
    WHERE b.id = orders.branch_id AND b.tenant_id = orders.tenant_id AND b.is_active
  )
  AND (
    public.is_current_tenant_admin()
    OR public.is_current_cashier_session(cashier_session_id, tenant_id, branch_id)
  )
);

-- This older permissive policy queried public.cashiers directly and could
-- fail with permission denied before the safe helper was evaluated.
DROP POLICY IF EXISTS orders_staff_update ON public.orders;
DROP POLICY IF EXISTS orders_tenant_update ON public.orders;
CREATE POLICY orders_tenant_update
ON public.orders
FOR UPDATE
TO authenticated
USING (
  public.tenant_match(tenant_id)
  AND (
    public.is_current_tenant_admin()
    OR public.is_active_cashier_in_branch(tenant_id, branch_id)
  )
)
WITH CHECK (
  public.tenant_match(tenant_id)
  AND (
    public.is_current_tenant_admin()
    OR public.is_active_cashier_in_branch(tenant_id, branch_id)
  )
);
