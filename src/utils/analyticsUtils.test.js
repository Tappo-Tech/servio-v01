import { aggregateHourlySales, createHourlyLabels } from "./analyticsUtils";

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
});
