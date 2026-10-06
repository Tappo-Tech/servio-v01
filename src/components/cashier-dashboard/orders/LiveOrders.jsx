// COMPONENTS
import OrderItemCard from "./OrderItemCard";
import PrinterSetupDialog from "../PrinterSetupDialog";
import InvoiceModal from "../../manager-dashboard/orders/OrderPill";

// MUI COMPONENTS
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import { useState } from "react";

// ANIMATION
import { AnimatePresence } from "framer-motion";

// CONTEXTS
import { useOrders } from "../../../context/OrdersContext";

// ICONS
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import { useLanguage } from "../../../context/LanguageContext";

const AUTO_PRINT_KEY = "servio.cashier.autoPrintAfterSave";

const COLUMNS = [
  { key: "pending", title: "newOrder", color: "warning" },
  { key: "preparing", title: "preparing", color: "info" },
  { key: "ready", title: "ready", color: "success" },
];

function LiveOrders() {
  const { orders, ordersLoading, ordersLoadError, reloadOrders } = useOrders();
  const { t, language } = useLanguage();
  const [printerSetupOpen, setPrinterSetupOpen] = useState(false);
  const [testInvoice, setTestInvoice] = useState(null);
  const [autoPrintAfterSave, setAutoPrintAfterSave] = useState(() => {
    try { return window.localStorage.getItem(AUTO_PRINT_KEY) !== "false"; } catch { return true; }
  });
  const handleAutoPrintChange = (event) => {
    const checked = Boolean(event?.target?.checked);
    setAutoPrintAfterSave(checked);
    try { window.localStorage.setItem(AUTO_PRINT_KEY, String(checked)); } catch { /* local preference is optional */ }
  };
  const openPrinterTest = () => {
    setPrinterSetupOpen(false);
    setTestInvoice({
      id: `test-${Date.now()}`,
      created_at: new Date().toISOString(),
      table_number: language === "ar" ? "اختبار طابعة" : "Printer test",
      notes: language === "ar" ? "هذه فاتورة اختبار وليست عملية بيع." : "Test receipt only; not a sale.",
      total_price: 0,
      payment_status: "unpaid",
      items: [{ id: "servio-printer-test", name: language === "ar" ? "اختبار اتصال الطابعة" : "Printer connection test", quantity: 1, price: 0 }],
    });
  };

  const activeOrders = orders.filter((order) => (
    !order.is_completed &&
    Array.isArray(order.items) &&
    order.items.length > 0 &&
    order.items.every((item) => item && String(item.name || "").trim() && item.quantity != null && item.price != null)
  ));

  const getOrdersByStatus = (status) =>
    activeOrders.filter((order) => order.status === status);

  if (ordersLoading) {
    return (
      <Box sx={{ minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center", gap: 1.2 }}>
        <CircularProgress size={24} />
        <Typography color="text.secondary">جاري تحميل الطلبات...</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={{ xs: 1.5, sm: 2, lg: 2.5 }}>
      <Grid size={{ xs: 12 }}>
        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={900}>{language === "ar" ? "الطباعة على جهاز الكاشير" : "Printing on this cashier device"}</Typography>
            <Typography variant="caption" color="text.secondary">{language === "ar" ? "تُحفظ الطابعات على هذا الجهاز ويعاد اتصال QZ تلقائيًا عند دخول الكاشير." : "Printers are saved on this device and QZ reconnects automatically when the cashier opens."}</Typography>
          </Box>
          <Button variant="outlined" startIcon={<PrintRoundedIcon />} onClick={() => setPrinterSetupOpen(true)} sx={{ borderRadius: 2, fontWeight: 850, whiteSpace: "nowrap" }}>
            {language === "ar" ? "إعداد الطابعات" : "Printer setup"}
          </Button>
        </Paper>
      </Grid>
      {ordersLoadError && (
        <Grid size={{ xs: 12 }}>
          <Paper elevation={0} role="status" sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, border: "1px solid", borderColor: "error.light" }}>
            <Typography color="error">{language === "ar" ? "تعذر تحميل الطلبات. تحقق من الاتصال ثم أعد المحاولة." : "Orders could not load. Check the connection and retry."}</Typography>
            <Button size="small" onClick={reloadOrders}>{language === "ar" ? "إعادة المحاولة" : "Retry"}</Button>
          </Paper>
        </Grid>
      )}
      {COLUMNS.map((col) => {
        const columnOrders = getOrdersByStatus(col.key);

        return (
          <Grid key={col.key} size={{ xs: 12, md: 6, lg: 4 }}>
            {/* عنوان العمود بنفس طابع لوحة التحكم */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.35, md: 1.55 },
                mb: 1.7,
                borderRadius: "15px",
                border: "1px solid",
                borderColor: "rgba(255,255,255,.7)",
                background: "rgba(248,250,252,.72)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                boxShadow: "0 10px 26px rgba(23,26,47,.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FiberManualRecordIcon
                  fontSize="small"
                  sx={{ color: `${col.color}.main`, fontSize: 14 }}
                />
                <Typography variant="subtitle1" fontWeight={700}>
                  {t(col.title)}
                </Typography>
              </Box>

              <Chip
                label={columnOrders.length}
                size="small"
                sx={{
                  bgcolor: (theme) => theme.palette[col.color].main + "18",
                  color: `${col.color}.main`,
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  borderRadius: "8px",
                  px: 0.5,
                }}
              />
            </Paper>

            {/* الحاوية ذات الانتقالات السلسة */}
            <Box sx={{ minHeight: "200px" }}>
              <AnimatePresence mode="popLayout">
                {columnOrders.map((order) => (
                  <OrderItemCard key={order.id} order={order} />
                ))}
              </AnimatePresence>
            </Box>
          </Grid>
        );
      })}
      <PrinterSetupDialog
        open={printerSetupOpen}
        onClose={() => setPrinterSetupOpen(false)}
        language={language}
        autoPrint={autoPrintAfterSave}
        onAutoPrintChange={handleAutoPrintChange}
        onTest={openPrinterTest}
      />
      <InvoiceModal
        open={Boolean(testInvoice)}
        onClose={() => setTestInvoice(null)}
        order={testInvoice}
        isTest
      />
    </Grid>
  );
}

export default LiveOrders;
