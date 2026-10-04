// لوحة التشغيل الرئيسية للكاشير: تعرض مبيعات اليوم والطلبات الحية فقط.
import DashboardHeader from "../components/cashier-dashboard/DashboardHeader";
import LiveOrders from "../components/cashier-dashboard/orders/LiveOrders";
import WaiterCallNotification from "../components/cashier-dashboard/orders/WaiterCallNotification";
import CashierSalesDrawer from "../components/cashier-dashboard/orders/CashierSalesDrawer";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
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
import { useMemo, useState } from "react";
import dayjs from "dayjs";

function Dashboard() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSalesHistoryOpen, setIsSalesHistoryOpen] = useState(false);
  const { finishedOrders = [], ordersLoading, ordersLoadError } = useOrders();
  const { storeInfo = {} } = useStore();
  const { t, language } = useLanguage();
  const todayOrders = useMemo(() => finishedOrders.filter((order) => (
    order.status !== "cancelled" &&
    dayjs(order.completed_at || order.created_at).isSame(dayjs(), "day")
  )), [finishedOrders]);
  const totalSales = todayOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
  const currency = storeInfo.currency || "ر.س";

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
            <LiveOrders />
          </Paper>

          <CashierSalesDrawer open={isSalesHistoryOpen} onClose={() => setIsSalesHistoryOpen(false)} />
          <WaiterCallNotification open={isNotificationOpen} close={() => setIsNotificationOpen(false)} />
        </Stack>
      </Container>
    </Box>
  );
}

export default Dashboard;
