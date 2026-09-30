import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";
const TablesContext = createContext();
export function TablesProvider({ children }) {
  const { slug, tenantId, isPublic } = useTenant();
  const [tables, setTables] = useState([]); const [error, setError] = useState(""); const [loaded, setLoaded] = useState(false);
  useEffect(() => { let active = true; setLoaded(false); if (isPublic && !slug) return () => { active = false; }; const load = async () => { const result = isPublic ? await supabase.rpc("get_public_tables", { p_slug: slug }) : await supabase.from("table").select("*").eq("tenant_id", tenantId).order("table_number", { ascending: true }); if (!active) return; if (result.error) setError(result.error.message); else { setError(""); setTables(result.data || []); } setLoaded(true); }; load(); return () => { active = false; }; }, [slug, tenantId, isPublic]);
  const generateTables = async (count) => { if (isPublic || !tenantId) return { error: new Error("غير مصرح") }; const parsed = parseInt(count, 10) || 0; if (parsed <= 0) return { error: new Error("أدخل عدد طاولات صحيح") }; const baseUrl = window.location.origin; const start = tables.length ? Math.max(...tables.map((table) => Number(table.table_number) || 0)) + 1 : 1; const newTables = Array.from({ length: parsed }, (_, index) => { const tableNumber = start + index; return { tenant_id: tenantId, table_number: tableNumber, qr_value: `${baseUrl}/menu/${slug}/${tableNumber}` }; }); const { data, error: insertError } = await supabase.from("table").insert(newTables).select("*"); if (!insertError) setTables((prev) => [...prev, ...(data || [])]); else setError(insertError.message); return { data, error: insertError }; };
  const clearTables = async () => { if (isPublic || !tenantId) return { error: new Error("غير مصرح") }; const { error: deleteError } = await supabase.from("table").delete().eq("tenant_id", tenantId); if (!deleteError) setTables([]); else setError(deleteError.message); return { error: deleteError }; };
  return <TablesContext.Provider value={{ tables, error, loaded, generateTables, clearTables }}>{children}</TablesContext.Provider>;
}
export const useTables = () => useContext(TablesContext);
