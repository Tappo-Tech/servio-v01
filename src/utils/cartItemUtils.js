export function getCartLineKey(item) {
  return String(item?.cartItemId || item?.id || "");
}

export function getAddonSelectionSignature(selectedAddons) {
  if (!Array.isArray(selectedAddons)) return "";
  return selectedAddons
    .map((addon) => {
      if (typeof addon === "string") {
        const name = addon.trim().replace(/\s+/g, " ").toLocaleLowerCase();
        return name ? `text:${name}` : "";
      }
      const id = String(addon?.id || addon?.menu_item_id || "").trim();
      if (id) return `item:${id}`;
      const name = String(addon?.name || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
      return name ? `text:${name}` : "";
    })
    .filter(Boolean)
    .sort()
    .join("|");
}

export function splitCartLine(cartItems, lineId, newLineId) {
  const sourceIndex = cartItems.findIndex((item) => getCartLineKey(item) === String(lineId));
  if (sourceIndex < 0) return cartItems;

  const source = cartItems[sourceIndex];
  const sourceQuantity = Math.max(1, Number(source.quantity) || 1);
  const nextItems = sourceQuantity > 1
    ? cartItems.map((item, index) => index === sourceIndex ? { ...item, quantity: sourceQuantity - 1 } : item)
    : [...cartItems];

  return [...nextItems, {
    ...source,
    cartItemId: newLineId,
    quantity: 1,
    selected_addons: [],
  }];
}

export function splitCartLineIntoUnits(cartItems, lineId, newLineIds) {
  const sourceIndex = cartItems.findIndex((item) => getCartLineKey(item) === String(lineId));
  if (sourceIndex < 0) return cartItems;

  const source = cartItems[sourceIndex];
  const sourceQuantity = Math.max(1, Math.floor(Number(source.quantity) || 1));
  if (sourceQuantity <= 1) return cartItems;
  if (!Array.isArray(newLineIds) || newLineIds.length < sourceQuantity - 1) return cartItems;

  return cartItems.flatMap((item, index) => {
    if (index !== sourceIndex) return [item];

    return Array.from({ length: sourceQuantity }, (_, unitIndex) => ({
      ...source,
      cartItemId: unitIndex === 0 ? source.cartItemId : newLineIds[unitIndex - 1],
      quantity: 1,
      selected_addons: Array.isArray(source.selected_addons) ? [...source.selected_addons] : [],
    }));
  });
}
