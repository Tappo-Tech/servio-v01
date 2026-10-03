-- Order cards only need identity, name, quantity and price.
-- Removing embedded menu images makes Realtime INSERT/UPDATE payloads small and fast.
update public.orders
set items = (
  select coalesce(jsonb_agg(item - 'image' - 'tags' - 'description' - 'allergens'), '[]'::jsonb)
  from jsonb_array_elements(items) as entry(item)
)
where jsonb_typeof(items) = 'array';
