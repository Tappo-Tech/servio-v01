// سياق React لقراءة معلومات النشاط وحفظ إعدادات المتجر على الخادم.
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";
import { createRequestGuard } from "../utils/requestGuard";

const StoreInfoContext = createContext();

export function StoreInfoProvider({ children }) {
  const { slug, tenantId, isPublic, isTracking } = useTenant();
  const [storeInfo, setStoreInfo] = useState({});
  const guard = useRef(createRequestGuard()).current;

  const refreshStoreInfo = useCallback(async () => {
    if (isTracking || (isPublic && !slug)) return;
    const query = isPublic
      ? supabase.rpc("get_public_store", { p_slug: slug })
      : supabase.from("store").select("*").eq("tenant_id", tenantId).maybeSingle();
    const { data, error } = await query;
    if (error) return null;
    const next = isPublic ? data?.[0] || {} : data || {};
    setStoreInfo(next);
    return next;
  }, [isTracking, isPublic, slug, tenantId]);

  useEffect(() => { void refreshStoreInfo(); }, [refreshStoreInfo]);

  const updateStoreInfo = useCallback((details) => guard("store:update", async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح: لا توجد جلسة مدير مرتبطة بنشاط") };
    const { data, error } = await supabase.rpc("update_current_store_settings", { p_store: details });
    if (error) return { error };
    if (!data) return { error: new Error("لم تُرجع قاعدة البيانات بيانات المتجر المحفوظة") };
    // تُحدث قاعدة البيانات جدول المتجر والمستأجر في معاملة واحدة؛ نعرض صف الخادم المؤكد فقط.
    setStoreInfo(data);
    return { data, error: null };
  }), [guard, isPublic, tenantId]);

  return <StoreInfoContext.Provider value={{ storeInfo, updateStoreInfo, refreshStoreInfo }}>{children}</StoreInfoContext.Provider>;
}

export const useStore = () => {
  const context = useContext(StoreInfoContext);
  if (!context) throw new Error("useStore must be used within StoreInfoProvider");
  return context;
};
