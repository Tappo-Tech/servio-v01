import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../supabase";

const WaiterCallsContext = createContext();

export function WaiterCallsProvider({ children }) {
  const [calls, setCalls] = useState([]);

  // 1. جلب النداءات المعلقة (غير الملباة) فقط عند تحميل التطبيق
  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const { data, error } = await supabase
          .from("waiter_calls")
          .select("*")
          .eq("is_resolved", false)
          .order("created_at", { ascending: false });

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
}

export const useWaiterCalls = () => {
  const context = useContext(WaiterCallsContext);
  if (!context) {
    throw new Error("useWaiterCalls must be used within a WaiterCallsProvider");
  }
  return context;
};
