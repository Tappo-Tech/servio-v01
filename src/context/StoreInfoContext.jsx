import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../supabase";

const StoreInfoContext = createContext();

export function StoreInfoProvider({ children }) {
  // حالة بيانات المتجر
  const [storeInfo, setStoreInfo] = useState({});

  // جلب البيانات الخاصة بالمتجر من قاعدة البيانات
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase.from("store").select();

        if (error) console.error("خطأ في جلب بيانات المتجر:", error);

        if (data) setStoreInfo(data);
      } catch (err) {
        console.error("فشل عام في جلب البيانات", err);
      }
    };

    fetchData();
  }, []);

  const updateStoreInfo = (newDetails) => {
    setStoreInfo((prev) => ({
      ...prev,
      ...newDetails,
    }));
  };

  return (
    <StoreInfoContext.Provider value={{ storeInfo, updateStoreInfo }}>
      {children}
    </StoreInfoContext.Provider>
  );
}

export const useStore = () => {
  const context = useContext(StoreInfoContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
