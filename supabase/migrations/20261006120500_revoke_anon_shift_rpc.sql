-- ترحيل قاعدة البيانات `revoke anon shift rpc`؛ راجع أوامر SQL أدناه لمعرفة التغيير الدقيق.
REVOKE EXECUTE ON FUNCTION public.open_cashier_session(numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.close_cashier_session(uuid, numeric, text) FROM anon;
