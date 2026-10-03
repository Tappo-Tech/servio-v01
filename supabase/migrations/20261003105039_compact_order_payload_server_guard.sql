-- صور المنيو والوصف لا تحتاجها بطاقة الطلب أو الفاتورة، لكنها تضخم بث Realtime وREST.
-- نُبقي معرف الصنف واسمه وكميته وسعره؛ ولا نمس إجمالي الطلب أو حالة الدفع/الإكمال.

CREATE OR REPLACE FUNCTION public.compact_order_items_payload(p_items jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT COALESCE(
    jsonb_agg(
      CASE
        WHEN jsonb_typeof(entry.item) = 'object'
          THEN entry.item - ARRAY['image', 'tags', 'description', 'allergens']::text[]
        ELSE entry.item
      END
      ORDER BY entry.ordinal
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(COALESCE(p_items, '[]'::jsonb)) = 'array'
        THEN COALESCE(p_items, '[]'::jsonb)
      ELSE '[]'::jsonb
    END
  ) WITH ORDINALITY AS entry(item, ordinal);
$$;

-- يفرض الضغط على أي عميل قديم أو جديد، بما في ذلك استدعاء RPC العام.
-- UPDATE دون تحديد items ينظف أيضًا الطلبات القديمة عند أول تعديل لحالتها.
CREATE OR REPLACE FUNCTION public.compact_order_items_before_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.items := public.compact_order_items_payload(NEW.items);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_compact_items_before_write ON public.orders;
CREATE TRIGGER orders_compact_items_before_write
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.compact_order_items_before_write();

-- الطلبات الثقيلة أُنشئت بعد التنظيف السابق من عميل ظل يرسل صور الأصناف.
-- حذف حقول العرض فقط يقلل البيانات المعادة، مع الحفاظ على تفاصيل الفاتورة والمجاميع.
UPDATE public.orders
SET items = public.compact_order_items_payload(items)
WHERE items IS DISTINCT FROM public.compact_order_items_payload(items);
