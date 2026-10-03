-- Compact orders created after the first payload cleanup migration.
update public.orders
set items = (
  select coalesce(jsonb_agg(item - 'image' - 'tags' - 'description' - 'allergens'), '[]'::jsonb)
  from jsonb_array_elements(items) as entry(item)
)
where jsonb_typeof(items) = 'array'
  and exists (
    select 1
    from jsonb_array_elements(items) as entry(item)
    where item ? 'image'
  );
