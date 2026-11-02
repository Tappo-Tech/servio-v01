import { createWorkdayHourBuckets, createWorkdayScheduleHourBuckets, getWorkdayScheduleBucketIndex } from "./workdayUtils";

export const HOURS_PER_DAY = 24;

export function createHourlyLabels(startMinutes = 0, durationMinutes = HOURS_PER_DAY * 60) {
  if (startMinutes && typeof startMinutes === "object") {
    return createWorkdayScheduleHourBuckets(startMinutes).map((bucket) => bucket.label);
  }
  return createWorkdayHourBuckets(startMinutes, durationMinutes).map((bucket) => bucket.label);
}

// تجمع المبيعات ضمن ساعات الشفتات الفعلية، مع ترتيبها من أول شفت حتى لو عبرت منتصف الليل.
export function aggregateHourlySales(orders, schedule = {}) {
  const buckets = createWorkdayScheduleHourBuckets(schedule);
  const totals = Array(buckets.length).fill(0);
  (orders || []).forEach((order) => {
    const saleDate = new Date(order?.completed_at || order?.created_at);
    const amount = Number(order?.total_price);
    if (Number.isNaN(saleDate.getTime()) || !Number.isFinite(amount)) return;
    const bucketIndex = getWorkdayScheduleBucketIndex(saleDate, schedule);
    if (bucketIndex != null && bucketIndex >= 0 && bucketIndex < totals.length) totals[bucketIndex] += amount;
  });
  return totals.map((value) => Number(value.toFixed(2)));
}
