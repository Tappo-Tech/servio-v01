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
            created_at: order.created_at ? new Date(order.created_at) : new Date(),
            completed_at: order.completed_at ? new Date(order.completed_at) : null,
          }));

          setOrders(formattedOrders);
        }
      } catch (err) {
        console.error("خطأ عام في جلب البيانات:", err);
      }
    };

    fetchData();
  }, []);

  const addOrder = (newOrder) => {
    const formattedOrder = {
      ...newOrder,
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "pending",
      is_completed: false,
      created_at: new Date(),
      completed_at: null
    };

    setOrders((prevOrders) => [formattedOrder, ...prevOrders]);
    return formattedOrder;
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id !== orderId) return order;

        const isFinished = ["served", "unclaimed", "cancelled"].includes(newStatus);

        return {
          ...order,
          status: newStatus,
          is_completed: isFinished,
          completed_at: (newStatus === "ready" || isFinished) 
            ? (order.completed_at || new Date()) 
            : order.completed_at
        };
      })
    );
  };

  const finishedOrders = orders.filter((order) => order.is_completed && order.status !== "cancelled");
  const cancelledOrders = orders.filter((order) => order.status === "cancelled");

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