import { createContext, useCallback, useContext, useState, useEffect } from "react";
import { toggleSelectedAddon } from "../utils/menuItemOptions";

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
    setCartItems((prevCartItems) => {
      const existingItemIndex = prevCartItems.findIndex((cartItem) => cartItem.id === item.id);

      if (existingItemIndex !== -1) {
        const updatedCart = [...prevCartItems];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantityToAdd,
        };
        return updatedCart;
      }

      return [...prevCartItems, { ...item, quantity: quantityToAdd, selected_addons: [] }];
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems((prevCartItems) => prevCartItems.filter((cartItem) => cartItem.id !== itemId));
  };

  const updatedQuantity = (itemId, currentQuantity) => {
    if (currentQuantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== itemId));
      return;
    }

    setCartItems((prev) => prev.map((item) => item.id === itemId ? { ...item, quantity: currentQuantity } : item));
  };

  const toggleCartItemAddon = (itemId, choice, choices) => {
    setCartItems((previous) => previous.map((item) => {
      if (item.id !== itemId) return item;
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
      value={{ tableNumber, setTable, cartItems, addToCart, removeFromCart, updatedQuantity, toggleCartItemAddon, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
