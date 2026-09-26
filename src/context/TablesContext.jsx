import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../supabase";

const TablesContext = createContext();

export function TablesProvider({ children }) {
  // جلب ارقام الطاولات و روابطها من قاعدة البيانات
  useEffect(() => {
    const fetchData = async () => {
      try {
        const {data, error} = await supabase.from("table").select();

        if (error) console.error("خطأ في جلب مصفوفة الطاولات:", error);

        if (data) setTables(data);
      } catch (err) {
        console.error("فشل عام في جلب البيانات", err);
      }
    }

    fetchData();
  }, [])

  // حالة الطاولات
  const [tables, setTables] = useState([]);

  // توليد الطاولات بالكامل ومسح القديم
  const generateTables = (count) => {
    const parsedCount = parseInt(count, 10) || 0;
    const baseUrl = window.location.origin;

    const newTables = Array.from({ length: parsedCount }, (_, index) => ({
      id: index + 1,
      table_number: index + 1,
      qr_value: `${baseUrl}/menu/${index + 1}`,
    }));

    setTables(newTables);
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