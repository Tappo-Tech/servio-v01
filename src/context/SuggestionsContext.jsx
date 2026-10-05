import { createContext, useContext, useMemo, useState } from "react";
import { useCart } from "./CartContext";
import { useMenu } from "./MenuContext";
import { getCompatibleSuggestions } from "../utils/menuItemOptions";

const SuggestionsContext = createContext();

export const SuggestionsProvider = ({ children }) => {
  const { cartItems } = useCart();
  // نستخدم كامل كتالوج النشاط لا القائمة المفلترة حسب تصنيف الشاشة الحالية.
  const { items } = useMenu();
  const [dismissedIds, setDismissedIds] = useState([]);

  const suggestedItems = useMemo(
    () => getCompatibleSuggestions(cartItems, items, dismissedIds, 2),
    [cartItems, items, dismissedIds],
  );

  const dismissSuggestion = (id) => {
    setDismissedIds((previous) => previous.includes(id) ? previous : [...previous, id]);
  };

  return (
    <SuggestionsContext.Provider value={{ suggestedItems, dismissSuggestion }}>
      {children}
    </SuggestionsContext.Provider>
  );
};

export const useSuggestions = () => useContext(SuggestionsContext);
