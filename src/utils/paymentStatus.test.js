// اختبارات الوحدة والانحدار الخاصة بالوحدة `paymentStatus` وسلوكها المتوقع.
import {
  createPaymentMethodUpdate,
  createOrderPaymentStatusUpdate,
  createPaymentSettlementUpdate,
  createPaymentStatusUpdate,
  isValidSplitPayment,
  normalizePaymentMethod,
  normalizePaymentStatus,
} from "./paymentStatus";

describe("payment helpers", () => {
  test("preserves legacy/unknown statuses instead of assuming one", () => {
    expect(normalizePaymentStatus(null)).toBeNull();
    expect(normalizePaymentStatus(undefined)).toBeNull();
    expect(normalizePaymentStatus("refunded")).toBeNull();
  });

  test("records the timestamp when payment is marked paid", () => {
    const now = () => new Date("2026-10-06T01:00:00.000Z");
    expect(createPaymentStatusUpdate("paid", now)).toEqual({
      payment_status: "paid",
      paid_at: "2026-10-06T01:00:00.000Z",
    });
  });

  test("clears the paid timestamp when switched back to unpaid", () => {
    expect(createPaymentStatusUpdate("unpaid")).toEqual({
      payment_status: "unpaid",
      paid_at: null,
    });
  });

  test("clears method and amounts only when an existing order is switched to unpaid", () => {
    expect(createOrderPaymentStatusUpdate("unpaid", {
      payment_status: "paid", payment_method: "cash", cash_amount: 12.5, card_amount: 0,
    })).toEqual({
      payment_status: "unpaid", paid_at: null, payment_method: null, cash_amount: null, card_amount: null,
    });
  });

  test("requires a payment method when an unpaid order is switched to paid", () => {
    expect(() => createOrderPaymentStatusUpdate("paid", { payment_status: "unpaid", total_price: 12.5 }))
      .toThrow("اختر طريقة الدفع قبل تسجيل الطلب كمدفوع");
  });

  test("creates database-valid amounts for cash, card, split, and non-cash settlement", () => {
    expect(createPaymentSettlementUpdate("cash", { total: 12.5 })).toEqual({
      payment_method: "cash", cash_amount: 12.5, card_amount: 0,
    });
    expect(createPaymentSettlementUpdate("card", { total: 12.5 })).toEqual({
      payment_method: "card", cash_amount: 0, card_amount: 12.5,
    });
    expect(createPaymentSettlementUpdate("split", { total: 12.5, cashAmount: 2.5, cardAmount: 10 })).toEqual({
      payment_method: "split", cash_amount: 2.5, card_amount: 10,
    });
    expect(createPaymentSettlementUpdate("wallet", { total: 12.5 })).toEqual({
      payment_method: "wallet", cash_amount: 0, card_amount: 0,
    });
  });

  test("rejects split amounts that do not match the order total", () => {
    expect(() => createPaymentSettlementUpdate("split", { total: 12.5, cashAmount: 2, cardAmount: 10 }))
      .toThrow("مجموع مبالغ الدفع يجب أن يساوي إجمالي الطلب");
    expect(isValidSplitPayment(12.5, 2.5, 10)).toBe(true);
    expect(isValidSplitPayment(12.5, 2.5, 10.01)).toBe(false);
    expect(isValidSplitPayment(12.5, -0.01, 12.51)).toBe(false);
  });

  test("rejects unsupported payment states", () => {
    expect(() => createPaymentStatusUpdate("pending")).toThrow("حالة الدفع غير صالحة");
  });

  test("normalizes the supported payment methods and leaves legacy values unknown", () => {
    expect(normalizePaymentMethod(" CARD ")).toBe("card");
    expect(normalizePaymentMethod(null)).toBeNull();
    expect(normalizePaymentMethod("cheque")).toBeNull();
  });

  test("stores a selected method or explicitly clears it", () => {
    expect(createPaymentMethodUpdate("wallet")).toEqual({ payment_method: "wallet" });
    expect(createPaymentMethodUpdate(null)).toEqual({ payment_method: null });
    expect(() => createPaymentMethodUpdate("bitcoin")).toThrow("طريقة الدفع غير صالحة");
  });
});
