// اختبارات إنشاء حساب مستقل للكاشير وعرض إجراء حذف حساب الدخول.
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CashierManagement from "./CashierManagement";
import supabase from "../../../supabase";
import { useStore } from "../../../context/StoreInfoContext";
import { useTenant } from "../../../context/TenantContext";
import { useLanguage } from "../../../context/LanguageContext";

jest.mock("../../../supabase", () => ({
  __esModule: true,
  default: { from: jest.fn(), rpc: jest.fn(), functions: { invoke: jest.fn() } },
}));
jest.mock("../../../context/StoreInfoContext", () => ({ useStore: jest.fn() }));
jest.mock("../../../context/TenantContext", () => ({ useTenant: jest.fn() }));
jest.mock("../../../context/LanguageContext", () => ({ useLanguage: jest.fn() }));

const cashier = { id: "cashier-1", full_name: "أحمد", username: "ahmad", created_at: "2026-01-01", is_active: true };

beforeEach(() => {
  jest.clearAllMocks();
  useStore.mockReturnValue({ storeInfo: { store_slug: "sample-cafe" } });
  useTenant.mockReturnValue({ tenantId: "tenant-1" });
  useLanguage.mockReturnValue({ t: (key) => key });
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn().mockResolvedValue({ data: [cashier], error: null }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  supabase.from.mockReturnValue(query);
  window.confirm = jest.fn(() => true);
});

test("يحمل حسابات الكاشير داخل نشاط واحد ويطلب تأكيدًا عند الحذف", async () => {
  supabase.functions.invoke.mockResolvedValue({ data: { success: true }, error: null });
  render(<CashierManagement />);

  expect(await screen.findByText("أحمد")).toBeTruthy();
  expect(supabase.from).toHaveBeenCalledWith("cashiers");
  expect(supabase.from.mock.results[0].value.eq).toHaveBeenCalledWith("tenant_id", "tenant-1");

  fireEvent.click(screen.getByRole("button", { name: "managerCashierDelete" }));
  await waitFor(() => expect(supabase.functions.invoke).toHaveBeenCalledWith("cashier-delete", {
    body: { cashier_id: cashier.id },
  }));
  expect(window.confirm).toHaveBeenCalled();
  expect(await screen.findByText("managerCashierDeleted")).toBeTruthy();
});

test("ينشئ اسم المستخدم ورمز PIN منفصلين لكل كاشير عبر الإجراء الآمن", async () => {
  supabase.rpc.mockResolvedValue({ error: null });
  render(<CashierManagement />);

  fireEvent.change(document.querySelector('input[value=""]'), { target: { value: "سارة" } });
  const inputs = document.querySelectorAll("input");
  fireEvent.change(inputs[1], { target: { value: "sara1" } });
  fireEvent.change(inputs[2], { target: { value: "1234" } });
  fireEvent.click(screen.getAllByRole("button", { name: "managerAddCashier" }).slice(-1)[0]);

  await waitFor(() => expect(supabase.rpc).toHaveBeenCalledWith("create_cashier", {
    p_full_name: "سارة",
    p_username: "sara1",
    p_pin: "1234",
  }));
  expect(await screen.findByText(/sara1 — PIN: 1234/)).toBeTruthy();
});
