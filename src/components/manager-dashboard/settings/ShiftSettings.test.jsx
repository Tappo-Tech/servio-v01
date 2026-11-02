import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ShiftSettings from "./ShiftSettings";
import { useStore } from "../../../context/StoreInfoContext";
import { useTenant } from "../../../context/TenantContext";
import { useLanguage } from "../../../context/LanguageContext";
import supabase from "../../../supabase";

jest.mock("../../../context/StoreInfoContext", () => ({ useStore: jest.fn() }));
jest.mock("../../../context/TenantContext", () => ({ useTenant: jest.fn() }));
jest.mock("../../../context/LanguageContext", () => ({ useLanguage: jest.fn() }));
jest.mock("../../../supabase", () => ({ __esModule: true, default: { from: jest.fn() } }));

const update = jest.fn();
const eq = jest.fn();
const select = jest.fn();
const maybeSingle = jest.fn();
const refreshStoreInfo = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useStore.mockReturnValue({
    storeInfo: { workday_start: "08:00:00", workday_end: "12:00:00", workday_hours: 4, workday_shifts: [{ start: "08:00", end: "12:00" }] },
    refreshStoreInfo,
  });
  useTenant.mockReturnValue({ tenantId: "tenant-1" });
  useLanguage.mockReturnValue({ language: "ar" });
  supabase.from.mockReturnValue({ update });
  update.mockReturnValue({ eq });
  eq.mockReturnValue({ select });
  select.mockReturnValue({ maybeSingle });
  maybeSingle.mockResolvedValue({ data: { id: "store-1" }, error: null });
});

test("يسمح بإضافة شفت آخر وحفظ جميع الفترات وإجمالي الساعات", async () => {
  const { container } = render(<ShiftSettings />);

  fireEvent.click(screen.getByRole("button", { name: "إضافة شفت" }));
  const times = container.querySelectorAll('input[type="time"]');
  expect(times).toHaveLength(4);
  expect(times[2].value).toBe("12:00");
  expect(times[3].value).toBe("20:00");

  fireEvent.click(screen.getByRole("button", { name: "حفظ الدوام" }));

  await waitFor(() => expect(update).toHaveBeenCalledWith({
    workday_start: "08:00",
    workday_end: "20:00",
    workday_hours: 12,
    workday_shifts: [{ start: "08:00", end: "12:00" }, { start: "12:00", end: "20:00" }],
  }));
  expect(eq).toHaveBeenCalledWith("tenant_id", "tenant-1");
  expect(refreshStoreInfo).toHaveBeenCalled();
});

test("يمنع حفظ فترتين متداخلتين", async () => {
  useStore.mockReturnValue({
    storeInfo: { workday_shifts: [{ start: "08:00", end: "14:00" }, { start: "13:00", end: "18:00" }] },
    refreshStoreInfo,
  });
  render(<ShiftSettings />);

  expect(screen.getByRole("button", { name: "حفظ الدوام" }).disabled).toBe(true);
  expect(supabase.from).not.toHaveBeenCalled();
});

test("يحافظ على ساعات الدوام القديمة إذا غاب وقت النهاية المحفوظ", () => {
  useStore.mockReturnValue({
    storeInfo: { workday_start: "18:00:00", workday_hours: 10, workday_shifts: [] },
    refreshStoreInfo,
  });
  const { container } = render(<ShiftSettings />);

  const times = container.querySelectorAll('input[type="time"]');
  expect(times[0].value).toBe("18:00");
  expect(times[1].value).toBe("04:00");
});
