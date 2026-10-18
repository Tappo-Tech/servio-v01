// اختبارات الوحدة والانحدار الخاصة بالوحدة `menuAvailability` وسلوكها المتوقع.
import { withIngredientAvailability } from "./menuAvailability";

describe("withIngredientAvailability", () => {
  const items = [
    { id: "dish-1", available: true },
    { id: "dish-2", available: true },
    { id: "dish-3", available: false },
    { id: "dish-4", available: true },
  ];
  const ingredients = [
    { id: "milk", name: "Milk", available: true },
    { id: "coffee", name: "Coffee", available: false },
  ];
  const links = [
    { menu_item_id: "dish-1", ingredient_id: "milk" },
    { menu_item_id: "dish-1", ingredient_id: "coffee" },
    { menu_item_id: "dish-2", ingredient_id: "milk" },
    { menu_item_id: "dish-4", ingredient_id: "unknown" },
  ];

  it("marks an item unavailable when any consumed ingredient is unavailable", () => {
    const [dish] = withIngredientAvailability([items[0]], ingredients, links);

    expect(dish.isAvailableForSale).toBe(false);
    expect(dish.unavailableIngredients.map((ingredient) => ingredient.id)).toEqual(["coffee"]);
    expect(dish.ingredient_ids).toEqual(["milk", "coffee"]);
  });

  it("keeps an item available when all linked ingredients are available", () => {
    const [dish] = withIngredientAvailability([items[1]], ingredients, links);

    expect(dish.isAvailableForSale).toBe(true);
    expect(dish.unavailableIngredients).toEqual([]);
  });

  it("preserves manual unavailability and fails closed for unknown ingredient links", () => {
    const [manuallyUnavailable, unknown] = withIngredientAvailability([items[2], items[3]], ingredients, links);

    expect(manuallyUnavailable.isAvailableForSale).toBe(false);
    expect(unknown.isAvailableForSale).toBe(false);
    expect(unknown.hasUnknownIngredient).toBe(true);
  });

  it("keeps an unlinked, manually available item available", () => {
    const [dish] = withIngredientAvailability([{ id: "dish-5", available: true }], ingredients, links);

    expect(dish.isAvailableForSale).toBe(true);
    expect(dish.ingredient_ids).toEqual([]);
  });
});
