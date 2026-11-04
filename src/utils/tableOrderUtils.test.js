import { aggregateTableTurnover, attachDailyTableOrderNumbers, getTableCounterKey } from "./tableOrderUtils";

describe("daily table order numbers and turnover", () => {
  test("starts each table at zero and keeps counters independent per day", () => {
    const orders = [
      { id: "b", table_number: "5", created_at: "2026-11-04T09:05:00" },
      { id: "a", table_number: "5", created_at: "2026-11-04T09:00:00" },
      { id: "c", table_number: "6", created_at: "2026-11-04T09:10:00" },
      { id: "d", table_number: "5", created_at: "2026-11-05T09:00:00" },
    ];
    const numbered = attachDailyTableOrderNumbers(orders);
    expect(numbered.map((order) => [order.id, order.order_number])).toEqual([
      ["b", 1], ["a", 0], ["c", 0], ["d", 0],
    ]);
    expect(getTableCounterKey("داخل - 5")).toBe(getTableCounterKey("5"));
  });

  test("calculates turns and average completed duration per physical table", () => {
    const report = aggregateTableTurnover([
      { id: "1", table_number: "5", status: "served", total_price: 20, created_at: "2026-11-04T09:00:00", completed_at: "2026-11-04T09:30:00" },
      { id: "2", table_number: "5", status: "unclaimed", total_price: 10, created_at: "2026-11-04T10:00:00", completed_at: "2026-11-04T10:20:00" },
      { id: "3", table_number: "takeaway", status: "served", total_price: 99, created_at: "2026-11-04T10:00:00", completed_at: "2026-11-04T10:05:00" },
    ]);
    expect(report.tableCount).toBe(1);
    expect(report.totalTurns).toBe(2);
    expect(report.averageTurnsPerTable).toBe(2);
    expect(report.averageMinutes).toBe(25);
    expect(report.rows[0]).toMatchObject({ table: "5", turns: 2, revenue: 30 });
  });
});
