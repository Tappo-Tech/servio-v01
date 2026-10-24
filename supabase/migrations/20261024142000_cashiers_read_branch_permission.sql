-- تسمح لمدير النشاط بعرض الكاشيرات وفروعهم في الإعدادات، مع إبقاء pin_hash غير قابل للقراءة.
GRANT SELECT (id, tenant_id, full_name, username, role, branch_id, created_at, is_active)
ON public.cashiers TO authenticated;

DROP POLICY IF EXISTS cashiers_admin_select ON public.cashiers;
CREATE POLICY cashiers_admin_select ON public.cashiers
FOR SELECT TO authenticated
USING (public.is_current_tenant_admin() AND public.tenant_match(tenant_id));
