import { createContext, useContext, useMemo, useState } from "react";
import { useHistory } from "./HistoryContext";

const AnalyticsContext = createContext();

const isValidDate = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const isSameDay = (date1, date2) => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

const calculateGrowth = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
};

export function AnalyticsProvider({ children }) {
  const { finishedOrders = [] } = useHistory();
  const [viewType, setViewType] = useState("daily");

  const analyticsData = useMemo(() => {
    const today = new Date();

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const validFinishedOrders = finishedOrders.filter((order) =>
      isValidDate(order.created_at)
    );

    const todaysOrders = validFinishedOrders.filter((order) =>
      isSameDay(new Date(order.created_at), today)
    );

    const yesterdaysOrders = validFinishedOrders.filter((order) =>
      isSameDay(new Date(order.created_at), yesterday)
    );

    const totalSalesToday = todaysOrders.reduce(
      (sum, order) => sum + Number(order.total_price || 0),
      0
    );

    const aovToday =
      todaysOrders.length > 0
        ? totalSalesToday / todaysOrders.length
        : 0;

    const totalSalesYesterday = yesterdaysOrders.reduce(
      (sum, order) => sum + Number(order.total_price || 0),
      0
    );

    const aovYesterday =
      yesterdaysOrders.length > 0
        ? totalSalesYesterday / yesterdaysOrders.length
        : 0;

    const salesGrowth = calculateGrowth(
      totalSalesToday,
      totalSalesYesterday
    );

    const aovGrowth = calculateGrowth(
      aovToday,
      aovYesterday
    );

    const ordersGrowth = calculateGrowth(
      todaysOrders.length,
      yesterdaysOrders.length
    );

    // آخر 7 أيام
    const last7Days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return date;
    });

    const weeklyLabels = last7Days.map((date) =>
      date.toLocaleDateString("ar-SA", {
        weekday: "long",
      })
    );

    const weeklySales = last7Days.map((date) => {
      return validFinishedOrders
        .filter(
          (order) =>
            isValidDate(order.created_at) &&
            isSameDay(new Date(order.created_at), date)
        )
        .reduce(
          (sum, order) =>
            sum + Number(order.total_price || 0),
          0
        );
    });

    // مبيعات اليوم حسب الساعات
    const hourlyLabels = [
      "08:00",
      "10:00",
      "12:00",
      "14:00",
      "16:00",
      "18:00",
      "20:00",
      "22:00",
    ];

    const hourlySales = [8, 10, 12, 14, 16, 18, 20, 22].map(
      (hour) => {
        return todaysOrders
          .filter((order) => {
            const orderHour = new Date(order.created_at).getHours();

            return orderHour >= hour && orderHour < hour + 2;
          })
          .reduce(
            (sum, order) =>
              sum + Number(order.total_price || 0),
            0
          );
      }
    );

    // أعلى المنتجات مبيعًا
    const itemSalesMap = {};

    validFinishedOrders.forEach((order) => {
      const items = Array.isArray(order.items)
        ? order.items
        : [];

      items.forEach((item) => {
        const name = item.name || "غير معروف";
        const quantity = Number(item.quantity || 1);
        const price = Number(item.price || 0);

        if (!itemSalesMap[name]) {
          itemSalesMap[name] = {
            quantity: 0,
            totalRevenue: 0,
          };
        }

        itemSalesMap[name].quantity += quantity;
        itemSalesMap[name].totalRevenue += quantity * price;
      });
    });

    const topProducts = Object.entries(itemSalesMap)
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        totalRevenue: data.totalRevenue,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);

    // أحدث 3 طلبات اليوم
    const recentOrders = [...todaysOrders]
      .sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      )
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
  }, [finishedOrders]);

  const isDaily = viewType === "daily";

  const currentLabels = isDaily
    ? analyticsData.hourlyLabels
    : analyticsData.weeklyLabels;

  const currentSales = isDaily
    ? analyticsData.hourlySales
    : analyticsData.weeklySales;

  const value = useMemo(
    () => ({
      viewType,
      setViewType,
      isDaily,
      currentLabels,
      currentSales,
      ...analyticsData,
    }),
    [
      viewType,
      isDaily,
      currentLabels,
      currentSales,
      analyticsData,
    ]
  );

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error(
      "useAnalytics must be used within an AnalyticsProvider"
    );
  }

  return context;
}