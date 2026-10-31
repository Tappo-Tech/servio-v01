-- Preserve the full non-negative decimal precision configured by the manager.
-- Quantity limits remain independent from price precision.
CREATE OR REPLACE FUNCTION public.validate_order_pricing_and_split()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_line jsonb;
  v_item public.menu_items%ROWTYPE;
  v_raw_id text;
  v_item_id uuid;
  v_quantity numeric;
  v_client_price numeric;
  v_expected_total numeric := 0;
  v_total numeric;
  v_payment_status text := COALESCE(NEW.payment_status, 'unpaid');
  v_method text := NEW.payment_method;
  v_cash numeric := COALESCE(NEW.cash_amount, 0);
  v_card numeric := COALESCE(NEW.card_amount, 0);
  v_validate_items boolean := TG_OP = 'INSERT' OR NEW.items IS DISTINCT FROM OLD.items OR NEW.total_price IS DISTINCT FROM OLD.total_price;
BEGIN
  IF v_validate_items AND (NEW.items IS NULL OR jsonb_typeof(NEW.items) <> 'array' OR jsonb_array_length(NEW.items) = 0) THEN
    RAISE EXCEPTION 'Order must contain menu items' USING ERRCODE = '22023';
  END IF;
  IF v_validate_items AND NEW.branch_id IS NULL THEN
    RAISE EXCEPTION 'Order branch is required' USING ERRCODE = '22023';
  END IF;

  IF v_validate_items THEN
  FOR v_line IN SELECT value FROM jsonb_array_elements(NEW.items) AS line(value)
  LOOP
    IF jsonb_typeof(v_line) <> 'object' THEN
      RAISE EXCEPTION 'Order contains an invalid menu item' USING ERRCODE = '22023';
    END IF;
    v_raw_id := COALESCE(NULLIF(v_line ->> 'id', ''), NULLIF(v_line ->> 'menu_item_id', ''));
    BEGIN
      v_item_id := v_raw_id::uuid;
    EXCEPTION WHEN invalid_text_representation OR null_value_not_allowed THEN
      RAISE EXCEPTION 'Order contains an invalid menu item' USING ERRCODE = '22023';
    END;
    IF COALESCE(v_line ->> 'quantity', '') !~ '^[0-9]+$' THEN
      RAISE EXCEPTION 'Order quantity must be a positive integer' USING ERRCODE = '22023';
    END IF;
    v_quantity := (v_line ->> 'quantity')::numeric;
    IF v_quantity < 1 OR v_quantity > 100 OR v_quantity <> trunc(v_quantity) THEN
      RAISE EXCEPTION 'Order quantity must be an integer between 1 and 100' USING ERRCODE = '22023';
    END IF;

    SELECT mi.* INTO v_item
    FROM public.menu_items mi
    WHERE mi.id = v_item_id
      AND mi.tenant_id = NEW.tenant_id
      AND mi.branch_id = NEW.branch_id
      AND mi.available IS TRUE
    LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'MENU_ITEM_NOT_IN_BRANCH_OR_UNAVAILABLE' USING ERRCODE = 'P0001';
    END IF;
    BEGIN
      v_client_price := (v_line ->> 'price')::numeric;
    EXCEPTION WHEN invalid_text_representation OR null_value_not_allowed THEN
      RAISE EXCEPTION 'Order item price is invalid' USING ERRCODE = '22023';
    END;
    IF v_client_price IS NULL OR v_client_price < 0 OR v_client_price <> v_item.price THEN
      RAISE EXCEPTION 'ORDER_ITEM_PRICE_MISMATCH' USING ERRCODE = '22023';
    END IF;
    v_expected_total := v_expected_total + (v_item.price * v_quantity);
  END LOOP;
  END IF;

  v_total := COALESCE(NEW.total_price, 0);
  IF v_validate_items AND (v_total <= 0 OR v_total <> v_expected_total) THEN
    RAISE EXCEPTION 'ORDER_TOTAL_MISMATCH' USING ERRCODE = '22023';
  END IF;
  IF v_payment_status = 'paid' THEN
    IF v_method IS NULL THEN
      RAISE EXCEPTION 'Paid orders require a payment method' USING ERRCODE = '22023';
    END IF;
    IF v_cash < 0 OR v_card < 0 THEN
      RAISE EXCEPTION 'Split payment amounts cannot be negative' USING ERRCODE = '22023';
    END IF;
    IF v_method = 'split' AND v_cash + v_card <> v_total THEN
      RAISE EXCEPTION 'Split payment must equal the order total' USING ERRCODE = '22023';
    ELSIF v_method = 'cash' AND v_cash <> v_total THEN
      RAISE EXCEPTION 'Cash payment must equal the order total' USING ERRCODE = '22023';
    ELSIF v_method = 'card' AND v_card <> v_total THEN
      RAISE EXCEPTION 'Card payment must equal the order total' USING ERRCODE = '22023';
    ELSIF v_method IN ('wallet', 'transfer', 'other') AND (v_cash <> 0 OR v_card <> 0) THEN
      RAISE EXCEPTION 'Non-cash payments cannot contain cash or card portions' USING ERRCODE = '22023';
    END IF;
  ELSIF v_payment_status = 'unpaid' AND (v_method IS NOT NULL OR v_cash <> 0 OR v_card <> 0) THEN
    RAISE EXCEPTION 'Unpaid orders cannot contain payment details' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;
