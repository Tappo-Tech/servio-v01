// MUI COMPONENTS
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

// CONTEXTS
import { useCart } from "../../context/CartContext";

function FloatingCartBar({ handleCartOpen }) {
  const { cartItems } = useCart();

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  if (cartItems.length === 0) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: { xs: 14, sm: 20 },
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 24px)",
        maxWidth: "560px",
        background: "rgba(23,26,47,.93)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        color: "white",
        borderRadius: "20px",
        padding: { xs: "12px 15px", sm: "14px 20px" },
        border: "1px solid rgba(255,255,255,.12)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 18px 48px rgba(23,26,47,.22)",
        zIndex: 1000,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Typography
          variant="body2"
          sx={{
            color: "grey.400",
            mb: 0.5,
          }}
        >
          {cartItems.length} عناصر مختارة
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          {totalPrice} ر.س
        </Typography>
      </Box>

      <Button
        onClick={handleCartOpen}
        variant="contained"
        sx={{
          backgroundColor: "white",
          color: "black",
          borderRadius: "12px",
          px: 3,
          fontWeight: 700,
          "&:hover": {
            backgroundColor: "grey.200",
          },
        }}
      >
        عرض الطلب
      </Button>
    </Box>
  );
}

export default FloatingCartBar;
