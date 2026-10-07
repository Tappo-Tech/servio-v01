import { createContext, useContext, useMemo, useState } from "react";
import { useHistory } from "./HistoryContext";
import { useLanguage } from "./LanguageContext";
import { useStore } from "./StoreInfoContext";
import { aggregateHourlySales, createHourlyLabels } from "../utils/analyticsUtils";
import { getWorkdayOffsetMinutes, getWorkdaySchedule, shiftBusinessDate } from "../utils/workdayUtils";

const AnalyticsContext = createContext();

const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const calculateGrowth = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const getSaleDate = (order) => order.completed_at || order.created_at;

export function AnalyticsProvider({ children }) {
  const { finishedOrders = [], ordersLoading, ordersLoadError, reloadOrders } = useHistory();
  const { language } = useLanguage();
  const { storeInfo = {} } = useStore();
  const [viewType, setViewType] = useState("daily");
  const schedule = useMemo(() => getWorkdaySchedule(storeInfo), [storeInfo]);

  const analyticsData = useMemo(() => {
    const now = new Date();
    const operationalToday = shiftBusinessDate(now, schedule.startMinutes) || now;
    const operationalTodayKey = dateKey(operationalToday);
    const previousBusinessDate = new Date(operationalToday);
    previousBusinessDate.setDate(previousBusinessDate.getDate() - 1);
    const previousBusinessKey = dateKey(previousBusinessDate);

    const validFinishedOrders = finishedOrders.filter((order) => (
      order.status !== "cancelled" && isValidDate(getSaleDate(order))
    ));
    const businessKey = (order) => {
      const saleDate = new Date(getSaleDate(order));
      return getWorkdayOffsetMinutes(saleDate, schedule.startMinutes) < schedule.durationMinutes
        ? dateKey(shiftBusinessDate(saleDate, schedule.startMinutes))
        : null;
    };
    const todaysOrders = validFinishedOrders.filter((order) => businessKey(order) === operationalTodayKey);
    const yesterdaysOrders = validFinishedOrders.filter((order) => businessKey(order) === previousBusinessKey);

    const totalSalesToday = todaysOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
    const aovToday = todaysOrders.length > 0 ? totalSalesToday / todaysOrders.length : 0;
    const totalSalesYesterday = yesterdaysOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
    const aovYesterday = yesterdaysOrders.length > 0 ? totalSalesYesterday / yesterdaysOrders.length : 0;
    const salesGrowth = calculateGrowth(totalSalesToday, totalSalesYesterday);
    const aovGrowth = calculateGrowth(aovToday, aovYesterday);
    const ordersGrowth = calculateGrowth(todaysOrders.length, yesterdaysOrders.length);

    const last7BusinessDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(operationalToday);
      date.setDate(operationalToday.getDate() - (6 - index));
      return date;
    });
    const weeklyLabels = last7BusinessDays.map((date) => date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { weekday: "long" }));
    const weeklySales = last7BusinessDays.map((date) => {
      const targetKey = dateKey(date);
      return validFinishedOrders
        .filter((order) => businessKey(order) === targetKey)
        .reduce((sum, order) => sum + Number(order.total_price || 0), 0);
    });

    const hourlyLabels = createHourlyLabels(schedule.startMinutes, schedule.durationMinutes);
    const hourlySales = aggregateHourlySales(todaysOrders, schedule);

    const itemSalesMap = {};
    todaysOrders.forEach((order) => {
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

    const recentOrders = [...todaysOrders]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3);

    return { todaysOrders, totalSalesToday, aovToday: aovToday.toFixed(2), salesGrowth, aovGrowth, ordersGrowth, weeklyLabels, weeklySales, hourlyLabels, hourlySales, topProducts, recentOrders };
  }, [finishedOrders, language, schedule]);

  const isDaily = viewType === "daily";
  const currentLabels = isDaily ? analyticsData.hourlyLabels : analyticsData.weeklyLabels;
  const currentSales = isDaily ? analyticsData.hourlySales : analyticsData.weeklySales;
  const analyticsReady = !ordersLoading && !ordersLoadError;
  const value = useMemo(() => ({
    viewType, setViewType, isDaily, currentLabels, currentSales, analyticsReady,
    ordersLoading, ordersLoadError, reloadOrders, schedule, ...analyticsData,
  }), [viewType, isDaily, currentLabels, currentSales, analyticsReady, ordersLoading, ordersLoadError, reloadOrders, schedule, analyticsData]);

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) throw new Error("useAnalytics must be used within an AnalyticsProvider");
  return context;
}
