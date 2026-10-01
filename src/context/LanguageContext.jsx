import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext(null);

const TRANSLATIONS = {
  ar: {
    liveOperations: "LIVE OPERATIONS",
    currentOrders: "الطلبات الحالية",
    cashierKitchen: "شاشة الكاشير والمطبخ",
    totalSales: "إجمالي المبيعات",
    completedOrders: "الطلبات المكتملة",
    orderHistory: "سجل الطلبات",
    orderHistoryHint: "استعرض الطلبات واطبع الفواتير",
    waiterCalls: "إشعارات نداء الجرسون",
    pendingCalls: "النداءات المعلقة",
    noPendingCalls: "لا توجد نداءات معلقة",
    fulfilled: "تمت التلبية",
    newOrder: "جديد",
    preparing: "جاري التحضير",
    ready: "جاهز للتسليم",
    logout: "تسجيل الخروج",
  },
  en: {
    liveOperations: "LIVE OPERATIONS",
    currentOrders: "Current Orders",
    cashierKitchen: "Cashier & Kitchen",
    totalSales: "Total Sales",
    completedOrders: "Completed orders",
    orderHistory: "Order History",
    orderHistoryHint: "Review orders and print invoices",
    waiterCalls: "Waiter Calls",
    pendingCalls: "Pending calls",
    noPendingCalls: "No pending calls",
    fulfilled: "Fulfilled",
    newOrder: "New",
    preparing: "Preparing",
    ready: "Ready",
    logout: "Sign out",
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem("tappo_language") === "en" ? "en" : "ar";
    } catch {
      return "ar";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("tappo_language", language);
    } catch {}
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage((prev) => (prev === "ar" ? "en" : "ar")),
      t: (key) => TRANSLATIONS[language][key] || key,
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
