export const MAX_ADDON_OPTIONS = 50;
export const MAX_ADDONS_PER_ITEM = 20;

export function normalizeAddonOptions(options) {
  if (!Array.isArray(options)) return [];
  const seen = new Set();
  const normalized = [];
  for (const value of options) {
    if (typeof value !== "string") continue;
    const label = value.trim().replace(/\s+/g, " ");
    const key = label.toLocaleLowerCase();
    if (!label || seen.has(key)) continue;
    seen.add(key);
    normalized.push(label);
    if (normalized.length >= MAX_ADDON_OPTIONS) break;
  }
  return normalized;
}

export function normalizeAddonItemIds(ids) {
  if (!Array.isArray(ids)) return [];
  return Array.from(new Set(ids.map((id) => String(id || "").trim()).filter(Boolean))).slice(0, MAX_ADDON_OPTIONS);
}

export function normalizeAddonLimit(limit, choicesOrCount) {
  const choiceCount = Array.isArray(choicesOrCount)
    ? choicesOrCount.length
    : Math.max(0, Math.floor(Number(choicesOrCount) || 0));
  const parsed = Number(limit);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(MAX_ADDONS_PER_ITEM, choiceCount, Math.max(0, Math.floor(parsed)));
}

export function buildAddonChoices(item, menuItems = []) {
  const customChoices = normalizeAddonOptions(item?.addon_options).map((name) => ({
    key: `text:${name.toLocaleLowerCase()}`,
    id: null,
    name,
  }));
  const menuById = new Map((menuItems || [])
    .filter((menuItem) => menuItem?.id && menuItem.id !== item?.id && menuItem.available !== false)
    .map((menuItem) => [String(menuItem.id), menuItem]));
  const menuChoices = normalizeAddonItemIds(item?.free_addon_item_ids)
    .map((id) => menuById.get(id))
    .filter(Boolean)
    .map((menuItem) => ({
      key: `item:${menuItem.id}`,
      id: String(menuItem.id),
      name: String(menuItem.name || "").trim(),
    }))
    .filter((choice) => choice.name);
  return [...customChoices, ...menuChoices];
}

function getChoiceKey(choice) {
  if (typeof choice === "string") return `text:${choice.trim().replace(/\s+/g, " ").toLocaleLowerCase()}`;
  const id = String(choice?.id || choice?.menu_item_id || "").trim();
  if (id) return `item:${id}`;
  const name = String(choice?.name || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
  return name ? `text:${name}` : "";
}

export function normalizeSelectedAddons(selected, choices, maxAllowed) {
  if (!Array.isArray(selected)) return [];
  const available = Array.isArray(choices) ? choices : [];
  const availableByKey = new Map(available.map((choice) => [choice.key || getChoiceKey(choice), choice]));
  const availableByName = new Map(available.filter((choice) => !choice.id).map((choice) => [choice.name.toLocaleLowerCase(), choice]));
  const max = normalizeAddonLimit(maxAllowed, available.length);
  if (max === 0) return [];
  const seen = new Set();
  const result = [];

  for (const value of selected) {
    const key = getChoiceKey(value);
    const choice = availableByKey.get(key) || (typeof value === "string" ? availableByName.get(value.trim().toLocaleLowerCase()) : null);
    if (!choice || seen.has(choice.key)) continue;
    seen.add(choice.key);
    result.push({ id: choice.id || null, name: choice.name });
    if (result.length >= max) break;
  }
  return result;
}

export function toggleSelectedAddon(selected, choice, choices, maxAllowed) {
  const available = Array.isArray(choices) ? choices : [];
  const canonical = available.find((option) => (option.key || getChoiceKey(option)) === getChoiceKey(choice));
  if (!canonical) return normalizeSelectedAddons(selected, available, maxAllowed);

  const current = normalizeSelectedAddons(selected, available, maxAllowed);
  const key = canonical.key || getChoiceKey(canonical);
  const existingIndex = current.findIndex((option) => getChoiceKey(option) === key);
  if (existingIndex >= 0) return current.filter((_, index) => index !== existingIndex);
  if (current.length >= normalizeAddonLimit(maxAllowed, available.length)) return current;
  return [...current, { id: canonical.id || null, name: canonical.name }];
}

export function normalizeOrderAddons(selected, addonOptions, freeAddonItemIds, maxAllowed) {
  if (!Array.isArray(selected)) return [];
  const customOptions = normalizeAddonOptions(addonOptions);
  const freeIds = new Set(normalizeAddonItemIds(freeAddonItemIds));
  const totalChoices = customOptions.length + freeIds.size;
  const max = normalizeAddonLimit(maxAllowed, totalChoices);
  if (max === 0) return [];
  const customByName = new Map(customOptions.map((name) => [name.toLocaleLowerCase(), name]));
  const result = [];
  const seen = new Set();

  for (const value of selected) {
    const id = typeof value === "object" && value
      ? String(value.id || value.menu_item_id || "").trim()
      : "";
    const rawName = typeof value === "string" ? value : String(value?.name || "");
    const name = rawName.trim().replace(/\s+/g, " ").slice(0, 100);
    let normalized = null;
    let key = "";

    if (id && freeIds.has(id) && name) {
      key = `item:${id}`;
      normalized = { id, name };
    } else if (!id && name) {
      const canonical = customByName.get(name.toLocaleLowerCase());
      if (canonical) {
        key = `text:${canonical.toLocaleLowerCase()}`;
        normalized = { id: null, name: canonical };
      }
    }

    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
    if (result.length >= max) break;
  }
  return result;
}

export function getCompatibleSuggestions(cartItems, menuItems, dismissedIds = [], limit = 2) {
  if (!Array.isArray(cartItems) || cartItems.length === 0 || !Array.isArray(menuItems) || menuItems.length === 0) return [];

  const availableItems = menuItems.filter((item) => item?.id && item.available !== false);
  const menuById = new Map(availableItems.map((item) => [String(item.id), item]));
  const inCart = new Set(cartItems.map((item) => String(item?.id || "")));
  const dismissed = new Set((dismissedIds || []).map(String));
  const seen = new Set();
  const suggestions = [];
  const maxResults = Math.max(0, Math.floor(Number(limit) || 0));
  if (maxResults === 0) return [];

  for (const cartItem of cartItems) {
    const currentMenuItem = menuById.get(String(cartItem?.id || ""));
    // Use the latest catalog relation when available; fall back to the cart snapshot for legacy cached carts.
    const relations = currentMenuItem?.recommendation_item_ids ?? cartItem?.recommendation_item_ids;
    if (!Array.isArray(relations)) continue;

    for (const relatedId of relations) {
      const key = String(relatedId || "");
      if (!key || inCart.has(key) || dismissed.has(key) || seen.has(key)) continue;
      const suggestion = menuById.get(key);
      if (!suggestion) continue;
      seen.add(key);
      suggestions.push(suggestion);
      if (suggestions.length >= maxResults) return suggestions;
    }
  }

  return suggestions;
}
