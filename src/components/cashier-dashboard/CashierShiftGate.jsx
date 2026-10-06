import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useLanguage } from "../../context/LanguageContext";
import { useUser } from "../../context/UserContext";
import { useShift } from "../../context/ShiftContext";
import { useStore } from "../../context/StoreInfoContext";

function ShiftMetric({ icon, label, value }) {
  return (
    <Box
      sx={{
        minWidth: 0,
        p: { xs: 1.1, sm: 1.35 },
        borderRadius: 2.5,
        border: "1px solid rgba(23,26,47,.07)",
        bgcolor: "rgba(255,255,255,.86)",
      }}
    >
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "text.secondary" }}>
        {icon}
        <Typography variant="caption" fontWeight={750} sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
          {label}
        </Typography>
      </Stack>
      <Typography
        sx={{
          mt: 0.55,
          fontWeight: 950,
          fontSize: { xs: ".88rem", sm: ".98rem" },
          fontVariantNumeric: "tabular-nums",
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function formatDuration(minutes, ar) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (ar) {
    if (hours >= 24) return `${Math.floor(hours / 24)} يوم · ${hours % 24} س ${remainingMinutes} د`;
    return `${hours} س ${remainingMinutes} د`;
  }
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h ${remainingMinutes}m`;
  return `${hours}h ${remainingMinutes}m`;
}

function ShiftDialog({
  open,
  kind,
  ar,
  currency,
  amount,
  setAmount,
  notes,
  setNotes,
  busy,
  error,
  schedule,
  mobile,
  onClose,
  onConfirm,
}) {
  const starting = kind === "start";
  const title = starting
    ? (ar ? "بدء وردية جديدة" : "Start a new shift")
    : (ar ? "إنهاء الوردية الحالية" : "Close the current shift");

  return (
    <Dialog
      open={open}
      onClose={() => !busy && onClose()}
      fullScreen={mobile}
      fullWidth
      maxWidth="sm"
      aria-labelledby="shift-dialog-title"
    >
      <Box sx={{ bgcolor: "secondary.main", color: "common.white" }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: { xs: 2, sm: 2.5 }, py: 2 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              flex: "0 0 auto",
              display: "grid",
              placeItems: "center",
              borderRadius: 2.5,
              color: "primary.light",
              bgcolor: "rgba(255,255,255,.10)",
            }}
          >
            {starting ? <PlayCircleOutlineRoundedIcon /> : <StopCircleOutlinedIcon />}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="overline" sx={{ display: "block", color: "rgba(255,255,255,.68)", fontWeight: 800, lineHeight: 1.25 }}>
              {ar ? "إدارة الوردية" : "SHIFT MANAGEMENT"}
            </Typography>
            <Typography id="shift-dialog-title" component="h2" variant="h6" fontWeight={900}>
              {title}
            </Typography>
          </Box>
          <IconButton
            aria-label={ar ? "إغلاق النافذة" : "Close dialog"}
            onClick={onClose}
            disabled={busy}
            sx={{ color: "common.white", flex: "0 0 auto" }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </Box>

      <DialogContent dir={ar ? "rtl" : "ltr"} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.85 }}>
          {starting
            ? (ar
              ? "أدخل النقد الفعلي الموجود في الدرج. تبدأ الوردية وتُسجّل المبيعات بعد التأكيد فقط."
              : "Enter the actual cash in the drawer. The shift and sales tracking begin only after confirmation.")
            : (ar
              ? "طابق درج النقدية ثم أدخل الرصيد الفعلي. سيُحفظ ملخص المبيعات ضمن تقرير هذه الوردية."
              : "Reconcile the cash drawer and enter the actual balance. Sales totals will be saved in this shift report.")}
        </Typography>

        {schedule && (
          <Paper variant="outlined" sx={{ mb: 2, px: 1.4, py: 1.1, borderRadius: 2.5, bgcolor: "action.hover" }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AccessTimeRoundedIcon fontSize="small" color="primary" />
              <Typography variant="body2" color="text.secondary">
                {ar ? "ساعات العمل المحددة" : "Configured working hours"}
              </Typography>
              <Typography variant="body2" fontWeight={850} sx={{ marginInlineStart: "auto", direction: "ltr" }}>
                {schedule}
              </Typography>
            </Stack>
          </Paper>
        )}

        <Stack spacing={1.6}>
          <TextField
            autoFocus={!mobile}
            fullWidth
            label={starting
              ? (ar ? "رصيد بداية الدرج" : "Opening cash float")
              : (ar ? "الرصيد الفعلي عند الإغلاق" : "Actual closing cash")}
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputProps={{ min: 0, step: "0.01", inputMode: "decimal", dir: "ltr" }}
            InputProps={{ startAdornment: <InputAdornment position="start">{currency}</InputAdornment> }}
            helperText={starting
              ? (ar ? "أدخل 0 إذا لم يوجد نقد في الدرج عند بداية الوردية." : "Enter 0 if there is no cash in the drawer at opening.")
              : (ar ? "استخدم المبلغ الموجود فعليًا بعد عدّ النقد." : "Enter the amount physically present after counting cash.")}
          />
          {!starting && (
            <TextField
              fullWidth
              multiline
              minRows={2}
              label={ar ? "ملاحظات الإغلاق (اختياري)" : "Closing notes (optional)"}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          )}
        </Stack>

        {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
      </DialogContent>

      <DialogActions
        sx={{
          p: { xs: 2, sm: 2.5 },
          pt: { xs: 0, sm: 1 },
          gap: 1,
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          "& .MuiButton-root": { minHeight: 46, borderRadius: 2.2, fontWeight: 850 },
        }}
      >
        <Button onClick={onClose} disabled={busy} color="inherit" fullWidth={mobile}>
          {ar ? "إلغاء" : "Cancel"}
        </Button>
        <Button
          variant="contained"
          color={starting ? "primary" : "error"}
          disabled={busy || amount === "" || !Number.isFinite(Number(amount)) || Number(amount) < 0}
          onClick={onConfirm}
          startIcon={busy ? undefined : (starting ? <PlayCircleOutlineRoundedIcon /> : <CheckCircleRoundedIcon />)}
          fullWidth={mobile}
        >
          {busy
            ? (starting ? (ar ? "جارٍ بدء الوردية…" : "Starting shift…") : (ar ? "جارٍ حفظ الإغلاق…" : "Saving closure…"))
            : (starting ? (ar ? "تأكيد وبدء الوردية" : "Confirm and start shift") : (ar ? "حفظ وإنهاء الوردية" : "Save and close shift"))}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function CashierShiftGate() {
  const { user } = useUser();
  const { language } = useLanguage();
  const { storeInfo = {} } = useStore();
  const { currentShift, loading, error, openShift, closeShift } = useShift();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [openCash, setOpenCash] = useState("0");
  const [closeCash, setCloseCash] = useState("");
  const [notes, setNotes] = useState("");
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const ar = language !== "en";
  const currency = storeInfo.currency || (ar ? "ر.س" : "SAR");
  const schedule = storeInfo.workday_start && storeInfo.workday_end
    ? `${String(storeInfo.workday_start).slice(0, 5)} – ${String(storeInfo.workday_end).slice(0, 5)}`
    : null;
  const openedAt = currentShift?.opened_at;

  useEffect(() => {
    if (!openedAt) return undefined;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [openedAt]);

  if (user?.role !== "cashier") return null;

  const openedTimestamp = openedAt ? new Date(openedAt).getTime() : NaN;
  const elapsedMinutes = Number.isFinite(openedTimestamp)
    ? Math.max(0, Math.floor((now - openedTimestamp) / 60_000))
    : 0;
  const openedTime = openedAt
    ? new Date(openedAt).toLocaleTimeString(ar ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })
    : "—";
  const formatMoney = (value) => new Intl.NumberFormat(ar ? "ar-SA" : "en-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

  const start = async () => {
    const amount = Number(openCash);
    if (!Number.isFinite(amount) || amount < 0 || busy) return;
    setBusy(true);
    setActionError("");
    try {
      const result = await openShift(amount);
      if (result?.error) setActionError(ar ? "تعذر بدء الوردية. تحقق من الاتصال ثم أعد المحاولة." : "Could not start the shift. Check the connection and retry.");
      else setDialog(null);
    } catch {
      setActionError(ar ? "تعذر بدء الوردية. تحقق من الاتصال ثم أعد المحاولة." : "Could not start the shift. Check the connection and retry.");
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    const amount = Number(closeCash);
    if (!Number.isFinite(amount) || amount < 0 || busy) return;
    setBusy(true);
    setActionError("");
    try {
      const result = await closeShift(amount, notes);
      if (result?.error) setActionError(ar ? "تعذر إغلاق الوردية. أعد المحاولة قبل مغادرة الحساب." : "Could not close the shift. Retry before leaving this account.");
      else {
        setDialog(null);
        setCloseCash("");
        setNotes("");
      }
    } catch {
      setActionError(ar ? "تعذر إغلاق الوردية. أعد المحاولة قبل مغادرة الحساب." : "Could not close the shift. Retry before leaving this account.");
    } finally {
      setBusy(false);
    }
  };

  const openDialog = (kind) => {
    setActionError("");
    setDialog(kind);
  };
  const closeDialog = () => {
    if (busy) return;
    setActionError("");
    setDialog(null);
  };

  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2.5 }}>{error}</Alert>}

      {loading ? (
        <Paper variant="outlined" sx={{ mb: 1.5, p: 2, borderRadius: 3, borderColor: "divider" }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Skeleton variant="rounded" width={48} height={48} />
            <Box sx={{ flex: 1 }}><Skeleton width="42%" /><Skeleton width="68%" /></Box>
          </Stack>
        </Paper>
      ) : !currentShift ? (
        <Paper
          component="section"
          aria-labelledby="shift-gate-title"
          elevation={0}
          sx={{
            mb: 1.7,
            p: { xs: 1.7, sm: 2.2 },
            position: "relative",
            overflow: "hidden",
            borderRadius: 3.5,
            color: "common.white",
            background: "linear-gradient(118deg, #171A2F 0%, #262B49 100%)",
            boxShadow: "0 14px 34px rgba(23,26,47,.14)",
            "&::after": {
              content: '""',
              position: "absolute",
              width: 190,
              height: 190,
              insetInlineEnd: -88,
              top: -105,
              borderRadius: "50%",
              border: "30px solid rgba(244,121,32,.18)",
              pointerEvents: "none",
            },
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" gap={2} sx={{ position: "relative", zIndex: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
              <Box sx={{ width: 46, height: 46, display: "grid", placeItems: "center", flex: "0 0 auto", borderRadius: 2.7, color: "primary.light", bgcolor: "rgba(255,255,255,.10)" }}>
                <AccessTimeRoundedIcon />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: .55 }}>
                  <Chip size="small" label={ar ? "غير نشطة" : "NOT STARTED"} sx={{ height: 23, color: "#FFD9BE", bgcolor: "rgba(244,121,32,.18)", fontWeight: 850, borderRadius: 1.5 }} />
                  {schedule && <Typography variant="caption" sx={{ color: "rgba(255,255,255,.68)" }}>{ar ? "الدوام" : "Hours"}: {schedule}</Typography>}
                </Stack>
                <Typography id="shift-gate-title" variant="h6" fontWeight={950} sx={{ fontSize: { xs: "1.05rem", sm: "1.2rem" }, lineHeight: 1.35 }}>
                  {ar ? "ابدأ ورديتك لتسجيل المبيعات" : "Start your shift to record sales"}
                </Typography>
                <Typography variant="body2" sx={{ mt: .5, maxWidth: 620, color: "rgba(255,255,255,.72)", lineHeight: 1.65 }}>
                  {ar ? "أدخل رصيد درج النقدية أولاً؛ بعدها يمكنك اعتماد المبيعات ومراجعة تقرير الوردية." : "Record the opening cash first, then complete sales and review the shift report."}
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayCircleOutlineRoundedIcon />}
              onClick={() => openDialog("start")}
              sx={{ minWidth: { sm: 190 }, minHeight: 48, borderRadius: 2.5, fontWeight: 900, boxShadow: "0 9px 20px rgba(244,121,32,.24)" }}
            >
              {ar ? "بدء الوردية" : "Start shift"}
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Paper
          component="section"
          aria-labelledby="active-shift-title"
          elevation={0}
          sx={{
            mb: 1.7,
            p: { xs: 1.5, sm: 2 },
            borderRadius: 3.5,
            border: "1px solid rgba(22,163,74,.18)",
            background: "linear-gradient(115deg, rgba(22,163,74,.07), rgba(255,255,255,.96) 52%)",
            boxShadow: "0 10px 28px rgba(23,26,47,.045)",
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1.5}>
            <Stack direction="row" alignItems="center" spacing={1.2} sx={{ minWidth: 0 }}>
              <Box sx={{ width: 42, height: 42, display: "grid", placeItems: "center", flex: "0 0 auto", borderRadius: 2.5, color: "success.main", bgcolor: "rgba(22,163,74,.10)" }}>
                <CheckCircleRoundedIcon />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                  <Typography id="active-shift-title" fontWeight={950}>{ar ? "الوردية نشطة" : "Shift is active"}</Typography>
                  <Chip size="small" color="success" label={ar ? "مفتوحة" : "OPEN"} sx={{ height: 22, fontWeight: 850 }} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: .2 }}>
                  {ar ? "بدأت الساعة" : "Started at"} {openedTime}
                </Typography>
              </Box>
            </Stack>
            <Button
              color="error"
              variant="outlined"
              startIcon={<StopCircleOutlinedIcon />}
              onClick={() => openDialog("close")}
              sx={{ minHeight: 44, borderRadius: 2.2, fontWeight: 850, alignSelf: { xs: "stretch", sm: "auto" } }}
            >
              {ar ? "إنهاء الوردية" : "End shift"}
            </Button>
          </Stack>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", sm: "repeat(3,minmax(0,1fr))" }, gap: 1, mt: 1.5 }}>
            <ShiftMetric
              icon={<AccessTimeRoundedIcon sx={{ fontSize: 16 }} />}
              label={ar ? "المدة المنقضية" : "Elapsed"}
              value={formatDuration(elapsedMinutes, ar)}
            />
            <ShiftMetric
              icon={<AccountBalanceWalletOutlinedIcon sx={{ fontSize: 16 }} />}
              label={ar ? "رصيد بداية الدرج" : "Opening cash"}
              value={`${formatMoney(currentShift.opening_cash)} ${currency}`}
            />
            <Box sx={{ gridColumn: { xs: "1 / -1", sm: "auto" } }}>
              <ShiftMetric
                icon={<CheckCircleRoundedIcon sx={{ fontSize: 16 }} />}
                label={ar ? "حالة تسجيل المبيعات" : "Sales tracking"}
                value={ar ? "يُسجّل تلقائيًا" : "Recording"}
              />
            </Box>
          </Box>
        </Paper>
      )}

      <ShiftDialog
        open={dialog === "start" || dialog === "close"}
        kind={dialog}
        ar={ar}
        currency={currency}
        amount={dialog === "start" ? openCash : closeCash}
        setAmount={dialog === "start" ? setOpenCash : setCloseCash}
        notes={notes}
        setNotes={setNotes}
        busy={busy}
        error={actionError}
        schedule={schedule}
        mobile={mobile}
        onClose={closeDialog}
        onConfirm={dialog === "start" ? start : finish}
      />
    </>
  );
}
