-- Registration must work even when a stale/other session exists in the browser (role = authenticated).
grant execute on function public.create_tenant_for_registration(text, text, text, text, text, text) to authenticated;
