import {
  aggregateSalesReport,
  createCsvText,
  createSalesSeries,
  getPresetDateRange,
  getUtcDateBounds,
} from "./salesReportUtils";

describe("sales report calculations", () => {
  test("uses Sunday-based full weeks and full calendar months", () => {
    const monday = new Date(2026, 9, 5, 12, 0, 0);
    expect(getPresetDateRange("weekly", monday)).toEqual({ from: "2026-10-04", to: "2026-10-10" });
    expect(getPresetDateRange("monthly", monday)).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(getPresetDateRange("daily", monday)).toEqual({ from: "2026-10-05", to: "2026-10-05" });
  });

  test("creates local-midnight inclusive date bounds with an exclusive next-day end", () => {
    const bounds = getUtcDateBounds("2026-10-05", "2026-10-05");
    expect(new Date(bounds.start).getHours()).toBe(0);
    const end = new Date(bounds.endExclusive);
    expect(end.getDate()).toBe(6);
    expect(end.getHours()).toBe(0);
    expect(() => getUtcDateBounds("2026-10-06", "2026-10-05")).toThrow();
  });

  test("aggregates completed sales, extracts inclusive VAT, and ranks items by quantity", () => {
    const report = aggregateSalesReport([
      { status: "served", total_price: 115, completed_at: "2026-10-05T10:00:00Z", items: [{ id: "a", name: "لاتيه", quantity: 2, price: 50 }, { id: "b", name: "قهوة", quantity: 1, price: 15 }] },
      { status: "unclaimed", total_price: 23, completed_at: null, created_at: "2026-10-05T11:00:00Z", items: [{ id: "a", name: "لاتيه", quantity: 1, price: 50 }] },
      { status: "cancelled", total_price: 999, completed_at: "2026-10-05T12:00:00Z", items: [{ id: "x", name: "ملغي", quantity: 1, price: 999 }] },
      { status: "served", total_price: 50, completed_at: "not-a-date", items: [] },
    ]);

    expect(report).toMatchObject({ orderCount: 2, gross: 138, vat: 18, net: 120, averageOrder: 69, itemQuantity: 4 });
    expect(report.topItems[0]).toMatchObject({ name: "لاتيه", quantity: 3, revenue: 150 });
    expect(report.topItems.some((item) => item.name === "ملغي")).toBe(false);
  });

  test("quotes CSV cells containing delimiters and quotes and preserves a UTF-8 BOM", () => {
    expect(createCsvText([["اسم الصنف", "القيمة"], ['"لاتيه, كبير"', 10]])).toBe('\uFEFF"اسم الصنف","القيمة"\r\n"""لاتيه, كبير""","10"');
  });

  test("groups period revenue by local calendar day and daily revenue by hour", () => {
    const monday = new Date(2026, 9, 5, 10, 0, 0).toISOString();
    const tuesday = new Date(2026, 9, 6, 12, 0, 0).toISOString();
    const orders = [
      { status: "served", total_price: 50, completed_at: monday },
      { status: "served", total_price: 25, completed_at: tuesday },
    ];
    const days = createSalesSeries(orders, "2026-10-05", "2026-10-06", "weekly", "en-US");
    expect(days.map((point) => point.total)).toEqual([50, 25]);
    const hours = createSalesSeries(orders, "2026-10-05", "2026-10-05", "daily", "en-US");
    expect(hours).toHaveLength(24);
    expect(hours[10].total).toBe(50);
  });

  test("aligns daily report buckets to configured work hours and handles overnight sales", () => {
    const schedule = { startMinutes: 18 * 60, durationMinutes: 10 * 60 };
    const inRange = new Date(2026, 9, 5, 23, 15, 0).toISOString();
    const afterMidnight = new Date(2026, 9, 6, 2, 15, 0).toISOString();
    const outside = new Date(2026, 9, 6, 5, 15, 0).toISOString();
    const bounds = getUtcDateBounds("2026-10-05", "2026-10-05", schedule.startMinutes);
    const end = new Date(bounds.endExclusive);
    expect(end.getDate()).toBe(6);
    expect(end.getHours()).toBe(18);
    const orders = [
      { status: "served", total_price: 20, completed_at: inRange },
      { status: "served", total_price: 15, completed_at: afterMidnight },
      { status: "served", total_price: 100, completed_at: outside },
    ];
    const series = createSalesSeries(orders, "2026-10-05", "2026-10-05", "daily", "en-US", schedule);
    expect(series[0].label).toBe("18:00");
    expect(series[6].label).toBe("00:00");
    expect(series[8].total).toBe(15);
    expect(series.reduce((sum, point) => sum + point.total, 0)).toBe(35);
    expect(aggregateSalesReport(orders, schedule).gross).toBe(35);
  });
});
