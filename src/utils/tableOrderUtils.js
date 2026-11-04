const pad = (value) => String(value).padStart(2, "0");

export function getTableCounterKey(tableNumber) {
  const raw = String(tableNumber ?? "").trim().toLowerCase();
  if (!raw) return "__unassigned__";
  const normalized = raw.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  const trailingNumber = normalized.match(/(\d+)\s*$/);
  if (trailingNumber) return `table:${Number(trailingNumber[1])}`;
  if (/pos|cashier|takeaway|سفري|محل|كاشير|غير محدد/.test(normalized)) return `service:${normalized}`;
  return `table:${normalized.replace(/\s+/g, " ")}`;
}

export function isPhysicalTable(tableNumber) {
  const key = getTableCounterKey(tableNumber);
  return key.startsWith("table:") && key !== "table:غير محدد";
}

export function getLocalCalendarDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown-date";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * رقم عرض محلي: كل طاولة لها عداد مستقل، ويعاد إلى 1 مع بداية كل يوم.
 * لا نكتب هذا الرقم في قاعدة البيانات لأن عزل الفرع والبيانات يبقيان على order.id.
 */
export function attachDailyTableOrderNumbers(orderList = []) {
  const counters = new Map();
  const sorted = [...orderList].sort((a, b) => new Date(a?.created_at || 0) - new Date(b?.created_at || 0));
  const numbers = new Map();
  sorted.forEach((order) => {
    const key = `${getLocalCalendarDateKey(order?.created_at)}|${getTableCounterKey(order?.table_number)}`;
    const next = counters.get(key) || 1;
    numbers.set(order.id, next);
    counters.set(key, next + 1);
  });
  return orderList.map((order) => ({ ...order, order_number: numbers.get(order.id) ?? 1 }));
}

export function aggregateTableTurnover(orders = [], schedule = { startMinutes: 0, durationMinutes: 1440 }) {
  const rowsByKey = new Map();
  const validStatuses = new Set(["served", "unclaimed"]);
  orders.forEach((order) => {
    if (!validStatuses.has(order?.status) || !isPhysicalTable(order?.table_number)) return;
    const created = order?.created_at ? new Date(order.created_at) : null;
    const completed = order?.completed_at ? new Date(order.completed_at) : null;
    if (!created || Number.isNaN(created.getTime())) return;
    const businessOffset = ((created.getHours() * 60 + created.getMinutes()) - Number(schedule.startMinutes || 0) + 1440) % 1440;
    if (businessOffset >= Number(schedule.durationMinutes || 1440)) return;
    const key = getTableCounterKey(order.table_number);
    const existing = rowsByKey.get(key) || {
      key,
      table: String(order.table_number || "—").replace(/^(داخل|dine\s*in)\s*[-:]?\s*/i, ""),
      turns: 0,
      revenue: 0,
      durationTotal: 0,
      durationCount: 0,
    };
    existing.turns += 1;
    existing.revenue += Number(order.total_price) || 0;
    if (completed && !Number.isNaN(completed.getTime()) && completed >= created) {
      existing.durationTotal += (completed.getTime() - created.getTime()) / 60000;
      existing.durationCount += 1;
    }
    rowsByKey.set(key, existing);
  });
  const rows = [...rowsByKey.values()]
    .map((row) => ({ ...row, revenue: Math.round(row.revenue * 100) / 100, averageMinutes: row.durationCount ? Math.round((row.durationTotal / row.durationCount) * 10) / 10 : null }))
    .sort((a, b) => b.turns - a.turns || String(a.table).localeCompare(String(b.table), "ar"));
  const totalTurns = rows.reduce((sum, row) => sum + row.turns, 0);
  const averageMinutes = rows.flatMap((row) => row.durationCount ? [{ total: row.durationTotal, count: row.durationCount }] : []).reduce((sum, row) => sum + row.total, 0);
  const durationCount = rows.reduce((sum, row) => sum + row.durationCount, 0);
  return {
    rows,
    tableCount: rows.length,
    totalTurns,
    averageTurnsPerTable: rows.length ? Math.round((totalTurns / rows.length) * 10) / 10 : 0,
    averageMinutes: durationCount ? Math.round((averageMinutes / durationCount) * 10) / 10 : null,
  };
}
