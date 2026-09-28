import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../supabase";

const WaiterCallsContext = createContext();

export function WaiterCallsProvider({ children }) {
  const [calls, setCalls] = useState([]);

  // جلب النداءات المعلقة من سوبابيس عند تحميل التطبيق
  useEffect(() => {
    const fetchCalls = async () => {
      const { data, error } = await supabase
        .from("waiter_calls")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("خطأ في جلب نداءات الجرسون:", error.message);
      } else if (data) {
        const formattedCalls = data.map((call) => ({
          id: call.id,
          table_number: call.table_number || "1",
          reason: call.reason || "استدعاء عام",
          created_at: new Date(call.created_at),
        }));
        setCalls(formattedCalls);
      }
    };

    fetchCalls();
  }, []);

  // دالة إضافة نداء جديد من العميل
  const addCall = (tableNumber, reason) => {
    const newCall = {
      id: Date.now().toString(),
      tableNumber: tableNumber || "1",
      reason: reason || "استدعاء عام",
      createdAt: new Date().toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: Date.now(),
    };

    setCalls((prev) => [newCall, ...prev]);
  };

  // دالة إكمال/تلبية النداء وحذفه من قائمة الكاشير
  const resolveCall = (id) => {
    setCalls((prev) => prev.filter((call) => call.id !== id));
  };

  return (
    <WaiterCallsContext.Provider value={{ calls, addCall, resolveCall }}>
      {children}
    </WaiterCallsContext.Provider>
  );
}

// Hook للاستخدام السريع
export const useWaiterCalls = () => {
  const context = useContext(WaiterCallsContext);
  if (!context) {
    throw new Error("useWaiterCalls must be used within a WaiterCallsProvider");
  }
  return context;
};