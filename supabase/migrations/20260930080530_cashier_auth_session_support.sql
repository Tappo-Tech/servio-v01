alter table public.cashiers add column if not exists auth_user_id uuid unique;

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
    coalesce(new.raw_user_meta_data->>'role', 'admin')
  )
  on conflict (id) do update set tenant_id = excluded.tenant_id, full_name = excluded.full_name, role = excluded.role;
  return new;
end;
$$;
