revoke all on function public.create_tenant_for_registration(text, text) from public, anon, authenticated;
drop function if exists public.create_tenant_for_registration(text, text);
revoke all on function public.create_tenant_for_registration(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_tenant_for_registration(text, text, text, text, text, text) to anon;
revoke all on function public.ensure_profile_for_current_user() from public, anon, authenticated;
grant execute on function public.ensure_profile_for_current_user() to authenticated;
revoke all on function public.is_current_tenant_admin() from public, anon, authenticated;
grant execute on function public.is_current_tenant_admin() to authenticated;
