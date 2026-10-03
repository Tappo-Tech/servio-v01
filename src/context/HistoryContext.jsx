import { createContext, useContext } from "react";
import { useOrders } from "./OrdersContext";

const HistoryContext = createContext();

export const HistoryProvider = ({ children }) => {
  // سجل المبيعات لا يملك نسخة ثانية من الطلبات؛ مصدر الحقيقة الوحيد هو OrdersContext.
  const {
    finishedOrders,
    cancelledOrders,
    ordersLoading,
    ordersLoadError,
    reloadOrders,
  } = useOrders();

  return (
    <HistoryContext.Provider value={{
      finishedOrders,
      cancelledOrders,
      ordersLoading,
      ordersLoadError,
      reloadOrders,
    }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
};
