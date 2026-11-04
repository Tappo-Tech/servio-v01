import { registrationErrorMessage, validateAdminRegistration } from "./registrationErrors";

const validForm = {
  full_name: "مها",
  email: "maha@example.com",
  password: "secret1",
  store_name: "مقهى النخيل",
  store_slug: "palm-cafe",
};

test("accepts registration values matching the backend slug convention", () => {
  expect(validateAdminRegistration(validForm)).toBeNull();
});

test.each([
  [{ ...validForm, email: "not-an-email" }, "email"],
  [{ ...validForm, password: "123" }, "password"],
  [{ ...validForm, store_name: "س" }, "storeName"],
  [{ ...validForm, store_slug: "Bad Slug" }, "slug"],
  [{ ...validForm, full_name: "  " }, "required"],
])("rejects invalid form before requesting registration", (form, expected) => {
  expect(validateAdminRegistration(form)).toBe(expected);
});

test("maps known signup and provisioning errors to clear Arabic messages", () => {
  expect(registrationErrorMessage({ message: "User already registered" }, true)).toMatch(/مسجل بالفعل/);
  expect(registrationErrorMessage({ message: "Invalid slug" }, true)).toMatch(/رابط النشاط غير صالح/);
  expect(registrationErrorMessage({ message: "Failed to fetch" }, true)).toMatch(/الإنترنت/);
  expect(registrationErrorMessage({ message: "Tenant profile is missing" }, true)).toMatch(/تعذر إكمال التسجيل/);
});
