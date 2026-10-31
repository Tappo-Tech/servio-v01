
CREATE OR REPLACE FUNCTION public.create_public_order_with_tracking(
  p_slug text, p_items jsonb, p_total_price numeric, p_table_number text, p_notes text
)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $$
  SELECT public.create_public_order_with_tracking(p_slug, p_items, p_total_price, p_table_number, p_notes, 'main');
$$;
