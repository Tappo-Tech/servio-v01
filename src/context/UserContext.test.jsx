// اختبارات طبقة الحفظ الحقيقية للملف الشخصي عبر Supabase Auth.
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { UserProvider, useUser } from "./UserContext";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";

jest.mock("../supabase", () => ({
  __esModule: true,
  default: { auth: { getUser: jest.fn(), onAuthStateChange: jest.fn(), updateUser: jest.fn(), signInWithPassword: jest.fn() } },
}));
jest.mock("./TenantContext", () => ({ useTenant: jest.fn() }));

const authUser = {
  id: "manager-1",
  email: "owner@example.com",
  user_metadata: { full_name: "المدير", phone: "0500000000", role: "admin", tenant_id: "tenant-1" },
};

function UserProbe() {
  const { updateUser } = useUser();
  return <button type="button" onClick={() => updateUser({ full_name: "مدير جديد", phone: "0555555555" })}>save</button>;
}

beforeEach(() => {
  jest.clearAllMocks();
  useTenant.mockReturnValue({ profile: { id: authUser.id, tenant_id: "tenant-1", role: "admin", full_name: "المدير", phone: "0500000000" } });
  supabase.auth.getUser.mockResolvedValue({ data: { user: authUser }, error: null });
  supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
  supabase.auth.updateUser.mockResolvedValue({ data: { user: { ...authUser, user_metadata: { ...authUser.user_metadata, full_name: "مدير جديد", phone: "0555555555" } } }, error: null });
});

test("يحفظ الاسم والهاتف في بيانات Auth مع إبقاء الدور والنشاط دون تغيير", async () => {
  render(<UserProvider><UserProbe /></UserProvider>);
  fireEvent.click(screen.getByRole("button", { name: "save" }));

  await waitFor(() => expect(supabase.auth.updateUser).toHaveBeenCalledWith({
    data: {
      ...authUser.user_metadata,
      full_name: "مدير جديد",
      phone: "0555555555",
    },
  }));
});

test("يتحقق من كلمة المرور الحالية قبل إرسال تغيير البريد", async () => {
  function SensitiveProbe() {
    const { updateUser } = useUser();
    return <button type="button" onClick={() => updateUser({ full_name: "المدير", phone: "", email: "new@example.com", current_password: "wrong" })}>change email</button>;
  }
  supabase.auth.signInWithPassword.mockResolvedValue({ error: new Error("invalid credentials") });
  render(<UserProvider><SensitiveProbe /></UserProvider>);
  fireEvent.click(screen.getByRole("button", { name: "change email" }));

  await waitFor(() => expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: authUser.email, password: "wrong" }));
  expect(supabase.auth.updateUser).not.toHaveBeenCalled();
});
