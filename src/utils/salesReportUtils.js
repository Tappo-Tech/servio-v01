import { calculateInclusiveVat, roundMoney, toMinorUnits } from "./taxUtils";

const SALES_STATUSES = new Set(["served", "unclaimed"]);
const pad = (value) => String(value).padStart(2, "0");

// يتبع التقرير التقويم المحلي للجهاز مثل لوحة التحليلات الحالية.
export function toLocalDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getPresetDateRange(period, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let from = new Date(today);
  if (period === "weekly") from.setDate(today.getDate() - today.getDay()); // أسبوع العمل يبدأ الأحد.
  if (period === "monthly") from = new Date(today.getFullYear(), today.getMonth(), 1);
  const todayKey = toLocalDateKey(today);
  return { from: toLocalDateKey(from), to: todayKey };
}

function parseLocalDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

// حدود الاستعلام محلية شاملة لبداية ونهاية اليوم، وUTC-exclusive لنهاية اليوم كي لا تُفقد الطلبات.
export function getUtcDateBounds(from, to) {
  const start = parseLocalDateKey(from);
  const lastDay = parseLocalDateKey(to);
  if (!start || !lastDay || from > to) throw new Error("Invalid report date range");
  const endExclusive = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + 1);
  return { start: start.toISOString(), endExclusive: endExclusive.toISOString() };
}

export function getSaleDate(order) {
  const completedAt = order?.completed_at ? new Date(order.completed_at) : null;
  if (completedAt && !Number.isNaN(completedAt.getTime())) return completedAt;
  const createdAt = order?.created_at ? new Date(order.created_at) : null;
  return createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : null;
}

function normalizeItems(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (item && typeof item === "object") return [item];
      if (typeof item !== "string") return [];
      try {
        const parsed = JSON.parse(item);
        return Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry === "object") : parsed && typeof parsed === "object" ? [parsed] : [];
      } catch {
        return [];
      }
    });
  }
  if (typeof value === "string") {
    try { return normalizeItems(JSON.parse(value)); } catch { return []; }
  }
  return [];
}

export function aggregateSalesReport(orders = []) {
  let grossMinor = 0;
  let vatMinor = 0;
  let itemQuantity = 0;
  const itemsByKey = new Map();
  const salesOrders = [];

  for (const order of orders) {
    if (!SALES_STATUSES.has(order?.status) || !getSaleDate(order)) continue;
    const amount = roundMoney(order.total_price || 0);
    const vat = calculateInclusiveVat(amount);
    grossMinor += toMinorUnits(vat.gross);
    vatMinor += toMinorUnits(vat.vat);
    salesOrders.push(order);

    for (const item of normalizeItems(order.items)) {
      const name = String(item.name || "").trim();
      if (!name) continue;
      const quantity = Number(item.quantity);
      const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
      const price = Number(item.price);
      const safePrice = Number.isFinite(price) && price >= 0 ? price : 0;
      const key = String(item.id || item.cartItemId || name);
      const existing = itemsByKey.get(key) || { key, name, quantity: 0, revenue: 0 };
      existing.quantity += safeQuantity;
      existing.revenue += safeQuantity * safePrice;
      itemsByKey.set(key, existing);
      itemQuantity += safeQuantity;
    }
  }

  const gross = grossMinor / 100;
  const vat = vatMinor / 100;
  const net = (grossMinor - vatMinor) / 100;
  const topItems = Array.from(itemsByKey.values())
    .map((item) => ({ ...item, revenue: roundMoney(item.revenue) }))
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue || a.name.localeCompare(b.name))
    .slice(0, 10);

  return {
    orderCount: salesOrders.length,
    gross: roundMoney(gross),
    vat: roundMoney(vat),
    net: roundMoney(net),
    averageOrder: salesOrders.length ? roundMoney(gross / salesOrders.length) : 0,
    itemQuantity: roundMoney(itemQuantity),
    topItems,
    salesOrders,
  };
}

export function createSalesSeries(orders, from, to, period, locale = "ar-SA") {
  const validOrders = (orders || []).filter((order) => SALES_STATUSES.has(order?.status) && getSaleDate(order));
  if (period === "daily") {
    const values = Array.from({ length: 24 }, (_, hour) => ({ label: `${pad(hour)}:00`, key: hour, total: 0 }));
    validOrders.forEach((order) => {
      const hour = getSaleDate(order).getHours();
      values[hour].total += Number(order.total_price) || 0;
    });
    return values.map((bucket) => ({ ...bucket, total: roundMoney(bucket.total) }));
  }

  const first = parseLocalDateKey(from);
  const last = parseLocalDateKey(to);
  if (!first || !last || from > to) return [];
  const byDay = new Map();
  validOrders.forEach((order) => {
    const key = toLocalDateKey(getSaleDate(order));
    byDay.set(key, (byDay.get(key) || 0) + (Number(order.total_price) || 0));
  });

  const series = [];
  const cursor = new Date(first);
  while (cursor <= last) {
    const key = toLocalDateKey(cursor);
    series.push({
      key,
      label: cursor.toLocaleDateString(locale, { day: "numeric", month: "short" }),
      total: roundMoney(byDay.get(key) || 0),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return series;
}

export function createCsvText(rows) {
  const cell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return `\uFEFF${rows.map((row) => row.map(cell).join(",")).join("\r\n")}`;
}
