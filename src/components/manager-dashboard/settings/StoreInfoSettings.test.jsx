// اختبارات حفظ حقول بيانات المتجر وإظهار نتيجة الخادم الصحيحة.
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import StoreInfoSettings from "./StoreInfoSettings";
import { useStore } from "../../../context/StoreInfoContext";
import { useLanguage } from "../../../context/LanguageContext";

jest.mock("../../../context/StoreInfoContext", () => ({ useStore: jest.fn() }));
jest.mock("../../../context/LanguageContext", () => ({ useLanguage: jest.fn() }));

const storeInfo = {
  store_name: "مقهى التجربة",
  store_slug: "sample-cafe",
  phone: "0500000000",
  email: "cafe@example.com",
  tax_number: "300000000000003",
  currency: "SAR",
  address: "الرياض",
  receipt_footer: "شكرًا لزيارتكم",
  logo_url: "",
};

beforeEach(() => {
  jest.clearAllMocks();
  useLanguage.mockReturnValue({ t: (key) => key });
});

test("يرسل جميع إعدادات المتجر إلى دالة الحفظ وينتظر استجابتها", async () => {
  const updateStoreInfo = jest.fn().mockResolvedValue({ data: storeInfo, error: null });
  useStore.mockReturnValue({ storeInfo, updateStoreInfo });
  render(<StoreInfoSettings />);

  fireEvent.change(document.querySelector('input[name="store_name"]'), { target: { value: "مقهى محدث" } });
  fireEvent.click(screen.getByRole("button", { name: "managerSave" }));

  await waitFor(() => expect(updateStoreInfo).toHaveBeenCalledWith(expect.objectContaining({
    store_name: "مقهى محدث",
    store_slug: expect.any(String),
    phone: "0500000000",
    email: "cafe@example.com",
    tax_number: "300000000000003",
    currency: "SAR",
    address: "الرياض",
    receipt_footer: "شكرًا لزيارتكم",
    logo_url: "",
  })));
  expect(await screen.findByText("managerSaved")).toBeTruthy();
});

test("يعرض خطأ الحفظ ولا يعلن نجاحًا عند رفض RPC", async () => {
  const updateStoreInfo = jest.fn().mockResolvedValue({ error: new Error("تعذر حفظ المتجر") });
  useStore.mockReturnValue({ storeInfo, updateStoreInfo });
  render(<StoreInfoSettings />);

  fireEvent.click(screen.getByRole("button", { name: "managerSave" }));
  expect(await screen.findByText("تعذر حفظ المتجر")).toBeTruthy();
  expect(screen.queryByText("managerSaved")).toBeNull();
});
