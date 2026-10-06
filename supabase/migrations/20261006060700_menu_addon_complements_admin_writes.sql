-- Keep complement names readable by staff in the same tenant, but editable only by its admin.
-- The table already has tenant isolation; replace its original broad FOR ALL policy.
CREATE OR REPLACE FUNCTION public.is_current_tenant_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = auth.uid()
      AND profile.tenant_id = public.current_tenant_id()
      AND profile.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_tenant_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_tenant_admin() TO authenticated;

DROP POLICY IF EXISTS menu_addon_complements_tenant_isolation
  ON public.menu_addon_complements;
DROP POLICY IF EXISTS menu_addon_complements_tenant_select
  ON public.menu_addon_complements;
DROP POLICY IF EXISTS menu_addon_complements_admin_insert
  ON public.menu_addon_complements;
DROP POLICY IF EXISTS menu_addon_complements_admin_update
  ON public.menu_addon_complements;
DROP POLICY IF EXISTS menu_addon_complements_admin_delete
  ON public.menu_addon_complements;

CREATE POLICY menu_addon_complements_tenant_select
  ON public.menu_addon_complements
  FOR SELECT
  TO authenticated
  USING (public.tenant_match(tenant_id));

CREATE POLICY menu_addon_complements_admin_insert
  ON public.menu_addon_complements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.tenant_match(tenant_id)
    AND public.is_current_tenant_admin()
  );

CREATE POLICY menu_addon_complements_admin_update
  ON public.menu_addon_complements
  FOR UPDATE
  TO authenticated
  USING (
    public.tenant_match(tenant_id)
    AND public.is_current_tenant_admin()
  )
  WITH CHECK (
    public.tenant_match(tenant_id)
    AND public.is_current_tenant_admin()
  );

CREATE POLICY menu_addon_complements_admin_delete
  ON public.menu_addon_complements
  FOR DELETE
  TO authenticated
  USING (
    public.tenant_match(tenant_id)
    AND public.is_current_tenant_admin()
  );
