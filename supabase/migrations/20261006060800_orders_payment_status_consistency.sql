-- Historical rows stay unknown only when both new fields are NULL. New paid/unpaid
-- records must keep paid_at consistent with payment_status.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_payment_timestamp_consistency_check'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_timestamp_consistency_check
      CHECK (
        COALESCE(
          (payment_status IS NULL AND paid_at IS NULL)
          OR (payment_status = 'paid' AND paid_at IS NOT NULL)
          OR (payment_status = 'unpaid' AND paid_at IS NULL),
          false
        )
      );
  END IF;
END $$;
