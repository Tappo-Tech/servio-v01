-- Make awaiting payment a real order workflow state.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'preparing', 'ready', 'awaiting_payment', 'served', 'unclaimed', 'cancelled'));

-- Preserve the intended queue for orders that were already ready and unpaid.
UPDATE public.orders
SET status = 'awaiting_payment'
WHERE status = 'ready'
  AND COALESCE(payment_status, 'unpaid') <> 'paid'
  AND COALESCE(is_completed, false) = false;
