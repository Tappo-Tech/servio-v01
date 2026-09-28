import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../supabase";

const TablesContext = createContext();

export function TablesProvider({ children }) {
  // حالة الطاولات
  const [tables, setTables] = useState([]);

  // جلب ارقام الطاولات و روابطها من قاعدة البيانات
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase.from("table").select();

        if (error) console.error("خطأ في جلب مصفوفة الطاولات:", error);

        if (data) setTables(data);
      } catch (err) {
        console.error("فشل عام في جلب البيانات", err);
      }
    };

    fetchData();
  }, []);

  // توليد الطاولات بالكامل ومسح القديم
  const generateTables = async (count) => {
    const parsedCount = parseInt(count, 10) || 0;
    if (parsedCount <= 0) return;

    const baseUrl = window.location.origin;

    const startingNumber = tables.length > 0 
      ? Math.max(...tables.map((t) => t.table_number)) + 1 
      : 1;

    const newTables = Array.from({ length: parsedCount }, (_, index) => {
      const tableNum = startingNumber + index;
      return {
        table_number: tableNum,
        qr_value: `${baseUrl}/menu/${tableNum}`,
      };
    });

    try {
      const { data, error } = await supabase
        .from("table")
        .insert(newTables)
        .select();

      if (error) {
        console.error("خطأ في إضافة الطاولات:", error.message);
        return;
      }

      if (data) {
        setTables((prev) => [...prev, ...data]);
      }
    } catch (err) {
      console.error("خطأ عام أثناء الإرسال:", err);
    }
  };

  // مسح جميع الطاولات
  const clearTables = () => {
    setTables([]);
    localStorage.removeItem("tappo_tables");
  };

  return (
    <TablesContext.Provider value={{ tables, generateTables, clearTables }}>
      {children}
    </TablesContext.Provider>
  );
}

export const useTables = () => useContext(TablesContext);
