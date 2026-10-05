import { getAddonSelectionSignature, getCartLineKey, splitCartLine } from "./cartItemUtils";

describe("cart line identity", () => {
  test("allows the same menu item to occupy separately editable cart lines", () => {
    const first = { id: "menu-item", cartItemId: "line-one" };
    const second = { id: "menu-item", cartItemId: "line-two" };

    expect(first.id).toBe(second.id);
    expect(getCartLineKey(first)).not.toBe(getCartLineKey(second));
    expect(getCartLineKey({ id: "legacy-line" })).toBe("legacy-line");
  });

  test("uses an order-independent signature for equal choices and distinct keys for different add-ons", () => {
    const honey = { id: "honey-id", name: "عسل" };
    const sauce = { id: "sauce-id", name: "صوص" };

    expect(getAddonSelectionSignature([honey, sauce])).toBe(getAddonSelectionSignature([sauce, honey]));
    expect(getAddonSelectionSignature([honey])).not.toBe(getAddonSelectionSignature([sauce]));
    expect(getAddonSelectionSignature([])).toBe("");
  });

  test("splits one unit from a multi-quantity line without changing the total unit count", () => {
    const cart = [{ id: "tea", cartItemId: "original", quantity: 2, selected_addons: [{ id: null, name: "عسل" }] }];
    const next = splitCartLine(cart, "original", "separate");

    expect(next.map((item) => item.quantity)).toEqual([1, 1]);
    expect(next[0].selected_addons).toEqual([{ id: null, name: "عسل" }]);
    expect(next[1].selected_addons).toEqual([]);
    expect(next.reduce((sum, item) => sum + item.quantity, 0)).toBe(2);
  });

  test("adds a separate unit when the source line contains one item", () => {
    const next = splitCartLine([{ id: "tea", cartItemId: "original", quantity: 1 }], "original", "separate");
    expect(next.map((item) => item.cartItemId)).toEqual(["original", "separate"]);
    expect(next.map((item) => item.quantity)).toEqual([1, 1]);
  });
});
