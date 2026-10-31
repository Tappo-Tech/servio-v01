// لوحة التشغيل الرئيسية للكاشير: تعرض مبيعات اليوم والطلبات الحية فقط.
import DashboardHeader from "../components/cashier-dashboard/DashboardHeader";
import LiveOrders from "../components/cashier-dashboard/orders/LiveOrders";
import WaiterCallNotification from "../components/cashier-dashboard/orders/WaiterCallNotification";
import CashierSalesDrawer from "../components/cashier-dashboard/orders/CashierSalesDrawer";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
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
import { useEffect, useMemo, useRef, useState } from "react";
import { getWorkdayOffsetMinutes, getWorkdaySchedule, shiftBusinessDate } from "../utils/workdayUtils";
import { toLocalDateKey } from "../utils/salesReportUtils";
import PrinterSetupDialog from "../components/cashier-dashboard/PrinterSetupDialog";
import InvoiceModal from "../components/manager-dashboard/orders/OrderPill";
import CashierShiftGate from "../components/cashier-dashboard/CashierShiftGate";
import PrinterBridgeStatus from "../components/cashier-dashboard/PrinterBridgeStatus";
import CategoryPrintRoutingDrawer from "../components/manager-dashboard/menu-control/CategoryPrintRoutingDrawer";
import ShiftReports from "../components/manager-dashboard/ShiftReports";
import { useMenu } from "../context/MenuContext";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import NewTableOrderAlert from "../components/cashier-dashboard/orders/NewTableOrderAlert";
import IngredientInventory from "../components/manager-dashboard/IngredientInventory";
import { getPrinterSettings, printKitchenTicketGroups } from "../utils/qzPrinting";
import { buildOrderReceiptGroups } from "../utils/categoryReceiptUtils";

const AUTO_PRINT_KEY = "servio.cashier.autoPrintAfterSave";

