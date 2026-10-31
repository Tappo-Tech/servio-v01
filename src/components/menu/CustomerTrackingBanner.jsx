import { useMemo } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { getCustomerTrackingPath, getRecentCustomerOrders } from "../../utils/customerTracking";

export default function CustomerTrackingBanner({ slug, branchSlug = "", tableNumber = "" }) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const records = useMemo(() => getRecentCustomerOrders(slug, branchSlug, Date.now(), tableNumber), [slug, branchSlug, tableNumber]);
  if (!records.length) return null;
  const latest = records[0];
  return (
    <Alert
      icon={<ReceiptLongRoundedIcon />}
      severity="info"
      sx={{ mb: 1.5, borderRadius: 2.5, alignItems: "center", border: "1px solid rgba(244,121,32,.28)", bgcolor: "#FFF8F2", color: "secondary.main", "& .MuiAlert-icon": { color: "primary.main" } }}
      action={<Button size="small" variant="contained" endIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(getCustomerTrackingPath(slug, latest))} sx={{ borderRadius: 2, whiteSpace: "nowrap" }}>{language === "ar" ? "متابعة الطلب" : "Track order"}</Button>}
    >
      <Stack spacing={.15}>
        <Typography variant="body2" fontWeight={900}>{language === "ar" ? `لديك ${records.length} طلب${records.length > 1 ? "ات" : ""} محفوظ${records.length > 1 ? "ة" : ""}` : `${records.length} recent order${records.length > 1 ? "s" : ""}`}</Typography>
        <Typography variant="caption" color="text.secondary">{language === "ar" ? "يمكنك متابعة الطلبات وعرض بياناتها خلال ساعة من هذا الجهاز." : "Track and view orders from this phone for up to one hour."}</Typography>
      </Stack>
    </Alert>
  );
}
