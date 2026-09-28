import { createContext, useContext, useEffect, useMemo, useState } from "react";
import supabase from "../supabase";

const FeedbacksContext = createContext();

export function FeedbacksProvider({ children }) {
  // حالة التقيمات
  const [feedbacks, setFeedbacks] = useState([]);
  
  // جلب مصفوفة الاراء من قاعدة البيانات
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase.from("feedbacks").select();

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
}
