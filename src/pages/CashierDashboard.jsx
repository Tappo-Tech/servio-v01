// COMPONENTS
import DashboardHeader from "../components/cashier-dashboard/DashboardHeader";
import LiveOrders from "../components/cashier-dashboard/orders/LiveOrders";
import WaiterCallNotification from "../components/cashier-dashboard/orders/WaiterCallNotification";
import CashierSalesDrawer from "../components/cashier-dashboard/orders/CashierSalesDrawer";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import { useOrders } from "../context/OrdersContext";
import { useStore } from "../context/StoreInfoContext";
import { useLanguage } from "../context/LanguageContext";

// MUI COMPONENTS
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";

// HOOKS
import { useState } from "react";

function Dashboard() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSalesHistoryOpen, setIsSalesHistoryOpen] = useState(false);
  const { finishedOrders = [] } = useOrders();
  const { storeInfo = {} } = useStore();
  const { t } = useLanguage();
  const totalSales = finishedOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
  const currency = storeInfo.currency || "ر.س";

  const handleNotificationOpen = () => setIsNotificationOpen(true);
  const handleNotificationClose = () => setIsNotificationOpen(false);

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 2, sm: 3, md: 5 },
      }}
    >
      <Container maxWidth="xl" disableGutters>
        <Stack spacing={{ xs: 1.5, md: 2.25 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2, md: 2.5 },
              borderRadius: { xs: 3, md: 4 },
              border: "1px solid",
              borderColor: "rgba(255,255,255,.72)",
              background: "rgba(255,255,255,.78)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              boxShadow: "0 14px 42px rgba(23,26,47,.06)",
            }}
          >
            <DashboardHeader handleNotificationOpen={handleNotificationOpen} />
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2, md: 2.25 },
              borderRadius: { xs: 3, md: 4 },
              border: "1px solid",
              borderColor: "rgba(255,255,255,.68)",
              background: "rgba(255,255,255,.72)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              boxShadow: "0 16px 48px rgba(23,26,47,.06)",
            }}
          >
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 2 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 800 }}>
                  {t("totalSales")}
                </Typography>
                <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: .2 }}>
                  <Typography sx={{ fontSize: { xs: "1.45rem", sm: "1.8rem" }, fontWeight: 950, color: "text.primary", letterSpacing: "-.04em" }}>
                    {totalSales.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" fontWeight={800} color="text.secondary">{currency}</Typography>
                </Stack>
              </Box>
              <Button
                variant="outlined"
                startIcon={<ReceiptLongRoundedIcon />}
                onClick={() => setIsSalesHistoryOpen(true)}
                sx={{ borderRadius: 2.5, fontWeight: 800, whiteSpace: "nowrap" }}
              >
                {t("orderHistory")}
              </Button>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.25, sm: 2, md: 2.5 },
              borderRadius: { xs: 3, md: 4 },
              border: "1px solid",
              borderColor: "rgba(255,255,255,.68)",
              background: "rgba(255,255,255,.72)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              boxShadow: "0 16px 48px rgba(23,26,47,.06)",
              minHeight: "calc(100vh - 168px)",
            }}
          >
            <LiveOrders />
          </Paper>

          <CashierSalesDrawer open={isSalesHistoryOpen} onClose={() => setIsSalesHistoryOpen(false)} />

          {/* النافذة الجانبية لنداءات الويتر */}
          <WaiterCallNotification
            open={isNotificationOpen}
            close={handleNotificationClose}
          />
        </Stack>
      </Container>
    </Box>
  );
}

export default Dashboard;