import { createContext, useCallback, useContext, useState, useEffect } from "react";
import { v4 as uuidV4 } from "uuid";
import { toggleSelectedAddon } from "../utils/menuItemOptions";
import { getAddonSelectionSignature, getCartLineKey, splitCartLine, splitCartLineIntoUnits } from "../utils/cartItemUtils";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem("app_cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("فشل في تحميل عناصر السلة من localStorage", error);
      return [];
    }
  });

  const [tableNumber, setTableNumber] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem("app_cart", JSON.stringify(cartItems));
    } catch (error) {
      console.error("فشل في حفظ السلة في localStorage", error);
    }
  }, [cartItems]);

  const setTable = useCallback((number) => {
    setTableNumber(number);
  }, []);

  const addToCart = (item, quantityToAdd = 1) => {
    setCartItems((previousItems) => {
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
    setCartItems((previousItems) => splitCartLine(previousItems, lineId, uuidV4()));
  };

  const separateCartLineIntoUnits = (lineId) => {
    const source = cartItems.find((item) => getCartLineKey(item) === String(lineId));
    const quantity = Math.max(1, Math.floor(Number(source?.quantity) || 1));
    if (quantity <= 1) return;

    const newLineIds = Array.from({ length: quantity - 1 }, () => uuidV4());
    setCartItems((previousItems) => splitCartLineIntoUnits(previousItems, lineId, newLineIds));
  };

  const removeFromCart = (lineId) => {
    setCartItems((previousItems) => previousItems.filter((item) => getCartLineKey(item) !== String(lineId)));
  };

  const updatedQuantity = (lineId, currentQuantity) => {
    if (currentQuantity <= 0) {
      removeFromCart(lineId);
      return;
    }

    setCartItems((previousItems) => previousItems.map((item) => (
      getCartLineKey(item) === String(lineId) ? { ...item, quantity: currentQuantity } : item
    )));
  };

  const toggleCartItemAddon = (lineId, choice, choices) => {
    setCartItems((previousItems) => previousItems.map((item) => {
      if (getCartLineKey(item) !== String(lineId)) return item;
      return {
        ...item,
        selected_addons: toggleSelectedAddon(item.selected_addons, choice, choices, item.max_addons),
      };
    }));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("app_cart");
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
