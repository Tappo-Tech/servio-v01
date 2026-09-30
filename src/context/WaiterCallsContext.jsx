import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";
import { playRealtimeNotification } from "../utils/realtimeNotifications";
const WaiterCallsContext = createContext();
export function WaiterCallsProvider({ children }) {
<<<<<<< HEAD
  const { slug, tenantId, isPublic } = useTenant(); const [calls, setCalls] = useState([]);
  useEffect(() => { let active = true; const load = async () => { if (isPublic || !tenantId) return; const { data, error } = await supabase.from("waiter_calls").select("*").eq("tenant_id", tenantId).eq("is_resolved", false).order("created_at", { ascending: false }); if (active && !error) setCalls(data || []); }; load(); if (isPublic || !tenantId) return () => { active = false; };
    const apply = (eventType, payload) => { const next = payload?.new; const old = payload?.old; if (eventType === "INSERT" && next && !next.is_resolved) { setCalls((current) => current.some((entry) => entry.id === next.id) ? current : [next, ...current]); playRealtimeNotification("waiter"); } else if (eventType === "UPDATE" && next) setCalls((current) => next.is_resolved ? current.filter((entry) => entry.id !== next.id) : current.map((entry) => entry.id === next.id ? next : entry)); else if (eventType === "DELETE" && old) setCalls((current) => current.filter((entry) => entry.id !== old.id)); };
    const channel = supabase.channel(`tenant:${tenantId}`).on("broadcast", { event: "INSERT" }, ({ payload }) => apply("INSERT", payload)).on("broadcast", { event: "UPDATE" }, ({ payload }) => apply("UPDATE", payload)).on("broadcast", { event: "DELETE" }, ({ payload }) => apply("DELETE", payload)).on("postgres_changes", { event: "*", schema: "public", table: "waiter_calls", filter: `tenant_id=eq.${tenantId}` }, ({ eventType, new: next, old }) => apply(eventType, { new: next, old })).subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [tenantId, isPublic]);
  const addCall = async (tableNumber, reason) => { if (!isPublic) return; const { data, error } = await supabase.rpc("create_public_waiter_call", { p_slug: slug, p_table_number: tableNumber || "1", p_reason: reason || "استدعاء عام" }); if (error) return console.error("خطأ في إرسال النداء:", error.message); if (data) setCalls((prev) => [data, ...prev]); };
  const resolveCall = async (id) => { if (isPublic) return; const { error } = await supabase.from("waiter_calls").update({ is_resolved: true }).eq("id", id).eq("tenant_id", tenantId); if (!error) setCalls((prev) => prev.filter((call) => call.id !== id)); };
  return <WaiterCallsContext.Provider value={{ calls, addCall, resolveCall }}>{children}</WaiterCallsContext.Provider>;
=======
  const [calls, setCalls] = useState([]);

  // 1. جلب النداءات المعلقة (غير الملباة) فقط عند تحميل التطبيق
  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const { data, error } = await supabase
          .from("waiter_calls")
          .select("*")
          .eq("is_resolved", false)
          .order("name", { ascending: true });

        if (error) {
          console.error("خطأ في جلب نداءات الجرسون:", error.message);
        } else if (data) {
          setCalls(data);
        }
      } catch (err) {
        console.error("خطاء اثناء جلب البيانات", err);
      }
    };

    fetchCalls();
  }, []);

  // دالة إضافة نداء جديد من العميل
  const addCall = async (tableNumber, reason) => {
    try {
      const { data, error } = await supabase
        .from("waiter_calls")
        .insert([
          {
            table_number: tableNumber || "1",
            reason: reason || "استدعاء عام",
            is_resolved: false,
          },
        ])
        .select();

      if (error) {
        console.error("خطأ أثناء إرسال النداء:", error.message);
        return;
      }

      if (data && data.length > 0) {
        setCalls((prev) => [data[0], ...prev]);
      }
    } catch (err) {
      console.error("خطأ عام أثناء الإرسال:", err);
    }
  };

  // دالة إكمال/تلبية النداء وحذفه من القائمة
  const resolveCall = async (id) => {
    if (!id) return;

    const previousCalls = calls;

    setCalls((prev) => prev.filter((call) => call.id !== id));

    try {
      const { error } = await supabase
        .from("waiter_calls")
        .update({ is_resolved: true })
        .eq("id", id);

      if (error) {
        console.error("خطأ في إرسال تلبية الطلب:", error.message);
        setCalls(previousCalls);
      }
    } catch (err) {
      console.error("خطأ أثناء الإرسال:", err);
      setCalls(previousCalls);
    }
  };

  return (
    <WaiterCallsContext.Provider value={{ calls, addCall, resolveCall }}>
      {children}
    </WaiterCallsContext.Provider>
  );
>>>>>>> 01f3269 ((fix): add sorting data from supabase)
}
export const useWaiterCalls = () => { const context = useContext(WaiterCallsContext); if (!context) throw new Error("useWaiterCalls must be used within WaiterCallsProvider"); return context; };
