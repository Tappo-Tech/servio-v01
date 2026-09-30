create or replace function public.create_tenant_for_registration(
  p_name text,
  p_slug text,
  p_phone text default null,
  p_email text default null,
  p_tax_number text default null,
  p_currency text default 'SAR'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if p_name is null or length(trim(p_name)) < 2 then
    raise exception 'Tenant name is required';
  end if;
  if p_slug is null or lower(trim(p_slug)) !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Invalid slug';
  end if;

  insert into public.tenants (name, slug)
  values (trim(p_name), lower(trim(p_slug)))
  returning id into new_id;

  insert into public.store (tenant_id, store_name, store_slug, phone, email, tax_number, currency)
  values (new_id, trim(p_name), lower(trim(p_slug)), nullif(trim(p_phone), ''), nullif(trim(p_email), ''), nullif(trim(p_tax_number), ''), coalesce(nullif(trim(p_currency), ''), 'SAR'));

  return new_id;
end;
$$;

grant execute on function public.create_tenant_for_registration(text, text, text, text, text, text) to anon;

create or replace function public.ensure_profile_for_current_user()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  metadata jsonb;
  metadata_tenant_id uuid;
  result public.profiles;
begin
  if current_user_id is null then
    raise exception 'Unauthenticated';
  end if;

  select raw_user_meta_data into metadata from auth.users where id = current_user_id;
  begin
    metadata_tenant_id := nullif(metadata->>'tenant_id', '')::uuid;
  exception when invalid_text_representation then
    metadata_tenant_id := null;
  end;

  select * into result from public.profiles where id = current_user_id limit 1;
  if result.id is not null then
    return result;
  end if;
  if metadata_tenant_id is null or not exists (select 1 from public.tenants where id = metadata_tenant_id) then
    raise exception 'Tenant profile is missing';
  end if;

  insert into public.profiles (id, tenant_id, full_name, role)
  values (
    current_user_id,
    metadata_tenant_id,
    coalesce(nullif(metadata->>'full_name', ''), 'مدير'),
    case when metadata->>'role' = 'cashier' then 'cashier' else 'admin' end
  )
  returning * into result;
  return result;
end;
$$;

grant execute on function public.ensure_profile_for_current_user() to authenticated;

insert into public.store (tenant_id, store_name, store_slug, currency)
select t.id, t.name, t.slug, 'SAR'
from public.tenants t
where not exists (select 1 from public.store s where s.tenant_id = t.id);
