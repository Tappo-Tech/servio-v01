-- حفظ بيانات الملف الشخصي والمتجر على الخادم، مع دورة حياة آمنة لحسابات الكاشير.

-- ملفات المدير تحفظ رقم الهاتف كذلك؛ العمود قد يكون موجودًا في بيئات أقدم.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
GRANT SELECT (phone) ON public.profiles TO authenticated;

-- مزامنة الاسم والهاتف من بيانات Auth إلى الملف المرتبط في المعاملة نفسها.
CREATE OR REPLACE FUNCTION public.sync_profile_settings_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data THEN
    UPDATE public.profiles
    SET full_name = COALESCE(NULLIF(pg_catalog.btrim(NEW.raw_user_meta_data->>'full_name'), ''), full_name),
        phone = NULLIF(pg_catalog.btrim(NEW.raw_user_meta_data->>'phone'), '')
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_profile_settings_from_auth() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS sync_profile_settings_after_auth_update ON auth.users;
CREATE TRIGGER sync_profile_settings_after_auth_update
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_settings_from_auth();

-- لا يستطيع الكاشير المؤرشف الاستمرار باستخدام جلسة قديمة للوصول إلى بيانات النشاط.
ALTER TABLE public.cashiers ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
GRANT SELECT (is_active) ON public.cashiers TO authenticated;
CREATE INDEX IF NOT EXISTS cashiers_tenant_active_created_idx
  ON public.cashiers (tenant_id, is_active, created_at DESC);

-- الأسماء فريدة بين الحسابات النشطة فقط، ويمكن إعادة استخدام اسم حساب مؤرشف.
ALTER TABLE public.cashiers DROP CONSTRAINT IF EXISTS cashiers_tenant_id_username_key;
DROP INDEX IF EXISTS public.cashiers_tenant_id_username_key;
CREATE UNIQUE INDEX IF NOT EXISTS cashiers_tenant_active_username_key
  ON public.cashiers (tenant_id, username) WHERE is_active;

-- تُحفظ سجلات الورديات بعد حذف هوية Auth، وتظل مربوطة بسجل الكاشير التاريخي.
ALTER TABLE public.cashier_sessions ALTER COLUMN auth_user_id DROP NOT NULL;
ALTER TABLE public.cashier_sessions DROP CONSTRAINT IF EXISTS cashier_sessions_auth_user_id_fkey;
ALTER TABLE public.cashier_sessions
  ADD CONSTRAINT cashier_sessions_auth_user_id_fkey
  FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- رقم النشاط لا يُمنح إلا لمدير أو لكاشير نشط ذي ملف مطابق.
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT profile.tenant_id
  FROM public.profiles AS profile
  WHERE profile.id = auth.uid()
    AND (
      profile.role = 'admin'
      OR (
        profile.role = 'cashier'
        AND EXISTS (
          SELECT 1
          FROM public.cashiers AS cashier
          WHERE cashier.auth_user_id = profile.id
            AND cashier.tenant_id = profile.tenant_id
            AND cashier.is_active IS TRUE
        )
      )
    )
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.current_tenant_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;

-- قفل صف الكاشير أثناء فتح الوردية؛ يمنع بدء وردية بالتزامن مع عملية الحذف.
CREATE OR REPLACE FUNCTION public.open_cashier_session(p_opening_cash numeric DEFAULT 0)
RETURNS public.cashier_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cashier public.cashiers%ROWTYPE;
  v_session public.cashier_sessions%ROWTYPE;
