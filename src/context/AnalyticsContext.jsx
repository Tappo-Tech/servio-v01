import { createContext, useContext, useMemo, useState } from "react";
import { useHistory } from "./HistoryContext";
import { useLanguage } from "./LanguageContext";

const AnalyticsContext = createContext();

const isValidDate = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const isSameDay = (date1, date2) => (
  date1.getDate() === date2.getDate() &&
  date1.getMonth() === date2.getMonth() &&
  date1.getFullYear() === date2.getFullYear()
);

// المقارنة مع يوم بلا مبيعات تُعرض 100% فقط إذا كان اليوم فيه مبيعات فعلية.
const calculateGrowth = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

// يعتمد التقرير على الطلبات المكتملة؛ وقت الإكمال هو تاريخ احتساب البيع، مع الرجوع للإنشاء للبيانات القديمة.
const getSaleDate = (order) => order.completed_at || order.created_at;

export function AnalyticsProvider({ children }) {
  const {
    finishedOrders = [],
    ordersLoading,
    ordersLoadError,
    reloadOrders,
  } = useHistory();
  const { language } = useLanguage();
  const [viewType, setViewType] = useState("daily");

  const analyticsData = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // نرفض تواريخ البيانات غير الصالحة ونستبعد الملغي؛ cancelled لا يعد إيرادًا مكتملًا.
    const validFinishedOrders = finishedOrders.filter((order) => (
      order.status !== "cancelled" && isValidDate(getSaleDate(order))
    ));
    const todaysOrders = validFinishedOrders.filter((order) => (
      isSameDay(new Date(getSaleDate(order)), today)
    ));
    const yesterdaysOrders = validFinishedOrders.filter((order) => (
      isSameDay(new Date(getSaleDate(order)), yesterday)
    ));

    // إجمالي اليوم ومتوسط قيمة الطلب يُحسبان من total_price المحفوظ على الطلب، لا من إعادة جمع الصور/المنيو.
    const totalSalesToday = todaysOrders.reduce(
      (sum, order) => sum + Number(order.total_price || 0),
      0,
    );
    const aovToday = todaysOrders.length > 0 ? totalSalesToday / todaysOrders.length : 0;
    const totalSalesYesterday = yesterdaysOrders.reduce(
      (sum, order) => sum + Number(order.total_price || 0),
      0,
    );
    const aovYesterday = yesterdaysOrders.length > 0 ? totalSalesYesterday / yesterdaysOrders.length : 0;

    const salesGrowth = calculateGrowth(totalSalesToday, totalSalesYesterday);
    const aovGrowth = calculateGrowth(aovToday, aovYesterday);
    const ordersGrowth = calculateGrowth(todaysOrders.length, yesterdaysOrders.length);

    // المبيعات الأسبوعية تحافظ على ترتيب الأيام من الأقدم إلى الأحدث حسب لغة الواجهة.
    const last7Days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return date;
    });
    const weeklyLabels = last7Days.map((date) => date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      weekday: "long",
    }));
    const weeklySales = last7Days.map((date) => validFinishedOrders
      .filter((order) => isSameDay(new Date(getSaleDate(order)), date))
      .reduce((sum, order) => sum + Number(order.total_price || 0), 0));

    // توزيع مبيعات اليوم على فترات ساعتين، باستخدام وقت الإكمال نفسه المستخدم في إجمالي المبيعات.
    const hourlyLabels = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
    const hourlySales = [8, 10, 12, 14, 16, 18, 20, 22].map((hour) => todaysOrders
      .filter((order) => {
        const orderHour = new Date(getSaleDate(order)).getHours();
        return orderHour >= hour && orderHour < hour + 2;
      })
      .reduce((sum, order) => sum + Number(order.total_price || 0), 0));

    // بيانات الأصناف التاريخية تستخدم الاسم والكمية والسعر؛ الصور والوصف لا تدخل في التحليل.
    const itemSalesMap = {};
    validFinishedOrders.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item) => {
        const name = item.name || "غير معروف";
        const quantity = Number(item.quantity || 1);
        const price = Number(item.price || 0);
        if (!itemSalesMap[name]) itemSalesMap[name] = { quantity: 0, totalRevenue: 0 };
        itemSalesMap[name].quantity += quantity;
        itemSalesMap[name].totalRevenue += quantity * price;
      });
    });
    const topProducts = Object.entries(itemSalesMap)
      .map(([name, data]) => ({ name, quantity: data.quantity, totalRevenue: data.totalRevenue }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);

    // أحدث الطلبات تظهر بترتيب وقت الإنشاء، وهو الأنسب لقراءة سجل التشغيل.
    const recentOrders = [...todaysOrders]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3);

    return {
      todaysOrders,
      totalSalesToday,
      aovToday: aovToday.toFixed(2),
      salesGrowth,
      aovGrowth,
      ordersGrowth,
      weeklyLabels,
      weeklySales,
      hourlyLabels,
      hourlySales,
      topProducts,
      recentOrders,
    };
  }, [finishedOrders, language]);

  const isDaily = viewType === "daily";
  const currentLabels = isDaily ? analyticsData.hourlyLabels : analyticsData.weeklyLabels;
  const currentSales = isDaily ? analyticsData.hourlySales : analyticsData.weeklySales;
  // لا تعتبر الأرقام صفرًا نهائية ما دام الاستعلام الأولي جارٍ أو فشل؛ تعرض الواجهة شرطة بدل تضليل المدير.
  const analyticsReady = !ordersLoading && !ordersLoadError;

  const value = useMemo(() => ({
    viewType,
    setViewType,
    isDaily,
    currentLabels,
    currentSales,
    analyticsReady,
    ordersLoading,
    ordersLoadError,
    reloadOrders,
    ...analyticsData,
  }), [
    viewType,
    isDaily,
    currentLabels,
    currentSales,
    analyticsReady,
    ordersLoading,
    ordersLoadError,
    reloadOrders,
    analyticsData,
  ]);

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
}
