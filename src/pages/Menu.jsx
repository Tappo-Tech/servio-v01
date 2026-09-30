import MenuHeader from "../components/menu/MenuHeader";
import MenuFilterTabs from "../components/menu/MenuFilterTabs";
import MenuItemsList from "../components/menu/MenuItemsList";
import FloatingCartBar from "../components/cart/FloatingCartBar";
import CartDrawer from "../components/cart/CartDrawer";
import NotFound from "../components/NotFound";
import FloatingActions from "../components/menu/FloatingActions";
import ReviewSection from "../components/menu/ReviewSection";
import CallWaiterConfirm from "../components/menu/CallWaiterConfirm";
import SuggestionBanner from "../components/menu/SuggestionBanner";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import { useCart } from "../context/CartContext";
import { useTables } from "../context/TablesContext";
import { useTenant } from "../context/TenantContext";
import { useState, useEffect } from "react";

function Menu() {
  const [isCartOpen, setCartOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [callingWaiterConfirmation, setCallingWaiterConfirmation] = useState(false);
  const { tables } = useTables();
  const { setTable } = useCart();
  const { tableNumber, tenant } = useTenant();
  const isValidTable = tableNumber ? tables.some((table) => String(table.table_number) === String(tableNumber)) : true;
  useEffect(() => { if (isValidTable && tableNumber) setTable(tableNumber); }, [tableNumber, isValidTable, setTable]);
  if (!tenant) return <Container maxWidth="sm" sx={{ py: 6 }}><NotFound title="الكافيه غير موجود" message="الرابط لا يشير إلى كافيه مسجل في TAPPO." /></Container>;
  if (!isValidTable) return <Container maxWidth="sm" sx={{ py: 6 }}><NotFound title="طاولة غير صالحة" message="عذراً، لم نتمكن من التعرف على رقم الطاولة." /></Container>;
  return <Box sx={{ minHeight: "100vh", backgroundColor: "background.default", pb: 2 }}>
    <Box sx={{ backgroundColor: "background.paper", px: 2, pt: 2, pb: 1, borderBottomLeftRadius: "20px", borderBottomRightRadius: "20px", boxShadow: "0px 4px 20px rgba(0,0,0,0.03)", mb: 2 }}><Container maxWidth="md" disableGutters><MenuHeader table={tableNumber} /><MenuFilterTabs /></Container></Box>
    <Container maxWidth="md"><MenuItemsList /></Container>
    <FloatingActions handleReview={() => setReviewOpen(true)} handleCallWaiter={() => setCallingWaiterConfirmation(true)} />
    <SuggestionBanner /><FloatingCartBar handleCartOpen={() => setCartOpen(true)} />
    <CartDrawer open={isCartOpen} close={() => setCartOpen(false)} />
    <ReviewSection open={reviewOpen} close={() => setReviewOpen(false)} tableNumber={tableNumber} />
    <CallWaiterConfirm open={callingWaiterConfirmation} close={() => setCallingWaiterConfirmation(false)} tableNumber={tableNumber} />
  </Box>;
}
export default Menu;
