-- Branch-aware operations: one tenant can own multiple operational branches.
CREATE TABLE IF NOT EXISTS public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 2 AND 120),
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);
CREATE INDEX IF NOT EXISTS branches_tenant_created_idx ON public.branches (tenant_id, created_at);
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.branches TO authenticated;
DROP POLICY IF EXISTS branches_select ON public.branches;
CREATE POLICY branches_select ON public.branches FOR SELECT TO authenticated USING (public.tenant_match(tenant_id));
DROP POLICY IF EXISTS branches_admin_write ON public.branches;
CREATE POLICY branches_admin_write ON public.branches FOR ALL TO authenticated USING (public.tenant_match(tenant_id) AND public.is_current_tenant_admin()) WITH CHECK (public.tenant_match(tenant_id) AND public.is_current_tenant_admin());

DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT id, name FROM public.tenants LOOP
    INSERT INTO public.branches (tenant_id, name, slug)
    VALUES (t.id, COALESCE(NULLIF(btrim(t.name), ''), 'الفرع الرئيسي'), 'main')
    ON CONFLICT (tenant_id, slug) DO NOTHING;
  END LOOP;
END $$;

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.menu_ingredients ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.menu_item_ingredients ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.menu_addon_complements ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public."table" ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cashier_id uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cashier_session_id uuid;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.waiter_calls ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.feedbacks ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.cashiers ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.cashier_sessions ADD COLUMN IF NOT EXISTS branch_id uuid;

UPDATE public.categories c SET branch_id = b.id FROM public.branches b WHERE c.branch_id IS NULL AND b.tenant_id = c.tenant_id AND b.slug = 'main';
UPDATE public.menu_items m SET branch_id = b.id FROM public.branches b WHERE m.branch_id IS NULL AND b.tenant_id = m.tenant_id AND b.slug = 'main';
UPDATE public.menu_ingredients m SET branch_id = b.id FROM public.branches b WHERE m.branch_id IS NULL AND b.tenant_id = m.tenant_id AND b.slug = 'main';
UPDATE public.menu_item_ingredients m SET branch_id = b.id FROM public.branches b WHERE m.branch_id IS NULL AND b.tenant_id = m.tenant_id AND b.slug = 'main';
UPDATE public.menu_addon_complements m SET branch_id = b.id FROM public.branches b WHERE m.branch_id IS NULL AND b.tenant_id = m.tenant_id AND b.slug = 'main';
UPDATE public."table" x SET branch_id = b.id FROM public.branches b WHERE x.branch_id IS NULL AND b.tenant_id = x.tenant_id AND b.slug = 'main';
UPDATE public.orders o SET branch_id = b.id FROM public.branches b WHERE o.branch_id IS NULL AND b.tenant_id = o.tenant_id AND b.slug = 'main';
UPDATE public.order_items x SET branch_id = o.branch_id FROM public.orders o WHERE x.branch_id IS NULL AND x.order_id = o.id;
UPDATE public.waiter_calls x SET branch_id = b.id FROM public.branches b WHERE x.branch_id IS NULL AND b.tenant_id = x.tenant_id AND b.slug = 'main';
UPDATE public.feedbacks x SET branch_id = b.id FROM public.branches b WHERE x.branch_id IS NULL AND b.tenant_id = x.tenant_id AND b.slug = 'main';
UPDATE public.cashiers x SET branch_id = b.id FROM public.branches b WHERE x.branch_id IS NULL AND b.tenant_id = x.tenant_id AND b.slug = 'main';
UPDATE public.cashier_sessions x SET branch_id = b.id FROM public.branches b WHERE x.branch_id IS NULL AND b.tenant_id = x.tenant_id AND b.slug = 'main';

ALTER TABLE public.categories ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public.menu_items ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public.menu_ingredients ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public.menu_item_ingredients ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public.menu_addon_complements ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public."table" ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public.order_items ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public.waiter_calls ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public.feedbacks ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public.cashiers ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public.cashier_sessions ALTER COLUMN branch_id SET NOT NULL;

