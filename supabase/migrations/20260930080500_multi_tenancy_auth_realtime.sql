create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  theme_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tenants_slug_idx on public.tenants (slug);

insert into public.tenants (name, slug, logo_url)
select
  coalesce(nullif(store_name, ''), 'SERVIO'),
  coalesce(nullif(regexp_replace(lower(coalesce(nullif(store_slug, ''), nullif(store_name, ''), 'servio')), '[^a-z0-9]+', '-', 'g'), ''), 'servio'),
  logo_url
from public.store
where not exists (select 1 from public.tenants)
limit 1;

insert into public.tenants (name, slug)
select 'SERVIO', 'servio'
where not exists (select 1 from public.tenants);

alter table public.store add column if not exists tenant_id uuid;
alter table public.categories add column if not exists tenant_id uuid;
alter table public.menu_items add column if not exists tenant_id uuid;
alter table public."table" add column if not exists tenant_id uuid;
alter table public.orders add column if not exists tenant_id uuid;
alter table public.waiter_calls add column if not exists tenant_id uuid;
alter table public.feedbacks add column if not exists tenant_id uuid;

update public.store set tenant_id = (select id from public.tenants order by created_at limit 1) where tenant_id is null;
update public.categories set tenant_id = (select id from public.tenants order by created_at limit 1) where tenant_id is null;
update public.menu_items set tenant_id = (select id from public.tenants order by created_at limit 1) where tenant_id is null;
update public."table" set tenant_id = (select id from public.tenants order by created_at limit 1) where tenant_id is null;
update public.orders set tenant_id = (select id from public.tenants order by created_at limit 1) where tenant_id is null;
update public.waiter_calls set tenant_id = (select id from public.tenants order by created_at limit 1) where tenant_id is null;
update public.feedbacks set tenant_id = (select id from public.tenants order by created_at limit 1) where tenant_id is null;

alter table public.store alter column tenant_id set not null;
alter table public.categories alter column tenant_id set not null;
alter table public.menu_items alter column tenant_id set not null;
alter table public."table" alter column tenant_id set not null;
alter table public.orders alter column tenant_id set not null;
alter table public.waiter_calls alter column tenant_id set not null;
alter table public.feedbacks alter column tenant_id set not null;

alter table public.store drop constraint if exists store_tenant_id_fkey;
alter table public.categories drop constraint if exists categories_tenant_id_fkey;
alter table public.menu_items drop constraint if exists menu_items_tenant_id_fkey;
alter table public."table" drop constraint if exists table_tenant_id_fkey;
alter table public.orders drop constraint if exists orders_tenant_id_fkey;
alter table public.waiter_calls drop constraint if exists waiter_calls_tenant_id_fkey;
alter table public.feedbacks drop constraint if exists feedbacks_tenant_id_fkey;

alter table public.store add constraint store_tenant_id_fkey foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.categories add constraint categories_tenant_id_fkey foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.menu_items add constraint menu_items_tenant_id_fkey foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public."table" add constraint table_tenant_id_fkey foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.orders add constraint orders_tenant_id_fkey foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.waiter_calls add constraint waiter_calls_tenant_id_fkey foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.feedbacks add constraint feedbacks_tenant_id_fkey foreign key (tenant_id) references public.tenants(id) on delete cascade;

create index if not exists store_tenant_id_idx on public.store (tenant_id);
create index if not exists categories_tenant_id_idx on public.categories (tenant_id);
create index if not exists menu_items_tenant_id_idx on public.menu_items (tenant_id);
create index if not exists table_tenant_id_idx on public."table" (tenant_id);
create index if not exists orders_tenant_id_idx on public.orders (tenant_id);
create index if not exists waiter_calls_tenant_id_idx on public.waiter_calls (tenant_id);
create index if not exists feedbacks_tenant_id_idx on public.feedbacks (tenant_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);
create index if not exists order_items_tenant_id_idx on public.order_items (tenant_id);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'cashier')),
  created_at timestamptz not null default now()
);
create index if not exists profiles_tenant_id_idx on public.profiles (tenant_id);

create table if not exists public.cashiers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  username text not null,
  pin_hash text not null,
  role text not null default 'cashier' check (role = 'cashier'),
  created_at timestamptz not null default now(),
  unique (tenant_id, username)
);
create index if not exists cashiers_tenant_id_idx on public.cashiers (tenant_id);

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, tenant_id, full_name, role)
  values (
    new.id,
    (new.raw_user_meta_data->>'tenant_id')::uuid,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'admin'
  )
  on conflict (id) do update set tenant_id = excluded.tenant_id, full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.create_tenant_for_registration(p_name text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare new_id uuid;
begin
  if p_name is null or length(trim(p_name)) < 2 then raise exception 'Tenant name is required'; end if;
  if p_slug is null or p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'Invalid slug'; end if;
  insert into public.tenants (name, slug) values (trim(p_name), lower(trim(p_slug))) returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.get_public_tenant(p_slug text)
returns setof public.tenants
language sql
stable
security definer
set search_path = public
as $$ select * from public.tenants where slug = lower(trim(p_slug)) limit 1 $$;

create or replace function public.get_public_store(p_slug text)
returns setof public.store
language sql
stable
security definer
set search_path = public
as $$ select s.* from public.store s join public.tenants t on t.id = s.tenant_id where t.slug = lower(trim(p_slug)) limit 1 $$;

create or replace function public.get_public_categories(p_slug text)
returns setof public.categories
language sql
stable
security definer
set search_path = public
as $$ select c.* from public.categories c join public.tenants t on t.id = c.tenant_id where t.slug = lower(trim(p_slug)) $$;

create or replace function public.get_public_menu_items(p_slug text)
returns setof public.menu_items
language sql
stable
security definer
set search_path = public
as $$ select m.* from public.menu_items m join public.tenants t on t.id = m.tenant_id where t.slug = lower(trim(p_slug)) $$;

create or replace function public.get_public_tables(p_slug text)
returns setof public."table"
language sql
stable
security definer
set search_path = public
as $$ select tb.* from public."table" tb join public.tenants t on t.id = tb.tenant_id where t.slug = lower(trim(p_slug)) $$;

create or replace function public.create_public_order(p_slug text, p_items jsonb, p_total_price numeric, p_table_number text, p_notes text)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare result public.orders;
begin
  insert into public.orders (tenant_id, items, total_price, table_number, notes, status, is_completed, completed_at)
  select t.id, array(select value from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)))::jsonb[], p_total_price, p_table_number, p_notes, 'pending', false, null
  from public.tenants t where t.slug = lower(trim(p_slug)) returning * into result;
  if result.id is null then raise exception 'Tenant not found'; end if;
  return result;
