import {
  buildAddonChoices,
  getCompatibleSuggestions,
  normalizeAddonItemIds,
  normalizeAddonLimit,
  normalizeAddonOptions,
  normalizeOrderAddons,
  normalizeSelectedAddons,
  toggleSelectedAddon,
} from "./menuItemOptions";

describe("menu item options", () => {
  test("normalizes unique labels and ids and clamps the maximum to available choices", () => {
    const options = normalizeAddonOptions([" صوص حار ", "عسل", "صوص حار", "", null]);
    const ids = normalizeAddonItemIds([" sauce-id ", "sauce-id", "honey-id"]);
    expect(options).toEqual(["صوص حار", "عسل"]);
    expect(ids).toEqual(["sauce-id", "honey-id"]);
    expect(normalizeAddonLimit(9, options.length + ids.length)).toBe(4);
    expect(normalizeAddonLimit(-3, options)).toBe(0);
  });

  test("uses a shared choice limit, allowing deselection while blocking new choices", () => {
    const choices = [
      { key: "text:صوص", id: null, name: "صوص" },
      { key: "item:honey-id", id: "honey-id", name: "عسل" },
      { key: "text:ليمون", id: null, name: "ليمون" },
    ];
    const selected = [{ id: null, name: "صوص" }, { id: "honey-id", name: "عسل" }];
    expect(toggleSelectedAddon(selected, choices[2], choices, 2)).toEqual(selected);
    expect(toggleSelectedAddon(selected, choices[0], choices, 2)).toEqual([{ id: "honey-id", name: "عسل" }]);
    expect(normalizeSelectedAddons([...selected, choices[2]], choices, 2)).toEqual(selected);
  });

  test("resolves linked menu items and only persists configured custom or free item add-ons", () => {
    const item = { addon_options: ["عسل"], free_addon_item_ids: ["sauce-id", "missing-id"] };
    const choices = buildAddonChoices(item, [
      { id: "sauce-id", name: "صوص", available: true },
      { id: "missing-id", name: "غير متاح", available: false },
    ]);
    expect(choices.map(({ id, name }) => [id, name])).toEqual([[null, "عسل"], ["sauce-id", "صوص"]]);
    expect(normalizeOrderAddons([
      { id: null, name: "عسل" },
      { id: "sauce-id", name: "صوص" },
      { id: "other-id", name: "ممنوع" },
    ], item.addon_options, item.free_addon_item_ids, 2)).toEqual([
      { id: null, name: "عسل" },
      { id: "sauce-id", name: "صوص" },
    ]);
  });

  test("only returns available items explicitly listed in the current compatibility field", () => {
    const cart = [{ id: "drink", recommendation_item_ids: ["honey", "cookie", "already-added", "unavailable"] }];
    const menu = [
      { id: "drink", available: true, recommendation_item_ids: ["honey", "cookie", "already-added", "unavailable"], tags: ["حلويات خفيفة"], category_id: "drinks" },
      { id: "honey", name: "عسل", available: true },
      { id: "cookie", name: "كوكيز", available: true },
      { id: "already-added", name: "موجود", available: true },
      { id: "unavailable", name: "غير متاح", available: false },
    ];
    expect(getCompatibleSuggestions(cart, menu, [], 2).map((item) => item.id)).toEqual(["honey", "cookie"]);
    const noExplicitCompatibility = menu.map((item) => item.id === "drink" ? { ...item, recommendation_item_ids: [] } : item);
    expect(getCompatibleSuggestions([{ id: "drink" }], noExplicitCompatibility, [], 2)).toEqual([]);
  });

  test("uses the latest compatibility field and excludes dismissed or cart items", () => {
    const cart = [{ id: "drink", recommendation_item_ids: ["old-item"] }, { id: "cookie" }];
    const menu = [
      { id: "drink", available: true, recommendation_item_ids: ["cookie", "fresh-item"] },
      { id: "cookie", available: true, recommendation_item_ids: [] },
      { id: "fresh-item", available: true },
      { id: "old-item", available: true },
    ];
    expect(getCompatibleSuggestions(cart, menu, ["fresh-item"], 2)).toEqual([]);
    expect(getCompatibleSuggestions(cart, menu, [], 2).map((item) => item.id)).toEqual(["fresh-item"]);
  });
});
