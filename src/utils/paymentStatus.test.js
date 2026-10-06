import {
  createPaymentMethodUpdate,
  createPaymentStatusUpdate,
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
