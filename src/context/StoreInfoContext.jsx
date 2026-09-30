import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";
const StoreInfoContext = createContext();
export function StoreInfoProvider({ children }) {
  const { slug, tenantId, isPublic } = useTenant();
  const [storeInfo, setStoreInfo] = useState({});
  useEffect(() => { if (isPublic && !slug) return; const query = isPublic ? supabase.rpc("get_public_store", { p_slug: slug }) : supabase.from("store").select("*").eq("tenant_id", tenantId).maybeSingle(); query.then(({ data, error }) => { if (!error) setStoreInfo(isPublic ? data?.[0] || {} : data || {}); }); }, [slug, tenantId, isPublic]);
  const updateStoreInfo = async (details) => { if (isPublic || !tenantId) return { error: new Error("غير مصرح") }; const safeSlug = String(details.store_slug || "").trim().toLowerCase(); if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(safeSlug)) return { error: new Error("الـ slug يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطة فقط") }; const { error: storeError } = await supabase.from("store").update({ store_name: details.store_name, store_slug: safeSlug, phone: details.phone, email: details.email, tax_number: details.tax_number, currency: details.currency, address: details.address, receipt_footer: details.receipt_footer, logo_url: details.logo_url }).eq("tenant_id", tenantId); if (storeError) return { error: storeError }; const { error: tenantError } = await supabase.from("tenants").update({ name: details.store_name, slug: safeSlug, logo_url: details.logo_url, theme_config: details.theme_config || {} }).eq("id", tenantId); if (!tenantError) setStoreInfo((prev) => ({ ...prev, ...details, store_slug: safeSlug })); return { error: tenantError || null };
  };
  return <StoreInfoContext.Provider value={{ storeInfo, updateStoreInfo }}>{children}</StoreInfoContext.Provider>;
}
export const useStore = () => { const context = useContext(StoreInfoContext); if (!context) throw new Error("useStore must be used within StoreInfoProvider"); return context; };
