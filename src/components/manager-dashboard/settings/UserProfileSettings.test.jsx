// اختبارات حفظ الملف الشخصي ورسائل الخطأ والنجاح.
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import UserProfileSettings from "./UserProfileSettings";
import { useUser } from "../../../context/UserContext";
import { useLanguage } from "../../../context/LanguageContext";

jest.mock("../../../context/UserContext", () => ({ useUser: jest.fn() }));
jest.mock("../../../context/LanguageContext", () => ({ useLanguage: jest.fn() }));

const baseUser = { id: "manager-1", role: "admin", full_name: "مدير المتجر", email: "owner@example.com", phone: "0500000000" };

beforeEach(() => {
  jest.clearAllMocks();
  useLanguage.mockReturnValue({ t: (key) => key });
});

test("يحفظ الاسم والبريد والهاتف وينتظر تأكيد الدالة قبل عرض النجاح", async () => {
  const updateUser = jest.fn().mockResolvedValue({ data: { id: baseUser.id }, error: null });
  useUser.mockReturnValue({ user: baseUser, updateUser });
  render(<UserProfileSettings />);

  fireEvent.change(document.querySelector('input[name="full_name"]'), { target: { value: "مدير جديد" } });
  fireEvent.change(document.querySelector('input[name="email"]'), { target: { value: "new@example.com" } });
  fireEvent.change(document.querySelector('input[name="phone"]'), { target: { value: "0555555555" } });
  fireEvent.change(document.querySelector('input[name="current_password"]'), { target: { value: "current-secret" } });
  fireEvent.click(screen.getByRole("button", { name: "managerSave" }));

  await waitFor(() => expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({
    full_name: "مدير جديد",
    email: "new@example.com",
    phone: "0555555555",
  })));
  expect(await screen.findByText("managerSaved")).toBeTruthy();
});

test("لا يعرض نجاحًا عندما يرفض الخادم حفظ الملف الشخصي", async () => {
  const updateUser = jest.fn().mockResolvedValue({ error: new Error("تعذر تحديث الملف") });
  useUser.mockReturnValue({ user: baseUser, updateUser });
  render(<UserProfileSettings />);

  fireEvent.click(screen.getByRole("button", { name: "managerSave" }));
  expect(await screen.findByText("تعذر تحديث الملف")).toBeTruthy();
  expect(screen.queryByText("managerSaved")).toBeNull();
});

test("يتطلب كلمة المرور الحالية عند تغيير البريد", async () => {
  const updateUser = jest.fn();
  useUser.mockReturnValue({ user: baseUser, updateUser });
  render(<UserProfileSettings />);

  fireEvent.change(document.querySelector('input[name="email"]'), { target: { value: "next@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "managerSave" }));

  expect(await screen.findByText("managerCurrentPasswordRequired")).toBeTruthy();
  expect(updateUser).not.toHaveBeenCalled();
});