ALTER TABLE public.categories ADD CONSTRAINT categories_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.menu_items ADD CONSTRAINT menu_items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.menu_ingredients ADD CONSTRAINT menu_ingredients_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.menu_item_ingredients ADD CONSTRAINT menu_item_ingredients_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.menu_addon_complements ADD CONSTRAINT menu_addon_complements_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public."table" ADD CONSTRAINT table_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD CONSTRAINT orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.waiter_calls ADD CONSTRAINT waiter_calls_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.feedbacks ADD CONSTRAINT feedbacks_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.cashiers ADD CONSTRAINT cashiers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;
ALTER TABLE public.cashier_sessions ADD CONSTRAINT cashier_sessions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;
ALTER TABLE public.orders ADD CONSTRAINT orders_cashier_id_fkey FOREIGN KEY (cashier_id) REFERENCES public.cashiers(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD CONSTRAINT orders_cashier_session_id_fkey FOREIGN KEY (cashier_session_id) REFERENCES public.cashier_sessions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS categories_branch_idx ON public.categories(branch_id, created_at);
CREATE INDEX IF NOT EXISTS menu_items_branch_idx ON public.menu_items(branch_id, created_at);
CREATE INDEX IF NOT EXISTS menu_ingredients_branch_idx ON public.menu_ingredients(branch_id, created_at);
CREATE INDEX IF NOT EXISTS tables_branch_idx ON public."table"(branch_id, table_number);
CREATE INDEX IF NOT EXISTS orders_branch_created_idx ON public.orders(branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_cashier_idx ON public.orders(cashier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_session_idx ON public.orders(cashier_session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS cashiers_branch_idx ON public.cashiers(branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sessions_branch_idx ON public.cashier_sessions(branch_id, created_at DESC);

-- Resolve a public branch from the tenant slug and optional branch slug.
CREATE OR REPLACE FUNCTION public.resolve_branch_id(p_tenant_slug text, p_branch_slug text DEFAULT NULL)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.id FROM public.branches b JOIN public.tenants t ON t.id = b.tenant_id
  WHERE t.slug = lower(trim(p_tenant_slug)) AND b.is_active
    AND (p_branch_slug IS NULL OR b.slug = lower(trim(p_branch_slug)))
  ORDER BY (b.slug = 'main') DESC, b.created_at LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.resolve_branch_id(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_branch_id(text,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.current_user_branch_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.branch_id FROM public.cashiers c WHERE c.auth_user_id = auth.uid() AND c.is_active LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.current_user_branch_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_branch_id() TO authenticated;

-- Branch-aware public reads/writes. Existing one-argument RPCs remain compatible.
CREATE OR REPLACE FUNCTION public.get_public_categories(p_slug text, p_branch_slug text)
RETURNS SETOF public.categories LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.* FROM public.categories c WHERE c.branch_id = public.resolve_branch_id(p_slug, p_branch_slug)
$$;
CREATE OR REPLACE FUNCTION public.get_public_menu_items(p_slug text, p_branch_slug text)
RETURNS SETOF public.menu_items LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.* FROM public.menu_items m WHERE m.branch_id = public.resolve_branch_id(p_slug, p_branch_slug)
$$;
CREATE OR REPLACE FUNCTION public.get_public_tables(p_slug text, p_branch_slug text)
RETURNS SETOF public."table" LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tb.* FROM public."table" tb WHERE tb.branch_id = public.resolve_branch_id(p_slug, p_branch_slug)
$$;
CREATE OR REPLACE FUNCTION public.create_public_order(p_slug text, p_items jsonb, p_total_price numeric, p_table_number text, p_notes text, p_branch_slug text)
RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result public.orders; v_tenant uuid; v_branch uuid;
BEGIN
  SELECT t.id INTO v_tenant FROM public.tenants t WHERE t.slug = lower(trim(p_slug));
  v_branch := public.resolve_branch_id(p_slug, p_branch_slug);
  INSERT INTO public.orders (tenant_id, branch_id, items, total_price, table_number, notes, status, is_completed, completed_at)
  VALUES (v_tenant, v_branch, COALESCE(p_items, '[]'::jsonb), COALESCE(p_total_price,0), p_table_number, p_notes, 'pending', false, null) RETURNING * INTO result;
  IF result.id IS NULL THEN RAISE EXCEPTION 'Tenant or branch not found'; END IF;
  RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.create_public_waiter_call(p_slug text, p_table_number text, p_reason text, p_branch_slug text)
RETURNS public.waiter_calls LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result public.waiter_calls;
BEGIN
  INSERT INTO public.waiter_calls (tenant_id, branch_id, table_number, reason, is_resolved)
  SELECT t.id, public.resolve_branch_id(p_slug, p_branch_slug), COALESCE(p_table_number,'1'), COALESCE(p_reason,'استدعاء عام'), false
  FROM public.tenants t WHERE t.slug = lower(trim(p_slug)) RETURNING * INTO result;
  IF result.id IS NULL THEN RAISE EXCEPTION 'Tenant or branch not found'; END IF;
  RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.create_public_feedback(p_slug text, p_table_number text, p_rating numeric, p_tags text[], p_comment text, p_branch_slug text)
RETURNS public.feedbacks LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result public.feedbacks;
BEGIN
  INSERT INTO public.feedbacks (tenant_id, branch_id, table_number, rating, tags, comment)
  SELECT t.id, public.resolve_branch_id(p_slug, p_branch_slug), p_table_number, p_rating, p_tags, p_comment
  FROM public.tenants t WHERE t.slug = lower(trim(p_slug)) RETURNING * INTO result;
  IF result.id IS NULL THEN RAISE EXCEPTION 'Tenant or branch not found'; END IF;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_public_categories(text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_menu_items(text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_tables(text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_public_order(text,jsonb,numeric,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_public_waiter_call(text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_public_feedback(text,text,numeric,text[],text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_categories(text,text), public.get_public_menu_items(text,text), public.get_public_tables(text,text), public.create_public_order(text,jsonb,numeric,text,text,text), public.create_public_waiter_call(text,text,text,text), public.create_public_feedback(text,text,numeric,text[],text,text) TO anon, authenticated;

-- Keep shift totals tied to the cashier session, never all tenant sales.
CREATE OR REPLACE FUNCTION public.close_cashier_session(p_session_id uuid, p_closing_cash numeric, p_notes text DEFAULT NULL)
RETURNS public.cashier_sessions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result public.cashier_sessions;
BEGIN
  IF p_closing_cash IS NULL OR p_closing_cash < 0 THEN RAISE EXCEPTION 'Closing cash must be non-negative'; END IF;
  SELECT cs.* INTO result FROM public.cashier_sessions cs WHERE cs.id = p_session_id AND cs.status = 'open' AND (cs.auth_user_id = auth.uid() OR public.is_current_tenant_admin()) FOR UPDATE;
  IF result.id IS NULL THEN RAISE EXCEPTION 'Open cashier session not found'; END IF;
  WITH sales AS (SELECT COALESCE(sum(o.total_price),0) total,
    COALESCE(sum(o.total_price) FILTER (WHERE o.payment_method='cash'),0) cash,
    COALESCE(sum(o.total_price) FILTER (WHERE o.payment_method='card'),0) card,
    COALESCE(sum(o.total_price) FILTER (WHERE o.payment_method='wallet'),0) wallet,
    COALESCE(sum(o.total_price) FILTER (WHERE o.payment_method='transfer'),0) transfer,
    COALESCE(sum(o.total_price) FILTER (WHERE o.payment_method='other' OR o.payment_method IS NULL),0) other
    FROM public.orders o WHERE o.cashier_session_id = result.id AND o.status IN ('served','unclaimed') AND COALESCE(o.payment_status,'unpaid')='paid')
  UPDATE public.cashier_sessions cs SET status='closed', closed_at=now(), closing_cash=round(p_closing_cash,2), notes=NULLIF(trim(p_notes),''), total_sales=round(s.total,2), cash_sales=round(s.cash,2), card_sales=round(s.card,2), wallet_sales=round(s.wallet,2), transfer_sales=round(s.transfer,2), other_sales=round(s.other,2) FROM sales s WHERE cs.id=p_session_id RETURNING cs.* INTO result;
  RETURN result;
END $$;
GRANT EXECUTE ON FUNCTION public.close_cashier_session(uuid,numeric,text) TO authenticated;