BEGIN
  IF p_opening_cash IS NULL OR p_opening_cash < 0 THEN
    RAISE EXCEPTION 'Opening cash must be non-negative' USING ERRCODE = '22023';
  END IF;

  SELECT cashier.* INTO v_cashier
  FROM public.cashiers AS cashier
  WHERE cashier.auth_user_id = auth.uid() AND cashier.is_active IS TRUE
  FOR UPDATE;
  IF v_cashier.id IS NULL THEN RAISE EXCEPTION 'Active cashier profile not found' USING ERRCODE = '42501'; END IF;

  SELECT session.* INTO v_session
  FROM public.cashier_sessions AS session
  WHERE session.auth_user_id = auth.uid() AND session.status = 'open'
  LIMIT 1;
  IF v_session.id IS NOT NULL THEN RETURN v_session; END IF;

  INSERT INTO public.cashier_sessions (tenant_id, cashier_id, auth_user_id, opening_cash)
  VALUES (v_cashier.tenant_id, v_cashier.id, auth.uid(), pg_catalog.round(p_opening_cash, 2))
  RETURNING * INTO v_session;
  RETURN v_session;
END;
$$;
GRANT EXECUTE ON FUNCTION public.open_cashier_session(numeric) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.open_cashier_session(numeric) FROM anon;

-- تعطيل الحساب وقفل فتح ورديات جديدة في معاملة واحدة مع التحقق من صلاحية المدير.
CREATE OR REPLACE FUNCTION public.deactivate_cashier(p_cashier_id uuid)
RETURNS TABLE (id uuid, full_name text, auth_user_id uuid, is_active boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid := public.current_tenant_id();
  v_cashier public.cashiers%ROWTYPE;
BEGIN
  IF v_tenant_id IS NULL OR NOT public.is_current_tenant_admin() THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;

  SELECT cashier.* INTO v_cashier
  FROM public.cashiers AS cashier
  WHERE cashier.id = p_cashier_id AND cashier.tenant_id = v_tenant_id
  FOR UPDATE;
  IF v_cashier.id IS NULL THEN RAISE EXCEPTION 'Cashier not found' USING ERRCODE = 'P0002'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.cashier_sessions AS session
    WHERE session.cashier_id = v_cashier.id AND session.status = 'open'
  ) THEN
    RAISE EXCEPTION 'Cashier must close the open shift before account deletion' USING ERRCODE = '55000';
  END IF;

  UPDATE public.cashiers AS cashier
  SET is_active = false
  WHERE cashier.id = v_cashier.id
  RETURNING cashier.id, cashier.full_name, cashier.auth_user_id, cashier.is_active
  INTO id, full_name, auth_user_id, is_active;
  RETURN NEXT;
