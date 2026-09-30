import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";
import { playRealtimeNotification } from "../utils/realtimeNotifications";
const OrdersContext = createContext();
const formatOrder = (order) => ({ ...order, created_at: order.created_at ? new Date(order.created_at) : new Date(), completed_at: order.completed_at ? new Date(order.completed_at) : null });
export const OrdersProvider = ({ children }) => {
<<<<<<< HEAD
  const { slug, tenantId, isPublic } = useTenant(); const [orders, setOrders] = useState([]);
  useEffect(() => { let active = true; const load = async () => { if (isPublic || !tenantId) return; const { data, error } = await supabase.from("orders").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }); if (active && !error) setOrders((data || []).map(formatOrder)); }; load(); if (isPublic || !tenantId) return () => { active = false; };
    const apply = (eventType, payload) => { const next = payload?.new; const old = payload?.old; if (eventType === "INSERT" && next) { setOrders((current) => current.some((entry) => entry.id === next.id) ? current : [formatOrder(next), ...current]); playRealtimeNotification("order"); } else if (eventType === "UPDATE" && next) setOrders((current) => current.map((entry) => entry.id === next.id ? formatOrder(next) : entry)); else if (eventType === "DELETE" && old) setOrders((current) => current.filter((entry) => entry.id !== old.id)); };
    const channel = supabase.channel(`tenant:${tenantId}`).on("broadcast", { event: "INSERT" }, ({ payload }) => apply("INSERT", payload)).on("broadcast", { event: "UPDATE" }, ({ payload }) => apply("UPDATE", payload)).on("broadcast", { event: "DELETE" }, ({ payload }) => apply("DELETE", payload)).on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `tenant_id=eq.${tenantId}` }, ({ eventType, new: next, old }) => apply(eventType, { new: next, old })).subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [tenantId, isPublic]);
  const addOrder = async (newOrder) => { if (isPublic) { const { data, error } = await supabase.rpc("create_public_order", { p_slug: slug, p_items: newOrder.items || [], p_total_price: newOrder.total_price, p_table_number: newOrder.table_number, p_notes: newOrder.notes || null }); if (error) return console.error("خطأ في إرسال الطلب:", error.message); if (data) setOrders((prev) => [formatOrder(data), ...prev]); return; } const { data, error } = await supabase.from("orders").insert([{ ...newOrder, tenant_id: tenantId, status: "pending", is_completed: false, completed_at: null }]).select(); if (error) return console.error("خطأ في إرسال الطلب:", error.message); if (data?.[0]) setOrders((prev) => [formatOrder(data[0]), ...prev]); };
  const updateOrderStatus = async (orderId, newStatus) => { if (isPublic) return; const target = orders.find((order) => order.id === orderId); if (!target) return; const finished = ["served", "unclaimed", "cancelled"].includes(newStatus); const completedAt = newStatus === "ready" || finished ? target.completed_at || new Date() : null; const { error } = await supabase.from("orders").update({ status: newStatus, is_completed: finished, completed_at: completedAt?.toISOString() || null }).eq("id", orderId).eq("tenant_id", tenantId); if (!error) setOrders((prev) => prev.map((order) => order.id === orderId ? formatOrder({ ...order, status: newStatus, is_completed: finished, completed_at: completedAt }) : order)); };
  return <OrdersContext.Provider value={{ orders, finishedOrders: orders.filter((o) => o.is_completed && o.status !== "cancelled"), cancelledOrders: orders.filter((o) => o.status === "cancelled"), addOrder, updateOrderStatus }}>{children}</OrdersContext.Provider>;
=======
  // حالة الطلبات
  const [orders, setOrders] = useState([]);

  // جلب مصفوفة الطلبات من قاعدة البيانات
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase.from("orders").select("*").order("created_at", {ascending: true});

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
>>>>>>> 01f3269 ((fix): add sorting data from supabase)
};
export const useOrders = () => { const context = useContext(OrdersContext); if (!context) throw new Error("useOrders must be used within OrdersProvider"); return context; };
