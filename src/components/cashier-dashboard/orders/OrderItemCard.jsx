import { useEffect, useState } from "react";

// MUI COMPONENTS
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

// ANIMATION
import { motion } from "framer-motion";

// ICONS
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";

// HELPERS
import { formatTimeAgo } from "../../../utils/helpers";

// CONTEXTS
import { useOrders } from "../../../context/OrdersContext";
import { useLanguage } from "../../../context/LanguageContext";
import InvoiceModal from "../../manager-dashboard/orders/OrderPill";
import PaymentStatusControl from "./PaymentStatusControl";

function OrderItemCard({ order }) {
  const { updateOrderStatus, updateOrderPaymentStatus, updateOrderPaymentMethod } = useOrders();
  const { t, language } = useLanguage();
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [, setTimeTick] = useState(0);
  const isPaid = order.payment_status === "paid";
  const isAwaitingPayment = order.status === "awaiting_payment" || (order.status === "ready" && !isPaid);
  useEffect(() => {
    const timer = window.setInterval(() => setTimeTick((tick) => tick + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const changeStatus = async (status) => {
    if (sending) return;
    setSending(true);
    const nextStatus = !isPaid && ["ready", "served"].includes(status) ? "awaiting_payment" : status;
    await updateOrderStatus(order.id, nextStatus);
    setSending(false);
  };
  const changePaymentStatus = async (status) => {
    if (paymentSaving) return;
    setPaymentSaving(true);
    setPaymentError("");
    const result = await updateOrderPaymentStatus(order.id, status);
    if (result?.error) setPaymentError(language === "ar" ? "تعذر حفظ حالة الدفع. أعد المحاولة." : "Could not save payment status. Retry.");
    setPaymentSaving(false);
  };
  const changePaymentMethod = async (method) => {
    if (paymentSaving) return;
    setPaymentSaving(true);
    setPaymentError("");
    const result = await updateOrderPaymentMethod(order.id, method);
    if (result?.error) setPaymentError(language === "ar" ? "تعذر حفظ طريقة الدفع. أعد المحاولة." : "Could not save payment method. Retry.");
    setPaymentSaving(false);
  };
  const orderItems = Array.isArray(order?.items) ? order.items : [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      style={{ marginBottom: "12px" }}
    >
      <Card
        elevation={0}
        sx={{
          width: "100%",
          minWidth: 0,
          boxSizing: "border-box",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "16px",
          background: "rgba(255,255,255,.96)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          boxShadow: "0 8px 24px rgba(23,26,47,.055)",
          transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
          overflow: "hidden",
          "&:hover": {
            boxShadow: "0 10px 26px rgba(23,26,47,.09)",
            borderColor: "primary.light",
          },
        }}
      >
        {/* هيدر الكارت */}
        <Box
          sx={{
            p: { xs: 1.25, sm: 1.5 },
            pb: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            minWidth: 0,
            gap: 0.8,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 900, color: "text.primary", fontSize: { xs: "0.98rem", sm: "1.05rem" }, minWidth: 0, overflowWrap: "anywhere" }}
          >
            {t("table")} {order.table_number}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              fontSize: "0.74rem",
              bgcolor: "rgba(244,121,32,.09)",
              color: "warning.dark",
              border: "1px solid",
              borderColor: "warning.100",
              px: 1,
              py: 0.45,
              borderRadius: "999px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {formatTimeAgo(order.created_at, language, t)}
          </Typography>
        </Box>

        <Box sx={{ mx: { xs: 1.25, sm: 1.5 }, mb: 1.15, p: 1.1, borderRadius: "12px", border: "1px solid", borderColor: "divider", bgcolor: "grey.50", display: "flex", flexDirection: "column", gap: 0.55, minWidth: 0 }}>
          <PaymentStatusControl value={order.payment_status} method={order.payment_method} onChange={changePaymentStatus} onMethodChange={changePaymentMethod} disabled={paymentSaving} language={language} />
          {paymentError && <Typography variant="caption" color="error" sx={{ px: 0.25, overflowWrap: "anywhere" }}>{paymentError}</Typography>}
        </Box>

        <Divider sx={{ borderStyle: "dashed" }} />

        {/* عناصر الطلب */}
        <CardContent sx={{ p: { xs: 1.25, sm: 1.5 }, pt: 1.1, pb: 1.25, "&:last-child": { pb: 1.25 } }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, minWidth: 0 }}>
            {orderItems.map((item) => (
              <Box
                key={item.cartItemId || item.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: 0.65,
                  alignItems: "start",
                  minWidth: 0,
                  py: 0.2,
                }}
              >
                <Typography
                  variant="body2"
                    sx={{ fontWeight: 700, color: "text.primary", minWidth: 0, lineHeight: 1.4, overflowWrap: "anywhere" }}
                >
                  <Box
                    component="span"
                    sx={{ color: "primary.main", fontWeight: 900, mr: 0.5, whiteSpace: "nowrap" }}
                  >
                    {item.quantity}x
                  </Box>{" "}
                  {item.name}
                  {Array.isArray(item.selected_addons) && item.selected_addons.length > 0 && (
                    <Box component="span" sx={{ display: "block", color: "text.secondary", fontSize: "0.72rem", fontWeight: 600, lineHeight: 1.45, mt: 0.25, overflowWrap: "anywhere" }}>
                      {language === "ar" ? "إضافات: " : "Add-ons: "}
                      {item.selected_addons.map((addon) => typeof addon === "string" ? addon : addon?.name).filter(Boolean).join(language === "ar" ? "، " : ", ")}
                    </Box>
                  )}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", fontWeight: 800, fontSize: "0.8rem", whiteSpace: "nowrap", pt: 0.15 }}
                >
                  {item.price} {language === "ar" ? "ر.س" : "SAR"}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* الملاحظات */}
          {order.notes && (
            <Box
              sx={{
                mt: 1.1,
                p: 1,
                borderRadius: "10px",
                bgcolor: "warning.50",
                border: "1px solid",
                borderColor: "warning.100",
                display: "flex",
                alignItems: "flex-start",
                gap: 0.8,
                minWidth: 0,
              }}
            >
              <FiberManualRecordIcon
                sx={{ fontSize: 8, color: "warning.main" }}
              />
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: "warning.dark", lineHeight: 1.45, minWidth: 0, overflowWrap: "anywhere" }}
              >
                {t("note")}: {order.notes}
              </Typography>
            </Box>
          )}
        </CardContent>

        {/* أزرار الإجراءات */}
        <CardActions sx={{ p: { xs: 1.25, sm: 1.5 }, pt: 0.25, minWidth: 0, "& .MuiButton-root": { minHeight: 46, borderRadius: "11px", fontWeight: 800, lineHeight: 1.2, px: 1 } }}>
          {order.status === "pending" && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", sm: "minmax(0,1fr) auto auto" }, gap: 0.8, width: "100%", minWidth: 0, "& .MuiButton-root": { minWidth: 0, whiteSpace: "normal" } }}>
              <Button
                color="primary"
                fullWidth
                size="medium"
                variant="contained"
                disableElevation
                onClick={() => changeStatus("preparing")} disabled={sending}
                sx={{ gridColumn: { xs: "1 / -1", sm: "auto" }, minWidth: 0, minHeight: 48, py: 0.9 }}
              >
                {sending ? "جاري الإرسال..." : t("startPreparing")}
              </Button>
              <Button
                size="medium"
                variant="outlined"
                startIcon={<PrintRoundedIcon />}
                onClick={() => setIsInvoiceOpen(true)}
                sx={{ minWidth: 0, whiteSpace: "normal" }}
              >
                {language === "ar" ? "طباعة تذكرة المطبخ" : "Print kitchen ticket"}
              </Button>
              <Button
                color="error"
                size="medium"
                variant="outlined"
                onClick={() => changeStatus("cancelled")} disabled={sending}
                sx={{ minWidth: 0 }}
              >
                {t("cancel")}
              </Button>
            </Box>
          )}

          {order.status === "preparing" && (
            <Button
              color="info"
              fullWidth
              size="medium"
              variant="contained"
              disableElevation
              onClick={() => changeStatus("ready")} disabled={sending}
              sx={{
                minHeight: 48,
                py: 0.9,
                color: "white",
              }}
            >
              {sending ? "جاري الإرسال..." : t("ready")}
            </Button>
          )}

          {order.status === "ready" && (
            <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) auto", gap: 0.8, width: "100%", minWidth: 0, "& .MuiButton-root": { minWidth: 0, whiteSpace: "normal" } }}>
              <Button
                color="success"
                fullWidth
                size="medium"
                variant="contained"
                disableElevation
                onClick={() => changeStatus("served")} disabled={sending}
                sx={{ minWidth: 0, minHeight: 48, py: 0.9 }}
              >
                {t("received")}
              </Button>
              <Button
                color={isPaid ? "primary" : "inherit"}
                size="medium"
                variant="outlined"
                startIcon={<PrintRoundedIcon />}
                onClick={() => setIsInvoiceOpen(true)}
                disabled={!isPaid || sending}
                title={!isPaid ? (language === "ar" ? "سجّل السداد أولًا لطباعة فاتورة الكاشير" : "Record payment before printing the cashier invoice") : undefined}
                sx={{ minHeight: 48, minWidth: 0, whiteSpace: "normal" }}
              >
                {t("printInvoice")}
              </Button>
              <Button
                color="warning"
                size="medium"
                variant="outlined"
                onClick={() => changeStatus("unclaimed")} disabled={sending}
                sx={{ minHeight: 48, minWidth: 0, whiteSpace: "normal" }}
              >
                {t("unclaimed")}
              </Button>
            </Box>
          )}
          {isAwaitingPayment && (
            <Box sx={{ width: "100%", display: "grid", gap: 0.8 }}>
              <Typography variant="caption" color="warning.dark" sx={{ fontWeight: 800 }}>
                {t("paymentRequired")}
              </Typography>
              <Button color="success" variant="contained" onClick={() => changeStatus("served")} disabled={!isPaid || sending}>
                {t("markDelivered")}
              </Button>
              <Button variant="outlined" startIcon={<PrintRoundedIcon />} onClick={() => setIsInvoiceOpen(true)} disabled={!isPaid || sending}>
                {t("printInvoice")}
              </Button>
            </Box>
          )}
        </CardActions>
      </Card>
      <InvoiceModal open={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} order={order} autoPrint={order.status === "pending" ? "kitchen" : false} />
    </motion.div>
  );
}

export default OrderItemCard;
