import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";
const TablesContext = createContext();
export function TablesProvider({ children }) {
  const { slug, tenantId, isPublic } = useTenant();
  const [tables, setTables] = useState([]);
  useEffect(() => { if (isPublic && !slug) return; const query = isPublic ? supabase.rpc("get_public_tables", { p_slug: slug }) : supabase.from("table").select("*").eq("tenant_id", tenantId); query.then(({ data, error }) => { if (!error) setTables(data || []); }); }, [slug, tenantId, isPublic]);
  const generateTables = async (count) => { if (isPublic || !tenantId) return; const parsed = parseInt(count, 10) || 0; if (parsed <= 0) return; const baseUrl = window.location.origin; const start = tables.length ? Math.max(...tables.map((table) => table.table_number)) + 1 : 1; const newTables = Array.from({ length: parsed }, (_, index) => { const tableNumber = start + index; return { tenant_id: tenantId, table_number: tableNumber, qr_value: `${baseUrl}/menu/${slug || "cafe"}/${tableNumber}` }; }); const { data, error } = await supabase.from("table").insert(newTables).select(); if (!error) setTables((prev) => [...prev, ...(data || [])]); };
  const clearTables = async () => { if (isPublic) return; const { error } = await supabase.from("table").delete().eq("tenant_id", tenantId); if (!error) setTables([]); };
  return <TablesContext.Provider value={{ tables, generateTables, clearTables }}>{children}</TablesContext.Provider>;
}
export const useTables = () => useContext(TablesContext);
