import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../supabase";

const OrdersContext = createContext();

export const OrdersProvider = ({ children }) => {
  // حالة الطلبات
  const [orders, setOrders] = useState([]);

  // جلب مصفوفة الطلبات من قاعدة البيانات
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase.from("orders").select("*");

        if (error) {
          console.error("خطأ في جلب الطلبات:", error.message);
          return;
        }

        if (data) {
          const formattedOrders = data.map((order) => ({
            ...order,
            created_at: order.created_at
              ? new Date(order.created_at)
              : new Date(),
            completed_at: order.completed_at
              ? new Date(order.completed_at)
              : null,
          }));

          setOrders(formattedOrders);
        }
      } catch (err) {
        console.error("خطأ عام في جلب البيانات:", err);
      }
    };

    fetchData();
  }, []);

  // اضافة الطلبات
  const addOrder = async (newOrder) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .insert([
          {
            ...newOrder,
            status: "pending",
            is_completed: false,
            completed_at: null,
          },
        ])
        .select();

      if (error) {
        console.error("خطاء في ارسال بيانات الطلب", error.message);
        return;
      }

      if (data) {
        const newOrderFormatted = {
          ...data[0],
          created_at: new Date(data[0].created_at),
          completed_at: data[0].completed_at
            ? new Date(data[0].completed_at)
            : null,
        };
        setOrders((prev) => [newOrderFormatted, ...prev]);
      }
    } catch (err) {
      console.error("خطاء عام اثناء الارسال", err);
    }
  };

  // تحديث حالة الطلبات
  const updateOrderStatus = async (orderId, newStatus) => {
    const targetOrder = orders.find((order) => order.id === orderId);
    if (!targetOrder) return;

    const isFinished = ["served", "unclaimed", "cancelled"].includes(newStatus);
    const isReadyOrFinished = newStatus === "ready" || isFinished;

    const updatedCompletedAt = isReadyOrFinished
      ? targetOrder.completed_at || new Date()
      : null;

    const previousOrders = orders;

    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id !== orderId) return order;

        return {
          ...order,
          status: newStatus,
          is_completed: isFinished,
          completed_at: updatedCompletedAt,
        };
      }),
    );

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          is_completed: isFinished,
          completed_at: updatedCompletedAt
            ? updatedCompletedAt.toISOString()
            : null,
        })
        .eq("id", orderId);

      if (error) {
        console.error("خطأ أثناء تحديث حالة الطلب:", error.message);
        setOrders(previousOrders);
      }
    } catch (err) {
      console.error("خطأ عام أثناء التعديل:", err);
      setOrders(previousOrders);
    }
  };

  const finishedOrders = orders.filter(
    (order) => order.is_completed && order.status !== "cancelled",
  );
  const cancelledOrders = orders.filter(
    (order) => order.status === "cancelled",
  );

  return (
    <OrdersContext.Provider
      value={{
        orders,
        finishedOrders,
        cancelledOrders,
        addOrder,
        updateOrderStatus,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return context;
};
