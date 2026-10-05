export const HOURS_PER_DAY = 24;

export function createHourlyLabels() {
  return Array.from({ length: HOURS_PER_DAY }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);
}

// يجمع إيراد الساعة حسب وقت إكمال الطلب، مع الرجوع إلى وقت الإنشاء للطلبات القديمة.
export function aggregateHourlySales(orders) {
  const totals = Array(HOURS_PER_DAY).fill(0);
  (orders || []).forEach((order) => {
    const saleDate = new Date(order?.completed_at || order?.created_at);
    const amount = Number(order?.total_price);
    if (Number.isNaN(saleDate.getTime()) || !Number.isFinite(amount)) return;
    totals[saleDate.getHours()] += amount;
  });
  return totals.map((value) => Number(value.toFixed(2)));
}
