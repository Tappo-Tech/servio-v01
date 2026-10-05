import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import TrialNotice from "../components/TrialNotice";
import supabase from "../supabase";
import { useTenant } from "../context/TenantContext";
import { useLanguage } from "../context/LanguageContext";
import { buildMenuReturnPath } from "../utils/orderTrackingRoutes";

const POLL_INTERVAL_MS = 10_000;
const FINISHED_STATUSES = new Set(["served", "unclaimed", "cancelled"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TRACKING_STORAGE_PREFIX = "servio.orderTracking.";

const copy = {
  ar: {
    eyebrow: "متابعة الطلب",
    title: "طلبك، خطوة بخطوة",
    subtitle: "تابع حالة طلبك فقط؛ تتحدث تلقائيًا دون عرض أي طلبات أخرى.",
    order: "رقم الطلب",
    submitted: "وقت الإرسال",
    dineIn: "رقم الطاولة",
    progress: "تقدم الطلب",
    pending: "تم استلام الطلب",
    preparing: "قيد التحضير",
    ready: "جاهز للتسليم",
    served: "تم التسليم",
    cancelled: "تم إلغاء الطلب",
    unclaimed: "لم يُستلم الطلب",
    steps: ["استلام الطلب", "التحضير", "جاهز", "التسليم"],
    cancelledText: "تم إلغاء هذا الطلب. يرجى مراجعة فريق المتجر للمساعدة.",
    unclaimedText: "تم تسجيل الطلب على أنه لم يُستلم.",
    loading: "جارٍ تحميل حالة الطلب…",
    unavailable: "تعذر تحميل حالة الطلب الآن. سنحاول مجددًا تلقائيًا.",
    invalidTitle: "تعذر فتح التتبع",
    invalidBody: "رابط التتبع غير صالح أو لا يخص هذا الطلب. افتح صفحة التتبع من الجهاز الذي أرسل منه الطلب.",
    back: "العودة إلى منيو الطاولة",
    retry: "إعادة المحاولة",
    live: "تحديث تلقائي كل 10 ثوانٍ ما دامت الصفحة مفتوحة",
    storeFallback: "طلبك لدى",
    statusLabel: "الحالة الحالية",
    unavailableStatus: "حالة الطلب",
  },
  en: {
    eyebrow: "ORDER TRACKING",
    title: "Your order, step by step",
    subtitle: "Track this order only. Its status refreshes automatically; no other orders are shown.",
    order: "Order reference",
    submitted: "Submitted",
    dineIn: "Table number",
    progress: "Order progress",
    pending: "Order received",
    preparing: "Preparing",
    ready: "Ready for pickup",
    served: "Delivered",
    cancelled: "Order cancelled",
    unclaimed: "Not collected",
    steps: ["Received", "Preparing", "Ready", "Delivered"],
    cancelledText: "This order was cancelled. Please contact the store team for help.",
    unclaimedText: "This order was marked as not collected.",
    loading: "Loading order status…",
    unavailable: "The order status could not be loaded. We will retry automatically.",
    invalidTitle: "Tracking unavailable",
    invalidBody: "This tracking link is invalid or does not belong to this order. Open tracking on the device used to place the order.",
    back: "Back to this table's menu",
    retry: "Try again",
    live: "Automatically refreshes every 10 seconds while this page is open",
    storeFallback: "Your order at",
    statusLabel: "Current status",
    unavailableStatus: "Order status",
  },
};

const statusText = (status, text) => text[status] || text.unavailableStatus;

function OrderTrackingPage() {
  const { slug = "", orderId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { tenant, storeInfo, loading: tenantLoading } = useTenant();
  const { language } = useLanguage();
  const text = copy[language] || copy.ar;
  const storageKey = `${TRACKING_STORAGE_PREFIX}${slug}.${orderId}`;

  const [trackingToken, setTrackingToken] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invalidLink, setInvalidLink] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let token = location.state?.trackingToken || "";
    try {
      if (token) window.sessionStorage.setItem(storageKey, token);
      else token = window.sessionStorage.getItem(storageKey) || "";
    } catch {
      // إذا منع المتصفح التخزين، يستمر التتبع باستخدام رمز حالة التنقل الحالية.
    }
    setTrackingToken(token);
  }, [location.state?.trackingToken, storageKey]);

  useEffect(() => {
    if (!trackingToken) {
      setLoading(false);
      return undefined;
    }
    if (invalidLink) {
      setLoading(false);
      return undefined;
    }
    if (!UUID_PATTERN.test(orderId)) {
      setLoading(false);
      setInvalidLink(true);
      return undefined;
    }

    let active = true;
    let inFlight = false;

    const refreshStatus = async (showSpinner = false) => {
      if (!active || inFlight) return;
      inFlight = true;
      if (showSpinner) setLoading(true);
      try {
        const { data, error } = await supabase.rpc("get_public_order_tracking", {
          p_slug: slug,
          p_order_id: orderId,
          p_tracking_token: trackingToken,
        });
        if (!active) return;
        if (error) {
          setLoadError(text.unavailable);
        } else if (!data) {
          setInvalidLink(true);
          setLoadError("");
        } else {
          setOrder(data);
          setInvalidLink(false);
          setLoadError("");
        }
      } catch {
        if (active) setLoadError(text.unavailable);
      } finally {
        inFlight = false;
        if (active) setLoading(false);
      }
    };

    void refreshStatus(true);
    const terminal = FINISHED_STATUSES.has(order?.status) || invalidLink;
    const timer = terminal ? null : window.setInterval(() => {
      if (document.visibilityState !== "hidden") void refreshStatus(false);
    }, POLL_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && !terminal) void refreshStatus(false);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [trackingToken, slug, orderId, order?.status, invalidLink, text.unavailable]);

  const steps = text.steps;
  const currentStep = Math.max(0, ["pending", "preparing", "ready", "served"].indexOf(order?.status));
  const orderReference = orderId ? orderId.slice(-6).toUpperCase() : "—";
  const createdAt = order?.created_at
    ? new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.created_at))
    : "—";
  // نستخدم رقم الطاولة الذي أعادته RPC المقيدة، ونحتفظ بما مرره تدفق الطلب قبل اكتمال أول قراءة.
  const returnTable = order?.table_number || location.state?.tableNumber || "";
  const menuReturnPath = buildMenuReturnPath(slug, returnTable);
  const storeName = storeInfo?.store_name || storeInfo?.name || tenant?.name || "SERVIO";
  const orderStatusColor = order?.status === "cancelled" ? "error" : order?.status === "unclaimed" ? "warning" : order?.status === "served" ? "success" : "primary";
  const progressValue = order?.status === "served" ? 100 : Math.max(8, (currentStep / (steps.length - 1)) * 100);

  return (
    <Box
      component="main"
      dir={language === "ar" ? "rtl" : "ltr"}
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "radial-gradient(circle at 92% 0%, rgba(244,121,32,.14), transparent 28%), radial-gradient(circle at 0% 70%, rgba(43,54,91,.08), transparent 25%), #f6f7fa",
        py: { xs: 2, md: 5 },
        px: 1.2,
      }}
    >
      <Container maxWidth="sm" sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Stack spacing={{ xs: 2, sm: 2.5 }} sx={{ width: "100%", my: "auto" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box component="img" src="/logo-icon.webp" alt="SERVIO" sx={{ width: 38, height: 38, objectFit: "contain" }} />
              <Typography fontWeight={950} color="secondary.main" letterSpacing=".04em">SERVIO</Typography>
            </Stack>
            <Chip
              icon={<StorefrontRoundedIcon />}
              label={text.eyebrow}
              size="small"
              sx={{ bgcolor: "rgba(255,255,255,.78)", border: "1px solid rgba(23,26,47,.08)", fontWeight: 800 }}
            />
          </Stack>

          <Box>
            <Typography variant="h4" component="h1" fontWeight={950} letterSpacing="-.035em" sx={{ fontSize: { xs: "1.8rem", sm: "2.2rem" } }}>
              {text.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: .7, lineHeight: 1.8 }}>{text.subtitle}</Typography>
          </Box>

          {tenantLoading ? (
            <Paper elevation={0} sx={{ p: 5, textAlign: "center", borderRadius: 4, border: "1px solid rgba(23,26,47,.07)" }}>
              <CircularProgress />
              <Typography color="text.secondary" sx={{ mt: 1.2 }}>{text.loading}</Typography>
            </Paper>
          ) : invalidLink || !trackingToken ? (
            <Alert severity="warning" sx={{ borderRadius: 3, alignItems: "flex-start" }}>
              <Typography fontWeight={900}>{text.invalidTitle}</Typography>
              <Typography variant="body2" sx={{ mt: .5, lineHeight: 1.8 }}>{text.invalidBody}</Typography>
            </Alert>
          ) : (
            <Card elevation={0} sx={{ borderRadius: { xs: 3.5, sm: 4.5 }, border: "1px solid rgba(23,26,47,.08)", boxShadow: "0 20px 60px rgba(23,26,47,.08)", overflow: "hidden" }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2.5 }, "&:last-child": { pb: { xs: 1.5, sm: 2.5 } } }}>
                <Stack spacing={{ xs: 1.5, sm: 2 }}>
                  <Box sx={{ p: { xs: 1.8, sm: 2.4 }, borderRadius: 3, color: "#fff", background: "linear-gradient(125deg, #252a46 0%, #363d62 100%)", position: "relative", overflow: "hidden" }}>
                    <Box aria-hidden="true" sx={{ position: "absolute", width: 150, height: 150, borderRadius: "50%", bgcolor: "rgba(255,255,255,.06)", insetInlineEnd: -48, top: -75 }} />
                    <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" gap={1.3} sx={{ position: "relative" }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{ display: "block", opacity: .72, mb: .35 }}>{storeName}</Typography>
                        <Typography variant="caption" sx={{ opacity: .72 }}>{text.order}</Typography>
                        <Typography variant="h4" fontWeight={950} sx={{ lineHeight: 1.1, mt: .2, letterSpacing: ".03em" }}>#{orderReference}</Typography>
                      </Box>
                      {order && <Chip color={orderStatusColor} label={statusText(order.status, text)} sx={{ fontWeight: 850, maxWidth: "100%" }} />}
                    </Stack>
                  </Box>

                  {loading && !order ? (
                    <Stack alignItems="center" spacing={1.2} sx={{ py: 3 }}><CircularProgress /><Typography color="text.secondary">{text.loading}</Typography></Stack>
                  ) : order ? (
                    <>
                      {order.status === "cancelled" || order.status === "unclaimed" ? (
                        <Alert severity={order.status === "cancelled" ? "error" : "warning"} sx={{ borderRadius: 2.5, lineHeight: 1.7 }}>
                          {order.status === "cancelled" ? text.cancelledText : text.unclaimedText}
                        </Alert>
                      ) : (
                        <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, bgcolor: "#fbfbfd", border: "1px solid rgba(23,26,47,.07)" }}>
                          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">{text.progress}</Typography>
                              <Typography fontWeight={900} sx={{ mt: .25 }}>{statusText(order.status, text)}</Typography>
                            </Box>
                            <Chip size="small" color="success" variant="outlined" label="LIVE" sx={{ fontWeight: 900, letterSpacing: ".06em" }} />
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={progressValue}
                            sx={{ mt: 1.5, mb: 2, height: 7, borderRadius: 8, bgcolor: "rgba(244,121,32,.12)", "& .MuiLinearProgress-bar": { borderRadius: 8 } }}
                          />
                          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: .5 }}>
                            {steps.map((label, index) => {
                              const complete = index < currentStep || (order.status === "served" && index === 3);
                              const active = index === currentStep;
                              return (
                                <Box key={label} sx={{ minWidth: 0, textAlign: "center" }}>
                                  <Box
                                    aria-current={active ? "step" : undefined}
                                    sx={{
                                      width: { xs: 30, sm: 34 }, height: { xs: 30, sm: 34 }, mx: "auto", mb: .7,
                                      borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 900,
                                      color: complete || active ? "#fff" : "text.secondary",
                                      bgcolor: complete || active ? "primary.main" : "rgba(23,26,47,.08)",
                                      boxShadow: active ? "0 0 0 4px rgba(244,121,32,.14)" : "none",
                                    }}
                                  >
                                    {complete ? "✓" : index + 1}
                                  </Box>
                                  <Typography variant="caption" sx={{ display: "block", fontSize: { xs: ".62rem", sm: ".72rem" }, fontWeight: active ? 850 : 650, color: active ? "text.primary" : "text.secondary", lineHeight: 1.45, overflowWrap: "anywhere" }}>
                                    {label}
                                  </Typography>
                                </Box>
                              );
                            })}
                          </Box>
                        </Paper>
                      )}

                      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: order?.table_number ? "1fr 1fr" : "1fr" }, gap: 1 }}>
                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "#fff", border: "1px solid rgba(23,26,47,.07)" }}>
                          <Typography variant="caption" color="text.secondary">{text.submitted}</Typography>
                          <Typography variant="body2" fontWeight={800} sx={{ mt: .35 }}>{createdAt}</Typography>
                        </Paper>
                        {order.table_number && (
                          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "#fff", border: "1px solid rgba(23,26,47,.07)" }}>
                            <Typography variant="caption" color="text.secondary">{text.dineIn}</Typography>
                            <Typography variant="body2" fontWeight={800} sx={{ mt: .35 }}>{order.table_number}</Typography>
                          </Paper>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ lineHeight: 1.7 }}>{text.live}</Typography>
                    </>
                  ) : null}

                  {loadError && (
                    <Alert
                      severity="warning"
                      action={<Button color="inherit" size="small" startIcon={<RefreshRoundedIcon />} onClick={() => window.location.reload()}>{text.retry}</Button>}
                      sx={{ borderRadius: 2.5 }}
                    >
                      {loadError}
                    </Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}

          <Button
            variant="outlined"
            fullWidth
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate(menuReturnPath)}
            sx={{ minHeight: 48, borderRadius: 2.5, fontWeight: 850, bgcolor: "rgba(255,255,255,.66)" }}
          >
            {text.back}
          </Button>
        </Stack>
        <TrialNotice />
      </Container>
    </Box>
  );
}

export default OrderTrackingPage;