function Dashboard() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSalesHistoryOpen, setIsSalesHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [testInvoice, setTestInvoice] = useState(null);
  const { finishedOrders = [], ordersLoading, ordersLoadError } = useOrders();
  const { newTableOrderAlert } = useOrders();
  const { storeInfo = {} } = useStore();
  const { items = [], categoriesList = [], menuLoading, updateCategoryPrintRoutes } = useMenu();
  const { t, language } = useLanguage();
  const categoryPrinterNames = useMemo(
    () =>
      categoriesList
        .map((category) => category.printer_name)
        .filter((name) => typeof name === "string" && name.trim()),
    [categoriesList],
  );
  const schedule = useMemo(() => getWorkdaySchedule(storeInfo), [storeInfo]);
  const operationalToday =
    shiftBusinessDate(new Date(), schedule.startMinutes) || new Date();
  const operationalTodayKey = toLocalDateKey(operationalToday);
  const todayOrders = useMemo(
    () =>
      finishedOrders.filter(
        (order) =>
          order.status !== "cancelled" &&
          Number.isFinite(
            new Date(order.completed_at || order.created_at).getTime(),
          ) &&
          getWorkdayOffsetMinutes(
            new Date(order.completed_at || order.created_at),
            schedule.startMinutes,
          ) < schedule.durationMinutes &&
          toLocalDateKey(
            shiftBusinessDate(
              new Date(order.completed_at || order.created_at),
              schedule.startMinutes,
            ),
          ) === operationalTodayKey,
      ),
    [finishedOrders, schedule, operationalTodayKey],
  );
  const totalSales = todayOrders.reduce(
    (sum, order) => sum + Number(order.total_price || 0),
    0,
  );
  const currency = storeInfo.currency || "ر.س";

  const [autoPrintAfterSave, setAutoPrintAfterSave] = useState(() => {
    try {
      return window.localStorage.getItem(AUTO_PRINT_KEY) !== "false";
    } catch {
      return true;
    }
  });
  const autoPrintedPublicOrders = useRef(new Set());

  useEffect(() => {
    const incoming = newTableOrderAlert;
    if (!incoming?.id || autoPrintedPublicOrders.current.has(incoming.id)) return;
    const settings = getPrinterSettings();
    if (!settings.autoPrintPublicOrders) return;
    // لا نؤكد الطباعة قبل اكتمال تحميل المنيو؛ وإلا قد تطبع التذكرة الموحدة
    // أولًا ثم تمنع إعادة المحاولة بعد وصول إعدادات split_print.
    if (menuLoading) return;
    autoPrintedPublicOrders.current.add(incoming.id);
    // طلب العميل المؤكد يطبع تذاكر المطبخ حسب التصنيفات نفسها المستخدمة
    // في التوجيه اليدوي؛ لذلك يعمل split_print حتى لو كانت كل التصنيفات
    // على طابعة واحدة، مع بقاء إيصال العميل الموحد في مسار الفاتورة.
    const ticketGroups = buildOrderReceiptGroups(incoming, categoriesList, items, language);
    printKitchenTicketGroups(ticketGroups, storeInfo, { settings, language })
      .catch((error) => console.error("تعذر طباعة تذكرة طلب العميل تلقائيًا", error));
  }, [newTableOrderAlert, storeInfo, language, categoriesList, items, menuLoading]);

  const handleAutoPrintChange = (event) => {
    const checked = Boolean(event?.target?.checked);
    setAutoPrintAfterSave(checked);
    try {
      window.localStorage.setItem(AUTO_PRINT_KEY, String(checked));
    } catch {
      /* تفضيل محلي اختياري */
    }
  };

  const openPrinterTest = () => {
    setTestInvoice({
      id: `test-${Date.now()}`,
      created_at: new Date().toISOString(),
      table_number: language === "ar" ? "اختبار طابعة" : "Printer test",
      notes:
        language === "ar"
          ? "هذه فاتورة اختبار وليست عملية بيع."
          : "Test receipt only; not a sale.",
      total_price: 0,
      payment_status: "unpaid",
      items: [
        {
          id: "servio-printer-test",
          name:
            language === "ar"
              ? "اختبار اتصال الطابعة"
              : "Printer connection test",
          quantity: 1,
          price: 0,
        },
      ],
    });
  };

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 88% 8%, rgba(244,121,32,.14), transparent 24%), linear-gradient(135deg, #fff8f1 0%, #f7f8fb 44%, #eef1f7 100%)",
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 2, sm: 3, md: 5 },
      }}
    >
      <NewTableOrderAlert />
      <Container maxWidth="xl" disableGutters>
        <Stack spacing={{ xs: 1.5, md: 2.25 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2, md: 2.5 },
              borderRadius: { xs: 3, md: 4 },
              border: "1px solid rgba(255,255,255,.72)",
              background: "rgba(255,255,255,.78)",
              backdropFilter: "blur(18px)",
              boxShadow: "0 14px 42px rgba(23,26,47,.06)",
            }}
          >
            <DashboardHeader
              handleNotificationOpen={() => setIsNotificationOpen(true)}
            />
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2, md: 2.25 },
              borderRadius: { xs: 3, md: 4 },
              border: "1px solid rgba(255,255,255,.68)",
              background: "rgba(255,255,255,.72)",
              backdropFilter: "blur(18px)",
              boxShadow: "0 16px 48px rgba(23,26,47,.06)",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              sx={{
                alignItems: { xs: "stretch", sm: "center" },
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontWeight: 800 }}
                >
                  {t("totalSales")} ·{" "}
                  {language === "ar" ? "اليوم التشغيلي" : "Workday"}
                </Typography>
                <Stack
                  direction="row"

                  spacing={1}
                  sx={{ mt: 0.2 , alignItems: "baseline"}}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: "1.45rem", sm: "1.8rem" },
                      fontWeight: 950,
                      color: "text.primary",
                      letterSpacing: "-.04em",
                    }}
                  >
                    {ordersLoading || ordersLoadError
                      ? "—"
                      : totalSales.toFixed(2)}
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={800}
                    color="text.secondary"
                  >
                    {currency}
                  </Typography>
                </Stack>
              </Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}


                spacing={1}
                sx={{ width: { xs: "100%", sm: "auto" } , justifyContent: "flex-end", alignItems: { xs: "stretch", sm: "center" }}}
              >
                <Button
                  variant="outlined"
                  startIcon={<ReceiptLongRoundedIcon />}
                  onClick={() => setIsSalesHistoryOpen(true)}
                  sx={{
                    borderRadius: 2.5,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("orderHistory")}
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <CashierShiftGate />
          <Box
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-start", sm: "flex-end" },
              minWidth: 0,
            }}
          >
            <PrinterBridgeStatus
              language={language}
              categoryPrinterNames={categoryPrinterNames}
            />
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.25, sm: 2, md: 2.5 },
              borderRadius: { xs: 3, md: 4 },
              border: "1px solid rgba(255,255,255,.68)",
              background: "rgba(255,255,255,.72)",
              backdropFilter: "blur(18px)",
              boxShadow: "0 16px 48px rgba(23,26,47,.06)",
              minHeight: { xs: 0, md: "calc(100vh - 168px)" },
              minWidth: 0,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              variant="scrollable"
              scrollButtons="auto"
              aria-label={
                language === "ar" ? "تبويبات الكاشير" : "Cashier tabs"
              }
              sx={{
                mb: 2,
                borderBottom: 1,
                borderColor: "divider",
                "& .MuiTab-root": { fontWeight: 850, minHeight: 48 },
              }}
            >
              <Tab
                value="orders"
                label={
                  language === "ar" ? "الطلبات الواردة" : "Incoming orders"
                }
              />
              <Tab
                value="inventory"
                icon={<Inventory2OutlinedIcon />}
                iconPosition="start"
                label={language === "ar" ? "إدارة المخزون" : "Inventory"}
              />
              <Tab
                value="printing"
                icon={<PrintRoundedIcon />}
                iconPosition="start"
                label={
                  language === "ar" ? "إعدادات الطباعة" : "Printer settings"
                }
              />
              <Tab
                value="shifts"
                icon={<AccessTimeRoundedIcon />}
                iconPosition="start"
                label={language === "ar" ? "الورديات" : "Shifts"}
              />
            </Tabs>
            {activeTab === "orders" ? (
              <LiveOrders />
            ) : activeTab === "shifts" ? (
              <ShiftReports />
            ) : activeTab === "inventory" ? (
              <IngredientInventory />
            ) : (
              <Stack spacing={2.5} sx={{ maxWidth: 1100, mx: "auto", py: { xs: 1, md: 2 } }}>
                <PrinterSetupDialog
                  open={activeTab === "printing"}
                  onClose={() => {}}
                  language={language}
                  autoPrint={autoPrintAfterSave}
                  onAutoPrintChange={handleAutoPrintChange}
                  onTest={openPrinterTest}
                  inline
                />
                <CategoryPrintRoutingDrawer
                  open={activeTab === "printing"}
                  onClose={() => {}}
                  categories={categoriesList}
                  onUpdateCategories={updateCategoryPrintRoutes}
                  inline
                />
              </Stack>
            )}
          </Paper>

          <CashierSalesDrawer
            open={isSalesHistoryOpen}
            onClose={() => setIsSalesHistoryOpen(false)}
          />
          <WaiterCallNotification
            open={isNotificationOpen}
            close={() => setIsNotificationOpen(false)}
          />
          <InvoiceModal
            open={Boolean(testInvoice)}
            onClose={() => setTestInvoice(null)}
            order={testInvoice}
            isTest
            autoPrint
          />
        </Stack>
      </Container>
    </Box>
  );
}

export default Dashboard;
