import { createContext, useContext, useEffect, useRef, useState } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";
import { playRealtimeNotification } from "../utils/realtimeNotifications";
import { createRequestGuard } from "../utils/requestGuard";

const OrdersContext = createContext();

const ORDER_COLUMNS = "id,items,total_price,table_number,notes,status,is_completed,created_at,completed_at,tenant_id";

const parseOrderItems = (items) => {
  if (Array.isArray(items)) {
    return items.flatMap((item) => {
      if (item && typeof item === "object") return [item];
      if (typeof item !== "string") return [];
      try {
        const parsed = JSON.parse(item);
        return parsed && typeof parsed === "object" ? (Array.isArray(parsed) ? parsed : [parsed]) : [];
      } catch {
        return [];
      }
    });
  }

  if (typeof items === "string") {
    try {
      return parseOrderItems(JSON.parse(items));
    } catch {
      return [];
    }
  }

  return [];
};

const compactOrderItems = (items) => parseOrderItems(items)
  .map((item) => ({
    id: item.id || item.cartItemId || null,
    cartItemId: item.cartItemId || item.id || null,
    name: String(item.name || "").trim(),
    quantity: Number(item.quantity) || 1,
    price: Number(item.price) || 0,
  }))
  .filter((item) => item.name);

const formatOrder = (order = {}) => ({
  ...order,
  items: parseOrderItems(order.items),
  created_at: order.created_at ? new Date(order.created_at) : new Date(),
  completed_at: order.completed_at ? new Date(order.completed_at) : null,
});

const hasCompleteItems = (order) => (
  Array.isArray(order?.items) &&
  order.items.length > 0 &&
  order.items.every((item) => (
    item && typeof item === "object" &&
    String(item.name || "").trim() &&
    item.quantity != null &&
    item.price != null
  ))
);

const mergeOrder = (existing, incoming) => {
  const next = formatOrder(incoming);
  if (!existing) return next;

  return formatOrder({
    ...existing,
    ...incoming,
    // Realtime UPDATE payloads can omit unchanged columns. Never erase items.
    items: hasCompleteItems(next) ? next.items : existing.items,
    created_at: incoming.created_at || existing.created_at,
    status: incoming.status || existing.status,
    is_completed: typeof incoming.is_completed === "boolean" ? incoming.is_completed : existing.is_completed,
    completed_at: incoming.completed_at === undefined ? existing.completed_at : incoming.completed_at,
  });
};

export const OrdersProvider = ({ children }) => {
  const { slug, tenantId, isPublic } = useTenant();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const guard = useRef(createRequestGuard()).current;

  useEffect(() => {
    let active = true;
    setOrdersLoading(!isPublic && Boolean(tenantId));

    if (isPublic || !tenantId) {
      setOrders([]);
      return () => { active = false; };
    }

    const applyRealtimeOrder = (eventType, next, old) => {
      if (!active) return;

      if (eventType === "DELETE") {
        if (old?.id) setOrders((current) => current.filter((order) => order.id !== old.id));
        return;
      }

      if (!next?.id) return;
      const incoming = formatOrder(next);

      setOrders((current) => {
        const existing = current.find((order) => order.id === incoming.id);
        if (eventType === "INSERT") {
          if (!hasCompleteItems(incoming)) return current;
          if (existing) return current.map((order) => order.id === incoming.id ? mergeOrder(order, incoming) : order);
          playRealtimeNotification("order");
          return [incoming, ...current];
        }

        if (!existing && !hasCompleteItems(incoming)) return current;
        const merged = mergeOrder(existing, incoming);
        return existing
          ? current.map((order) => order.id === incoming.id ? merged : order)
          : [merged, ...current];
      });
    };

    // Same mechanism as waiter calls: one postgres_changes channel per tenant.
    const channel = supabase
      .channel(`tenant:${tenantId}:orders:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `tenant_id=eq.${tenantId}` },
        ({ eventType, new: next, old }) => applyRealtimeOrder(eventType, next, old),
      )
      .subscribe();

    const loadInitialOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(ORDER_COLUMNS)
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: true });

        if (!active || error) return;
        const loaded = (data || []).map(formatOrder).filter(hasCompleteItems);
        setOrders((current) => {
          const byId = new Map(current.map((order) => [order.id, order]));
          loaded.forEach((order) => byId.set(order.id, mergeOrder(byId.get(order.id), order)));
          return Array.from(byId.values()).filter(hasCompleteItems);
        });
      } finally {
        if (active) setOrdersLoading(false);
      }
    };

    // Start the query immediately after registering the channel. State merging
    // makes INSERT events safe even if they arrive during the initial query.
    loadInitialOrders();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [tenantId, isPublic]);

  const addOrder = (newOrder) => guard("orders:add", async () => {
    const items = compactOrderItems(newOrder.items);
    if (!items.length) return { error: new Error("الطلب لا يحتوي على أصناف") };

    if (isPublic) {
      const { data, error } = await supabase.rpc("create_public_order", {
        p_slug: slug,
        p_items: items,
        p_total_price: Number(newOrder.total_price) || 0,
        p_table_number: String(newOrder.table_number || "غير محدد"),
        p_notes: newOrder.notes ? String(newOrder.notes) : null,
      });
      if (!error && data) {
        const formatted = formatOrder(data);
        if (hasCompleteItems(formatted)) setOrders((current) => [formatted, ...current.filter((order) => order.id !== formatted.id)]);
      }
      return { data, error };
    }

    const { data, error } = await supabase
      .from("orders")
      .insert([{
        items,
        total_price: Number(newOrder.total_price) || 0,
        table_number: String(newOrder.table_number || "غير محدد"),
        notes: newOrder.notes ? String(newOrder.notes) : null,
        tenant_id: tenantId,
        status: "pending",
        is_completed: false,
        completed_at: null,
      }])
      .select(ORDER_COLUMNS)
      .single();

    if (!error && data) {
      const formatted = formatOrder(data);
      if (hasCompleteItems(formatted)) setOrders((current) => [formatted, ...current.filter((order) => order.id !== formatted.id)]);
    }
    return { data, error };
  });

  const updateOrderStatus = (orderId, newStatus) => guard(`orders:update:${orderId}`, async () => {
    if (isPublic) return { error: new Error("غير مصرح") };
    const target = orders.find((order) => order.id === orderId);
    if (!target) return { error: new Error("الطلب غير موجود") };

    const finished = ["served", "unclaimed", "cancelled"].includes(newStatus);
    const completedAt = finished ? target.completed_at || new Date() : null;
    const optimistic = { ...target, status: newStatus, is_completed: finished, completed_at: completedAt };

    // Move the card immediately; keep its items while Supabase confirms.
    setOrders((current) => current.map((order) => order.id === orderId ? optimistic : order));

    const { error } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        is_completed: finished,
        completed_at: completedAt?.toISOString() || null,
      })
      .eq("id", orderId)
      .eq("tenant_id", tenantId);

    if (error) setOrders((current) => current.map((order) => order.id === orderId ? target : order));
    return { error };
  });

  return (
    <OrdersContext.Provider value={{
      orders,
      ordersLoading,
      finishedOrders: orders.filter((order) => order.is_completed && order.status !== "cancelled"),
      cancelledOrders: orders.filter((order) => order.status === "cancelled"),
      addOrder,
      updateOrderStatus,
    }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) throw new Error("useOrders must be used within OrdersProvider");
  return context;
};
