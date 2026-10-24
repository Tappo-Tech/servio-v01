-- Complete branch propagation for existing RPCs used by the UI.
CREATE OR REPLACE FUNCTION public.create_public_order_with_tracking(p_slug text,p_items jsonb,p_total_price numeric,p_table_number text,p_notes text,p_branch_slug text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE result public.orders; target_tenant_id uuid; target_branch_id uuid; tracking_token text;
BEGIN
 SELECT t.id INTO target_tenant_id FROM public.tenants t WHERE t.slug=lower(trim(p_slug)) LIMIT 1;
 target_branch_id:=public.resolve_branch_id(p_slug,p_branch_slug);
 IF target_tenant_id IS NULL OR target_branch_id IS NULL THEN RAISE EXCEPTION 'Tenant or branch not found'; END IF;
 tracking_token:=encode(extensions.gen_random_bytes(32),'hex');
 INSERT INTO public.orders(tenant_id,branch_id,items,total_price,table_number,notes,status,is_completed,completed_at,tracking_token_hash)
 VALUES(target_tenant_id,target_branch_id,CASE WHEN jsonb_typeof(coalesce(p_items,'[]'::jsonb))='array' THEN coalesce(p_items,'[]'::jsonb) ELSE '[]'::jsonb END,round(coalesce(p_total_price,0),2),coalesce(nullif(trim(p_table_number),''),'غير محدد'),nullif(trim(coalesce(p_notes,'')),''),'pending',false,null,encode(extensions.digest(tracking_token,'sha256'),'hex')) RETURNING * INTO result;
 RETURN jsonb_build_object('order_id',result.id,'tracking_token',tracking_token,'status',result.status,'created_at',result.created_at,'total_price',result.total_price,'table_number',result.table_number);
END $$;
REVOKE ALL ON FUNCTION public.create_public_order_with_tracking(text,jsonb,numeric,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_order_with_tracking(text,jsonb,numeric,text,text,text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.save_menu_item_with_ingredients(p_item jsonb,p_ingredient_ids uuid[] DEFAULT ARRAY[]::uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_tenant_id uuid:=public.current_tenant_id(); v_branch_id uuid; v_item public.menu_items%ROWTYPE; v_exists boolean; v_primary uuid;
BEGIN
 IF v_tenant_id IS NULL OR NOT public.is_current_tenant_admin() THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 v_item:=pg_catalog.jsonb_populate_record(NULL::public.menu_items,p_item); v_branch_id:=COALESCE(v_item.branch_id,(SELECT b.id FROM public.branches b WHERE b.tenant_id=v_tenant_id AND b.slug='main' LIMIT 1));
 IF v_item.id IS NULL THEN v_item.id:=pg_catalog.gen_random_uuid(); END IF;
 v_item.name:=pg_catalog.btrim(v_item.name);
 IF v_item.name IS NULL OR v_item.name='' OR v_item.price IS NULL OR v_item.price<0 THEN RAISE EXCEPTION 'Menu item name and a non-negative price are required'; END IF;
 IF v_branch_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.branches b WHERE b.id=v_branch_id AND b.tenant_id=v_tenant_id) THEN RAISE EXCEPTION 'Branch is required'; END IF;
 IF EXISTS(SELECT 1 FROM pg_catalog.unnest(COALESCE(p_ingredient_ids,ARRAY[]::uuid[])) r LEFT JOIN public.menu_ingredients i ON i.id=r AND i.tenant_id=v_tenant_id AND i.branch_id=v_branch_id WHERE r IS NOT NULL AND i.id IS NULL) THEN RAISE EXCEPTION 'Ingredient does not belong to branch'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.menu_items mi WHERE mi.id=v_item.id AND mi.tenant_id=v_tenant_id AND mi.branch_id=v_branch_id FOR UPDATE) INTO v_exists;
 IF v_exists THEN
  SELECT x.ingredient_id INTO v_primary FROM public.menu_item_ingredients x WHERE x.tenant_id=v_tenant_id AND x.branch_id=v_branch_id AND x.menu_item_id=v_item.id AND x.is_primary LIMIT 1;
  UPDATE public.menu_items SET name=v_item.name,price=v_item.price,category_id=COALESCE(v_item.category_id,'all'),description=v_item.description,image=v_item.image,allergens=v_item.allergens,tags=v_item.tags,available=COALESCE(v_item.available,true),recommendation_item_ids=COALESCE(v_item.recommendation_item_ids,ARRAY[]::uuid[]),addon_options=COALESCE(v_item.addon_options,ARRAY[]::text[]),free_addon_item_ids=COALESCE(v_item.free_addon_item_ids,ARRAY[]::uuid[]),max_addons=COALESCE(v_item.max_addons,0) WHERE id=v_item.id AND tenant_id=v_tenant_id AND branch_id=v_branch_id;
 ELSE
  INSERT INTO public.menu_items(id,name,price,category_id,description,image,allergens,tags,available,recommendation_item_ids,addon_options,free_addon_item_ids,max_addons,tenant_id,branch_id) VALUES(v_item.id,v_item.name,v_item.price,COALESCE(v_item.category_id,'all'),v_item.description,v_item.image,v_item.allergens,v_item.tags,COALESCE(v_item.available,true),COALESCE(v_item.recommendation_item_ids,ARRAY[]::uuid[]),COALESCE(v_item.addon_options,ARRAY[]::text[]),COALESCE(v_item.free_addon_item_ids,ARRAY[]::uuid[]),COALESCE(v_item.max_addons,0),v_tenant_id,v_branch_id);
 END IF;
 DELETE FROM public.menu_item_ingredients WHERE menu_item_id=v_item.id AND tenant_id=v_tenant_id AND branch_id=v_branch_id;
 INSERT INTO public.menu_item_ingredients(tenant_id,branch_id,menu_item_id,ingredient_id,is_primary) SELECT v_tenant_id,v_branch_id,v_item.id,x,false FROM pg_catalog.unnest(COALESCE(p_ingredient_ids,ARRAY[]::uuid[])) x;
END $$;
GRANT EXECUTE ON FUNCTION public.save_menu_item_with_ingredients(jsonb,uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.open_cashier_session(p_opening_cash numeric DEFAULT 0)
RETURNS public.cashier_sessions LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_cashier public.cashiers%ROWTYPE; v_session public.cashier_sessions%ROWTYPE;
BEGIN
 IF p_opening_cash IS NULL OR p_opening_cash<0 THEN RAISE EXCEPTION 'Opening cash must be non-negative'; END IF;
 SELECT c.* INTO v_cashier FROM public.cashiers c WHERE c.auth_user_id=auth.uid() AND c.is_active FOR UPDATE;
 IF v_cashier.id IS NULL THEN RAISE EXCEPTION 'Active cashier profile not found'; END IF;
 SELECT s.* INTO v_session FROM public.cashier_sessions s WHERE s.auth_user_id=auth.uid() AND s.status='open' LIMIT 1;
 IF v_session.id IS NOT NULL THEN RETURN v_session; END IF;
 INSERT INTO public.cashier_sessions(tenant_id,branch_id,cashier_id,auth_user_id,opening_cash) VALUES(v_cashier.tenant_id,v_cashier.branch_id,v_cashier.id,auth.uid(),pg_catalog.round(p_opening_cash,2)) RETURNING * INTO v_session;
 RETURN v_session;
END $$;
GRANT EXECUTE ON FUNCTION public.open_cashier_session(numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_cashier(p_full_name text,p_username text,p_pin text,p_branch_id uuid)
RETURNS TABLE(id uuid,full_name text,username text,branch_id uuid) LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_tenant_id uuid:=public.current_tenant_id(); v_branch uuid;
BEGIN
 IF v_tenant_id IS NULL OR NOT public.is_current_tenant_admin() THEN RAISE EXCEPTION 'Admin role required'; END IF;
 v_branch:=p_branch_id; IF NOT EXISTS(SELECT 1 FROM public.branches b WHERE b.id=v_branch AND b.tenant_id=v_tenant_id AND b.is_active) THEN RAISE EXCEPTION 'Branch not found'; END IF;
 IF pg_catalog.length(pg_catalog.btrim(COALESCE(p_full_name,'')))<2 OR pg_catalog.length(pg_catalog.btrim(COALESCE(p_username,'')))<3 OR pg_catalog.btrim(p_username) !~ '^[A-Za-z0-9._-]+$' OR p_pin !~ '^[0-9]{4,6}$' THEN RAISE EXCEPTION 'Cashier name, username, or PIN is invalid'; END IF;
 RETURN QUERY INSERT INTO public.cashiers(tenant_id,branch_id,full_name,username,pin_hash,is_active) VALUES(v_tenant_id,v_branch,pg_catalog.btrim(p_full_name),pg_catalog.lower(pg_catalog.btrim(p_username)),extensions.crypt(p_pin,extensions.gen_salt('bf')),true) RETURNING cashiers.id,cashiers.full_name,cashiers.username,cashiers.branch_id;
END $$;
GRANT EXECUTE ON FUNCTION public.create_cashier(text,text,text,uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.list_cashier_sessions(integer);
CREATE FUNCTION public.list_cashier_sessions(p_limit integer DEFAULT 100)
RETURNS TABLE(id uuid,tenant_id uuid,branch_id uuid,cashier_id uuid,auth_user_id uuid,opened_at timestamptz,closed_at timestamptz,status text,opening_cash numeric,closing_cash numeric,total_sales numeric,cash_sales numeric,card_sales numeric,wallet_sales numeric,transfer_sales numeric,other_sales numeric,notes text,created_at timestamptz,cashier_name text,cashier_username text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT cs.id,cs.tenant_id,cs.branch_id,cs.cashier_id,cs.auth_user_id,cs.opened_at,cs.closed_at,cs.status,cs.opening_cash,cs.closing_cash,cs.total_sales,cs.cash_sales,cs.card_sales,cs.wallet_sales,cs.transfer_sales,cs.other_sales,cs.notes,cs.created_at,c.full_name,c.username FROM public.cashier_sessions cs JOIN public.cashiers c ON c.id=cs.cashier_id AND c.tenant_id=cs.tenant_id WHERE public.tenant_match(cs.tenant_id) AND (public.is_current_tenant_admin() OR cs.auth_user_id=auth.uid()) ORDER BY cs.created_at DESC LIMIT GREATEST(1,LEAST(COALESCE(p_limit,100),500))
$$;
GRANT EXECUTE ON FUNCTION public.list_cashier_sessions(integer) TO authenticated;
