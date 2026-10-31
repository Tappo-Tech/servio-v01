import { FullscreenDialog as Dialog } from "../../common/FullscreenOverlays";
import { useEffect, useState } from "react";

// MUI COMPONENTS
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";

import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

// ANIMATION
import { motion } from "framer-motion";

// ICONS
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";

// HELPERS
import { formatTimeAgo } from "../../../utils/helpers";
import { isValidSplitPayment } from "../../../utils/paymentStatus";

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
  const [confirmingStatus, setConfirmingStatus] = useState(null);
  const [settlementMethod, setSettlementMethod] = useState("");
  const [settlementCash, setSettlementCash] = useState("");
  const [settlementCard, setSettlementCard] = useState("");
  const [, setTimeTick] = useState(0);
  const isPaid = order.payment_status === "paid";
  const isAwaitingPayment = order.status === "awaiting_payment";
  const isReady = order.status === "ready";
  const statusVisual = order.status === "pending"
    ? { accent: "#F47920", soft: "rgba(244,121,32,.10)", label: language === "ar" ? "جديد" : "New" }
    : order.status === "preparing"
      ? { accent: "#2878C8", soft: "rgba(40,120,200,.10)", label: language === "ar" ? "قيد التحضير" : "Preparing" }
      : isAwaitingPayment
        ? { accent: "#B66A00", soft: "rgba(244,173,52,.16)", label: language === "ar" ? "ينتظر السداد" : "Awaiting payment" }
        : { accent: "#159A68", soft: "rgba(21,154,104,.11)", label: language === "ar" ? "جاهز" : "Ready" };
  useEffect(() => {
    const timer = window.setInterval(() => setTimeTick((tick) => tick + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const performStatusChange = async (status) => {
    if (sending) return;
    setSending(true);
    // لا نغيّر الصف لمجرد تعديل حالة الدفع؛ الانتقال يتم فقط عند ضغط جاهز للتسليم.
    const nextStatus = !isPaid && status === "ready" ? "awaiting_payment" : status;
    const result = await updateOrderStatus(order.id, nextStatus);
    if (result?.error) setPaymentError(language === "ar" ? "تعذر نقل الطلب إلى انتظار السداد. أعد المحاولة." : "Could not move the order to payment queue. Retry.");
    setSending(false);
  };
  const changeStatus = (status) => {
    if (status === "served") {
      setConfirmingStatus(status);
      return;
    }
    void performStatusChange(status);
  };
  const settleAndDeliver = () => {
    if (sending || paymentSaving) return;
    setPaymentError("");
    setSettlementMethod("");
    setSettlementCash("");
    setSettlementCard("");
    setConfirmingStatus("settle_and_serve");
  };
  const recordPayment = () => {
    if (sending || paymentSaving) return;
    setPaymentError("");
    setSettlementMethod("");
    setSettlementCash("");
    setSettlementCard("");
    setConfirmingStatus("record_payment");
  };
  const confirmReceiptAction = async () => {
    const action = confirmingStatus;
    if (action === "settle_and_serve" || action === "record_payment") {
      if (!settlementMethod) return;
      const cash = Number(settlementCash) || 0;
      const card = Number(settlementCard) || 0;
      const total = Number(order.total_price) || 0;
      if (settlementMethod === "split" && !isValidSplitPayment(total, cash, card)) return;
      setSending(true);
      setPaymentError("");
      const paymentResult = await updateOrderPaymentStatus(order.id, "paid", {
        method: settlementMethod,
        cashAmount: cash,
        cardAmount: card,
      });
      if (paymentResult?.error) {
        setPaymentError(language === "ar" ? "تعذر تسجيل السداد. تحقق من طريقة الدفع ثم أعد المحاولة." : "Could not record payment. Check the payment method and retry.");
        setSending(false);
        return;
      }
      setConfirmingStatus(null);
      if (action === "settle_and_serve") await updateOrderStatus(order.id, "served");
      setSending(false);
      return;
    }
    setConfirmingStatus(null);
    await performStatusChange(action);
  };
  const changePaymentStatus = async (status) => {
    if (paymentSaving) return;
    if (status === "paid") {
      recordPayment();
      return;
    }
    if (isReady && status !== "paid") {
      setPaymentError(language === "ar"
        ? "لا يمكن تحويل طلب جاهز للاستلام إلى غير مدفوع. أعده إلى انتظار السداد قبل تعديل الدفع."
        : "A ready-for-pickup order cannot be changed to unpaid. Move it to the payment queue first.");
      return;
    }
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
          borderColor: statusVisual.accent,
          borderTopWidth: 6,
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
          <Box sx={{ minWidth: 0, display: "flex", alignItems: "center", gap: .75, flexWrap: "wrap" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 950, color: "text.primary", fontSize: { xs: "1rem", sm: "1.08rem" }, minWidth: 0, overflowWrap: "anywhere" }}>
              #{order.displayOrderNumber || order.order_number || "—"} · {t("table")} {order.table_number}
            </Typography>
            <Chip label={statusVisual.label} size="small" sx={{ height: 25, bgcolor: statusVisual.soft, color: statusVisual.accent, border: `1px solid ${statusVisual.accent}55`, fontWeight: 950, fontSize: ".7rem" }} />
          </Box>

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

        <Box sx={{ mx: { xs: 1.25, sm: 1.5 }, mb: 1.15, p: 1.1, borderRadius: "12px", border: `1px solid ${statusVisual.accent}30`, bgcolor: statusVisual.soft, display: "flex", flexDirection: "column", gap: 0.55, minWidth: 0 }}>
          {!isAwaitingPayment && <PaymentStatusControl value={order.payment_status} method={order.payment_method} onChange={changePaymentStatus} onMethodChange={changePaymentMethod} disabled={paymentSaving || (isReady && isPaid)} language={language} />}
          {isReady && isPaid && <Typography variant="caption" color="success.dark" sx={{ fontWeight: 800 }}>
            {language === "ar" ? "جاهز للاستلام — حالة الدفع مثبتة حتى يتم التسليم." : "Ready for pickup — payment status is locked until delivery."}
          </Typography>}
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

          {order.status === "ready" && isPaid && (
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
              <Button color="success" variant="contained" onClick={!isPaid ? settleAndDeliver : () => changeStatus("served")} disabled={sending || paymentSaving}>
                {!isPaid ? (language === "ar" ? "تأكيد السداد والتسليم" : "Confirm payment & delivery") : t("markDelivered")}
              </Button>
              {isPaid && <Button variant="outlined" startIcon={<PrintRoundedIcon />} onClick={() => setIsInvoiceOpen(true)} disabled={sending}>
                {t("printInvoice")}
              </Button>}
            </Box>
          )}
        </CardActions>
      </Card>
      <InvoiceModal open={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} order={order} autoPrint={order.status === "pending" ? "kitchen" : false} printMode={order.status === "pending" ? "order" : "cashier"} />
      <Dialog open={Boolean(confirmingStatus)} onClose={() => !sending && setConfirmingStatus(null)} fullWidth maxWidth="xs" language={language}>
        <DialogTitle>{confirmingStatus === "record_payment" ? (language === "ar" ? "تسجيل سداد الطلب" : "Record order payment") : (language === "ar" ? "تأكيد الاستلام" : "Confirm receipt")}</DialogTitle>
        <DialogContent>
          {confirmingStatus === "settle_and_serve" || confirmingStatus === "record_payment" ? (
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <Typography>{confirmingStatus === "settle_and_serve" ? (language === "ar" ? "اختر طريقة الدفع لتسجيل السداد وتسليم الطلب. طريقة الدفع إلزامية." : "Choose a payment method to record payment and deliver the order. This field is required.") : (language === "ar" ? "اختر طريقة الدفع لتسجيل السداد. لن تتغير مرحلة الطلب." : "Choose a payment method to record payment. The order stage will remain unchanged.")}</Typography>
              <Typography fontWeight={850}>{language === "ar" ? "إجمالي الطلب: " : "Order total: "}{Number(order.total_price || 0).toFixed(2)} {language === "ar" ? "ر.س" : "SAR"}</Typography>
              <FormControl fullWidth required size="small">
                <InputLabel id={`settlement-method-${order.id}`}>{language === "ar" ? "طريقة الدفع *" : "Payment method *"}</InputLabel>
                <Select
                  labelId={`settlement-method-${order.id}`}
                  label={language === "ar" ? "طريقة الدفع *" : "Payment method *"}
                  value={settlementMethod}
                  onChange={(event) => setSettlementMethod(event.target.value)}
                  required
                >
                  <MenuItem value="cash">{language === "ar" ? "نقدًا" : "Cash"}</MenuItem>
                  <MenuItem value="card">{language === "ar" ? "بطاقة / شبكة (مدى)" : "Card / network (mada)"}</MenuItem>
                  <MenuItem value="split">{language === "ar" ? "نقدًا + شبكة" : "Cash + network"}</MenuItem>
                  <MenuItem value="wallet">{language === "ar" ? "محفظة رقمية" : "Digital wallet"}</MenuItem>
                  <MenuItem value="transfer">{language === "ar" ? "تحويل بنكي" : "Bank transfer"}</MenuItem>
                  <MenuItem value="other">{language === "ar" ? "أخرى" : "Other"}</MenuItem>
                </Select>
              </FormControl>
              {settlementMethod === "split" && (
                <Box sx={{ display: "grid", gap: 1 }}>
                  <TextField size="small" type="number" label={language === "ar" ? "المبلغ النقدي" : "Cash amount"} value={settlementCash} onChange={(event) => setSettlementCash(event.target.value)}  required  slotProps={{ htmlInput: { min: 0, step: "0.01", inputMode: "decimal" } }}/>
                  <TextField size="small" type="number" label={language === "ar" ? "مبلغ الشبكة" : "Card amount"} value={settlementCard} onChange={(event) => setSettlementCard(event.target.value)}  required  slotProps={{ htmlInput: { min: 0, step: "0.01", inputMode: "decimal" } }}/>
                  <Typography variant="caption" color={isValidSplitPayment(Number(order.total_price) || 0, Number(settlementCash) || 0, Number(settlementCard) || 0) ? "success.main" : "error.main"}>
                    {language === "ar" ? "مجموع المبلغين: " : "Combined amount: "}{((Number(settlementCash) || 0) + (Number(settlementCard) || 0)).toFixed(2)}
                  </Typography>
                </Box>
              )}
              {paymentError && <Typography role="alert" variant="caption" color="error">{paymentError}</Typography>}
            </Box>
          ) : (
            language === "ar" ? "هل تؤكد أن العميل استلم الطلب؟ سيتم نقل الطلب غير المدفوع إلى انتظار السداد." : "Confirm that the customer received the order? Unpaid orders will remain awaiting payment."
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmingStatus(null)} disabled={sending}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
          <Button variant="contained" color="success" onClick={confirmReceiptAction} disabled={sending || ((confirmingStatus === "settle_and_serve" || confirmingStatus === "record_payment") && (!settlementMethod || (settlementMethod === "split" && !isValidSplitPayment(Number(order.total_price) || 0, Number(settlementCash) || 0, Number(settlementCard) || 0))))}>{confirmingStatus === "record_payment" ? (language === "ar" ? "تأكيد تسجيل السداد" : "Confirm payment") : confirmingStatus === "settle_and_serve" ? (language === "ar" ? "تأكيد السداد والتسليم" : "Confirm payment & delivery") : (language === "ar" ? "تأكيد الاستلام" : "Confirm receipt")}</Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}

export default OrderItemCard;
