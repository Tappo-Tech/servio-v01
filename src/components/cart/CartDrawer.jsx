// COMPONENTS
import CartItemCard from "./CartItemCard";

// MUI COMPONENTS
import Alert from "@mui/material/Alert";
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
import { useNavigate } from "react-router-dom";

// CONTEXTS
import { useCart } from "../../context/CartContext";
import { useOrders } from "../../context/OrdersContext";
import { useTenant } from "../../context/TenantContext";
import { calculateInclusiveVat, toMinorUnits } from "../../utils/taxUtils";
import { getCartLineKey } from "../../utils/cartItemUtils";

function CartDrawer({ open, close }) {
  const { cartItems, tableNumber, clearCart } = useCart();
  const { addOrder } = useOrders();
  const { slug } = useTenant();
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const totalMinorUnits = cartItems.reduce(
    (acc, item) => acc + toMinorUnits(item.price) * Number(item.quantity || 0),
    0,
  );
  const totalPrice = totalMinorUnits / 100;
  const vatBreakdown = calculateInclusiveVat(totalPrice);
  const itemCount = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const handleConfirmOrder = async () => {
    if (cartItems.length === 0 || sending) return;
    setSending(true);
    setSendError("");

    const newOrder = {
      items: cartItems,
      total_price: totalPrice,
      table_number: tableNumber || "غير محدد",
      notes: notes,
    };

    try {
      const result = await addOrder(newOrder);
      if (result?.error || !result?.data) throw result?.error || new Error("لم يصل تأكيد حفظ الطلب");
      const { order_id: orderId, tracking_token: trackingToken } = result.data;
      if (!orderId || !trackingToken) throw new Error("لم يصل رمز تتبع الطلب");
      try {
        window.sessionStorage.setItem(`servio.orderTracking.${slug}.${orderId}`, trackingToken);
      } catch {
        // تمرير الرمز داخل حالة التنقل يبقي الصفحة الحالية قابلة للفتح إذا منع المتصفح التخزين.
      }
      clearCart();
      setNotes("");
      close();
      // تمرير رقم الطاولة يتيح زر الرجوع إعادة فتح المنيو من نفس الطاولة فورًا.
      navigate(`/track/${encodeURIComponent(slug)}/${orderId}`, { state: { trackingToken, tableNumber: tableNumber || null } });
    } catch (error) {
      console.error("تعذر إرسال طلب الطاولة:", { code: error?.code, status: error?.status, message: error?.message });
      setSendError("تعذر إرسال الطلب الآن. تحقق من الاتصال ثم حاول مرة أخرى؛ ستبقى أصنافك في السلة.");
    } finally {
      setSending(false);
    }
  };

  const bottomBarHeight = "220px";

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
              ملخص الطلب ({itemCount})
            </Typography>
            <IconButton size="small" onClick={close}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {cartItems.map((item) => (
          <CartItemCard key={getCartLineKey(item)} cartItemDetails={item} />
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
          minHeight: bottomBarHeight,
          height: "auto",
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
        <Box sx={{ mb: 1.2 }}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: .6 }}>
            الأسعار شاملة ضريبة القيمة المضافة 15%، والتفصيل أدناه من دون زيادة الإجمالي.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: .4 }}>
            <Typography variant="caption" color="text.secondary">المبلغ قبل الضريبة</Typography>
            <Typography variant="caption">{vatBreakdown.net.toFixed(2)} ر.س</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="caption" color="text.secondary">VAT 15% (مضمنة)</Typography>
            <Typography variant="caption">{vatBreakdown.vat.toFixed(2)} ر.س</Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
          <Typography
            variant="body1"
            sx={{ color: "text.secondary", fontWeight: 600 }}
          >
            الإجمالي المستحق شامل الضريبة:
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, color: "primary.main" }}
          >
            {totalPrice.toFixed(2)} ر.س
          </Typography>
        </Box>

        {sendError && <Alert severity="error" sx={{ mb: 1 }}>{sendError}</Alert>}

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
