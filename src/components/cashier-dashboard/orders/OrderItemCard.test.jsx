import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import OrderItemCard from "./OrderItemCard";
import { useOrders } from "../../../context/OrdersContext";
import { useLanguage } from "../../../context/LanguageContext";

jest.mock("../../../context/OrdersContext", () => ({ useOrders: jest.fn() }));
jest.mock("../../../context/LanguageContext", () => ({ useLanguage: jest.fn() }));
jest.mock("../../manager-dashboard/orders/OrderPill", () => ({ __esModule: true, default: () => null }));

const updateOrderStatus = jest.fn();
const updateOrderPaymentStatus = jest.fn();
const updateOrderPaymentMethod = jest.fn();

const makeOrder = (overrides = {}) => ({
  id: "order-1",
  order_number: 17,
  table_number: "طاولة 4",
  status: "awaiting_payment",
  payment_status: "unpaid",
  payment_method: null,
  total_price: 12.5,
  items: [{ id: "item-1", name: "وجبة", quantity: 1, price: 12.5 }],
  created_at: new Date("2026-10-31T08:00:00.000Z"),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  useOrders.mockReturnValue({ updateOrderStatus, updateOrderPaymentStatus, updateOrderPaymentMethod });
  useLanguage.mockReturnValue({ language: "ar", t: (key) => key });
  updateOrderPaymentStatus.mockResolvedValue({ data: { id: "order-1", payment_status: "paid" }, error: null });
  updateOrderStatus.mockResolvedValue({ data: { id: "order-1" }, error: null });
  updateOrderPaymentMethod.mockResolvedValue({ data: { id: "order-1" }, error: null });
});

test("يسجل الدفع فور الضغط باستخدام الطريقة المحددة مسبقًا دون نافذة تأكيد", async () => {
  render(<OrderItemCard order={makeOrder({ status: "preparing", payment_method: "cash" })} />);

  fireEvent.click(screen.getByRole("button", { name: "مدفوع" }));
  await waitFor(() => expect(updateOrderPaymentStatus).toHaveBeenCalledWith("order-1", "paid", { method: "cash" }));
  expect(updateOrderStatus).not.toHaveBeenCalled();
  expect(screen.queryByText("تسجيل سداد الطلب")).toBeNull();
});

test("يعرض حقل طريقة الدفع في انتظار السداد ويسجل بها فورًا", async () => {
  render(<OrderItemCard order={makeOrder({ payment_method: "card" })} />);

  const paymentSelect = screen.getByRole("combobox", { name: "طريقة الدفع" });
  fireEvent.mouseDown(paymentSelect);
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["غير محددة", "نقد", "شبكة/بطاقة"]);
  fireEvent.click(screen.getByRole("option", { name: "شبكة/بطاقة" }));
  fireEvent.click(screen.getByRole("button", { name: "تأكيد السداد" }));
  await waitFor(() => expect(updateOrderPaymentStatus).toHaveBeenCalledWith("order-1", "paid", { method: "card" }));
  expect(updateOrderStatus).not.toHaveBeenCalled();
});

test("يسمح بتغيير الدفع إلى غير مدفوع", async () => {
  render(<OrderItemCard order={makeOrder({
    status: "preparing",
    payment_status: "paid",
    payment_method: "cash",
  })} />);

  fireEvent.click(screen.getByRole("button", { name: "غير مدفوع" }));
  await waitFor(() => expect(updateOrderPaymentStatus).toHaveBeenCalledWith("order-1", "unpaid"));
});
