// COMPONENTS
import CartItemCard from "./CartItemCard";

// MUI COMPONENTS
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";

// ICONS
import CloseIcon from "@mui/icons-material/Close";

// HOOKS
import { useState } from "react";

// CONTEXTS
import { useCart } from "../../context/CartContext";
import { useOrders } from "../../context/OrdersContext";

function CartDrawer({ open, close }) {
  const { cartItems, tableNumber, clearCart } = useCart();
  const { addOrder } = useOrders();
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  const totalPrice = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  const handleConfirmOrder = async () => {
    if (cartItems.length === 0 || sending) return;
    setSending(true);

    const newOrder = {
      items: cartItems,
      total_price: totalPrice,
      table_number: tableNumber || "غير محدد",
      notes: notes,
    };

    const result = await addOrder(newOrder);
    if (result?.error) { setSending(false); return; }
    clearCart();
    setNotes("");
    close();
    setSending(false);
  };

  const bottomBarHeight = "130px";

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={close}
      onOpen={() => {}}
      disableSwipeToOpen={true}
      slotProps={{
        paper: {
          sx: {
            borderTopLeftRadius: "24px",
            borderTopRightRadius: "24px",
            maxHeight: "90dvh",
            backgroundColor: "background.paper",
            overflow: "hidden",
          },
        },
      }}
    >
      <Box
        sx={{
          maxHeight: `calc(90dvh - ${bottomBarHeight})`,
          overflowY: "auto",
          p: 2,
        }}
      >
        <Box
          sx={{
            pb: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: "40px",
              height: "4px",
              backgroundColor: "grey.300",
              borderRadius: "2px",
              mx: "auto",
              mb: 1.5,
            }}
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              ملخص الطلب ({cartItems.length})
            </Typography>
            <IconButton size="small" onClick={close}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {cartItems.map((item) => (
          <CartItemCard key={item.id} cartItemDetails={item} />
        ))}

        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="أي ملاحظات خاصة؟ (مثال: بدون سكر، زيادة ثلج...)"
          variant="outlined"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{
            mt: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              fontSize: "0.9rem",
            },
          }}
        />
      </Box>

      <Box
        sx={{
          height: bottomBarHeight,
          p: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper",
          boxShadow: "0px -4px 12px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "start",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
          <Typography
            variant="body1"
            sx={{ color: "text.secondary", fontWeight: 600 }}
          >
            الإجمالي النهائي:
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, color: "primary.main" }}
          >
            {totalPrice} ر.س
          </Typography>
        </Box>

        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={cartItems.length === 0 || sending}
          onClick={handleConfirmOrder}
          sx={{
            py: 1.4,
            borderRadius: "12px",
            fontWeight: 800,
            fontSize: "1rem",
          }}
        >
          {sending ? "جاري الإرسال..." : "تأكيد وإرسال الطلب"}
        </Button>
      </Box>
    </SwipeableDrawer>
  );
}

export default CartDrawer;
