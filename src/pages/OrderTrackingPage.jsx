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
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import supabase from "../supabase";
import { useTenant } from "../context/TenantContext";
import { useLanguage } from "../context/LanguageContext";

const POLL_INTERVAL_MS = 10_000;
const FINISHED_STATUSES = new Set(["served", "unclaimed", "cancelled"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TRACKING_STORAGE_PREFIX = "servio.orderTracking.";

const copy = {
  ar: {
    eyebrow: "SERVIO · متابعة الطلب",
    title: "تتبع طلبك",
    subtitle: "ستتحدث حالة هذا الطلب تلقائيًا. هذه الصفحة لا تعرض أي طلبات أخرى.",
    order: "رقم الطلب",
    submitted: "وقت الإرسال",
    dineIn: "الموقع",
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
    back: "العودة إلى المنيو",
    retry: "إعادة المحاولة",
    lastUpdate: "آخر تحديث",
    live: "تحديث تلقائي كل 10 ثوانٍ أثناء فتح الصفحة",
    unknown: "حالة الطلب",
  },
  en: {
    eyebrow: "SERVIO · ORDER TRACKING",
    title: "Track your order",
    subtitle: "This order's status refreshes automatically. No other orders are shown here.",
    order: "Order reference",
    submitted: "Submitted",
    dineIn: "Location",
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
    back: "Back to menu",
    retry: "Try again",
    lastUpdate: "Last updated",
    live: "Automatically refreshes every 10 seconds while this page is open",
    unknown: "Order status",
  },
};

const statusText = (status, text) => text[status] || text.unknown;

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
      // تتبع الجلسة يستمر باستخدام حالة التنقل إذا كان التخزين محظورًا.
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

  return (
    <Box dir={language === "ar" ? "rtl" : "ltr"} sx={{ minHeight: "100vh", bgcolor: "#f5f6f8", py: { xs: 3, md: 6 }, px: 1.5 }}>
      <Container maxWidth="sm">
        <Stack spacing={2.2}>
          <Box>
            <Typography variant="overline" color="primary.main" fontWeight={900} letterSpacing={1.2}>{text.eyebrow}</Typography>
            <Typography variant="h4" fontWeight={950} sx={{ mt: .4 }}>{text.title}</Typography>
            <Typography color="text.secondary" sx={{ mt: .7 }}>{text.subtitle}</Typography>
          </Box>

          {tenantLoading ? (
            <Paper elevation={0} sx={{ p: 5, textAlign: "center", borderRadius: 3 }}><CircularProgress /></Paper>
          ) : invalidLink || !trackingToken ? (
            <Alert severity="warning" sx={{ borderRadius: 3 }}>
              <Typography fontWeight={900}>{text.invalidTitle}</Typography>
              <Typography variant="body2" sx={{ mt: .5 }}>{text.invalidBody}</Typography>
            </Alert>
          ) : (
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid rgba(23,26,47,.08)" }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack spacing={2.2}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">{storeInfo?.store_name || storeInfo?.name || tenant?.name || "SERVIO"}</Typography>
                      <Typography variant="h6" fontWeight={950}>{text.order} #{orderReference}</Typography>
                    </Box>
                    {order && <Chip color={order.status === "cancelled" ? "error" : order.status === "served" ? "success" : "primary"} label={statusText(order.status, text)} sx={{ fontWeight: 800 }} />}
                  </Stack>

                  {loading && !order ? (
                    <Stack alignItems="center" spacing={1.2} sx={{ py: 3 }}><CircularProgress /><Typography color="text.secondary">{text.loading}</Typography></Stack>
                  ) : order ? (
                    <>
                      {order.status === "cancelled" || order.status === "unclaimed" ? (
                        <Alert severity={order.status === "cancelled" ? "error" : "warning"}>{order.status === "cancelled" ? text.cancelledText : text.unclaimedText}</Alert>
                      ) : (
                        <>
                          <Stepper activeStep={currentStep} alternativeLabel>
                            {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
                          </Stepper>
                          <LinearProgress
                            variant="determinate"
                            value={order.status === "served" ? 100 : Math.max(8, (currentStep / (steps.length - 1)) * 100)}
                            sx={{ height: 7, borderRadius: 8, bgcolor: "rgba(244,121,32,.12)", "& .MuiLinearProgress-bar": { borderRadius: 8 } }}
                          />
                        </>
                      )}

                      <Divider />
                      <Stack direction="row" justifyContent="space-between" gap={2}>
                        <Typography variant="body2" color="text.secondary">{text.submitted}</Typography>
                        <Typography variant="body2" fontWeight={700} textAlign="end">{createdAt}</Typography>
                      </Stack>
                      {order.table_number && (
                        <Stack direction="row" justifyContent="space-between" gap={2}>
                          <Typography variant="body2" color="text.secondary">{text.dineIn}</Typography>
                          <Typography variant="body2" fontWeight={700} textAlign="end">{order.table_number}</Typography>
                        </Stack>
                      )}
                      <Typography variant="caption" color="text.secondary" textAlign="center">{text.live}</Typography>
                    </>
                  ) : null}

                  {loadError && <Alert severity="warning" action={<Button color="inherit" size="small" startIcon={<RefreshRoundedIcon />} onClick={() => window.location.reload()}>{text.retry}</Button>}>{loadError}</Alert>}
                </Stack>
              </CardContent>
            </Card>
          )}

          <Button
            variant="text"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate(`/menu/${encodeURIComponent(slug)}`)}
            sx={{ alignSelf: "flex-start", fontWeight: 800 }}
          >
            {text.back}
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

export default OrderTrackingPage;