END;
$$;
REVOKE ALL ON FUNCTION public.deactivate_cashier(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_cashier(uuid) TO authenticated;

-- حفظ إعدادات المتجر واسم/رابط النشاط بعملية ذرية حتى لا ينفصل الصفان عند الفشل.
CREATE OR REPLACE FUNCTION public.update_current_store_settings(p_store jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid := public.current_tenant_id();
  v_name text;
  v_slug text;
  v_currency text;
  v_store public.store%ROWTYPE;
BEGIN
  IF v_tenant_id IS NULL OR NOT public.is_current_tenant_admin() THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;
  IF p_store IS NULL OR pg_catalog.jsonb_typeof(p_store) <> 'object' THEN
    RAISE EXCEPTION 'Store settings payload is invalid' USING ERRCODE = '22023';
  END IF;

  v_name := pg_catalog.btrim(COALESCE(p_store->>'store_name', ''));
  v_slug := pg_catalog.lower(pg_catalog.btrim(COALESCE(p_store->>'store_slug', '')));
  v_currency := COALESCE(NULLIF(pg_catalog.btrim(p_store->>'currency'), ''), 'SAR');
  IF v_name = '' THEN RAISE EXCEPTION 'Store name is required' USING ERRCODE = '22023'; END IF;
  IF v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Invalid store slug' USING ERRCODE = '22023';
  END IF;
  IF v_currency NOT IN ('SAR', 'AED', 'USD') THEN
    RAISE EXCEPTION 'Unsupported store currency' USING ERRCODE = '22023';
  END IF;

  UPDATE public.store AS store_row
  SET store_name = v_name,
      store_slug = v_slug,
      phone = NULLIF(pg_catalog.btrim(COALESCE(p_store->>'phone', '')), ''),
      email = NULLIF(pg_catalog.btrim(COALESCE(p_store->>'email', '')), ''),
      tax_number = NULLIF(pg_catalog.btrim(COALESCE(p_store->>'tax_number', '')), ''),
      currency = v_currency,
      address = NULLIF(pg_catalog.btrim(COALESCE(p_store->>'address', '')), ''),
      receipt_footer = NULLIF(pg_catalog.btrim(COALESCE(p_store->>'receipt_footer', '')), ''),
      logo_url = NULLIF(p_store->>'logo_url', '')
  WHERE store_row.tenant_id = v_tenant_id
  RETURNING store_row.* INTO v_store;

  IF v_store.id IS NULL THEN RAISE EXCEPTION 'Store settings were not found' USING ERRCODE = 'P0002'; END IF;

  UPDATE public.tenants AS tenant
  SET name = v_store.store_name,
      slug = v_store.store_slug,
      logo_url = v_store.logo_url
  WHERE tenant.id = v_tenant_id;

  RETURN pg_catalog.to_jsonb(v_store);
END;
$$;
REVOKE ALL ON FUNCTION public.update_current_store_settings(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_current_store_settings(jsonb) TO authenticated;

-- الإبقاء على حساب دخول مستقل لكل كاشير، مع منع الحسابات المؤرشفة من تسجيل الدخول.
CREATE OR REPLACE FUNCTION public.verify_cashier_login(
  p_tenant_slug text,
  p_username text,
  p_pin text
)
RETURNS TABLE (id uuid, tenant_id uuid, full_name text, username text, role text, auth_user_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT cashier.id, cashier.tenant_id, cashier.full_name, cashier.username, cashier.role, cashier.auth_user_id
  FROM public.cashiers AS cashier
  JOIN public.tenants AS tenant ON tenant.id = cashier.tenant_id
  WHERE tenant.slug = pg_catalog.lower(pg_catalog.btrim(p_tenant_slug))
    AND cashier.username = pg_catalog.lower(pg_catalog.btrim(p_username))
    AND cashier.is_active IS TRUE
    AND cashier.pin_hash = extensions.crypt(p_pin, cashier.pin_hash)
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.verify_cashier_login(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_cashier_login(text, text, text) TO service_role;

-- يعيد إنشاء وظيفة إضافة الكاشير مع تحقق مدخلات صارم وعدم إرجاع hash الـPIN للمتصفح.
DROP FUNCTION IF EXISTS public.create_cashier(text, text, text);
CREATE FUNCTION public.create_cashier(p_full_name text, p_username text, p_pin text)
RETURNS TABLE (id uuid, full_name text, username text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid := public.current_tenant_id();
BEGIN
  IF v_tenant_id IS NULL OR NOT public.is_current_tenant_admin() THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;
  IF pg_catalog.length(pg_catalog.btrim(COALESCE(p_full_name, ''))) < 2
    OR pg_catalog.length(pg_catalog.btrim(COALESCE(p_username, ''))) < 3
    OR pg_catalog.btrim(p_username) !~ '^[A-Za-z0-9._-]+$'
    OR p_pin !~ '^[0-9]{4,6}$' THEN
    RAISE EXCEPTION 'Cashier name, username, or PIN is invalid' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  INSERT INTO public.cashiers AS cashier (tenant_id, full_name, username, pin_hash, is_active)
  VALUES (
    v_tenant_id,
    pg_catalog.btrim(p_full_name),
    pg_catalog.lower(pg_catalog.btrim(p_username)),
    extensions.crypt(p_pin, extensions.gen_salt('bf')),
    true
  )
  RETURNING cashier.id, cashier.full_name, cashier.username;
END;
$$;
REVOKE ALL ON FUNCTION public.create_cashier(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_cashier(text, text, text) TO authenticated;
