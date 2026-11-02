-- Store newly uploaded, compressed menu item photos outside menu row payloads.
-- Public reads use immutable CDN URLs; writes are restricted to the owning tenant admin.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('menu-item-images', 'menu-item-images', true, 204800, ARRAY['image/webp', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "menu_item_images_tenant_insert" ON storage.objects;
CREATE POLICY "menu_item_images_tenant_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'menu-item-images'
  AND public.is_current_tenant_admin()
  AND split_part(name, '/', 1) = public.current_tenant_id()::text
  AND EXISTS (
    SELECT 1 FROM public.branches b
    WHERE b.id::text = split_part(name, '/', 2)
      AND b.tenant_id = public.current_tenant_id()
  )
);

DROP POLICY IF EXISTS "menu_item_images_tenant_update" ON storage.objects;
CREATE POLICY "menu_item_images_tenant_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'menu-item-images'
  AND public.is_current_tenant_admin()
  AND split_part(name, '/', 1) = public.current_tenant_id()::text
  AND EXISTS (
    SELECT 1 FROM public.branches b
    WHERE b.id::text = split_part(name, '/', 2)
      AND b.tenant_id = public.current_tenant_id()
  )
)
WITH CHECK (
  bucket_id = 'menu-item-images'
  AND public.is_current_tenant_admin()
  AND split_part(name, '/', 1) = public.current_tenant_id()::text
  AND EXISTS (
    SELECT 1 FROM public.branches b
    WHERE b.id::text = split_part(name, '/', 2)
      AND b.tenant_id = public.current_tenant_id()
  )
);

DROP POLICY IF EXISTS "menu_item_images_tenant_delete" ON storage.objects;
CREATE POLICY "menu_item_images_tenant_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'menu-item-images'
  AND public.is_current_tenant_admin()
  AND split_part(name, '/', 1) = public.current_tenant_id()::text
  AND EXISTS (
    SELECT 1 FROM public.branches b
    WHERE b.id::text = split_part(name, '/', 2)
      AND b.tenant_id = public.current_tenant_id()
  )
);
