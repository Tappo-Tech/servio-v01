// اختبارات حفظ إعدادات المتجر عبر الإجراء الذري في قاعدة البيانات.
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StoreInfoProvider, useStore } from "./StoreInfoContext";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";

jest.mock("../supabase", () => ({ __esModule: true, default: { from: jest.fn(), rpc: jest.fn() } }));
jest.mock("./TenantContext", () => ({ useTenant: jest.fn() }));

const store = { id: "store-1", tenant_id: "tenant-1", store_name: "مقهى جديد", store_slug: "new-cafe", phone: "0500000000", currency: "SAR" };
const payload = { store_name: "مقهى جديد", store_slug: "new-cafe", phone: "0500000000", currency: "SAR" };

function StoreProbe() {
  const { storeInfo, updateStoreInfo } = useStore();
  return <div><span>{storeInfo.store_name || "loading"}</span><button onClick={() => updateStoreInfo(payload)}>save</button></div>;
}

beforeEach(() => {
  jest.clearAllMocks();
  useTenant.mockReturnValue({ slug: null, tenantId: "tenant-1", isPublic: false, isTracking: false });
  const query = { select: jest.fn(), eq: jest.fn(), maybeSingle: jest.fn().mockResolvedValue({ data: store, error: null }) };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  supabase.from.mockReturnValue(query);
  supabase.rpc.mockResolvedValue({ data: store, error: null });
});

test("يحفظ بيانات المتجر من خلال RPC ذري ويحدّث الحالة بما أعاده الخادم", async () => {
  render(<StoreInfoProvider><StoreProbe /></StoreInfoProvider>);
  fireEvent.click(await screen.findByRole("button", { name: "save" }));

  await waitFor(() => expect(supabase.rpc).toHaveBeenCalledWith("update_current_store_settings", { p_store: payload }));
  expect(await screen.findByText("مقهى جديد")).toBeTruthy();
});

test("لا يستبدل بيانات المتجر عند إرجاع الخادم خطأ", async () => {
  supabase.rpc.mockResolvedValue({ data: null, error: new Error("store update rejected") });
  render(<StoreInfoProvider><StoreProbe /></StoreInfoProvider>);
  fireEvent.click(await screen.findByRole("button", { name: "save" }));

  await waitFor(() => expect(supabase.rpc).toHaveBeenCalled());
  expect(await screen.findByText("مقهى جديد")).toBeTruthy();
});
