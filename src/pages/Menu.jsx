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
import CircularProgress from "@mui/material/CircularProgress";
import { useCart } from "../context/CartContext";
import { useTables } from "../context/TablesContext";
import { useTenant } from "../context/TenantContext";
import { useState, useEffect } from "react";

function Menu() {
  const [isCartOpen, setCartOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [callingWaiterConfirmation, setCallingWaiterConfirmation] = useState(false);
  const { tables, loaded: tablesLoaded } = useTables();
  const { setTable } = useCart();
  const { tableNumber, tenant, loading: tenantLoading } = useTenant();
  const isValidTable = tableNumber ? tables.some((table) => String(table.table_number) === String(tableNumber)) : true;
  useEffect(() => { if (isValidTable && tableNumber) setTable(tableNumber); }, [tableNumber, isValidTable, setTable]);
  if (tenantLoading || (tenant && tableNumber && !tablesLoaded)) return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  if (!tenant) return <Container maxWidth="sm" sx={{ py: 6 }}><NotFound title="الكافيه غير موجود" message="الرابط لا يشير إلى كافيه مسجل في SERVIO." /></Container>;
  if (!isValidTable) return <Container maxWidth="sm" sx={{ py: 6 }}><NotFound title="طاولة غير صالحة" message="عذراً، لم نتمكن من التعرف على رقم الطاولة." /></Container>;
  return (
    <Box sx={{ minHeight: "100vh", background: "radial-gradient(circle at 100% 0%, rgba(244,121,32,.08), transparent 28%), linear-gradient(180deg, #fafbfc 0%, #f6f7f9 100%)", pb: 3 }}>
      <Box sx={{ px: { xs: 1.2, sm: 2 }, pt: { xs: 1, sm: 1.5 } }}>
        <Box sx={{ maxWidth: 760, mx: "auto", background: "rgba(255,255,255,.78)", border: "1px solid rgba(255,255,255,.75)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderRadius: { xs: 3.5, sm: 4 }, boxShadow: "0 16px 45px rgba(23,26,47,.07)", px: { xs: 1.2, sm: 2 }, pt: 1.3, pb: 0.3 }}>
          <MenuHeader table={tableNumber} />
          <MenuFilterTabs />
        </Box>
      </Box>
      <Container maxWidth="md" sx={{ pt: 1.5 }}>
        <MenuItemsList />
      </Container>
    <FloatingActions handleReview={() => setReviewOpen(true)} handleCallWaiter={() => setCallingWaiterConfirmation(true)} />
    <SuggestionBanner /><FloatingCartBar handleCartOpen={() => setCartOpen(true)} />
    <CartDrawer open={isCartOpen} close={() => setCartOpen(false)} />
    <ReviewSection open={reviewOpen} close={() => setReviewOpen(false)} tableNumber={tableNumber} />
    <CallWaiterConfirm open={callingWaiterConfirmation} close={() => setCallingWaiterConfirmation(false)} tableNumber={tableNumber} />
    </Box>
  );
}
export default Menu;
