-- 1) profiles: authenticated users must be able to read their own profile (RLS limits rows to id = auth.uid()).
--    Column-level grant only; role/tenant_id can never be updated directly by clients.
grant select (id, tenant_id, full_name, role, created_at) on public.profiles to authenticated;
drop policy if exists profiles_self_update on public.profiles;

-- 2) cashiers: admins may list cashiers, but never see pin_hash.
grant select (id, tenant_id, full_name, username, role, created_at) on public.cashiers to authenticated;
drop policy if exists cashiers_admin_select on public.cashiers;
create policy cashiers_admin_select on public.cashiers for select to authenticated
  using (public.is_current_tenant_admin() and public.tenant_match(tenant_id));

-- 3) Logged-in managers/cashiers open the public menu in the same browser: they need the public RPCs too.
grant execute on function public.get_public_tenant(text), public.get_public_store(text), public.get_public_categories(text),
  public.get_public_menu_items(text), public.get_public_tables(text), public.create_public_order(text, jsonb, numeric, text, text),
  public.create_public_waiter_call(text, text, text), public.create_public_feedback(text, text, numeric, text[], text) to authenticated;

-- 4) Cashiers (staff) can read store/menu/tables of their own tenant; writes stay admin-only.
drop policy if exists store_staff_select on public.store;
create policy store_staff_select on public.store for select to authenticated using (public.tenant_match(tenant_id));
drop policy if exists categories_staff_select on public.categories;
create policy categories_staff_select on public.categories for select to authenticated using (public.tenant_match(tenant_id));
drop policy if exists menu_items_staff_select on public.menu_items;
create policy menu_items_staff_select on public.menu_items for select to authenticated using (public.tenant_match(tenant_id));
drop policy if exists table_staff_select on public."table";
create policy table_staff_select on public."table" for select to authenticated using (public.tenant_match(tenant_id));
