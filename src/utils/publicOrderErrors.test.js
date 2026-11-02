import { getUnavailableCartItemNames, isUnavailableMenuOrderError } from "./publicOrderErrors";

test.each([
  ["MENU_ITEM_UNAVAILABLE", true],
  ["MENU_ITEM_NOT_IN_BRANCH_OR_UNAVAILABLE", true],
  ["ORDER_ITEM_PRICE_MISMATCH", false],
  ["Failed to fetch", false],
])("classifies the customer order error %s", (message, expected) => {
  expect(isUnavailableMenuOrderError(new Error(message))).toBe(expected);
});

test("identifies unavailable cart items by comparing IDs against the current public menu", () => {
  const cartItems = [
    { id: "available-1", name: "Burger" },
    { id: "stopped-2", name: "Soup" },
    { menu_item_id: "stopped-3", name: "Salad" },
  ];
  const availableItems = [{ id: "available-1" }];

  expect(getUnavailableCartItemNames(cartItems, availableItems)).toEqual(["Soup", "Salad"]);
});
