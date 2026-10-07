import { useMemo, useState } from "react";
import { Box, Drawer, IconButton, Stack, Typography, Divider, Button, Chip, TextField, MenuItem } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import dayjs from "dayjs";
import { useOrders } from "../../../context/OrdersContext";
import { useStore } from "../../../context/StoreInfoContext";
import InvoiceModal from "../../manager-dashboard/orders/OrderPill";
import { useLanguage } from "../../../context/LanguageContext";

const locationOf = (order, language) => {
  const value = String(order.table_number || "").toLowerCase();
  if (/سفري|takeaway/.test(value)) return "takeaway";
  if (/محلي|cashier|pos|محل/.test(value)) return "cashier";
  return "table";
};

function CashierSalesDrawer({ open, onClose }) {
  const { finishedOrders = [], ordersLoading, ordersLoadError } = useOrders();
  const { storeInfo = {} } = useStore();
  const { language, t } = useLanguage();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const currency = storeInfo.currency || (language === "ar" ? "ر.س" : "SAR");
  const anchor = language === "ar" ? "right" : "left";
  const text = language === "ar" ? {
    search: "ابحث برقم الطلب", date: "كل التواريخ", payment: "طريقة الدفع", status: "الحالة", location: "نوع الطلب", all: "الكل", paid: "مدفوع", unpaid: "غير مدفوع", cash: "نقد", card: "شبكة", split: "كاش + شبكة", table: "طاولة", takeaway: "سفري", cashier: "كاشير", served: "تم التسليم", cancelled: "ملغي", ready: "جاهز", print: "طباعة", noOrders: "لا توجد طلبات مطابقة للفلاتر", clear: "مسح الفلاتر", dateLabel: "التاريخ",
  } : {
    search: "Search by order number", date: "All dates", payment: "Payment method", status: "Status", location: "Order type", all: "All", paid: "Paid", unpaid: "Unpaid", cash: "Cash", card: "Network", split: "Cash + network", table: "Table", takeaway: "Takeaway", cashier: "Cashier", served: "Served", cancelled: "Cancelled", ready: "Ready", print: "Print", noOrders: "No orders match these filters", clear: "Clear filters", dateLabel: "Date",
  };
  const filteredOrders = useMemo(() => finishedOrders.filter((order) => {
    const number = String(order.order_number || order.displayOrderNumber || "");
    const matchesSearch = !searchQuery.trim() || number.includes(searchQuery.trim());
    const matchesDate = !selectedDate || dayjs(order.completed_at || order.created_at).isSame(dayjs(selectedDate), "day");
    const matchesPayment = paymentFilter === "all" || (paymentFilter === "paid" ? order.payment_status === "paid" : paymentFilter === "unpaid" ? order.payment_status !== "paid" : order.payment_method === paymentFilter);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesLocation = locationFilter === "all" || locationOf(order, language) === locationFilter;
    return matchesSearch && matchesDate && matchesPayment && matchesStatus && matchesLocation;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [finishedOrders, searchQuery, selectedDate, paymentFilter, statusFilter, locationFilter, language]);
  const sales = filteredOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
  const topItems = useMemo(() => { const totals = new Map(); filteredOrders.forEach((order) => (order.items || []).forEach((item) => totals.set(item.name || "—", (totals.get(item.name || "—") || 0) + Number(item.quantity || 1)))); return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3); }, [filteredOrders]);
  const resetFilters = () => { setSearchQuery(""); setSelectedDate(""); setPaymentFilter("all"); setStatusFilter("all"); setLocationFilter("all"); };

  return <>
    <Drawer anchor={anchor} open={open} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: "100vw !important", sm: "88vw !important", md: "clamp(480px, 40vw, 720px) !important" }, maxWidth: "100vw !important", boxSizing: "border-box", p: { xs: 2, sm: 3, md: 3.5 }, direction: language === "ar" ? "rtl" : "ltr", background: "linear-gradient(180deg,#fff8f1 0%,#eef1f7 100%)" } } }}>
      <Stack spacing={1.7} sx={{ height: "100%", width: "100%", minWidth: 0, overflowY: "auto", pr: .25 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between"><Box><Typography variant="h5" fontWeight={950}>{t("orderHistory")}</Typography><Typography variant="body2" color="text.secondary">{t("orderHistoryHint")}</Typography></Box><IconButton onClick={onClose} aria-label={language === "ar" ? "إغلاق" : "Close"}><CloseRoundedIcon /></IconButton></Stack>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1.5fr 1fr" }, gap: 1 }}>
          <TextField size="small" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value.replace(/[^0-9]/g, ""))} placeholder={text.search} InputProps={{ startAdornment: <SearchRoundedIcon color="action" sx={{ mr: .7 }} /> }} />
          <TextField size="small" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} label={text.dateLabel} InputLabelProps={{ shrink: true }} />
          <TextField select size="small" label={text.payment} value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}><MenuItem value="all">{text.all}</MenuItem><MenuItem value="paid">{text.paid}</MenuItem><MenuItem value="unpaid">{text.unpaid}</MenuItem><MenuItem value="cash">{text.cash}</MenuItem><MenuItem value="card">{text.card}</MenuItem><MenuItem value="split">{text.split}</MenuItem></TextField>
          <TextField select size="small" label={text.status} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><MenuItem value="all">{text.all}</MenuItem><MenuItem value="served">{text.served}</MenuItem><MenuItem value="cancelled">{text.cancelled}</MenuItem><MenuItem value="ready">{text.ready}</MenuItem></TextField>
          <TextField select size="small" label={text.location} value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}><MenuItem value="all">{text.all}</MenuItem><MenuItem value="table">{text.table}</MenuItem><MenuItem value="takeaway">{text.takeaway}</MenuItem><MenuItem value="cashier">{text.cashier}</MenuItem></TextField>
          <Button onClick={resetFilters} variant="text" sx={{ fontWeight: 850 }}>{text.clear}</Button>
        </Box>
        <Box sx={{ p: 2.2, borderRadius: 4, color: "#fff", background: "linear-gradient(135deg,#171A2F 0%,#2E3250 62%,#F47920 180%)", boxShadow: "0 18px 38px rgba(23,26,47,.16)" }}><Typography variant="body2" sx={{ opacity: .76, fontWeight: 750 }}>{t("totalSales")}</Typography><Typography variant="h4" fontWeight={950} sx={{ mt: .4 }}>{ordersLoading || ordersLoadError ? "—" : sales.toFixed(2)} {currency}</Typography><Typography variant="caption" sx={{ opacity: .7 }}>{filteredOrders.length} {t("completedOrders")}</Typography></Box>
        <Box sx={{ p: 1.7, borderRadius: 3, bgcolor: "rgba(255,255,255,.82)", border: "1px solid rgba(23,26,47,.08)" }}><Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}><TrendingUpRoundedIcon color="primary" /><Typography fontWeight={900}>{language === "ar" ? "أعلى 3 أصناف" : "Top 3 items"}</Typography></Stack><Stack spacing={.7}>{topItems.length ? topItems.map(([name, quantity], index) => <Stack key={name} direction="row" justifyContent="space-between"><Stack direction="row" spacing={1} alignItems="center"><Chip label={index + 1} size="small" color={index === 0 ? "primary" : "default"} /><Typography fontWeight={700}>{name}</Typography></Stack><Typography fontWeight={900} color="primary.main">{quantity}×</Typography></Stack>) : <Typography variant="body2" color="text.secondary">{text.noOrders}</Typography>}</Stack></Box>
        <Divider />
        <Box sx={{ width: "100%" }}><Stack spacing={1}>{filteredOrders.map((order) => { const location = locationOf(order, language); return <Box key={order.id} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, bgcolor: "rgba(255,255,255,.9)", border: "1px solid rgba(23,26,47,.08)", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", minWidth: 0, gap: 1.5, boxShadow: "0 6px 18px rgba(23,26,47,.04)" }}><Box sx={{ minWidth: 0 }}><Stack direction="row" spacing={.8} alignItems="center" flexWrap="wrap"><Chip label={`#${order.order_number || order.displayOrderNumber || "—"}`} size="small" sx={{ fontWeight: 950, bgcolor: "rgba(244,121,32,.12)", color: "primary.dark" }} /><Chip label={location === "table" ? `${text.table} ${order.table_number}` : text[location]} size="small" variant="outlined" /><Chip label={order.payment_method === "split" ? text.split : order.payment_method === "card" ? text.card : order.payment_method === "cash" ? text.cash : order.payment_status === "paid" ? text.paid : text.unpaid} size="small" color={order.payment_status === "paid" ? "success" : "warning"} variant="outlined" /></Stack><Typography variant="caption" color="text.secondary">{dayjs(order.created_at).format("DD/MM/YY · hh:mm A")}</Typography></Box><Stack alignItems={language === "ar" ? "flex-start" : "flex-end"} spacing={.65}><Typography fontWeight={950}>{order.total_price} {currency}</Typography><Button size="small" variant="text" startIcon={<PrintRoundedIcon />} onClick={() => setSelectedOrder(order)} sx={{ minWidth: 0 }}>{text.print}</Button></Stack></Box>; })}{!filteredOrders.length && <Box sx={{ py: 8, textAlign: "center" }}><ReceiptLongRoundedIcon sx={{ fontSize: 42, color: "text.disabled", mb: 1 }} /><Typography color="text.secondary">{text.noOrders}</Typography></Box>}</Stack></Box>
      </Stack>
    </Drawer><InvoiceModal open={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)} order={selectedOrder} />
  </>;
}

export default CashierSalesDrawer;
