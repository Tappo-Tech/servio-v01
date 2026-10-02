import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const LanguageContext = createContext(null);
const GLOBAL_KEY = "tappo_language";
const SCOPE_KEYS = { cashier: "tappo_language_cashier", manager: "tappo_language_manager" };

const TRANSLATIONS = {
  ar: {
    liveOperations: "LIVE OPERATIONS", currentOrders: "الطلبات الحالية", cashierKitchen: "شاشة الكاشير والمطبخ", totalSales: "إجمالي المبيعات", completedOrders: "الطلبات المكتملة", orderHistory: "سجل الطلبات", orderHistoryHint: "استعرض الطلبات واطبع الفواتير", waiterCalls: "إشعارات نداء الجرسون", pendingCalls: "النداءات المعلقة", noPendingCalls: "لا توجد نداءات معلقة", fulfilled: "تمت التلبية", newOrder: "جديد", preparing: "جاري التحضير", ready: "جاهز للتسليم", logout: "تسجيل الخروج", startPreparing: "بدء التحضير", cancel: "إلغاء", printInvoice: "طباعة الفاتورة", language: "اللغة", today: "اليوم", table: "طاولة", received: "تم الاستلام", unclaimed: "لم يُستلم",
  },
  en: {
    liveOperations: "LIVE OPERATIONS", currentOrders: "Current Orders", cashierKitchen: "Cashier & Kitchen", totalSales: "Total Sales", completedOrders: "Completed orders", orderHistory: "Order History", orderHistoryHint: "Review orders and print invoices", waiterCalls: "Waiter Calls", pendingCalls: "Pending calls", noPendingCalls: "No pending calls", fulfilled: "Fulfilled", newOrder: "New", preparing: "Preparing", ready: "Ready", logout: "Sign out", startPreparing: "Start preparing", cancel: "Cancel", printInvoice: "Print invoice", language: "Language", today: "Today", table: "Table", received: "Received", unclaimed: "Unclaimed",
  },
};

function getScope(pathname) {
  if (pathname.startsWith("/dashboard")) return "cashier";
  if (pathname.startsWith("/manager")) return "manager";
  return "public";
}

function readLanguage(key, fallback = "ar") {
  try { return localStorage.getItem(key) === "en" ? "en" : fallback; } catch { return fallback; }
}

export function LanguageProvider({ children }) {
  const { pathname } = useLocation();
  const scope = getScope(pathname);
  const [language, setLanguageState] = useState(() => readLanguage(GLOBAL_KEY));

  // عند الانتقال بين الهوم والكاشير والمدير نحمّل إعداد النطاق المناسب.
  useEffect(() => {
    const scopedKey = SCOPE_KEYS[scope];
    setLanguageState(readLanguage(scopedKey || GLOBAL_KEY, readLanguage(GLOBAL_KEY)));
    document.documentElement.lang = readLanguage(scopedKey || GLOBAL_KEY, readLanguage(GLOBAL_KEY));
  }, [scope]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const setLanguage = useCallback((nextLanguage) => {
    const next = nextLanguage === "en" ? "en" : "ar";
    try {
      if (scope === "public") {
        localStorage.setItem(GLOBAL_KEY, next);
        // تغيير الهوم هو الإعداد العام؛ يلغي أي override سابق حتى تتبعه كل الصفحات.
        localStorage.removeItem(SCOPE_KEYS.cashier);
        localStorage.removeItem(SCOPE_KEYS.manager);
      } else {
        localStorage.setItem(SCOPE_KEYS[scope], next);
      }
    } catch {}
    setLanguageState(next);
  }, [scope]);

  const value = useMemo(() => ({
    language,
    scope,
    setLanguage,
    toggleLanguage: () => setLanguage(language === "ar" ? "en" : "ar"),
    t: (key) => TRANSLATIONS[language][key] || key,
  }), [language, scope, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
