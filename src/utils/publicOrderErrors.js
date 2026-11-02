export const isUnavailableMenuOrderError = (error) => {
  const message = String(error?.message || error || "");
  return /\b(?:MENU_ITEM_UNAVAILABLE|MENU_ITEM_NOT_IN_BRANCH_OR_UNAVAILABLE)\b/i.test(message);
};

export const getUnavailableCartItemNames = (cartItems = [], availableItems = []) => {
  const availableIds = new Set((Array.isArray(availableItems) ? availableItems : [])
    .map((item) => String(item?.id || item?.menu_item_id || ""))
    .filter(Boolean));
  return [...new Set((Array.isArray(cartItems) ? cartItems : [])
    .filter((item) => !availableIds.has(String(item?.id || item?.menu_item_id || "")))
    .map((item) => String(item?.name || "").trim())
    .filter(Boolean))];
};
