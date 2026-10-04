import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";
import { playRealtimeNotification } from "../utils/realtimeNotifications";
import { createRequestGuard } from "../utils/requestGuard";

const OrdersContext = createContext();

// نطلب الأعمدة التي تحتاجها البطاقات والفواتير والتحليلات فقط، بدل جلب كل أعمدة الجدول.
const ORDER_COLUMNS = "id,items,total_price,table_number,notes,status,is_completed,created_at,completed_at,tenant_id";
const UPDATE_COLUMNS = "id,status,is_completed,completed_at";
const RETRY_DELAYS_MS = [250, 650];
const FINISHED_STATUSES = new Set(["served", "unclaimed", "cancelled"]);

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

// المهلة و5xx وأخطاء الاتصال مؤقتة غالبًا، بينما أخطاء التحقق والصلاحيات لا يفيد معها التكرار.
const isTransientError = (error) => {
  const status = Number(error?.status);
  const code = String(error?.code || "");
  const message = String(error?.message || "");
  return status >= 500 || ["57014", "53300", "57P01", "08000", "08001", "08003", "08006"].includes(code) || /timeout|timed out|network|fetch failed|temporar/i.test(message);
};

// يحول صيغ عناصر الطلب القديمة أو القادمة كنص JSON إلى مصفوفة متوقعة في الواجهة.
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

// صور المنيو والوصف لا تُستخدم في بطاقة الطلب أو الفاتورة؛ نحفظ أقل بيانات لازمة للطلب.
const compactOrderItems = (items) => parseOrderItems(items)
  .map((item) => ({
    id: item.id || item.cartItemId || null,
    cartItemId: item.cartItemId || item.id || null,
    name: String(item.name || "").trim(),
    quantity: Number(item.quantity) || 1,
    price: Number(item.price) || 0,
  }))
  .filter((item) => item.name);

