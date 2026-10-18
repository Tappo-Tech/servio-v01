// اختبارات الوحدة والانحدار الخاصة بالوحدة `orderKitchenDelta` وسلوكها المتوقع.
import { buildKitchenOrderDelta } from "./orderKitchenDelta";

describe("buildKitchenOrderDelta", () => {
  test("returns only newly added items", () => {
    const delta = buildKitchenOrderDelta(
      [{ id: "tea", name: "Tea", quantity: 1, category_id: "drinks" }],
      [
        { id: "tea", name: "Tea", quantity: 1, category_id: "drinks" },
        { id: "cake", name: "Cake", quantity: 2, category_id: "dessert" },
      ],
    );
    expect(delta).toEqual([{ id: "cake", name: "Cake", quantity: 2, category_id: "dessert", kitchenAction: "add" }]);
  });

  test("prints only the quantity increase or cancellation as a change", () => {
    const oldOrder = [{ id: "tea", name: "Tea", quantity: 3 }];
    expect(buildKitchenOrderDelta(oldOrder, [{ id: "tea", name: "Tea", quantity: 5 }]))
      .toEqual([{ id: "tea", name: "Tea", quantity: 2, kitchenAction: "add" }]);
    expect(buildKitchenOrderDelta(oldOrder, [{ id: "tea", name: "Tea", quantity: 1 }]))
      .toEqual([{ id: "tea", name: "Tea", quantity: 2, kitchenAction: "remove" }]);
  });

  test("marks removed items as cancellations", () => {
    expect(buildKitchenOrderDelta([{ id: "tea", name: "Tea", quantity: 1 }], []))
      .toEqual([{ id: "tea", name: "Tea", quantity: 1, kitchenAction: "remove" }]);
  });

  test("treats a changed addon selection as cancel-old plus add-new", () => {
    const delta = buildKitchenOrderDelta(
      [{ id: "coffee", name: "Coffee", quantity: 1, selected_addons: ["Oat milk"] }],
      [{ id: "coffee", name: "Coffee", quantity: 1, selected_addons: ["Whole milk"] }],
    );
    expect(delta).toHaveLength(2);
    expect(delta).toEqual(expect.arrayContaining([
      expect.objectContaining({ selected_addons: ["Oat milk"], kitchenAction: "remove" }),
      expect.objectContaining({ selected_addons: ["Whole milk"], kitchenAction: "add" }),
    ]));
  });

  test("returns no changes for identical order lines even when repeated lines aggregate", () => {
    expect(buildKitchenOrderDelta(
      [{ id: "tea", name: "Tea", quantity: 1 }, { id: "tea", name: "Tea", quantity: 1 }],
      [{ id: "tea", name: "Tea", quantity: 2 }],
    )).toEqual([]);
  });
});
