import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import supabase from "../../../supabase";
import { useStore } from "../../../context/StoreInfoContext";
import { useTenant } from "../../../context/TenantContext";
import { useLanguage } from "../../../context/LanguageContext";
import { parseClockMinutes } from "../../../utils/workdayUtils";

function durationFor(start, end) {
  const startMinutes = parseClockMinutes(start, NaN);
  const endMinutes = parseClockMinutes(end, NaN);
  if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) return null;
  const diff = (endMinutes - startMinutes + 1440) % 1440;
  return diff === 0 ? 24 : diff / 60;
}

export default function ShiftSettings() {
  const { storeInfo = {}, refreshStoreInfo } = useStore();
  const { tenantId } = useTenant();
  const { language } = useLanguage();
  const ar = language !== "en";
  const [form, setForm] = useState({ start: "08:00", end: "00:00" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const hours = useMemo(() => durationFor(form.start, form.end), [form.start, form.end]);

  useEffect(() => {
    setForm({ start: storeInfo.workday_start?.slice(0, 5) || "08:00", end: storeInfo.workday_end?.slice(0, 5) || "00:00" });
  }, [storeInfo.workday_start, storeInfo.workday_end]);

  const saveHours = async (event) => {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    if (!tenantId || hours == null || hours <= 0 || hours > 24) {
      setError(ar ? "أدخل وقت بداية ونهاية صحيحًا." : "Enter valid opening and closing times.");
      setSaving(false);
      return;
    }
    const { data: updatedStore, error: saveError } = await supabase.from("store").update({
      workday_start: form.start || null,
      workday_end: form.end || null,
      workday_hours: hours,
    }).eq("tenant_id", tenantId).select("id").maybeSingle();
    if (saveError || !updatedStore) setError(saveError?.message || (ar ? "لم يتم تحديث سجل المتجر؛ تحقق من صلاحيات المدير." : "Store settings were not updated; check manager permissions."));
    else {
      setMessage(ar ? "تم حفظ ساعات الدوام؛ ستُعرض ساعات التقارير بالترتيب بدءًا من وقت الافتتاح." : "Working hours saved. Report hours will start at opening time and run in order.");
      await refreshStoreInfo?.();
    }
    setSaving(false);
  };

  return <Box sx={{ maxWidth: 900, mx: "auto" }}>
    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: .5 }}><AccessTimeRoundedIcon color="primary" /><Typography variant="h6" fontWeight={950}>{ar ? "ساعات الدوام" : "Working hours"}</Typography></Stack>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.25, lineHeight: 1.8 }}>{ar ? "حدد بداية ونهاية يوم العمل. ستُرتّب رسوم المبيعات والتقارير الساعية من بداية دوامك، بما في ذلك الدوام الممتد بعد منتصف الليل." : "Set the opening and closing time. Hourly sales charts and reports will follow your workday sequence, including overnight hours."}</Typography>
    <Paper component="form" onSubmit={saveHours} variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "flex-end" }}>
        <TextField type="time" label={ar ? "تبدأ الوردية" : "Workday starts"} value={form.start} onChange={(event) => setForm((current) => ({ ...current, start: event.target.value }))} InputLabelProps={{ shrink: true }} inputProps={{ dir: "ltr" }} required fullWidth />
        <TextField type="time" label={ar ? "ينتهي الدوام" : "Workday ends"} value={form.end} onChange={(event) => setForm((current) => ({ ...current, end: event.target.value }))} InputLabelProps={{ shrink: true }} inputProps={{ dir: "ltr" }} required fullWidth />
        <TextField label={ar ? "مدة الدوام المحسوبة" : "Calculated duration"} value={hours == null ? "—" : `${hours} ${ar ? "ساعة" : "hours"}`} InputProps={{ readOnly: true }} fullWidth />
        <Button type="submit" variant="contained" disabled={saving || hours == null} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineRoundedIcon />} sx={{ fontWeight: 900, whiteSpace: "nowrap", minHeight: 42 }}>{ar ? "حفظ الدوام" : "Save hours"}</Button>
      </Stack>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>{ar ? "إذا كان وقت النهاية أسبق من البداية، يُحسب تلقائيًا أنه في اليوم التالي. إدخال وقت البداية والنهاية نفسيهما يعني دوامًا كاملًا (24 ساعة)." : "If the end time is earlier than the start, it is treated as the next day. Matching start and end times mean a full 24-hour day."}</Typography>
    </Paper>
    {message && <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>{message}</Alert>}
    {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
    <Card elevation={0} sx={{ mt: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "background.default" }}><CardContent><Typography fontWeight={850}>{ar ? "تقارير الوردية في مكان مستقل" : "Shift reports have their own section"}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5, lineHeight: 1.7 }}>{ar ? "نُقلت جلسات الكاشير والطباعة إلى تبويب «الورديات» في لوحة المدير، كما أصبحت متاحة للكاشير من لوحة التشغيل." : "Cashier sessions and printing now live under the dedicated Shifts tab in the manager dashboard and are also available to cashiers."}</Typography></CardContent></Card>
  </Box>;
}
