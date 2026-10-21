// اختبارات إنشاء البيع المباشر من لوحة الطلبات الواردة.
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CashierQuickOrderDialog from "./CashierQuickOrderDialog";
import { useMenu } from "../../../context/MenuContext";
import { useOrders } from "../../../context/OrdersContext";
import { useStore } from "../../../context/StoreInfoContext";
import { useTenant } from "../../../context/TenantContext";
import { useShift } from "../../../context/ShiftContext";
import { useUser } from "../../../context/UserContext";
import { useLanguage } from "../../../context/LanguageContext";

jest.mock("../../manager-dashboard/orders/OrderPill", () => ({ __esModule: true, default: () => null }));
jest.mock("../../../context/MenuContext", () => ({ useMenu: jest.fn() }));
jest.mock("../../../context/OrdersContext", () => ({ useOrders: jest.fn() }));
jest.mock("../../../context/StoreInfoContext", () => ({ useStore: jest.fn() }));
jest.mock("../../../context/TenantContext", () => ({ useTenant: jest.fn() }));
jest.mock("../../../context/ShiftContext", () => ({ useShift: jest.fn() }));
jest.mock("../../../context/UserContext", () => ({ useUser: jest.fn() }));
jest.mock("../../../context/LanguageContext", () => ({ useLanguage: jest.fn() }));

const addOrder = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.setItem("servio.cashier.autoPrintAfterSave", "false");
  useMenu.mockReturnValue({ items: [{ id: "coffee-1", name: "قهوة", price: 3.5, available: true, isAvailableForSale: true }], categoriesList: [] });
  useOrders.mockReturnValue({ addOrder });
  useStore.mockReturnValue({ storeInfo: { currency: "ر.س" } });
  useTenant.mockReturnValue({ tenantId: "tenant-1" });
  useShift.mockReturnValue({ currentShift: { id: "shift-1" } });
  useUser.mockReturnValue({ user: { role: "cashier" } });
  useLanguage.mockReturnValue({ language: "ar" });
  addOrder.mockResolvedValue({ data: { id: "order-1", items: [{ id: "coffee-1", name: "قهوة", price: 3.5, quantity: 1 }], total_price: 3.5 }, error: null });
});

test("يمنع حفظ البيع قبل اختيار طريقة الدفع ثم يحفظه بالطريقة المحددة", async () => {
  render(<CashierQuickOrderDialog open onClose={jest.fn()} />);

  fireEvent.click(await screen.findByRole("button", { name: "إضافة" }));
  const saveButton = screen.getByRole("button", { name: "حفظ البيع" });
  expect(saveButton.disabled).toBe(true);
  expect(addOrder).not.toHaveBeenCalled();

  fireEvent.mouseDown(screen.getByRole("combobox", { name: /طريقة الدفع/ }));
  fireEvent.click(await screen.findByRole("option", { name: "نقدًا" }));
  expect(saveButton.disabled).toBe(false);
  fireEvent.click(saveButton);

  await waitFor(() => expect(addOrder).toHaveBeenCalledTimes(1));
  expect(addOrder.mock.calls[0][0]).toMatchObject({
    payment_status: "paid",
    payment_method: "cash",
    cash_amount: 3.5,
    total_price: 3.5,
    completeImmediately: true,
  });
});

test("يوجه الطلب غير المدفوع إلى قائمة الطلبات الواردة لاستكمال الدفع لاحقًا", async () => {
  render(<CashierQuickOrderDialog open onClose={jest.fn()} />);

  fireEvent.click(await screen.findByRole("button", { name: "إضافة" }));
  fireEvent.click(screen.getByRole("button", { name: "غير مدفوع" }));
  const saveButton = screen.getByRole("button", { name: "حفظ البيع" });
  expect(saveButton.disabled).toBe(false);
  fireEvent.click(saveButton);

  await waitFor(() => expect(addOrder).toHaveBeenCalledTimes(1));
  expect(addOrder.mock.calls[0][0]).toMatchObject({
    payment_status: "unpaid",
    payment_method: null,
    completeImmediately: false,
  });
});
