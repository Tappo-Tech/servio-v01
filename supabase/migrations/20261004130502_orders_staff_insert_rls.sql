-- Allow authenticated staff to create orders only for their own tenant.
-- This matches the existing SELECT/UPDATE tenant scope and does not grant anon inserts.
GRANT INSERT ON TABLE public.orders TO authenticated;

DROP POLICY IF EXISTS orders_staff_insert ON public.orders;
CREATE POLICY orders_staff_insert
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (public.tenant_match(tenant_id));
