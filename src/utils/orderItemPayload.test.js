import { compactOrderItems, parseOrderItems } from "./orderItemPayload";

describe("order item payload", () => {
  test("preserves category ids, cart variants and selected add-ons while omitting menu images", () => {
    const payload = compactOrderItems([{
      id: "menu-tea",
      cartItemId: "menu-tea::variant-2",
      name: "شاي",
      price: 5,
      quantity: 1,
      category_id: "drinks-category",
      image: "data:image/png;base64,large",
      tags: ["hot"],
      selected_addons: [{ id: null, name: "عسل" }],
      addon_options: ["عسل"],
      max_addons: 1,
    }]);

    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({
      id: "menu-tea",
      cartItemId: "menu-tea::variant-2",
      name: "شاي",
      quantity: 1,
      price: 5,
      category_id: "drinks-category",
      selected_addons: [{ id: null, name: "عسل" }],
    });
    expect(payload[0]).not.toHaveProperty("image");
    expect(payload[0]).not.toHaveProperty("addon_options");
  });

  test("accepts JSON-encoded legacy order items and drops malformed entries", () => {
    expect(parseOrderItems('[{"id":"tea","name":"شاي"},"broken",null]')).toEqual([{ id: "tea", name: "شاي" }]);
    expect(compactOrderItems([{ id: "x", name: "  ", price: 1 }])).toEqual([]);
  });
});
