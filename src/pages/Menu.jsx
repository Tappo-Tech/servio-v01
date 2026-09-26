// COMPONENTS
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

// MUI COMPONENTS
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";

// CONTEXTS
import { useCart } from "../context/CartContext";
import { useTables } from "../context/TablesContext";

// HOOKS
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

function Menu() {
  const [isCartOpen, setCartOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [callingWaiterConfirmation, setCallingWaiterConfirmation] = useState(false);

  // دالة فتح السلة
  function handleCartOpen() {
    setCartOpen(true);
  }

  // دالة اغلاق السلة
  function handleCartClose() {
    setCartOpen(false);
  }

  const { tables } = useTables();
  const { setTable } = useCart();
  const { tableNumber } = useParams();

  const isValidTable = tables.some(
    (t) => String(t.table_number) === String(tableNumber)
  );

  useEffect(() => {
    if (isValidTable && tableNumber) {
      setTable(tableNumber);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableNumber, isValidTable]);

  // دالة فتح قسم الاراء
  const handleReviewOpen = () => {
    setReviewOpen(true);
  };

  // دالة اغلاق قسم الاراء
  const handleReviewClose = () => {
    setReviewOpen(false);
  }

  // دالة فتح نافذة تاكيد استدعاء الويتر
  const handleCallingWaiterConfirmationOpen = () => {
    setCallingWaiterConfirmation(true);
  }

  // دالة اغلاق نافذة استدعاء الويتر
  const handleCallingWaiterConfirmationClose = () => {
    setCallingWaiterConfirmation(false);
  }

  if (!isValidTable) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <NotFound
          title="طاولة غير صالحة"
          message="عذراً، لم نتمكن من التعرف على رقم الطاولة. يرجى مسح رمز الـ QR الموجود على طاولتك مرة أخرى."
        />
      </Container>
    );
  }

  return (
    <Box
      sx={{ minHeight: "100vh", backgroundColor: "background.default", pb: 2 }}
    >
      {/* HEADER & FILTER TABS */}
      <Box
        sx={{
          backgroundColor: "background.paper",
          px: 2,
          pt: 2,
          pb: 1,
          borderBottomLeftRadius: "20px",
          borderBottomRightRadius: "20px",
          boxShadow: "0px 4px 20px rgba(0,0,0,0.03)",
          mb: 2,
        }}
      >
        <Container maxWidth="md" disableGutters>
          <MenuHeader table={tableNumber} />
          <MenuFilterTabs />
        </Container>
      </Box>

      {/* ITEMS SPACE */}
      <Container maxWidth="md">
        <MenuItemsList />
      </Container>

      {/* FLOATING ACTIONS (SPEED DIAL) */}
      <FloatingActions
        handleReview={handleReviewOpen}
        handleCallWaiter={handleCallingWaiterConfirmationOpen}
      />

      {/* SUGGESTION BANNER */}
      <SuggestionBanner />

      {/* SHOWING CART BUTTON */}
      <FloatingCartBar handleCartOpen={handleCartOpen} />

      {/* CART DRAWER */}
      <CartDrawer open={isCartOpen} close={handleCartClose} />

      {/* REVIEW SECTION */}
      <ReviewSection open={reviewOpen} close={handleReviewClose} tableNumber={tableNumber}/>

      {/* CALLING WAITER CONFIRMATION */}
      <CallWaiterConfirm open={callingWaiterConfirmation} close={handleCallingWaiterConfirmationClose} tableNumber={tableNumber} />
    </Box>
  );
}

export default Menu;