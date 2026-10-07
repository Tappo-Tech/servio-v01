const PAYMENT_STATUS_VALUES = new Set(["paid", "unpaid"]);
export const PAYMENT_METHOD_VALUES = ["cash", "card", "split", "wallet", "transfer", "other"];
const PAYMENT_METHOD_SET = new Set(PAYMENT_METHOD_VALUES);

export function normalizePaymentStatus(value) {
  return PAYMENT_STATUS_VALUES.has(value) ? value : null;
}

export function normalizePaymentMethod(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return PAYMENT_METHOD_SET.has(normalized) ? normalized : null;
}

export function createPaymentStatusUpdate(status, now = () => new Date()) {
  const normalized = normalizePaymentStatus(status);
  if (!normalized) throw new Error("حالة الدفع غير صالحة");

  return {
    payment_status: normalized,
    paid_at: normalized === "paid" ? now().toISOString() : null,
  };
}

export function createPaymentMethodUpdate(method) {
  if (method == null || method === "") return { payment_method: null };
  const normalized = normalizePaymentMethod(method);
  if (!normalized) throw new Error("طريقة الدفع غير صالحة");
  return { payment_method: normalized };
}
