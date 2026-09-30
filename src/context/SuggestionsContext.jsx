import { createContext, useContext, useMemo, useState } from "react";
import { useCart } from "./CartContext";
import { useMenu } from "./MenuContext";

const SuggestionsContext = createContext();

export const SuggestionsProvider = ({ children }) => {
  const { cartItems } = useCart();
  const { customerMenu } = useMenu();
  const [dismissedIds, setDismissedIds] = useState([]);

  const suggestedItems = useMemo(() => {
    if (!cartItems?.length || !customerMenu?.length) return [];

    const cartIds = new Set(cartItems.map((item) => item.id));
    const candidates = customerMenu.filter(
      (item) => !cartIds.has(item.id) && !dismissedIds.includes(item.id)
    );
    if (!candidates.length) return [];

    const scores = new Map(candidates.map((item) => [item.id, 0]));
    const cartTagSet = new Set(
      cartItems.flatMap((item) => Array.isArray(item.tags) ? item.tags : [])
    );
    const cartCategorySet = new Set(cartItems.map((item) => item.category_id).filter(Boolean));

    // 1) العلاقات التي حددها مدير الكافيه هي أقوى إشارة.
    cartItems.forEach((cartItem) => {
      const explicitIds = Array.isArray(cartItem.recommendation_item_ids)
        ? cartItem.recommendation_item_ids
        : [];
      explicitIds.forEach((id) => {
        if (scores.has(id)) scores.set(id, scores.get(id) + 100);
      });
    });

    // 2) توافقات إضافية خفيفة من الوسوم والتصنيف، بدون أن تتغلب على العلاقة الصريحة.
    candidates.forEach((item) => {
      const tags = Array.isArray(item.tags) ? item.tags : [];
      const sharedTags = tags.filter((tag) => cartTagSet.has(tag)).length;
      const categoryMatch = cartCategorySet.has(item.category_id) ? 2 : 0;
      const pairingTags = tags.some((tag) =>
        ["يناسب المشروبات الساخنة", "يناسب المشروبات الباردة", "حلويات خفيفة", "وجبات سريعة"].includes(tag)
      ) ? 1 : 0;
      scores.set(item.id, scores.get(item.id) + sharedTags * 8 + categoryMatch + pairingTags);
    });

    return candidates
      .map((item) => ({ item, score: scores.get(item.id) || 0 }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(({ item }) => item);
  }, [cartItems, customerMenu, dismissedIds]);

  const dismissSuggestion = (id) => {
    setDismissedIds((prev) => prev.includes(id) ? prev : [...prev, id]);
  };

  return (
    <SuggestionsContext.Provider value={{ suggestedItems, dismissSuggestion }}>
      {children}
    </SuggestionsContext.Provider>
  );
};

export const useSuggestions = () => useContext(SuggestionsContext);