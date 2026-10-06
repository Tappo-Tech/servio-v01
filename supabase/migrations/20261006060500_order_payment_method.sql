-- طريقة التحصيل مستقلة عن حالة الدفع وتظل NULL حتى يحددها موظف الكاشير.
-- لا نملأ الطلبات القديمة بقيم مستنتجة حفاظًا على دقة التاريخ المالي.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_payment_method_check'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_method_check
      CHECK (payment_method IS NULL OR payment_method IN ('cash', 'card', 'wallet', 'transfer', 'other'));
  END IF;
END $$;

COMMENT ON COLUMN public.orders.payment_method IS
  'Optional cashier-selected method: cash, card, wallet, transfer, or other; NULL means not specified.';
