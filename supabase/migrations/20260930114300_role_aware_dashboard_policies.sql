create or replace function public.is_current_tenant_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

grant execute on function public.is_current_tenant_admin() to authenticated;

 drop policy if exists store_tenant_isolation on public.store;
 drop policy if exists categories_tenant_isolation on public.categories;
 drop policy if exists menu_items_tenant_isolation on public.menu_items;
 drop policy if exists table_tenant_isolation on public."table";
 drop policy if exists orders_tenant_isolation on public.orders;
 drop policy if exists waiter_calls_tenant_isolation on public.waiter_calls;
 drop policy if exists feedbacks_tenant_isolation on public.feedbacks;
 drop policy if exists order_items_tenant_isolation on public.order_items;

create policy store_admin_all on public.store for all to authenticated using (public.is_current_tenant_admin() and public.tenant_match(tenant_id)) with check (public.is_current_tenant_admin() and public.tenant_match(tenant_id));
create policy categories_admin_all on public.categories for all to authenticated using (public.is_current_tenant_admin() and public.tenant_match(tenant_id)) with check (public.is_current_tenant_admin() and public.tenant_match(tenant_id));
create policy menu_items_admin_all on public.menu_items for all to authenticated using (public.is_current_tenant_admin() and public.tenant_match(tenant_id)) with check (public.is_current_tenant_admin() and public.tenant_match(tenant_id));
create policy table_admin_all on public."table" for all to authenticated using (public.is_current_tenant_admin() and public.tenant_match(tenant_id)) with check (public.is_current_tenant_admin() and public.tenant_match(tenant_id));

create policy orders_tenant_select on public.orders for select to authenticated using (public.tenant_match(tenant_id));
create policy orders_tenant_update on public.orders for update to authenticated using (public.tenant_match(tenant_id)) with check (public.tenant_match(tenant_id));
create policy waiter_calls_tenant_select on public.waiter_calls for select to authenticated using (public.tenant_match(tenant_id));
create policy waiter_calls_tenant_update on public.waiter_calls for update to authenticated using (public.tenant_match(tenant_id)) with check (public.tenant_match(tenant_id));
create policy feedbacks_tenant_select on public.feedbacks for select to authenticated using (public.tenant_match(tenant_id));
create policy order_items_tenant_select on public.order_items for select to authenticated using (public.tenant_match(tenant_id));

drop policy if exists tenants_admin_update on public.tenants;
create policy tenants_admin_update on public.tenants for update to authenticated using (public.is_current_tenant_admin() and id = public.current_tenant_id()) with check (public.is_current_tenant_admin() and id = public.current_tenant_id());
