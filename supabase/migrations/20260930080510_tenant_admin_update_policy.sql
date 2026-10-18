-- ترحيل قاعدة البيانات `tenant admin update policy`؛ راجع أوامر SQL أدناه لمعرفة التغيير الدقيق.
create policy tenants_admin_update on public.tenants
for update to authenticated
using (id = public.current_tenant_id())
with check (id = public.current_tenant_id());
