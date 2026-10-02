import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const LanguageContext = createContext(null);
const GLOBAL_KEY = "tappo_language";
const SCOPE_KEYS = { cashier: "tappo_language_cashier", manager: "tappo_language_manager" };

const TRANSLATIONS = {
  ar: {
    liveOperations: "LIVE OPERATIONS", currentOrders: "الطلبات الحالية", cashierKitchen: "شاشة الكاشير والمطبخ", totalSales: "إجمالي المبيعات", completedOrders: "الطلبات المكتملة", orderHistory: "سجل الطلبات", orderHistoryHint: "استعرض الطلبات واطبع الفواتير", waiterCalls: "إشعارات نداء الجرسون", pendingCalls: "النداءات المعلقة", noPendingCalls: "لا توجد نداءات معلقة", fulfilled: "تمت التلبية", newOrder: "جديد", preparing: "جاري التحضير", ready: "جاهز للتسليم", logout: "تسجيل الخروج", startPreparing: "بدء التحضير", cancel: "إلغاء", printInvoice: "طباعة الفاتورة", language: "اللغة", today: "اليوم", table: "طاولة", received: "تم الاستلام", unclaimed: "لم يُستلم", managerHeader: "الإدارة", storeFallback: "المتجر", homeTag: "منيو + طلبات + تشغيل + تحليلات", homeSubtitle: "تشغيل أذكى للكافيه", homeLogin: "تسجيل الدخول", homeStart: "ابدأ الآن", homeTitleA: "الكافيه كله", homeTitleB: "في تدفق واحد.", homeDescription: "TAPPO منصة تشغيل رقمية للكافيهات والمطاعم. من رابط المنيو الخاص بكل طاولة، إلى الطلب، والكاشير، ونداءات الخدمة، وحتى مؤشرات الأداء والتقييمات — كل شيء مترابط في تجربة واحدة أبسط للفريق وأوضح للعميل.", homeCreate: "أنشئ حساب الكافيه", homeAlready: "لدي حساب بالفعل", manager: "لوحة النظرة العامة", menuControl: "التحكم في المنيو", qrCodes: "أكواد الطاولات (QR)", feedbacks: "آراء العملاء", settings: "الإعدادات",
  },
  en: {
    liveOperations: "LIVE OPERATIONS", currentOrders: "Current Orders", cashierKitchen: "Cashier & Kitchen", totalSales: "Total Sales", completedOrders: "Completed orders", orderHistory: "Order History", orderHistoryHint: "Review orders and print invoices", waiterCalls: "Waiter Calls", pendingCalls: "Pending calls", noPendingCalls: "No pending calls", fulfilled: "Fulfilled", newOrder: "New", preparing: "Preparing", ready: "Ready", logout: "Sign out", startPreparing: "Start preparing", cancel: "Cancel", printInvoice: "Print invoice", language: "Language", today: "Today", table: "Table", received: "Received", unclaimed: "Unclaimed", managerHeader: "Administration", storeFallback: "Store", homeTag: "Menu + Orders + Operations + Analytics", homeSubtitle: "Smarter cafe operations", homeLogin: "Sign in", homeStart: "Get started", homeTitleA: "Your entire cafe", homeTitleB: "in one flow.", homeDescription: "TAPPO is a digital operations platform for cafes and restaurants. From each table's menu link to orders, cashier operations, service calls, performance metrics, and feedback — everything is connected in one clearer experience.", homeCreate: "Create your cafe account", homeAlready: "I already have an account", manager: "Overview", menuControl: "Menu control", qrCodes: "Table QR codes", feedbacks: "Customer feedback", settings: "Settings",
  },
};

function getScope(pathname) {
  if (pathname.startsWith("/dashboard")) return "cashier";
  if (pathname.startsWith("/manager")) return "manager";
  if (pathname === "/" || ["/login", "/register", "/auth/callback"].includes(pathname) || pathname.startsWith("/cashier/")) return "public";
  return "menu";
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
    const nextLanguage = scope === "menu" ? "ar" : readLanguage(scopedKey || GLOBAL_KEY, readLanguage(GLOBAL_KEY));
    setLanguageState(nextLanguage);
    document.documentElement.lang = nextLanguage;
  }, [scope]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const setLanguage = useCallback((nextLanguage) => {
    const next = nextLanguage === "en" ? "en" : "ar";
    try {
      if (scope === "menu") return;
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
