import { useMemo, useState } from "react";
import { Box, Drawer, IconButton, Stack, Typography, Divider, Button, Chip, TextField } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import dayjs from "dayjs";
import { useOrders } from "../../../context/OrdersContext";
import { useStore } from "../../../context/StoreInfoContext";
import InvoiceModal from "../../manager-dashboard/orders/OrderPill";
import { useLanguage } from "../../../context/LanguageContext";

/** سجل الكاشير مستقل عن قائمة الطلبات الحية، لذلك يمكن تصفيته دون التأثير على التشغيل. */
function CashierSalesDrawer({ open, onClose }) {
  const { finishedOrders = [] } = useOrders();
  const { storeInfo = {} } = useStore();
  const { language, t } = useLanguage();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const currency = storeInfo.currency || "ر.س";
  // الجهة القائدة تكون يمينًا في العربية ويسارًا في الإنجليزية.
  const anchor = language === "ar" ? "right" : "left";

  const filteredOrders = useMemo(() => finishedOrders.filter((order) => dayjs(order.completed_at || order.created_at).isSame(dayjs(selectedDate), "day")).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [finishedOrders, selectedDate]);
  const sales = filteredOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
  const topItems = useMemo(() => {
    const totals = new Map();
    filteredOrders.forEach((order) => (order.items || []).forEach((item) => {
      const name = item.name || (language === "ar" ? "صنف غير مسمى" : "Unnamed item");
      const quantity = Number(item.quantity || 1);
      totals.set(name, (totals.get(name) || 0) + quantity);
    }));
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [filteredOrders, language]);

  return (
    <>
      <Drawer anchor={anchor} open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 570, md: 650 }, p: { xs: 2, sm: 3 }, background: "linear-gradient(180deg,#f8fafc 0%,#eef2f7 100%)" } }}>
        <Stack spacing={2.2} sx={{ height: "100%" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box><Typography variant="h5" fontWeight={950}>{t("orderHistory")}</Typography><Typography variant="body2" color="text.secondary">{t("orderHistoryHint")}</Typography></Box>
            <IconButton onClick={onClose} aria-label={language === "ar" ? "إغلاق" : "Close"}><CloseRoundedIcon /></IconButton>
          </Stack>

          <TextField label={language === "ar" ? "تاريخ السجل" : "History date"} type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" />
          <Box sx={{ p: 2.4, borderRadius: 4, color: "#fff", background: "linear-gradient(135deg,#171A2F 0%,#2E3250 62%,#F47920 180%)", boxShadow: "0 18px 38px rgba(23,26,47,.16)" }}>
            <Typography variant="body2" sx={{ opacity: .76, fontWeight: 700 }}>{t("totalSales")}</Typography>
            <Typography variant="h4" fontWeight={950} sx={{ mt: .4 }}>{sales.toFixed(2)} {currency}</Typography>
            <Typography variant="caption" sx={{ opacity: .7 }}>{filteredOrders.length} {t("completedOrders")}</Typography>
          </Box>

          <Box sx={{ p: 2, borderRadius: 3, bgcolor: "rgba(255,255,255,.82)", border: "1px solid rgba(23,26,47,.08)", boxShadow: "0 10px 26px rgba(23,26,47,.05)" }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.3 }}><TrendingUpRoundedIcon color="primary" /><Typography fontWeight={900}>{language === "ar" ? "أعلى 3 أصناف" : "Top 3 items"}</Typography></Stack>
            <Stack spacing={.8}>{topItems.length ? topItems.map(([name, quantity], index) => <Stack key={name} direction="row" justifyContent="space-between" alignItems="center"><Stack direction="row" spacing={1} alignItems="center"><Chip label={index + 1} size="small" color={index === 0 ? "primary" : "default"} /><Typography fontWeight={700}>{name}</Typography></Stack><Typography fontWeight={900} color="primary.main">{quantity}×</Typography></Stack>) : <Typography variant="body2" color="text.secondary">{language === "ar" ? "لا توجد أصناف لهذا التاريخ" : "No items for this date"}</Typography>}</Stack>
          </Box>

          <Divider />
          <Box sx={{ overflowY: "auto", flex: 1, pr: .25 }}><Stack spacing={1}>{filteredOrders.map((order) => { const shortId = String(order.id || "").slice(-6).toUpperCase(); return <Box key={order.id} sx={{ p: 1.5, borderRadius: 2.8, bgcolor: "#fff", border: "1px solid rgba(23,26,47,.08)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, boxShadow: "0 6px 18px rgba(23,26,47,.04)" }}><Box sx={{ minWidth: 0 }}><Stack direction="row" spacing={.8} alignItems="center"><Chip label={`#${shortId}`} size="small" sx={{ fontWeight: 900 }} /><Typography variant="caption" color="text.secondary">{language === "ar" ? `طاولة ${order.table_number}` : `Table ${order.table_number}`}</Typography></Stack><Typography variant="caption" color="text.secondary">{dayjs(order.created_at).format("DD/MM/YY · hh:mm A")}</Typography></Box><Stack alignItems="flex-end" spacing={.5}><Typography fontWeight={900}>{order.total_price} {currency}</Typography><Button size="small" variant="text" startIcon={<PrintRoundedIcon />} onClick={() => setSelectedOrder(order)} sx={{ minWidth: 0 }}>{language === "ar" ? "طباعة" : "Print"}</Button></Stack></Box>; })}{!filteredOrders.length && <Box sx={{ py: 8, textAlign: "center" }}><ReceiptLongRoundedIcon sx={{ fontSize: 42, color: "text.disabled", mb: 1 }} /><Typography color="text.secondary">{language === "ar" ? "لا توجد طلبات مكتملة لهذا التاريخ" : "No completed orders for this date"}</Typography></Box>}</Stack></Box>
        </Stack>
      </Drawer>
      <InvoiceModal open={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)} order={selectedOrder} />
    </>
  );
}

export default CashierSalesDrawer;
