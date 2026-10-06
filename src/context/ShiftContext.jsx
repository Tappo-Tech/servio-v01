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

  useEffect(() => {
    setCurrentShift(null);
    setSessions([]);
  }, [tenantId, isPublic]);

  const loadCurrentShift = useCallback(async () => {
    if (isPublic || tenantLoading || !tenantId || user?.role !== "cashier") {
      setCurrentShift(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setCurrentShift(null);
    const { data, error: loadError } = await supabase
      .from("cashier_sessions")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("auth_user_id", user?.id)
      .eq("status", "open")
      .maybeSingle();
    setCurrentShift(loadError ? null : data);
    setError(loadError?.message || "");
    setLoading(false);
  }, [isPublic, tenantId, tenantLoading, user?.role, user?.id]);

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
    if (isPublic || !tenantId || !["admin", "cashier"].includes(user?.role)) return { data: [], error: null };
    const { data, error: loadError } = await supabase.rpc("list_cashier_sessions", { p_limit: limit });
    if (!loadError) setSessions(data || []);
    else setError(loadError.message || "تعذر تحميل الورديات");
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