end;
$$;

create or replace function public.create_public_waiter_call(p_slug text, p_table_number text, p_reason text)
returns public.waiter_calls
language plpgsql
security definer
set search_path = public
as $$
declare result public.waiter_calls;
begin
  insert into public.waiter_calls (tenant_id, table_number, reason, is_resolved)
  select t.id, coalesce(p_table_number, '1'), coalesce(p_reason, 'استدعاء عام'), false
  from public.tenants t where t.slug = lower(trim(p_slug)) returning * into result;
  if result.id is null then raise exception 'Tenant not found'; end if;
  return result;
end;
$$;

create or replace function public.create_public_feedback(p_slug text, p_table_number text, p_rating numeric, p_tags text[], p_comment text)
returns public.feedbacks
language plpgsql
security definer
set search_path = public
as $$
declare result public.feedbacks;
begin
  insert into public.feedbacks (tenant_id, table_number, rating, tags, comment)
  select t.id, coalesce(p_table_number, '1'), p_rating, p_tags, p_comment
  from public.tenants t where t.slug = lower(trim(p_slug)) returning * into result;
  if result.id is null then raise exception 'Tenant not found'; end if;
  return result;
end;
$$;

create or replace function public.create_cashier(p_full_name text, p_username text, p_pin text)
returns public.cashiers
language plpgsql
security definer
set search_path = public
as $$
declare result public.cashiers;
begin
  if public.current_tenant_id() is null then raise exception 'Unauthenticated'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then raise exception 'Admin role required'; end if;
  insert into public.cashiers (tenant_id, full_name, username, pin_hash)
  values (public.current_tenant_id(), trim(p_full_name), lower(trim(p_username)), extensions.crypt(p_pin, extensions.gen_salt('bf')))
  returning * into result;
  return result;
end;
$$;

create or replace function public.verify_cashier_login(p_tenant_slug text, p_username text, p_pin text)
returns table (id uuid, tenant_id uuid, full_name text, username text, role text)
language sql
security definer
set search_path = public
as $$
  select c.id, c.tenant_id, c.full_name, c.username, c.role
  from public.cashiers c join public.tenants t on t.id = c.tenant_id
  where t.slug = lower(trim(p_tenant_slug))
    and c.username = lower(trim(p_username))
    and c.pin_hash = extensions.crypt(p_pin, c.pin_hash)
  limit 1;
$$;

revoke all on public.cashiers from anon, authenticated;
revoke all on public.profiles from anon, authenticated;
grant execute on function public.create_tenant_for_registration(text, text) to anon, authenticated;
grant execute on function public.get_public_tenant(text) to anon, authenticated;
grant execute on function public.get_public_store(text) to anon, authenticated;
grant execute on function public.get_public_categories(text) to anon, authenticated;
grant execute on function public.get_public_menu_items(text) to anon, authenticated;
grant execute on function public.get_public_tables(text) to anon, authenticated;
grant execute on function public.create_public_order(text, jsonb, numeric, text, text) to anon, authenticated;
grant execute on function public.create_public_waiter_call(text, text, text) to anon, authenticated;
grant execute on function public.create_public_feedback(text, text, numeric, text[], text) to anon, authenticated;
grant execute on function public.verify_cashier_login(text, text, text) to anon, authenticated;
grant execute on function public.create_cashier(text, text, text) to authenticated;

alter table public.tenants enable row level security;
alter table public.store enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public."table" enable row level security;
alter table public.orders enable row level security;
alter table public.waiter_calls enable row level security;
alter table public.feedbacks enable row level security;
alter table public.order_items enable row level security;
alter table public.profiles enable row level security;
alter table public.cashiers enable row level security;

drop policy if exists tenants_public_select on public.tenants;
create policy tenants_public_select on public.tenants for select to anon, authenticated using (true);

create or replace function public.tenant_match(row_tenant_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select row_tenant_id = public.current_tenant_id() $$;

do $$
declare t text;
begin
  foreach t in array array['store','categories','menu_items','table','orders','waiter_calls','feedbacks','order_items'] loop
    execute format('drop policy if exists %I_tenant_isolation on public.%I', t, t);
    execute format('create policy %I_tenant_isolation on public.%I for all to authenticated using (public.tenant_match(tenant_id)) with check (public.tenant_match(tenant_id))', t, t);
  end loop;
end $$;

create policy profiles_self_select on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy cashiers_admin_select on public.cashiers for select to authenticated using (public.tenant_match(tenant_id));


do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'orders') then alter publication supabase_realtime add table public.orders; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'waiter_calls') then alter publication supabase_realtime add table public.waiter_calls; end if;
end $$;
