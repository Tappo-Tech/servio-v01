import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, IconButton, Stack, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import TableRestaurantRoundedIcon from "@mui/icons-material/TableRestaurantRounded";
import { useOrders } from "../../../context/OrdersContext";
import { useLanguage } from "../../../context/LanguageContext";

export default function NewTableOrderAlert() {
  const { newTableOrderAlert, dismissNewTableOrderAlert } = useOrders();
  const { language } = useLanguage();
  const navigate = useNavigate();
  if (!newTableOrderAlert) return null;

  const table = newTableOrderAlert.table_number || (language === "ar" ? "غير محددة" : "Unknown");
  const orderNumber = newTableOrderAlert.order_number || newTableOrderAlert.displayOrderNumber || "—";
  const goToLiveOrders = () => {
    dismissNewTableOrderAlert();
    navigate("/dashboard", { state: { openLiveOrders: true } });
  };

  return (
    <Box sx={{ position: "fixed", top: { xs: 10, sm: 18 }, insetInline: { xs: 10, sm: 24 }, zIndex: (theme) => theme.zIndex.snackbar + 20, pointerEvents: "none" }}>
      <Alert
        severity="warning"
        icon={<NotificationsActiveRoundedIcon sx={{ fontSize: { xs: 28, sm: 34 } }} />}
        action={<IconButton aria-label={language === "ar" ? "إغلاق تنبيه الطلب" : "Close order alert"} onClick={dismissNewTableOrderAlert} color="inherit" sx={{ pointerEvents: "auto" }}><CloseRoundedIcon /></IconButton>}
        sx={{
          pointerEvents: "auto",
          alignItems: "flex-start",
          borderRadius: { xs: 3, sm: 4 },
          color: "#171A2F",
          background: "linear-gradient(115deg, rgba(255,248,241,.98), rgba(255,224,194,.96) 58%, rgba(244,121,32,.94))",
          border: "2px solid rgba(244,121,32,.72)",
          boxShadow: "0 18px 55px rgba(244,121,32,.32), 0 8px 22px rgba(23,26,47,.14)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          animation: "servioAlertPulse 1.65s ease-in-out infinite",
          "& .MuiAlert-icon": { color: "#D96210", mt: .2 },
          "& .MuiAlert-message": { width: "100%", minWidth: 0 },
          "@keyframes servioAlertPulse": { "0%, 100%": { transform: "scale(1)", boxShadow: "0 18px 55px rgba(244,121,32,.28), 0 8px 22px rgba(23,26,47,.14)" }, "50%": { transform: "scale(1.012)", boxShadow: "0 20px 70px rgba(244,121,32,.48), 0 8px 22px rgba(23,26,47,.18)" } },
        }}
      >
        <Stack spacing={.65} sx={{ pr: .5 }}>
          <Typography sx={{ fontWeight: 950, fontSize: { xs: "1rem", sm: "1.15rem" } }}>{language === "ar" ? "طلب جديد من الطاولة" : "New table order"}</Typography>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Stack direction="row" spacing={.45} alignItems="center"><TableRestaurantRoundedIcon sx={{ fontSize: 19, color: "#D96210" }} /><Typography variant="body2" fontWeight={900}>{language === "ar" ? `طاولة ${table}` : `Table ${table}`}</Typography></Stack>
            <Typography variant="body2" fontWeight={900}>{language === "ar" ? `طلب #${orderNumber}` : `Order #${orderNumber}`}</Typography>
          </Stack>
          <Button size="small" variant="contained" endIcon={<ArrowBackRoundedIcon />} onClick={goToLiveOrders} sx={{ alignSelf: "flex-start", mt: .35, minHeight: 38, borderRadius: 2, bgcolor: "#171A2F", color: "#fff", fontWeight: 900, "&:hover": { bgcolor: "#0B0D1A" } }}>
            {language === "ar" ? "فتح اللايف أوردرز" : "Open live orders"}
          </Button>
        </Stack>
      </Alert>
    </Box>
  );
}
