import { createContext, useContext, useState, useEffect, useRef } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";
import { playRealtimeNotification } from "../utils/realtimeNotifications";
import { createRequestGuard } from "../utils/requestGuard";

const OrdersContext = createContext();

const parseOrderItems = (items) => {
  if (Array.isArray(items)) {
    return items.flatMap((item) => {
      if (item && typeof item === "object") return [item];
      if (typeof item !== "string") return [];
      try {
        const parsed = JSON.parse(item);
        return Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? [parsed] : [];
      } catch {
        return [];
      }
    });
  }
  if (typeof items === "string") {
    try {
      const parsed = JSON.parse(items);
      return parseOrderItems(parsed);
    } catch {
      return [];
    }
  }
  return [];
};

const compactOrderItems = (items) => parseOrderItems(items).map((item) => ({
  id: item.id || item.cartItemId || null,
  cartItemId: item.cartItemId || item.id || null,
  name: String(item.name || "").trim(),
  quantity: Number(item.quantity) || 1,
  price: Number(item.price) || 0,
})).filter((item) => item.name);

const formatOrder = (order = {}) => ({
  ...order,
  items: parseOrderItems(order.items),
  created_at: order.created_at ? new Date(order.created_at) : new Date(),
  completed_at: order.completed_at ? new Date(order.completed_at) : null,
});

const hasCompleteItems = (order) => order?.items?.length > 0 && order.items.every((item) => (
  item && typeof item === "object" && String(item.name || "").trim() && item.quantity != null && item.price != null
));

export const OrdersProvider = ({ children }) => {
  const { slug, tenantId, isPublic } = useTenant();
  const [orders, setOrders] = useState([]);
  const guard = useRef(createRequestGuard()).current;

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (isPublic || !tenantId) return;
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true });
      if (active && !error) {
        const loaded = (data || []).map(formatOrder).filter(hasCompleteItems);
        setOrders((current) => {
          const byId = new Map(current.map((order) => [order.id, order]));
          loaded.forEach((order) => byId.set(order.id, order));
          return Array.from(byId.values()).filter(hasCompleteItems);
        });
      }
    };

    if (isPublic || !tenantId) return () => { active = false; };

    const apply = (eventType, payload) => {
      const next = payload?.new;
      const old = payload?.old;
      if (eventType === "INSERT" && next) {
        const formatted = formatOrder(next);
        const addCompleteOrder = (order) => {
          if (!active || !hasCompleteItems(order)) return;
          setOrders((current) => current.some((entry) => entry.id === order.id) ? current : [order, ...current]);
          playRealtimeNotification("order");
        };
        if (hasCompleteItems(formatted)) {
          addCompleteOrder(formatted);
        } else {
          // Realtime may notify before the complete row is visible to the client.
          // Fetch it again and render nothing until all item fields are present.
          setTimeout(async () => {
            const { data } = await supabase.from("orders").select("*").eq("id", next.id).maybeSingle();
            addCompleteOrder(formatOrder(data || next));
          }, 350);
        }
      } else if (eventType === "UPDATE" && next) {
        const formatted = formatOrder(next);
        setOrders((current) => {
          const existing = current.find((entry) => entry.id === next.id);
          if (!existing) return hasCompleteItems(formatted) ? [formatted, ...current] : current;
          const merged = formatOrder({
            ...existing,
            ...next,
            items: hasCompleteItems(formatted) ? formatted.items : existing.items,
            status: next.status || existing.status,
            is_completed: typeof next.is_completed === "boolean" ? next.is_completed : existing.is_completed,
            completed_at: next.completed_at === undefined ? existing.completed_at : next.completed_at,
          });
          return current.map((entry) => entry.id === next.id ? merged : entry);
        });
      } else if (eventType === "DELETE" && old) {
        setOrders((current) => current.filter((entry) => entry.id !== old.id));
      }
    };

    const channel = supabase
      .channel(`tenant:${tenantId}:orders:${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `tenant_id=eq.${tenantId}` }, ({ eventType, new: next, old }) => apply(eventType, { new: next, old }))
      .subscribe();

    // Subscribe before the initial query so no order can be missed while loading.
    load();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [tenantId, isPublic]);

  const addOrder = (newOrder) => guard("orders:add", async () => {
    if (isPublic) {
      const { data, error } = await supabase.rpc("create_public_order", {
        p_slug: slug,
        p_items: compactOrderItems(newOrder.items),
        p_total_price: newOrder.total_price,
        p_table_number: newOrder.table_number,
        p_notes: newOrder.notes || null,
      });
      if (!error && data) {
        const formatted = formatOrder(data);
        if (hasCompleteItems(formatted)) setOrders((prev) => [formatted, ...prev]);
      }
      return { data, error };
    }

    const { data, error } = await supabase
      .from("orders")
      .insert([{ ...newOrder, items: compactOrderItems(newOrder.items), tenant_id: tenantId, status: "pending", is_completed: false, completed_at: null }])
      .select();
    if (!error && data?.[0]) {
      const formatted = formatOrder(data[0]);
      if (hasCompleteItems(formatted)) setOrders((prev) => [formatted, ...prev]);
    }
    return { data: data?.[0], error };
  });

  const updateOrderStatus = (orderId, newStatus) => guard(`orders:update:${orderId}`, async () => {
    if (isPublic) return { error: new Error("غير مصرح") };
    const target = orders.find((order) => order.id === orderId);
    if (!target) return { error: new Error("الطلب غير موجود") };
    const finished = ["served", "unclaimed", "cancelled"].includes(newStatus);
    const completedAt = finished ? target.completed_at || new Date() : null;
    const optimisticOrder = {
      ...target,
      status: newStatus,
      is_completed: finished,
      completed_at: completedAt,
    };
    setOrders((prev) => prev.map((order) => order.id === orderId ? optimisticOrder : order));
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, is_completed: finished, completed_at: completedAt?.toISOString() || null })
      .eq("id", orderId)
      .eq("tenant_id", tenantId);
    if (error) setOrders((prev) => prev.map((order) => order.id === orderId ? target : order));
    return { error };
  });

  return (
    <OrdersContext.Provider value={{ orders, finishedOrders: orders.filter((o) => o.is_completed && o.status !== "cancelled"), cancelledOrders: orders.filter((o) => o.status === "cancelled"), addOrder, updateOrderStatus }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) throw new Error("useOrders must be used within OrdersProvider");
  return context;
};
