// دوال مساعدة `paymentStatus` لمنطق التطبيق واختباراته.
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

export function isValidSplitPayment(total, cashAmount, cardAmount) {
  const values = [total, cashAmount, cardAmount].map(Number);
  if (values.some((value) => !Number.isFinite(value) || value < 0)) return false;
  const toCents = (value) => Math.round((value + Number.EPSILON) * 100);
  return toCents(values[1]) + toCents(values[2]) === toCents(values[0]);
}

export function createPaymentSettlementUpdate(method, { total, cashAmount, cardAmount } = {}) {
  const methodUpdate = createPaymentMethodUpdate(method);
  const normalizedTotal = Number(total);
  if (!Number.isFinite(normalizedTotal) || normalizedTotal < 0) {
    throw new Error("إجمالي الطلب غير صالح لتسجيل السداد");
  }

  const roundedTotal = Math.round((normalizedTotal + Number.EPSILON) * 100) / 100;
  if (methodUpdate.payment_method === "cash") {
    return { ...methodUpdate, cash_amount: roundedTotal, card_amount: 0 };
  }
  if (methodUpdate.payment_method === "card") {
    return { ...methodUpdate, cash_amount: 0, card_amount: roundedTotal };
  }
  if (methodUpdate.payment_method === "split") {
    const cash = Number(cashAmount);
    const card = Number(cardAmount);
    if (!Number.isFinite(cash) || !Number.isFinite(card) || cash < 0 || card < 0) {
      throw new Error("مبالغ الدفع غير صالحة");
    }
    const roundedCash = Math.round((cash + Number.EPSILON) * 100) / 100;
    const roundedCard = Math.round((card + Number.EPSILON) * 100) / 100;
    if (!isValidSplitPayment(roundedTotal, roundedCash, roundedCard)) {
      throw new Error("مجموع مبالغ الدفع يجب أن يساوي إجمالي الطلب");
    }
    return { ...methodUpdate, cash_amount: roundedCash, card_amount: roundedCard };
  }
  return { ...methodUpdate, cash_amount: 0, card_amount: 0 };
}

export function createOrderPaymentStatusUpdate(status, order, paymentDetails = null, now = () => new Date()) {
  let update = createPaymentStatusUpdate(status, now);
  if (update.payment_status === "unpaid") {
    return { ...update, payment_method: null, cash_amount: null, card_amount: null };
  }
  if (order?.payment_status !== "paid" && !paymentDetails?.method) {
    throw new Error("اختر طريقة الدفع قبل تسجيل الطلب كمدفوع");
  }
  if (paymentDetails) {
    update = {
      ...update,
      ...createPaymentSettlementUpdate(paymentDetails.method, {
        total: order?.total_price,
        cashAmount: paymentDetails.cashAmount,
        cardAmount: paymentDetails.cardAmount,
      }),
    };
  }
  return update;
}
