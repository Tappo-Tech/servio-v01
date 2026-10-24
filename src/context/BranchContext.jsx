import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";

const BranchContext = createContext(null);
const slugify = (value) => String(value || "branch").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "branch";

export function BranchProvider({ children }) {
  const { tenantId, slug: tenantSlug, isPublic, loading: tenantLoading } = useTenant();
  const publicBranchSlug = useMemo(() => new URLSearchParams(window.location.search).get("branch") || null, []);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBranches = useCallback(async () => {
    if (tenantLoading || !tenantId) { setBranches([]); setSelectedBranchId(null); setLoading(false); return; }
    setLoading(true); setError("");
    const result = isPublic ? await supabase.rpc("get_public_branches", { p_slug: tenantSlug }) : await supabase.from("branches").select("id,tenant_id,name,slug,is_active,created_at").eq("tenant_id", tenantId).eq("is_active", true).order("created_at", { ascending: true });
    const { data, error: loadError } = result;
    if (loadError) { setError(loadError.message); setBranches([]); setSelectedBranchId(null); setLoading(false); return; }
    const next = data || [];
    setBranches(next);
    let preferred = null;
    if (isPublic && publicBranchSlug) preferred = next.find((branch) => branch.slug === publicBranchSlug)?.id;
    if (!isPublic) {
      const saved = window.localStorage.getItem(`servio.branch.${tenantId}`);
      preferred = next.find((branch) => branch.id === saved)?.id;
      if (!preferred && next.length) {
        const { data: cashierBranch } = await supabase.rpc("current_user_branch_id");
        preferred = next.find((branch) => branch.id === cashierBranch)?.id;
      }
    }
    setSelectedBranchId(preferred || next[0]?.id || null);
    setLoading(false);
  }, [tenantId, tenantLoading, isPublic, publicBranchSlug, tenantSlug]);

  useEffect(() => { void loadBranches(); }, [loadBranches]);
  const selectedBranch = useMemo(() => branches.find((branch) => branch.id === selectedBranchId) || branches[0] || null, [branches, selectedBranchId]);
  const selectBranch = useCallback((branchId) => {
    const branch = branches.find((entry) => entry.id === branchId);
    if (!branch) return;
    setSelectedBranchId(branch.id);
    if (!isPublic && tenantId) window.localStorage.setItem(`servio.branch.${tenantId}`, branch.id);
  }, [branches, isPublic, tenantId]);
  const createBranch = useCallback(async (name) => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const cleanName = String(name || "").trim();
    if (cleanName.length < 2) return { error: new Error("اسم الفرع مطلوب") };
    const baseSlug = slugify(cleanName);
    const existingSlugs = new Set(branches.map((branch) => branch.slug));
    let branchSlug = baseSlug;
    let suffix = 2;
    while (existingSlugs.has(branchSlug)) { branchSlug = `${baseSlug}-${suffix++}`; }
    const { data, error: createError } = await supabase.from("branches").insert({ tenant_id: tenantId, name: cleanName, slug: branchSlug }).select("id,tenant_id,name,slug,is_active,created_at").single();
    if (createError) { setError(createError.message); return { error: createError }; }
    setBranches((current) => [...current, data]);
    selectBranch(data.id);
    return { data, error: null };
  }, [branches, isPublic, selectBranch, tenantId]);
  const value = useMemo(() => ({ branches, selectedBranch, selectedBranchId: selectedBranch?.id || null, branchSlug: selectedBranch?.slug || null, publicBranchSlug, loading, error, selectBranch, createBranch, reloadBranches: loadBranches, tenantSlug }), [branches, selectedBranch, publicBranchSlug, loading, error, selectBranch, createBranch, loadBranches, tenantSlug]);
  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}
export const useBranch = () => useContext(BranchContext) || {
  branches: [], selectedBranch: null, selectedBranchId: null, branchSlug: null,
  publicBranchSlug: null, loading: false, error: "", selectBranch: () => {},
  createBranch: async () => ({ error: new Error("Branch provider unavailable") }), reloadBranches: async () => {}, tenantSlug: null,
};
