import { calculateInclusiveVat, roundMoney, toMinorUnits } from "./taxUtils";
import { createWorkdayHourBuckets, getWorkdayOffsetMinutes, shiftBusinessDate } from "./workdayUtils";

const SALES_STATUSES = new Set(["served", "unclaimed"]);
const pad = (value) => String(value).padStart(2, "0");

export function toLocalDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getPresetDateRange(period, now = new Date(), workdayStartMinutes = 0) {
  const operationalToday = shiftBusinessDate(now, workdayStartMinutes) || now;
  const today = new Date(operationalToday.getFullYear(), operationalToday.getMonth(), operationalToday.getDate());
  let from = new Date(today);
  let to = new Date(today);
  if (period === "weekly") {
    from.setDate(today.getDate() - today.getDay());
    to = new Date(from);
    to.setDate(from.getDate() + 6);
  }
  if (period === "monthly") {
    from = new Date(today.getFullYear(), today.getMonth(), 1);
    to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  }
  return { from: toLocalDateKey(from), to: toLocalDateKey(to) };
}

function parseLocalDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function setClock(date, minuteOfDay = 0) {
  const safeMinute = Math.max(0, Math.min(1439, Math.floor(Number(minuteOfDay) || 0)));
  date.setHours(Math.floor(safeMinute / 60), safeMinute % 60, 0, 0);
  return date;
}

// حدود اليوم التشغيلي تبدأ وتنتهي عند وقت الافتتاح، لا عند منتصف الليل.
export function getUtcDateBounds(from, to, workdayStartMinutes = 0) {
  const start = parseLocalDateKey(from);
  const lastDay = parseLocalDateKey(to);
  if (!start || !lastDay || from > to) throw new Error("Invalid report date range");
  const endExclusive = new Date(lastDay);
  endExclusive.setDate(endExclusive.getDate() + 1);
  setClock(start, workdayStartMinutes);
  setClock(endExclusive, workdayStartMinutes);
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
      } catch { return []; }
    });
  }
  if (typeof value === "string") {
    try { return normalizeItems(JSON.parse(value)); } catch { return []; }
  }
  return [];
}

function isInWorkday(date, schedule) {
  if (!date) return false;
  return getWorkdayOffsetMinutes(date, schedule.startMinutes) < schedule.durationMinutes;
}

export function aggregateSalesReport(orders = [], schedule = { startMinutes: 0, durationMinutes: 1440 }) {
  let grossMinor = 0;
  let vatMinor = 0;
  let itemQuantity = 0;
  const itemsByKey = new Map();
  const salesOrders = [];

  for (const order of orders) {
    const saleDate = getSaleDate(order);
    if (!SALES_STATUSES.has(order?.status) || !isInWorkday(saleDate, schedule)) continue;
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

export function createSalesSeries(orders, from, to, period, locale = "ar-SA", schedule = { startMinutes: 0, durationMinutes: 1440 }) {
  const validOrders = (orders || []).filter((order) => SALES_STATUSES.has(order?.status) && isInWorkday(getSaleDate(order), schedule));
  if (period === "daily") {
    const buckets = createWorkdayHourBuckets(schedule.startMinutes, schedule.durationMinutes).map((bucket) => ({ label: bucket.label, total: 0 }));
    validOrders.forEach((order) => {
      const offset = getWorkdayOffsetMinutes(getSaleDate(order), schedule.startMinutes);
      if (offset == null || offset >= schedule.durationMinutes) return;
      const index = Math.floor(offset / 60);
      if (buckets[index]) buckets[index].total += Number(order.total_price) || 0;
    });
    return buckets.map((bucket, index) => ({ ...bucket, key: index, total: roundMoney(bucket.total) }));
  }

  const first = parseLocalDateKey(from);
  const last = parseLocalDateKey(to);
  if (!first || !last || from > to) return [];
  const byDay = new Map();
  validOrders.forEach((order) => {
    const businessDate = shiftBusinessDate(getSaleDate(order), schedule.startMinutes);
    const key = businessDate && toLocalDateKey(businessDate);
    if (key) byDay.set(key, (byDay.get(key) || 0) + (Number(order.total_price) || 0));
  });

  const series = [];
  const cursor = new Date(first);
  while (cursor <= last) {
    const key = toLocalDateKey(cursor);
    series.push({ key, label: cursor.toLocaleDateString(locale, { day: "numeric", month: "short" }), total: roundMoney(byDay.get(key) || 0) });
    cursor.setDate(cursor.getDate() + 1);
  }
  return series;
}

export function createCsvText(rows) {
  const cell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return `\uFEFF${rows.map((row) => row.map(cell).join(",")).join("\r\n")}`;
}
