-- Keep ready-for-pickup orders out of the unpaid state.
-- If a payment update or another client attempts to make a ready order unpaid,
-- move it back to the explicit payment queue instead of leaving an inconsistent card.
CREATE OR REPLACE FUNCTION public.guard_ready_order_payment_state()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'ready' AND COALESCE(NEW.payment_status, 'unpaid') <> 'paid' THEN
    NEW.status := 'awaiting_payment';
    NEW.is_completed := false;
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_guard_ready_payment_state ON public.orders;
CREATE TRIGGER orders_guard_ready_payment_state
BEFORE INSERT OR UPDATE OF status, payment_status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.guard_ready_order_payment_state();
