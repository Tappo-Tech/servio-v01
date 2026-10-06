-- Orders that predate this migration remain NULL (unknown) so existing financial
-- history is not reclassified. New orders default to unpaid until staff confirms payment.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

ALTER TABLE public.orders
  ALTER COLUMN payment_status SET DEFAULT 'unpaid';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_payment_status_check'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_status_check
      CHECK (payment_status IS NULL OR payment_status IN ('paid', 'unpaid'));
  END IF;
END $$;
