import { createWorkdayHourBuckets, getWorkdayOffsetMinutes } from "./workdayUtils";

export const HOURS_PER_DAY = 24;

export function createHourlyLabels(startMinutes = 0, durationMinutes = HOURS_PER_DAY * 60) {
  return createWorkdayHourBuckets(startMinutes, durationMinutes).map((bucket) => bucket.label);
}

// تجمع المبيعات ضمن نافذة الدوام فقط، ويبدأ ترتيب الأعمدة من وقت الافتتاح حتى لو تجاوز منتصف الليل.
export function aggregateHourlySales(orders, schedule = {}) {
  const startMinutes = Number(schedule?.startMinutes) || 0;
  const durationMinutes = Math.min(HOURS_PER_DAY * 60, Math.max(1, Number(schedule?.durationMinutes) || HOURS_PER_DAY * 60));
  const buckets = createWorkdayHourBuckets(startMinutes, durationMinutes);
  const totals = Array(buckets.length).fill(0);
  (orders || []).forEach((order) => {
    const saleDate = new Date(order?.completed_at || order?.created_at);
    const amount = Number(order?.total_price);
    if (Number.isNaN(saleDate.getTime()) || !Number.isFinite(amount)) return;
    const offset = getWorkdayOffsetMinutes(saleDate, startMinutes);
    if (offset == null || offset >= durationMinutes) return;
    const bucketIndex = Math.floor(offset / 60);
    if (bucketIndex >= 0 && bucketIndex < totals.length) totals[bucketIndex] += amount;
  });
  return totals.map((value) => Number(value.toFixed(2)));
}
