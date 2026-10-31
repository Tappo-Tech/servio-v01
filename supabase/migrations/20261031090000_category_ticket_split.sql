-- Allow a category to be printed as its own ticket even when it shares a printer.
alter table public.categories
  add column if not exists split_print boolean not null default false;

comment on column public.categories.split_print is
  'When true, print this category as its own ticket even when it uses the same printer as other categories.';

create or replace function public.save_category_print_route(
  p_category_id uuid,
  p_separate_print boolean,
  p_printer_name text,
  p_branch_id uuid,
  p_split_print boolean
)
returns public.categories
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.categories;
  v_tenant uuid := public.current_tenant_id();
  v_branch uuid := coalesce(p_branch_id, public.current_user_branch_id());
begin
  if auth.uid() is null or v_tenant is null or not public.is_current_tenant_admin() then
    raise exception 'Manager role required' using errcode='42501';
  end if;
  if not exists (select 1 from public.branches b where b.id=v_branch and b.tenant_id=v_tenant and b.is_active) then
    raise exception 'Branch is required' using errcode='42501';
  end if;
  if length(coalesce(trim(p_printer_name), '')) > 255 then
    raise exception 'Printer name is too long';
  end if;
  update public.categories c
  set separate_print=coalesce(p_separate_print,c.separate_print),
      printer_name=nullif(trim(p_printer_name),''),
      split_print=coalesce(p_split_print,c.split_print)
  where c.id=p_category_id and c.tenant_id=v_tenant and c.branch_id=v_branch
  returning c.* into result;
  if result.id is null then raise exception 'Category not found in branch' using errcode='42501'; end if;
  return result;
end;
$$;

grant execute on function public.save_category_print_route(uuid, boolean, text, uuid, boolean) to authenticated;

create or replace function public.save_category_print_routes(p_routes jsonb, p_branch_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant uuid := public.current_tenant_id();
  v_branch uuid := coalesce(p_branch_id, public.current_user_branch_id());
  requested_count integer;
  updated_count integer;
begin
  if v_tenant is null or not public.is_current_tenant_admin() then raise exception 'Manager role required' using errcode='42501'; end if;
  if not exists (select 1 from public.branches b where b.id=v_branch and b.tenant_id=v_tenant and b.is_active) then raise exception 'Branch is required'; end if;
  if p_routes is null or jsonb_typeof(p_routes) <> 'array' then raise exception 'Routes must be a JSON array'; end if;
  requested_count := jsonb_array_length(p_routes);
  if requested_count = 0 then return 0; end if;
  with routes as (
    select
      (value->>'category_id')::uuid as category_id,
      (value->>'separate_print')::boolean as separate_print,
      nullif(trim(value->>'printer_name'),'') as printer_name,
      (value->>'split_print')::boolean as split_print
    from jsonb_array_elements(p_routes) entry(value)
  ), updated as (
    update public.categories c
    set separate_print=coalesce(r.separate_print,c.separate_print),
        printer_name=coalesce(r.printer_name,c.printer_name),
        split_print=coalesce(r.split_print,c.split_print)
    from routes r
    where c.id=r.category_id and c.tenant_id=v_tenant and c.branch_id=v_branch
    returning c.id
  ) select count(*) into updated_count from updated;
  if updated_count <> requested_count then raise exception 'One or more categories are missing or belong to another branch' using errcode='42501'; end if;
  return updated_count;
end;
$$;

grant execute on function public.save_category_print_routes(jsonb, uuid) to authenticated;
