const getAddonKey = (addons) => (Array.isArray(addons) ? addons : [])
  .map((addon) => String(typeof addon === "string" ? addon : addon?.id ?? addon?.name ?? "").trim().toLocaleLowerCase())
  .filter(Boolean)
  .sort()
  .join(",");

const getItemKey = (item = {}) => [
  String(item.id ?? item.menuItemId ?? item.name ?? "").trim().toLocaleLowerCase(),
  String(item.name ?? "").trim().toLocaleLowerCase(),
  String(item.category_id ?? item.categoryId ?? ""),
  getAddonKey(item.selected_addons),
].join("|");

function aggregateItems(items) {
  const result = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    const quantity = Number(item?.quantity ?? 1);
    if (!item || !Number.isFinite(quantity) || quantity <= 0) return;
    const key = getItemKey(item);
    const current = result.get(key);
    result.set(key, {
      item: current?.item || item,
      quantity: (current?.quantity || 0) + quantity,
    });
  });
  return result;
}

/**
 * Returns only kitchen-relevant changes between the last printed ticket and the saved order.
 * Quantity increases become additions; decreases/removals are explicit cancellation lines.
 */
export function buildKitchenOrderDelta(previousItems, nextItems) {
  const previous = aggregateItems(previousItems);
  const next = aggregateItems(nextItems);
  const keys = [...new Set([...previous.keys(), ...next.keys()])];
  const delta = [];

  keys.forEach((key) => {
    const before = previous.get(key);
    const after = next.get(key);
    const difference = (after?.quantity || 0) - (before?.quantity || 0);
    if (difference > 0) {
      delta.push({ ...after.item, quantity: difference, kitchenAction: "add" });
    } else if (difference < 0) {
      delta.push({ ...before.item, quantity: Math.abs(difference), kitchenAction: "remove" });
    }
  });

  return delta;
}