// توحيد التواريخ والعناصر القادمة من REST أو Realtime قبل إدخالها في حالة React.
const formatOrder = (order = {}) => ({
  ...order,
  items: parseOrderItems(order.items),
  created_at: order.created_at ? new Date(order.created_at) : null,
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

// بعض أحداث Realtime لا تحمل إلا الحقول المتغيرة؛ ندمجها كي لا تمحو أصناف الطلب أو تاريخه.
const mergeOrder = (existing, incoming = {}) => {
  const next = formatOrder(incoming);
  if (!existing) return next;

  return formatOrder({
    ...existing,
    ...incoming,
    items: hasCompleteItems(next) ? next.items : existing.items,
    created_at: incoming.created_at ? next.created_at : existing.created_at,
    status: incoming.status || existing.status,
    is_completed: typeof incoming.is_completed === "boolean" ? incoming.is_completed : existing.is_completed,
    completed_at: Object.prototype.hasOwnProperty.call(incoming, "completed_at") ? next.completed_at : existing.completed_at,
  });
};

const getRealtimeOrder = (eventType, payload) => {
  if (eventType === "DELETE") return payload?.old || payload?.old_record || null;
  return payload?.new || payload?.record || null;
};

export const OrdersProvider = ({ children }) => {
  const { slug, tenantId, isPublic, loading: tenantLoading } = useTenant();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersLoadError, setOrdersLoadError] = useState(null);
  const guard = useRef(createRequestGuard()).current;
  const reloadOrdersRef = useRef(null);
  const notifiedRealtimeOrders = useRef(new Set());

  useEffect(() => {
    let active = true;

    // لا نعرض إجماليًا صفريًا قبل انتهاء تهيئة الجلسة والمستأجر.
    if (tenantLoading) {
      setOrders([]);
      setOrdersLoading(!isPublic);
      setOrdersLoadError(null);
      return () => { active = false; };
    }

    if (isPublic || !tenantId) {
      setOrders([]);
      setOrdersLoading(false);
      setOrdersLoadError(null);
      reloadOrdersRef.current = null;
      return () => { active = false; };
    }

    // يبدأ التحميل بعد معرفة المستأجر، لا بطلب REST ينتهي بـ tenant_id=null.
    setOrders([]);
    setOrdersLoading(true);
    setOrdersLoadError(null);

    // نحتفظ بأحداث وصلت بينما لقطة REST الأولية قيد التنفيذ، حتى لا تعيد نتيجة قديمة حالة الطلب للخلف.
    const realtimeChanges = new Map();
    let snapshotPromise = null;
    let successfulSnapshot = false;
    let connectedOnce = false;
    let snapshotStartedBeforeRealtime = false;
    let refreshAfterCurrentSnapshot = false;
    let fallbackTimer = null;

    const loadInitialOrders = () => {
      if (!active) return Promise.resolve();
      if (snapshotPromise) return snapshotPromise;

      snapshotPromise = (async () => {
        if (!successfulSnapshot) setOrdersLoading(true);
        let lastError = null;

        for (let attempt = 0; attempt < RETRY_DELAYS_MS.length + 1; attempt += 1) {
          try {
            const { data, error } = await supabase
              .from("orders")
              .select(ORDER_COLUMNS)
              .eq("tenant_id", tenantId)
              .order("created_at", { ascending: true });

            if (!active) return;
            if (error) {
              lastError = error;
              if (!isTransientError(error) || attempt >= RETRY_DELAYS_MS.length) break;
              await wait(RETRY_DELAYS_MS[attempt]);
              continue;
            }

            // نبني لقطة الخادم ثم نعيد تطبيق ما ورد أثناء الاستعلام؛ هكذا لا يفوز رد أقدم على حدث أحدث.
            const mergedById = new Map((data || []).map((row) => {
              const formatted = formatOrder(row);
              return [formatted.id, formatted];
            }));
            realtimeChanges.forEach((change, orderId) => {
              if (change === null) {
                mergedById.delete(orderId);
              } else {
                mergedById.set(orderId, mergeOrder(mergedById.get(orderId), change));
              }
            });
            realtimeChanges.clear();
            setOrders(Array.from(mergedById.values()));
            successfulSnapshot = true;
            lastError = null;
            setOrdersLoadError(null);
            return;
          } catch (requestError) {
            lastError = requestError;
            if (!isTransientError(requestError) || attempt >= RETRY_DELAYS_MS.length) break;
            await wait(RETRY_DELAYS_MS[attempt]);
          }
        }

        if (active && lastError) {
          // لا نمسح الأحداث التي وصلت ولا نخفي الفشل على هيئة مبيعات صفرية.
          console.error("تعذر تحميل الطلبات من Supabase:", lastError);
          setOrdersLoadError(lastError);
        }
      })();

      return snapshotPromise.finally(() => {
        snapshotPromise = null;
        if (active) {
          setOrdersLoading(false);
          if (refreshAfterCurrentSnapshot) {
            refreshAfterCurrentSnapshot = false;
            void loadInitialOrders();
          }
        }
      });
    };

    reloadOrdersRef.current = loadInitialOrders;

    const applyRealtimeOrder = (eventType, payload) => {
      if (!active) return;
      const row = getRealtimeOrder(eventType, payload);
      if (!row?.id) return;
      if (row.tenant_id && row.tenant_id !== tenantId) return;

      if (eventType === "DELETE") {
        realtimeChanges.set(row.id, null);
        setOrders((current) => current.filter((order) => order.id !== row.id));
        return;
      }

      const incoming = formatOrder(row);
      const earlierChange = realtimeChanges.get(incoming.id);
      realtimeChanges.set(incoming.id, earlierChange ? mergeOrder(earlierChange, incoming) : incoming);
      setOrders((current) => {
        const existing = current.find((order) => order.id === incoming.id);
        const merged = mergeOrder(existing, incoming);

        if (eventType === "INSERT" && !existing && hasCompleteItems(incoming) && !notifiedRealtimeOrders.current.has(incoming.id)) {
          notifiedRealtimeOrders.current.add(incoming.id);
          playRealtimeNotification("order");
        }

        return existing
          ? current.map((order) => order.id === incoming.id ? merged : order)
          : [merged, ...current];
      });
    };

    // قناة التغيير تظل Postgres Changes لأنها تطبق RLS على المستأجر؛ أحداث broadcast العامة غير مناسبة لبيانات الطلبات.
    const channel = supabase
      .channel(`tenant:${tenantId}:orders`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `tenant_id=eq.${tenantId}` },
        ({ eventType, new: next, old }) => applyRealtimeOrder(eventType, { new: next, old }),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          if (fallbackTimer) window.clearTimeout(fallbackTimer);
          const shouldRefresh = !successfulSnapshot || connectedOnce || snapshotStartedBeforeRealtime;
          connectedOnce = true;
          snapshotStartedBeforeRealtime = false;
          if (shouldRefresh) {
            if (snapshotPromise) refreshAfterCurrentSnapshot = true;
            else void loadInitialOrders();
          }
        } else if (["CHANNEL_ERROR", "TIMED_OUT"].includes(status) && !successfulSnapshot) {
          // حتى لو تعذر الاتصال اللحظي مؤقتًا، تبقى بيانات الشاشة قابلة للتحميل مع إعادة المحاولة.
          void loadInitialOrders();
        }
      });

    // إذا تأخر رد WebSocket نبدأ REST كمسار احتياطي، ثم نزامن مرة أخرى عند نجاح الاشتراك.
    fallbackTimer = window.setTimeout(() => {
      if (!connectedOnce && !successfulSnapshot) {
        snapshotStartedBeforeRealtime = true;
        void loadInitialOrders();
      }
    }, 2000);

    return () => {
      active = false;
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      if (reloadOrdersRef.current === loadInitialOrders) reloadOrdersRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [tenantId, isPublic, tenantLoading]);

  const addOrder = (newOrder) => guard("orders:add", async () => {
    const items = compactOrderItems(newOrder.items);
    if (!items.length) return { error: new Error("الطلب لا يحتوي على أصناف") };

    // الإكمال الفوري خيار داخلي لشاشة POS فقط؛ لا نسمح بتحويل طلب ضيف الطاولة إلى بيع مكتمل.
    if (isPublic && newOrder.completeImmediately) return { error: new Error("غير مصرح") };

    // للضيف نستخدم RPC آمن بالـ slug؛ كما يفرض ترحيل قاعدة البيانات ضغط العناصر مهما كان العميل قديمًا.
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
        if (hasCompleteItems(formatted)) {
          setOrders((current) => current.some((order) => order.id === formatted.id)
            ? current.map((order) => order.id === formatted.id ? mergeOrder(order, formatted) : order)
            : [formatted, ...current]);
        }
      }
      return { data, error };
    }

    if (!tenantId) return { error: new Error("لم يكتمل تحميل النشاط بعد") };
    const completedAt = newOrder.completeImmediately ? new Date().toISOString() : null;
    const { data, error } = await supabase
      .from("orders")
      .insert([{
        items,
        total_price: Number(newOrder.total_price) || 0,
        table_number: String(newOrder.table_number || "غير محدد"),
        notes: newOrder.notes ? String(newOrder.notes) : null,
        tenant_id: tenantId,
        status: completedAt ? "served" : "pending",
        is_completed: Boolean(completedAt),
        completed_at: completedAt,
      }])
      .select(ORDER_COLUMNS)
      .single();

    if (!error && data) {
      const formatted = formatOrder(data);
      setOrders((current) => current.some((order) => order.id === formatted.id)
        ? current.map((order) => order.id === formatted.id ? mergeOrder(order, formatted) : order)
        : [formatted, ...current]);
    }
    return { data, error };
  });

  const updateOrderStatus = (orderId, newStatus) => guard(`orders:update:${orderId}`, async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const target = orders.find((order) => order.id === orderId);
    if (!target) return { error: new Error("الطلب غير موجود") };

    const finished = FINISHED_STATUSES.has(newStatus);
    const completedAt = finished ? target.completed_at || new Date() : null;
    const optimistic = { ...target, status: newStatus, is_completed: finished, completed_at: completedAt };

    // ننقل البطاقة فورًا لتظل حركة الكاشير سلسة، ثم نؤكد العملية من قاعدة البيانات.
    setOrders((current) => current.map((order) => order.id === orderId ? optimistic : order));

    let result = { data: null, error: null };
    for (let attempt = 0; attempt < RETRY_DELAYS_MS.length + 1; attempt += 1) {
      try {
        result = await supabase
          .from("orders")
          .update({
            status: newStatus,
            is_completed: finished,
            completed_at: completedAt?.toISOString() || null,
          })
          .eq("id", orderId)
          .eq("tenant_id", tenantId)
          .select(UPDATE_COLUMNS)
          .maybeSingle();
      } catch (networkError) {
        result = { data: null, error: networkError };
      }

      if (!result.error || !isTransientError(result.error) || attempt >= RETRY_DELAYS_MS.length) break;
      await wait(RETRY_DELAYS_MS[attempt]);
    }

    const finalError = result.error || (!result.data ? new Error("لم يتم تحديث الطلب؛ تحقق من صلاحيات النشاط وحالة الاتصال") : null);
    if (finalError) {
      // لا نتراجع فوق حدث Realtime أحدث وصل من جهاز آخر بعد بدء هذا الطلب.
      setOrders((current) => current.map((order) => {
        if (order.id !== orderId || order !== optimistic) return order;
        return mergeOrder(order, target);
      }));
      return { error: finalError };
    }

    setOrders((current) => current.map((order) => order.id === orderId ? mergeOrder(order, result.data) : order));
    return { data: result.data, error: null };
  });

  const reloadOrders = useCallback(() => reloadOrdersRef.current?.() || Promise.resolve(), []);

  return (
    <OrdersContext.Provider value={{
      orders,
      ordersLoading,
      ordersLoadError,
      reloadOrders,
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
