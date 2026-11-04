import { aggregateTableTurnover, attachDailyTableOrderNumbers, buildTableTurnoverDetails, getTableCounterKey } from "./tableOrderUtils";

describe("daily table order numbers and turnover", () => {
  test("starts each table at one and keeps counters independent per day", () => {
    const orders = [
      { id: "b", table_number: "5", created_at: "2026-11-04T09:05:00" },
      { id: "a", table_number: "5", created_at: "2026-11-04T09:00:00" },
      { id: "c", table_number: "6", created_at: "2026-11-04T09:10:00" },
      { id: "d", table_number: "5", created_at: "2026-11-05T09:00:00" },
    ];
    const numbered = attachDailyTableOrderNumbers(orders);
    expect(numbered.map((order) => [order.id, order.order_number])).toEqual([
      ["b", 2], ["a", 1], ["c", 1], ["d", 1],
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

  test("returns every completed physical-table order with its number, gap and completion duration", () => {
    const details = buildTableTurnoverDetails([
      { id: "later", table_number: "طاولة 4", status: "served", total_price: 42.5, created_at: "2026-11-04T10:15:00", completed_at: "2026-11-04T10:55:00" },
      { id: "other-table", table_number: "5", status: "served", total_price: 9, created_at: "2026-11-04T10:05:00", completed_at: "2026-11-04T10:10:00" },
      { id: "first", table_number: "4", status: "served", total_price: 20, created_at: "2026-11-04T09:30:00", completed_at: "2026-11-04T10:00:00" },
      { id: "pos", table_number: "takeaway", status: "served", total_price: 100, created_at: "2026-11-04T10:00:00", completed_at: "2026-11-04T10:02:00" },
      { id: "pending", table_number: "4", status: "preparing", total_price: 10, created_at: "2026-11-04T10:10:00", completed_at: null },
    ]);

    const tableFour = details.find((group) => group.key === "table:4");
    expect(tableFour.orders).toEqual([
      expect.objectContaining({ id: "first", orderNumber: 1, gapMinutes: null, durationMinutes: 30, totalPrice: 20 }),
      expect.objectContaining({ id: "later", orderNumber: 2, gapMinutes: 45, durationMinutes: 40, totalPrice: 42.5 }),
    ]);
    expect(details.map((group) => group.table)).toEqual(["4", "5"]);
  });

  test("leaves missing completion times and first-order gaps blank", () => {
    const [table] = buildTableTurnoverDetails([
      { id: "1", table_number: "2", status: "served", created_at: "2026-11-04T08:00:00", completed_at: null },
    ]);
    expect(table.orders[0]).toMatchObject({ gapMinutes: null, durationMinutes: null });
  });
});
