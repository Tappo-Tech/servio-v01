// اختبارات فرض بدء الوردية قبل إتاحة واجهة استقبال الطلبات للكاشير.
import React from "react";
import { render, screen } from "@testing-library/react";
import CashierShiftGate from "./CashierShiftGate";
import { useUser } from "../../context/UserContext";
import { useShift } from "../../context/ShiftContext";
import { useStore } from "../../context/StoreInfoContext";
import { useLanguage } from "../../context/LanguageContext";

jest.mock("../../context/UserContext", () => ({ useUser: jest.fn() }));
jest.mock("../../context/ShiftContext", () => ({ useShift: jest.fn() }));
jest.mock("../../context/StoreInfoContext", () => ({ useStore: jest.fn() }));
jest.mock("../../context/LanguageContext", () => ({ useLanguage: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  useUser.mockReturnValue({ user: { id: "cashier-auth-1", role: "cashier" } });
  useLanguage.mockReturnValue({ language: "ar" });
  useStore.mockReturnValue({ storeInfo: { currency: "ر.س" } });
  useShift.mockReturnValue({ currentShift: null, loading: false, error: "", openShift: jest.fn(), closeShift: jest.fn() });
});

test("يفرض بدء الوردية بفتح نافذة مقفلة قبل إظهار الواجهة للكاشير", async () => {
  render(<CashierShiftGate />);

  expect(await screen.findByText("بدء وردية جديدة")).toBeTruthy();
  expect(screen.getByRole("button", { name: "تأكيد وبدء الوردية" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "إلغاء" })).toBeNull();
  expect(screen.queryByRole("button", { name: "إغلاق النافذة" })).toBeNull();
});
