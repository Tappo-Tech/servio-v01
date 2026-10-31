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
  useOrders.mockReturnValue({ updateOrderStatus, updateOrderPaymentStatus });
  useLanguage.mockReturnValue({ language: "ar", t: (key) => key });
  updateOrderPaymentStatus.mockResolvedValue({ data: { id: "order-1", payment_status: "paid" }, error: null });
  updateOrderStatus.mockResolvedValue({ data: { id: "order-1" }, error: null });
});

test("يسجل الدفع من مرحلة الطلب الحالية دون تغيير مرحلة الطلب", async () => {
  render(<OrderItemCard order={makeOrder({ status: "preparing" })} />);

  fireEvent.click(screen.getByRole("button", { name: "مدفوع" }));
  await screen.findByText("اختر طريقة الدفع لتسجيل السداد. لن تتغير مرحلة الطلب.");
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "طريقة الدفع *" }));
  fireEvent.click(await screen.findByRole("option", { name: "نقدًا" }));
  fireEvent.click(screen.getByRole("button", { name: "تأكيد تسجيل السداد" }));

  await waitFor(() => expect(updateOrderPaymentStatus).toHaveBeenCalledWith("order-1", "paid", {
    method: "cash", cashAmount: 0, cardAmount: 0,
  }));
  expect(updateOrderStatus).not.toHaveBeenCalled();
});

test("يحافظ على التدفق السابق: طلب انتظار الدفع يسدد ثم يسلّم", async () => {
  render(<OrderItemCard order={makeOrder()} />);

  fireEvent.click(screen.getByRole("button", { name: "تأكيد السداد والتسليم" }));
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "طريقة الدفع *" }));
  fireEvent.click(await screen.findByRole("option", { name: "نقدًا" }));
  fireEvent.click(screen.getByRole("button", { name: "تأكيد السداد والتسليم" }));

  await waitFor(() => expect(updateOrderPaymentStatus).toHaveBeenCalledWith("order-1", "paid", {
    method: "cash", cashAmount: 0, cardAmount: 0,
  }));
  await waitFor(() => expect(updateOrderStatus).toHaveBeenCalledWith("order-1", "served"));
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
