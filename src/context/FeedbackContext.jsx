// سياق React لإدارة حالة `FeedbackContext` ومشاركتها بين أجزاء التطبيق.
import { createContext, useContext, useEffect, useState, useRef } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";
import { useBranch } from "./BranchContext";
import { createRequestGuard } from "../utils/requestGuard";
const FeedbacksContext = createContext();
export function FeedbacksProvider({ children }) {
  const { slug, tenantId, isPublic } = useTenant();
  const { selectedBranchId: branchId, branchSlug } = useBranch(); const [feedbacks, setFeedbacks] = useState([]); const guard = useRef(createRequestGuard()).current;
  useEffect(() => { if (isPublic || !tenantId) return; supabase.from("feedbacks").select("*").eq("tenant_id", tenantId).eq("branch_id", branchId).order("created_at", { ascending: true }).then(({ data, error }) => { if (!error) setFeedbacks(data || []); }); }, [tenantId, branchId, isPublic, branchSlug]);
  const addFeedback = (newFeedback) => guard("feedback:add", async () => { if (isPublic) { const { data, error } = await supabase.rpc("create_public_feedback", { p_slug: slug, p_table_number: newFeedback.table_number || "1", p_rating: newFeedback.rating, p_tags: newFeedback.tags || [], p_comment: newFeedback.comment || null, p_branch_slug: branchSlug }); if (!error && data) setFeedbacks((prev) => [data, ...prev]); return { data, error }; } const { data, error } = await supabase.from("feedbacks").insert([{ ...newFeedback, tenant_id: tenantId, branch_id: branchId }]).select(); if (!error && data?.[0]) setFeedbacks((prev) => [data[0], ...prev]); return { data: data?.[0], error }; });
  return <FeedbacksContext.Provider value={{ feedbacks, addFeedback }}>{children}</FeedbacksContext.Provider>;
}
export function useFeedbacks() { const context = useContext(FeedbacksContext); if (!context) throw new Error("useFeedbacks must be used within FeedbacksProvider"); return context; }
