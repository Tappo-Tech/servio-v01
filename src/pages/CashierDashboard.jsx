// لوحة التشغيل الرئيسية للكاشير: تعرض مبيعات اليوم والطلبات الحية فقط.
import DashboardHeader from "../components/cashier-dashboard/DashboardHeader";
import LiveOrders from "../components/cashier-dashboard/orders/LiveOrders";
import WaiterCallNotification from "../components/cashier-dashboard/orders/WaiterCallNotification";
import CashierSalesDrawer from "../components/cashier-dashboard/orders/CashierSalesDrawer";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import { Link } from "react-router-dom";
import { useOrders } from "../context/OrdersContext";
import { useStore } from "../context/StoreInfoContext";
import { useLanguage } from "../context/LanguageContext";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import PrinterSetupDialog from "../components/cashier-dashboard/PrinterSetupDialog";
import InvoiceModal from "../components/manager-dashboard/orders/OrderPill";

const AUTO_PRINT_KEY = "servio.cashier.autoPrintAfterSave";

function Dashboard() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSalesHistoryOpen, setIsSalesHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [printerSetupOpen, setPrinterSetupOpen] = useState(false);
  const [testInvoice, setTestInvoice] = useState(null);
  const { finishedOrders = [], ordersLoading, ordersLoadError } = useOrders();
  const { storeInfo = {} } = useStore();
  const { t, language } = useLanguage();
  const todayOrders = useMemo(() => finishedOrders.filter((order) => (
    order.status !== "cancelled" &&
    dayjs(order.completed_at || order.created_at).isSame(dayjs(), "day")
  )), [finishedOrders]);
  const totalSales = todayOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
  const currency = storeInfo.currency || "ر.س";

  const [autoPrintAfterSave, setAutoPrintAfterSave] = useState(() => {
    try { return window.localStorage.getItem(AUTO_PRINT_KEY) !== "false"; } catch { return true; }
  });

  const handleAutoPrintChange = (event) => {
    const checked = Boolean(event?.target?.checked);
    setAutoPrintAfterSave(checked);
    try { window.localStorage.setItem(AUTO_PRINT_KEY, String(checked)); } catch { /* تفضيل محلي اختياري */ }
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

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", backgroundColor: "#f8fafc", py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, md: 5 } }}>
      <Container maxWidth="xl" disableGutters>
        <Stack spacing={{ xs: 1.5, md: 2.25 }}>
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, borderRadius: { xs: 3, md: 4 }, border: "1px solid rgba(255,255,255,.72)", background: "rgba(255,255,255,.78)", backdropFilter: "blur(18px)", boxShadow: "0 14px 42px rgba(23,26,47,.06)" }}>
            <DashboardHeader handleNotificationOpen={() => setIsNotificationOpen(true)} />
          </Paper>

          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.25 }, borderRadius: { xs: 3, md: 4 }, border: "1px solid rgba(255,255,255,.68)", background: "rgba(255,255,255,.72)", backdropFilter: "blur(18px)", boxShadow: "0 16px 48px rgba(23,26,47,.06)" }}>
            <Stack direction={{ xs: "column", sm: "row" }} sx={{ alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between", gap: 2 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 800 }}>{t("totalSales")} · {language === "ar" ? "اليوم" : "Today"}</Typography>
                <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: .2 }}>
                  <Typography sx={{ fontSize: { xs: "1.45rem", sm: "1.8rem" }, fontWeight: 950, color: "text.primary", letterSpacing: "-.04em" }}>{ordersLoading || ordersLoadError ? "—" : totalSales.toFixed(2)}</Typography>
                  <Typography variant="body2" fontWeight={800} color="text.secondary">{currency}</Typography>
                </Stack>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
                <Button component={Link} to="/dashboard/pos" variant="contained" startIcon={<PointOfSaleRoundedIcon />} sx={{ borderRadius: 2.5, fontWeight: 850, whiteSpace: "nowrap" }}>
                  {language === "ar" ? "واجهة الكاشير" : "Cashier menu"}
                </Button>
                <Button variant="outlined" startIcon={<ReceiptLongRoundedIcon />} onClick={() => setIsSalesHistoryOpen(true)} sx={{ borderRadius: 2.5, fontWeight: 800, whiteSpace: "nowrap" }}>
                  {t("orderHistory")}
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: { xs: 1.25, sm: 2, md: 2.5 }, borderRadius: { xs: 3, md: 4 }, border: "1px solid rgba(255,255,255,.68)", background: "rgba(255,255,255,.72)", backdropFilter: "blur(18px)", boxShadow: "0 16px 48px rgba(23,26,47,.06)", minHeight: "calc(100vh - 168px)" }}>
            <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} variant="scrollable" scrollButtons="auto" aria-label={language === "ar" ? "تبويبات الكاشير" : "Cashier tabs"} sx={{ mb: 2, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { fontWeight: 850, minHeight: 48 } }}>
              <Tab value="orders" label={language === "ar" ? "الطلبات الواردة" : "Incoming orders"} />
              <Tab value="printing" icon={<PrintRoundedIcon />} iconPosition="start" label={language === "ar" ? "إعدادات الطباعة" : "Printer settings"} />
            </Tabs>
            {activeTab === "orders" ? <LiveOrders /> : (
              <Box sx={{ maxWidth: 760, mx: "auto", py: { xs: 2, md: 4 } }}>
                <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: "1px solid", borderColor: "divider", background: "rgba(255,255,255,.82)" }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" fontWeight={950}>{language === "ar" ? "إعداد طابعات هذا الجهاز" : "Printer settings for this device"}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: .6 }}>{language === "ar" ? "حدد طابعات فواتير الكاشير وتذكرة المطبخ، ومقاس الورق، والطباعة التلقائية." : "Choose cashier and kitchen printers, paper size, and automatic printing."}</Typography>
                    </Box>
                    <Button variant="contained" startIcon={<PrintRoundedIcon />} onClick={() => setPrinterSetupOpen(true)} sx={{ borderRadius: 2.5, fontWeight: 900, whiteSpace: "nowrap" }}>
                      {language === "ar" ? "فتح إعدادات الطباعة" : "Open printer setup"}
                    </Button>
                  </Stack>
                </Paper>
              </Box>
            )}
          </Paper>

          <CashierSalesDrawer open={isSalesHistoryOpen} onClose={() => setIsSalesHistoryOpen(false)} />
          <WaiterCallNotification open={isNotificationOpen} close={() => setIsNotificationOpen(false)} />
          <PrinterSetupDialog
            open={printerSetupOpen}
            onClose={() => setPrinterSetupOpen(false)}
            language={language}
            autoPrint={autoPrintAfterSave}
            onAutoPrintChange={handleAutoPrintChange}
            onTest={openPrinterTest}
          />
          <InvoiceModal open={Boolean(testInvoice)} onClose={() => setTestInvoice(null)} order={testInvoice} isTest />
        </Stack>
      </Container>
    </Box>
  );
}

export default Dashboard;
