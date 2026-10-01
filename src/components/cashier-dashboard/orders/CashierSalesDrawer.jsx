import { useState } from "react";
import {
  Box,
  Drawer,
  IconButton,
  Stack,
  Typography,
  Divider,
  Button,
  Chip,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import dayjs from "dayjs";
import { useOrders } from "../../../context/OrdersContext";
import { useStore } from "../../../context/StoreInfoContext";
import InvoiceModal from "../../manager-dashboard/orders/OrderPill";
import { useLanguage } from "../../../context/LanguageContext";

function CashierSalesDrawer({ open, onClose }) {
  const { finishedOrders = [] } = useOrders();
  const { storeInfo = {} } = useStore();
  const { language, t } = useLanguage();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const currency = storeInfo.currency || "ر.س";
  const sales = finishedOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
  const recentOrders = [...finishedOrders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 30);

  return (
    <>
      <Drawer
        anchor={language === "ar" ? "left" : "right"}
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 430 },
            p: 2,
            background: "rgba(248,250,252,.96)",
            backdropFilter: "blur(22px)",
          },
        }}
      >
        <Stack spacing={2} sx={{ height: "100%" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" fontWeight={900}>{t("orderHistory")}</Typography>
              <Typography variant="body2" color="text.secondary">{t("orderHistoryHint")}</Typography>
            </Box>
            <IconButton onClick={onClose} aria-label="Close">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Box
            sx={{
              p: 2.2,
              borderRadius: 3,
              color: "#fff",
              background: "linear-gradient(135deg,#171A2F 0%,#2E3250 62%,#F47920 180%)",
              boxShadow: "0 18px 38px rgba(23,26,47,.16)",
            }}
          >
            <Typography variant="body2" sx={{ opacity: .76, fontWeight: 700 }}>
              {t("totalSales")}
            </Typography>
            <Typography variant="h4" fontWeight={950} sx={{ mt: .4 }}>
              {sales.toFixed(2)} {currency}
            </Typography>
            <Typography variant="caption" sx={{ opacity: .7 }}>
              {finishedOrders.length} {t("completedOrders")}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ overflowY: "auto", flex: 1, pr: .25 }}>
            <Stack spacing={1}>
              {recentOrders.map((order) => {
                const shortId = String(order.id || "").slice(-6).toUpperCase();
                return (
                  <Box
                    key={order.id}
                    sx={{
                      p: 1.4,
                      borderRadius: 2.5,
                      bgcolor: "#fff",
                      border: "1px solid",
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={.8} alignItems="center">
                        <Chip label={"#" + shortId} size="small" sx={{ fontWeight: 900 }} />
                        <Typography variant="caption" color="text.secondary">
                          {language === "ar" ? "طاولة " + order.table_number : "Table " + order.table_number}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(order.created_at).format("DD/MM/YY · hh:mm A")}
                      </Typography>
                    </Box>
                    <Stack alignItems="flex-end" spacing={.5}>
                      <Typography fontWeight={900}>{order.total_price} {currency}</Typography>
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<PrintRoundedIcon />}
                        onClick={() => setSelectedOrder(order)}
                        sx={{ minWidth: 0 }}
                      >
                        {language === "ar" ? "طباعة" : "Print"}
                      </Button>
                    </Stack>
                  </Box>
                );
              })}
              {!recentOrders.length && (
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <ReceiptLongRoundedIcon sx={{ fontSize: 42, color: "text.disabled", mb: 1 }} />
                  <Typography color="text.secondary">
                    {language === "ar" ? "لا توجد طلبات مكتملة حتى الآن" : "No completed orders yet"}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Stack>
      </Drawer>

      <InvoiceModal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />
    </>
  );
}

export default CashierSalesDrawer;
