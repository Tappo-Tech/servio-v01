-- مكتبة أسماء مكملات قابلة لإعادة الاستخدام في خيارات كل صنف.
-- تظل أسماء الإضافات المختارة محفوظة في menu_items.addon_options لتوافق الطلبات القائمة.
CREATE TABLE IF NOT EXISTS public.menu_addon_complements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS menu_addon_complements_tenant_name_key
  ON public.menu_addon_complements (tenant_id, lower(btrim(name)));

ALTER TABLE public.menu_addon_complements ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_addon_complements TO authenticated;

DROP POLICY IF EXISTS menu_addon_complements_tenant_isolation ON public.menu_addon_complements;
CREATE POLICY menu_addon_complements_tenant_isolation
  ON public.menu_addon_complements
  FOR ALL
  TO authenticated
  USING (public.tenant_match(tenant_id))
  WITH CHECK (public.tenant_match(tenant_id));

DROP TRIGGER IF EXISTS broadcast_menu_addon_complements_menu_catalog_change ON public.menu_addon_complements;
CREATE TRIGGER broadcast_menu_addon_complements_menu_catalog_change
  AFTER INSERT OR UPDATE OR DELETE ON public.menu_addon_complements
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_menu_catalog_change();
