import { normalizeOrderAddons } from "./menuItemOptions";

export const parseOrderItems = (items) => {
  if (Array.isArray(items)) {
    return items.flatMap((item) => {
      if (item && typeof item === "object") return [item];
      if (typeof item !== "string") return [];
      try {
        const parsed = JSON.parse(item);
        return parsed && typeof parsed === "object" ? (Array.isArray(parsed) ? parsed : [parsed]) : [];
      } catch {
        return [];
      }
    });
  }

  if (typeof items === "string") {
    try {
      return parseOrderItems(JSON.parse(items));
    } catch {
      return [];
    }
  }

  return [];
};

// يحفظ الحقول اللازمة للطلب والفاتورة فقط، ويحتفظ بمعرف التصنيف لضبط فصل الطباعة لاحقًا.
export const compactOrderItems = (items) => parseOrderItems(items)
  .map((item) => {
    const selectedAddons = normalizeOrderAddons(
      item.selected_addons,
      item.addon_options,
      item.free_addon_item_ids,
      item.max_addons,
    );
    const categoryId = typeof item.category_id === "string" ? item.category_id.trim() : "";
    return {
      id: item.id || item.cartItemId || null,
      cartItemId: item.cartItemId || item.id || null,
      name: String(item.name || "").trim(),
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
      ...(categoryId ? { category_id: categoryId } : {}),
      ...(selectedAddons.length ? { selected_addons: selectedAddons } : {}),
    };
  })
  .filter((item) => item.name);
