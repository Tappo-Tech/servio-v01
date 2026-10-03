-- إشعارات المنيو بين أجهزة المدير، دون بث صف الصنف أو صور Base64.
-- القناة خاصة ومربوطة بمستأجر واحد؛ وتتحقق RLS من مستأجر الجلسة عند الانضمام.

CREATE OR REPLACE FUNCTION public.broadcast_menu_catalog_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected_tenant_id uuid;
  affected_row_id text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_tenant_id := OLD.tenant_id;
    affected_row_id := OLD.id::text;
  ELSE
    affected_tenant_id := NEW.tenant_id;
    affected_row_id := NEW.id::text;
  END IF;

  IF affected_tenant_id IS NOT NULL THEN
    PERFORM realtime.send(
      jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'row_id', affected_row_id,
        'operation', TG_OP
      ),
      'menu_catalog_changed',
      'tenant:' || affected_tenant_id::text || ':menu_catalog',
      true
    );
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.broadcast_menu_catalog_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS broadcast_menu_items_menu_catalog_change ON public.menu_items;
CREATE TRIGGER broadcast_menu_items_menu_catalog_change
AFTER INSERT OR UPDATE OR DELETE ON public.menu_items
FOR EACH ROW EXECUTE FUNCTION public.broadcast_menu_catalog_change();

DROP TRIGGER IF EXISTS broadcast_categories_menu_catalog_change ON public.categories;
CREATE TRIGGER broadcast_categories_menu_catalog_change
AFTER INSERT OR UPDATE OR DELETE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.broadcast_menu_catalog_change();

DROP POLICY IF EXISTS tenant_menu_catalog_broadcast_read ON realtime.messages;
CREATE POLICY tenant_menu_catalog_broadcast_read
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  extension = 'broadcast'
  AND realtime.topic() = 'tenant:' || public.current_tenant_id()::text || ':menu_catalog'
);
