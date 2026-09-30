import { createContext, useContext, useEffect, useState } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";
const FeedbacksContext = createContext();
export function FeedbacksProvider({ children }) {
  const { slug, tenantId, isPublic } = useTenant();
  const [feedbacks, setFeedbacks] = useState([]);
<<<<<<< HEAD
  useEffect(() => { if (isPublic || !tenantId) return; supabase.from("feedbacks").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).then(({ data, error }) => { if (!error) setFeedbacks(data || []); }); }, [tenantId, isPublic]);
  const addFeedback = async (newFeedback) => { if (isPublic) { const { data, error } = await supabase.rpc("create_public_feedback", { p_slug: slug, p_table_number: newFeedback.table_number || "1", p_rating: newFeedback.rating, p_tags: newFeedback.tags || [], p_comment: newFeedback.comment || null }); if (error) return console.error("خطأ في إرسال التقييم:", error.message); if (data) setFeedbacks((prev) => [data, ...prev]); return; } const { data, error } = await supabase.from("feedbacks").insert([{ ...newFeedback, tenant_id: tenantId }]).select(); if (!error && data?.[0]) setFeedbacks((prev) => [data[0], ...prev]); };
  return <FeedbacksContext.Provider value={{ feedbacks, addFeedback }}>{children}</FeedbacksContext.Provider>;
=======
  
  // جلب مصفوفة الاراء من قاعدة البيانات
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase.from("feedbacks").select().order("created_at", {ascending: true});

        if (error) console.error("خطأ في جلب التقيمات:", error);

        if (data) setFeedbacks(data);
      } catch (err) {
        console.error("فشل عام في جلب البيانات", err);
      }
    };

    fetchData();
  }, []);

  // دالة إضافة تقييم جديد
  const addFeedback = async (newFeedback) => {
    try {
      const {data, error} = await supabase.from("feedbacks").insert(newFeedback).select()

      if (error) {
        console.log("خطاء في جلب التقيمات", error.message);
        return;
      }

      if (data) {
        setFeedbacks((prev) => [data,...prev]);
      }
    } catch (err) {
      console.error("خطأ عام أثناء الإرسال:", err);
    }
  };

  const value = useMemo(() => ({ feedbacks, addFeedback }), [feedbacks]);

  return (
    <FeedbacksContext.Provider value={value}>
      {children}
    </FeedbacksContext.Provider>
  );
}

export function useFeedbacks() {
  const context = useContext(FeedbacksContext);
  if (!context) {
    throw new Error("useFeedbacks must be used within a FeedbacksProvider");
  }
  return context;
>>>>>>> 01f3269 ((fix): add sorting data from supabase)
}
export function useFeedbacks() { const context = useContext(FeedbacksContext); if (!context) throw new Error("useFeedbacks must be used within FeedbacksProvider"); return context; }
