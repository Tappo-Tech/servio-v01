// اختبارات الوحدة والانحدار الخاصة بالوحدة `analyticsUtils` وسلوكها المتوقع.
import { aggregateHourlySales, createHourlyLabels } from "./analyticsUtils";
import { getWorkdaySchedule } from "./workdayUtils";

describe("24-hour sales trend", () => {
  test("creates one readable bucket for each hour from midnight through 23:00", () => {
    const labels = createHourlyLabels();
    expect(labels).toHaveLength(24);
    expect(labels[0]).toBe("00:00");
    expect(labels[23]).toBe("23:00");
  });

  test("places sales in the exact local hour and keeps legacy created_at records", () => {
    const atMidnight = new Date(2026, 9, 5, 0, 8, 0).toISOString();
    const atAfternoon = new Date(2026, 9, 5, 14, 45, 0).toISOString();
    const atLastHour = new Date(2026, 9, 5, 23, 59, 0).toISOString();
    const sales = aggregateHourlySales([
      { completed_at: atMidnight, total_price: 10.25 },
      { completed_at: atAfternoon, total_price: 20 },
      { completed_at: null, created_at: atLastHour, total_price: 7.5 },
      { completed_at: "not-a-date", total_price: 99 },
    ]);

    expect(sales).toHaveLength(24);
    expect(sales[0]).toBe(10.25);
    expect(sales[14]).toBe(20);
    expect(sales[23]).toBe(7.5);
    expect(sales.reduce((sum, value) => sum + value, 0)).toBe(37.75);
  });

  test("starts the chart at the configured workday hour and excludes outside hours", () => {
    const start = new Date(2026, 9, 5, 18, 10, 0).toISOString();
    const late = new Date(2026, 9, 6, 0, 30, 0).toISOString();
    const afterShift = new Date(2026, 9, 6, 5, 30, 0).toISOString();
    const labels = createHourlyLabels(18 * 60, 10 * 60);
    const sales = aggregateHourlySales([
      { completed_at: start, total_price: 10 },
      { completed_at: late, total_price: 12 },
      { completed_at: afterShift, total_price: 90 },
    ], { startMinutes: 18 * 60, durationMinutes: 10 * 60 });
    expect(labels[0]).toBe("18:00");
    expect(labels[9]).toBe("03:00");
    expect(sales).toHaveLength(10);
    expect(sales[0]).toBe(10);
    expect(sales[6]).toBe(12);
    expect(sales.reduce((sum, value) => sum + value, 0)).toBe(22);
  });

  test("shows active shift buckets without break hours and ignores break-time sales", () => {
    const schedule = getWorkdaySchedule({
      workday_start: "08:00:00",
      workday_end: "17:00:00",
      workday_hours: 8,
      workday_shifts: [{ start: "08:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
    });
    const labels = createHourlyLabels(schedule);
    const sales = aggregateHourlySales([
      { completed_at: new Date(2026, 9, 5, 9, 10).toISOString(), total_price: 10 },
      { completed_at: new Date(2026, 9, 5, 12, 30).toISOString(), total_price: 40 },
      { completed_at: new Date(2026, 9, 5, 14, 30).toISOString(), total_price: 20 },
    ], schedule);

    expect(labels).toEqual(["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"]);
    expect(sales).toHaveLength(8);
    expect(sales[1]).toBe(10);
    expect(sales[5]).toBe(20);
    expect(sales.reduce((sum, value) => sum + value, 0)).toBe(30);
  });
});
