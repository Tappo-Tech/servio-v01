import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";
import { playRealtimeNotification } from "../utils/realtimeNotifications";
const WaiterCallsContext = createContext();
export function WaiterCallsProvider({ children }) {
  const { slug, tenantId, isPublic } = useTenant(); const [calls, setCalls] = useState([]);
  useEffect(() => { let active = true; const load = async () => { if (isPublic || !tenantId) return; const { data, error } = await supabase.from("waiter_calls").select("*").eq("tenant_id", tenantId).eq("is_resolved", false).order("created_at", { ascending: true }); if (active && !error) setCalls(data || []); }; load(); if (isPublic || !tenantId) return () => { active = false; };
    const apply = (eventType, payload) => { const next = payload?.new; const old = payload?.old; if (eventType === "INSERT" && next && !next.is_resolved) { setCalls((current) => current.some((entry) => entry.id === next.id) ? current : [next, ...current]); playRealtimeNotification("waiter"); } else if (eventType === "UPDATE" && next) setCalls((current) => next.is_resolved ? current.filter((entry) => entry.id !== next.id) : current.map((entry) => entry.id === next.id ? next : entry)); else if (eventType === "DELETE" && old) setCalls((current) => current.filter((entry) => entry.id !== old.id)); };
    const channel = supabase.channel(`tenant:${tenantId}`).on("broadcast", { event: "INSERT" }, ({ payload }) => apply("INSERT", payload)).on("broadcast", { event: "UPDATE" }, ({ payload }) => apply("UPDATE", payload)).on("broadcast", { event: "DELETE" }, ({ payload }) => apply("DELETE", payload)).on("postgres_changes", { event: "*", schema: "public", table: "waiter_calls", filter: `tenant_id=eq.${tenantId}` }, ({ eventType, new: next, old }) => apply(eventType, { new: next, old })).subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [tenantId, isPublic]);
  const addCall = async (tableNumber, reason) => { if (!isPublic) return; const { data, error } = await supabase.rpc("create_public_waiter_call", { p_slug: slug, p_table_number: tableNumber || "1", p_reason: reason || "استدعاء عام" }); if (error) return console.error("خطأ في إرسال النداء:", error.message); if (data) setCalls((prev) => [data, ...prev]); };
  const resolveCall = async (id) => { if (isPublic) return; const { error } = await supabase.from("waiter_calls").update({ is_resolved: true }).eq("id", id).eq("tenant_id", tenantId); if (!error) setCalls((prev) => prev.filter((call) => call.id !== id)); };
  return <WaiterCallsContext.Provider value={{ calls, addCall, resolveCall }}>{children}</WaiterCallsContext.Provider>;
}
export const useWaiterCalls = () => { const context = useContext(WaiterCallsContext); if (!context) throw new Error("useWaiterCalls must be used within WaiterCallsProvider"); return context; };
