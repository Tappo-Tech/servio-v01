// إدارة سلة مستقلة لكل مطعم وفرع، مع إبقاء عناصر السلة خارج طلب الشبكة.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { v4 as uuidV4 } from "uuid";
import { toggleSelectedAddon } from "../utils/menuItemOptions";
import { getAddonSelectionSignature, getCartLineKey, splitCartLine, splitCartLineIntoUnits } from "../utils/cartItemUtils";
import { getCartStorageKey } from "../utils/cartStorage";
import { useTenant } from "./TenantContext";
import { useBranch } from "./BranchContext";

const CartContext = createContext();

function readCart(storageKey) {
  try {
    const savedCart = window.localStorage.getItem(storageKey);
    const parsed = savedCart ? JSON.parse(savedCart) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("فشل في تحميل عناصر السلة من localStorage", error);
    return [];
  }
}

export const CartProvider = ({ children }) => {
  const { slug } = useTenant();
  const { branchSlug, publicBranchSlug } = useBranch();
  const storageKey = useMemo(() => getCartStorageKey(slug, branchSlug, publicBranchSlug), [slug, branchSlug, publicBranchSlug]);

  const [cartState, setCartState] = useState({ storageKey: null, items: [] });
  const cartItems = cartState.storageKey === storageKey ? cartState.items : [];
  const [tableState, setTableState] = useState({ storageKey: null, value: null });
  const tableNumber = tableState.storageKey === storageKey ? tableState.value : null;

  useEffect(() => {
    setCartState({ storageKey, items: readCart(storageKey) });
  }, [storageKey]);

  useEffect(() => {
    if (cartState.storageKey !== storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(cartState.items));
    } catch (error) {
      console.error("فشل في حفظ السلة في localStorage", error);
    }
  }, [cartState, storageKey]);

  const updateCartItems = useCallback((updater) => {
    setCartState((previous) => {
      const previousItems = previous.storageKey === storageKey ? previous.items : [];
      const nextItems = typeof updater === "function" ? updater(previousItems) : updater;
      return { storageKey, items: nextItems };
    });
  }, [storageKey]);

  const setTable = useCallback((number) => {
    setTableState({ storageKey, value: number });
  }, [storageKey]);

  const addToCart = (item, quantityToAdd = 1) => {
    updateCartItems((previousItems) => {
      const signature = getAddonSelectionSignature(item.selected_addons);
      const existingIndex = previousItems.findIndex((cartItem) => (
        cartItem.id === item.id && getAddonSelectionSignature(cartItem.selected_addons) === signature
      ));

      if (existingIndex !== -1) {
        const updated = [...previousItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Number(updated[existingIndex].quantity || 0) + quantityToAdd,
        };
        return updated;
      }

      return [...previousItems, {
        ...item,
        cartItemId: item.cartItemId || uuidV4(),
        quantity: quantityToAdd,
        selected_addons: Array.isArray(item.selected_addons) ? item.selected_addons : [],
      }];
    });
  };

  // Split one unit out of a multi-quantity row; with one unit, add another independently configurable unit.
  const addSeparateCartItem = (lineId) => {
    updateCartItems((previousItems) => splitCartLine(previousItems, lineId, uuidV4()));
  };

  const separateCartLineIntoUnits = (lineId) => {
    const source = cartItems.find((item) => getCartLineKey(item) === String(lineId));
    const quantity = Math.max(1, Math.floor(Number(source?.quantity) || 1));
    if (quantity <= 1) return;

    const newLineIds = Array.from({ length: quantity - 1 }, () => uuidV4());
    updateCartItems((previousItems) => splitCartLineIntoUnits(previousItems, lineId, newLineIds));
  };

  const removeFromCart = (lineId) => {
    updateCartItems((previousItems) => previousItems.filter((item) => getCartLineKey(item) !== String(lineId)));
  };

  const updatedQuantity = (lineId, currentQuantity) => {
    if (currentQuantity <= 0) {
      removeFromCart(lineId);
      return;
    }

    updateCartItems((previousItems) => previousItems.map((item) => (
      getCartLineKey(item) === String(lineId) ? { ...item, quantity: currentQuantity } : item
    )));
  };

  const toggleCartItemAddon = (lineId, choice, choices) => {
    updateCartItems((previousItems) => previousItems.map((item) => {
      if (getCartLineKey(item) !== String(lineId)) return item;
      return {
        ...item,
        selected_addons: toggleSelectedAddon(item.selected_addons, choice, choices, item.max_addons),
      };
    }));
  };

  const clearCart = () => {
    updateCartItems([]);
    try { window.localStorage.removeItem(storageKey); } catch { /* التخزين المحلي اختياري */ }
  };

  return (
    <CartContext.Provider
      value={{ tableNumber, setTable, cartItems, addToCart, addSeparateCartItem, separateCartLineIntoUnits, removeFromCart, updatedQuantity, toggleCartItemAddon, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
