export const withIngredientAvailability = (items = [], ingredients = [], ingredientLinks = []) => {
  const ingredientById = new Map((ingredients || []).map((ingredient) => [String(ingredient.id), ingredient]));
  const ingredientIdsByItem = new Map();

  (ingredientLinks || []).forEach((link) => {
    const itemId = String(link.menu_item_id || "");
    const ingredientId = String(link.ingredient_id || "");
    if (!itemId || !ingredientId) return;
    const ids = ingredientIdsByItem.get(itemId) || [];
    if (!ids.includes(ingredientId)) ids.push(ingredientId);
    ingredientIdsByItem.set(itemId, ids);
  });

  return (items || []).map((item) => {
    const ingredientIds = ingredientIdsByItem.get(String(item.id)) || [];
    const linkedIngredients = ingredientIds.map((id) => ingredientById.get(id)).filter(Boolean);
    const unavailableIngredients = linkedIngredients.filter((ingredient) => ingredient.available !== true);
    const hasUnknownIngredient = ingredientIds.some((id) => !ingredientById.has(id));

    return {
      ...item,
      ingredient_ids: ingredientIds,
      ingredients: linkedIngredients,
      unavailableIngredients,
      hasUnknownIngredient,
      isAvailableForSale: item.available === true && unavailableIngredients.length === 0 && !hasUnknownIngredient,
    };
  });
};
