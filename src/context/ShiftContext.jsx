import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";
import { useUser } from "./UserContext";

const ShiftContext = createContext(null);

export function ShiftProvider({ children }) {
  const { tenantId, isPublic, loading: tenantLoading } = useTenant();
  const { user } = useUser();
  const [currentShift, setCurrentShift] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCurrentShift = useCallback(async () => {
    if (isPublic || tenantLoading || !tenantId || user?.role !== "cashier") {
      setCurrentShift(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("cashier_sessions")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("status", "open")
      .maybeSingle();
    setCurrentShift(loadError ? null : data);
    setError(loadError?.message || "");
    setLoading(false);
  }, [isPublic, tenantId, tenantLoading, user?.role]);

  useEffect(() => { void loadCurrentShift(); }, [loadCurrentShift]);

  const openShift = useCallback(async (openingCash = 0) => {
    const { data, error: openError } = await supabase.rpc("open_cashier_session", { p_opening_cash: Number(openingCash) || 0 });
    if (openError) { setError(openError.message); return { data: null, error: openError }; }
    setCurrentShift(data);
    setError("");
    return { data, error: null };
  }, []);

  const closeShift = useCallback(async (closingCash, notes = "") => {
    if (!currentShift?.id) return { data: null, error: new Error("لا توجد وردية مفتوحة") };
    const { data, error: closeError } = await supabase.rpc("close_cashier_session", {
      p_session_id: currentShift.id,
      p_closing_cash: Number(closingCash) || 0,
      p_notes: notes || null,
    });
    if (closeError) { setError(closeError.message); return { data: null, error: closeError }; }
    setCurrentShift(null);
    setError("");
    return { data, error: null };
  }, [currentShift?.id]);

  const loadSessions = useCallback(async (limit = 100) => {
    if (isPublic || !tenantId || user?.role !== "admin") return { data: [], error: null };
    const { data, error: loadError } = await supabase
      .from("cashier_sessions")
      .select("id,cashier_id,auth_user_id,opened_at,closed_at,status,opening_cash,closing_cash,total_sales,cash_sales,card_sales,wallet_sales,transfer_sales,other_sales,notes,created_at,cashiers(full_name,username)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (!loadError) setSessions(data || []);
    return { data: data || [], error: loadError };
  }, [isPublic, tenantId, user?.role]);

  const value = useMemo(() => ({ currentShift, sessions, loading, error, openShift, closeShift, loadCurrentShift, loadSessions }), [currentShift, sessions, loading, error, openShift, closeShift, loadCurrentShift, loadSessions]);
  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
}

export const useShift = () => {
  const context = useContext(ShiftContext);
  if (!context) throw new Error("useShift must be used within ShiftProvider");
  return context;
};
