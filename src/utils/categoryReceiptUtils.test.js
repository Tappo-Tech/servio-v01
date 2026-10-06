import { buildOrderReceiptGroups } from "./categoryReceiptUtils";
import { calculateInclusiveVat } from "./taxUtils";

describe("category-specific receipt groups", () => {
  const categories = [
    { id: "drinks", name: "المشروبات", separate_print: true },
    { id: "food", name: "الأطعمة", separate_print: false },
    { id: "dessert", name: "الحلويات", separate_print: true },
  ];

  test("keeps the full order together when no category is enabled", () => {
    const order = { id: "order-1", total_price: 15, items: [{ id: "tea", category_id: "drinks", name: "شاي", price: 15, quantity: 1 }] };
    const groups = buildOrderReceiptGroups(order, [{ id: "drinks", name: "المشروبات", separate_print: false }]);

    expect(groups).toHaveLength(1);
    expect(groups[0].items).toEqual(order.items);
    expect(groups[0].order.total_price).toBe(15);
    expect(groups[0].receiptTitle).toBeNull();
  });

  test("prints each enabled category separately and leaves other items on the main receipt", () => {
    const order = {
      id: "order-2",
      total_price: 28.75,
      items: [
        { id: "tea", category_id: "drinks", name: "شاي", price: 5.75, quantity: 1 },
        { id: "meal", category_id: "food", name: "وجبة", price: 12, quantity: 1 },
        { id: "coffee", category_id: "drinks", name: "قهوة", price: 3, quantity: 1 },
        { id: "cake", category_id: "dessert", name: "كيك", price: 8, quantity: 1 },
      ],
    };
    const groups = buildOrderReceiptGroups(order, categories);
    const printedItems = groups.flatMap((group) => group.items);

    expect(groups.map((group) => group.categoryId)).toEqual([null, "drinks", "dessert"]);
    expect(groups[0].items.map((item) => item.id)).toEqual(["meal"]);
    expect(groups[1].items.map((item) => item.id)).toEqual(["tea", "coffee"]);
    expect(groups[2].items.map((item) => item.id)).toEqual(["cake"]);
    expect(printedItems).toHaveLength(order.items.length);
    expect(new Set(printedItems.map((item) => item.id))).toEqual(new Set(order.items.map((item) => item.id)));
    expect(groups.map((group) => group.order.total_price)).toEqual([12, 8.75, 8]);
    expect(groups.reduce((sum, group) => sum + group.amounts.gross, 0)).toBeCloseTo(order.total_price, 2);
  });

  test("classifies older order snapshots from the current menu item id", () => {
    const order = { total_price: 9, items: [{ id: "tea", name: "شاي", price: 9, quantity: 1 }] };
    const groups = buildOrderReceiptGroups(order, categories, [{ id: "tea", category_id: "drinks" }]);

    expect(groups).toHaveLength(1);
    expect(groups[0].categoryId).toBe("drinks");
    expect(groups[0].isSeparate).toBe(true);
  });

  test("prefers the category saved on the order when the menu item has since moved", () => {
    const order = {
      total_price: 9,
      items: [{ id: "tea", category_id: "drinks", name: "شاي", price: 9, quantity: 1 }],
    };
    const groups = buildOrderReceiptGroups(order, categories, [{ id: "tea", category_id: "food" }]);

    expect(groups).toHaveLength(1);
    expect(groups[0].categoryId).toBe("drinks");
    expect(groups[0].isSeparate).toBe(true);
  });

  test("includes the store-saved printer queue for a separate category", () => {
    const order = { total_price: 5, items: [{ id: "tea", category_id: "drinks", name: "شاي", price: 5, quantity: 1 }] };
    const groups = buildOrderReceiptGroups(order, [{ id: "drinks", name: "المشروبات", separate_print: true, printer_name: "Drinks Queue" }]);
    expect(groups[0].printerName).toBe("Drinks Queue");
  });

  test("reconciles per-receipt rounding so gross, net and VAT sum to the original order", () => {
    const order = {
      total_price: 10.03,
      items: [
        { id: "main", category_id: "food", name: "وجبة", price: 10, quantity: 1 },
        { id: "small", category_id: "drinks", name: "إضافة", price: 0.03, quantity: 1 },
      ],
    };
    const groups = buildOrderReceiptGroups(order, categories);
    const totals = groups.reduce((acc, group) => ({
      gross: acc.gross + group.amounts.gross,
      net: acc.net + group.amounts.net,
      vat: acc.vat + group.amounts.vat,
    }), { gross: 0, net: 0, vat: 0 });
    const expected = calculateInclusiveVat(order.total_price);

    expect(totals.gross).toBeCloseTo(expected.gross, 2);
    expect(totals.net).toBeCloseTo(expected.net, 2);
    expect(totals.vat).toBeCloseTo(expected.vat, 2);
  });

  test("shows an order-level adjustment on the main receipt without changing the final total", () => {
    const order = {
      total_price: 19,
      items: [
        { id: "meal", category_id: "food", name: "وجبة", price: 10, quantity: 1 },
        { id: "drink", category_id: "drinks", name: "شاي", price: 10, quantity: 1 },
      ],
    };
    const groups = buildOrderReceiptGroups(order, categories);

    expect(groups[0].order.receipt_adjustment).toBe(-1);
    expect(groups.reduce((sum, group) => sum + group.amounts.gross, 0)).toBe(19);
  });
});
