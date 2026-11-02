// React context for current cashier shift state and shift history.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";
import { useBranch } from "./BranchContext";
import { useUser } from "./UserContext";

const ShiftContext = createContext(null);

export function ShiftProvider({ children }) {
  const { tenantId, isPublic, loading: tenantLoading } = useTenant();
  const { selectedBranchId: branchId, loading: branchLoading } = useBranch();
  const { user } = useUser();
  const [shiftSnapshot, setShiftSnapshot] = useState({ scopeKey: null, shift: null });
  const [sessions, setSessions] = useState([]);
  const [requestLoading, setRequestLoading] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  const scopeKey = `${isPublic ? "public" : "private"}:${tenantId || "no-tenant"}:${branchId || "no-branch"}:${user?.id || "no-user"}:${user?.role || "no-role"}`;
  const currentShift = shiftSnapshot.scopeKey === scopeKey ? shiftSnapshot.shift : null;
  const statusReady = shiftSnapshot.scopeKey === scopeKey;
  const loading = user?.role === "cashier" && !isPublic
    ? tenantLoading || branchLoading || requestLoading || shiftSnapshot.scopeKey !== scopeKey
    : false;

  useEffect(() => {
    setSessions([]);
  }, [tenantId, isPublic]);

  const loadCurrentShift = useCallback(async () => {
    if (isPublic || user?.role !== "cashier") return;
    if (tenantLoading || branchLoading) return;
    if (!tenantId || !branchId || !user?.id) {
      setError("تعذر تحديد النشاط أو الفرع للتحقق من الوردية.");
      return;
    }

    const requestId = ++requestIdRef.current;
    const requestScope = scopeKey;
    setRequestLoading(true);
    setError("");
    try {
      const { data, error: loadError } = await supabase
        .from("cashier_sessions")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("auth_user_id", user.id)
        .eq("branch_id", branchId)
        .eq("status", "open")
        .maybeSingle();

      if (requestId !== requestIdRef.current) return;
      if (loadError) {
        setError(loadError.message || "تعذر التحقق من حالة الوردية.");
        return;
      }
      setShiftSnapshot({ scopeKey: requestScope, shift: data || null });
      setError("");
    } catch (loadError) {
      if (requestId === requestIdRef.current) {
        setError(loadError?.message || "تعذر التحقق من حالة الوردية.");
      }
    } finally {
      if (requestId === requestIdRef.current) setRequestLoading(false);
    }
  }, [isPublic, tenantId, branchId, tenantLoading, branchLoading, user?.role, user?.id, scopeKey]);

  useEffect(() => {
    void loadCurrentShift();
  }, [loadCurrentShift]);

  // Recheck when the cashier returns from another tab or restores a minimized window.
  useEffect(() => {
    if (isPublic || user?.role !== "cashier") return undefined;
    let timer;
    const scheduleReload = () => {
      if (document.visibilityState === "hidden") return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { void loadCurrentShift(); }, 180);
    };
    window.addEventListener("focus", scheduleReload);
    document.addEventListener("visibilitychange", scheduleReload);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", scheduleReload);
      document.removeEventListener("visibilitychange", scheduleReload);
    };
  }, [isPublic, user?.role, loadCurrentShift]);

  const openShift = useCallback(async (openingCash = 0) => {
    requestIdRef.current += 1;
    setRequestLoading(false);
    const { data, error: openError } = await supabase.rpc("open_cashier_session", { p_opening_cash: Number(openingCash) || 0 });
    if (openError) { setError(openError.message); return { data: null, error: openError }; }
    requestIdRef.current += 1;
    setRequestLoading(false);
    setShiftSnapshot({ scopeKey, shift: data });
    setError("");
    return { data, error: null };
  }, [scopeKey]);

  const closeShift = useCallback(async (closingCash, notes = "") => {
    if (!currentShift?.id) return { data: null, error: new Error("لا توجد وردية مفتوحة") };
    requestIdRef.current += 1;
    setRequestLoading(false);
    const { data, error: closeError } = await supabase.rpc("close_cashier_session", {
      p_session_id: currentShift.id,
      p_closing_cash: Number(closingCash) || 0,
      p_notes: notes || null,
    });
    if (closeError) { setError(closeError.message); return { data: null, error: closeError }; }
    requestIdRef.current += 1;
    setRequestLoading(false);
    setShiftSnapshot({ scopeKey, shift: null });
    setError("");
    return { data, error: null };
  }, [currentShift?.id, scopeKey]);

  const loadSessions = useCallback(async (limit = 100) => {
    if (isPublic || !tenantId || !["admin", "cashier"].includes(user?.role)) return { data: [], error: null };
    const { data, error: loadError } = await supabase.rpc("list_cashier_sessions", { p_limit: limit, p_branch_id: branchId });
    if (!loadError) setSessions((data || []).filter((session) => !branchId || session.branch_id === branchId));
    else setError(loadError.message || "تعذر تحميل الورديات");
    return { data: data || [], error: loadError };
  }, [isPublic, tenantId, branchId, user?.role]);

  const value = useMemo(() => ({ currentShift, sessions, loading, statusReady, error, openShift, closeShift, loadCurrentShift, loadSessions }), [currentShift, sessions, loading, statusReady, error, openShift, closeShift, loadCurrentShift, loadSessions]);
  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
}

export const useShift = () => {
  const context = useContext(ShiftContext);
  if (!context) throw new Error("useShift must be used within ShiftProvider");
  return context;
};
