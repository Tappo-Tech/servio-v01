import { createContext, useContext, useState, useEffect, useMemo } from "react";
import supabase from "../supabase";

const FeedbacksContext = createContext();

export function FeedbacksProvider({ children }) {
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

  // حالة التقيمات
  const [feedbacks, setFeedbacks] = useState([]);

  // دالة إضافة تقييم جديد
  const addFeedback = (newFeedback) => {
    setFeedbacks((prev) => [newFeedback, ...prev]);
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
