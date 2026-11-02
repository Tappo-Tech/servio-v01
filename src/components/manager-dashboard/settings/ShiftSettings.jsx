// مكوّن واجهة `ShiftSettings` ضمن مجموعة `settings`.
import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Card, CardContent, CircularProgress, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import supabase from "../../../supabase";
import { useStore } from "../../../context/StoreInfoContext";
import { useTenant } from "../../../context/TenantContext";
import { useLanguage } from "../../../context/LanguageContext";
import { formatClockMinutes, parseClockMinutes, summarizeWorkdayShifts } from "../../../utils/workdayUtils";

const DEFAULT_SHIFTS = [{ start: "08:00", end: "00:00" }];

function readStoredShifts(storeInfo = {}) {
  const saved = Array.isArray(storeInfo.workday_shifts)
    ? storeInfo.workday_shifts.filter((shift) => shift && shift.start && shift.end).map(({ start, end }) => ({ start: String(start).slice(0, 5), end: String(end).slice(0, 5) }))
    : [];
  if (saved.length) return saved;
  const hasSavedSchedule = Boolean(storeInfo.workday_start) || Boolean(storeInfo.workday_end) || Number(storeInfo.workday_hours) > 0;
  const startMinutes = parseClockMinutes(storeInfo.workday_start, hasSavedSchedule ? 0 : 8 * 60);
  const storedDuration = Number(storeInfo.workday_hours) * 60;
  const hasStoredDuration = Number.isFinite(storedDuration) && storedDuration > 0 && storedDuration <= 24 * 60;
  const end = hasStoredDuration
    ? formatClockMinutes(startMinutes + Math.round(storedDuration))
    : storeInfo.workday_end
      ? String(storeInfo.workday_end).slice(0, 5)
      : formatClockMinutes(startMinutes + (hasSavedSchedule ? 24 * 60 : 16 * 60));
  return [{
    start: formatClockMinutes(startMinutes),
    end,
  }];
}

export default function ShiftSettings() {
  const { storeInfo = {}, refreshStoreInfo } = useStore();
  const { tenantId } = useTenant();
  const { language } = useLanguage();
  const ar = language !== "en";
  const [shifts, setShifts] = useState(DEFAULT_SHIFTS);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const summary = useMemo(() => summarizeWorkdayShifts(shifts), [shifts]);
  const storedShifts = storeInfo.workday_shifts;
  const storedStart = storeInfo.workday_start;
  const storedEnd = storeInfo.workday_end;
  const storedHours = storeInfo.workday_hours;

  useEffect(() => {
    setShifts(readStoredShifts({ workday_shifts: storedShifts, workday_start: storedStart, workday_end: storedEnd, workday_hours: storedHours }));
  }, [storedShifts, storedStart, storedEnd, storedHours]);

  const updateShift = (index, field, value) => {
    setShifts((current) => current.map((shift, shiftIndex) => shiftIndex === index ? { ...shift, [field]: value } : shift));
  };

  const addShift = () => {
    setShifts((current) => {
      const lastShift = current[current.length - 1] || DEFAULT_SHIFTS[0];
      const start = lastShift.end;
      const end = formatClockMinutes(parseClockMinutes(start, 0) + 8 * 60);
      return [...current, { start, end }];
    });
    setMessage("");
    setError("");
  };

  const removeShift = (index) => {
    setShifts((current) => current.length <= 1 ? current : current.filter((_, shiftIndex) => shiftIndex !== index));
    setMessage("");
    setError("");
  };

  const saveHours = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    if (!tenantId || !summary) {
      setError(ar
        ? "راجع أوقات الشفتات: تأكد من ترتيبها، وعدم تداخلها، وألا يتجاوز الدوام 24 ساعة."
        : "Check shift times: keep them ordered, non-overlapping, and within a 24-hour workday.");
      setSaving(false);
      return;
    }

    const firstShift = shifts[0];
    const lastShift = shifts[shifts.length - 1];
    const { data: updatedStore, error: saveError } = await supabase.from("store").update({
      workday_start: firstShift.start || null,
      workday_end: lastShift.end || null,
      workday_hours: summary.hours,
      workday_shifts: shifts.map(({ start, end }) => ({ start, end })),
    }).eq("tenant_id", tenantId).select("id").maybeSingle();
    if (saveError || !updatedStore) setError(saveError?.message || (ar ? "لم يتم تحديث سجل المتجر؛ تحقق من صلاحيات المدير." : "Store settings were not updated; check manager permissions."));
    else {
      setMessage(ar ? "تم حفظ فترات الدوام المتعددة؛ ستُعرض ساعات التقارير بالترتيب من بداية أول شفت." : "Multiple shifts saved. Report hours will follow the sequence from the first shift.");
      await refreshStoreInfo?.();
    }
    setSaving(false);
  };

  const totalHours = summary ? (Number.isInteger(summary.hours) ? summary.hours : summary.hours.toFixed(2)) : "—";

  return <Box sx={{ maxWidth: 900, mx: "auto" }}>
    <Stack direction="row" spacing={1.2} sx={{ mb: .5, alignItems: "center" }}><AccessTimeRoundedIcon color="primary" /><Typography variant="h6" fontWeight={950}>{ar ? "ساعات الدوام" : "Working hours"}</Typography></Stack>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.25, lineHeight: 1.8 }}>{ar ? "أضف فترة أو أكثر لدوام اليوم. رتّب الشفتات بالتتابع؛ يدعم النظام الفترات الممتدة بعد منتصف الليل ويستخدم بداية أول شفت لترتيب التقارير." : "Add one or more daily shift periods. Keep shifts in sequence; overnight shifts are supported and reports follow the first shift's start."}</Typography>
    <Paper component="form" onSubmit={saveHours} variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
      <Stack spacing={1.5}>
        {shifts.map((shift, index) => {
          const oneShift = summarizeWorkdayShifts([shift]);
          return <Card key={`shift-${index}`} variant="outlined" sx={{ borderRadius: 2.5, bgcolor: "background.default" }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
              <Stack spacing={1.25}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                  <Typography fontWeight={900}>{ar ? `الشفت ${index + 1}` : `Shift ${index + 1}`}</Typography>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    {oneShift && <Typography variant="caption" color="text.secondary">{oneShift.hours} {ar ? "ساعة" : "hours"}</Typography>}
                    <IconButton aria-label={ar ? `حذف الشفت ${index + 1}` : `Remove shift ${index + 1}`} onClick={() => removeShift(index)} disabled={saving || shifts.length <= 1} size="small" color="error">
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <TextField type="time" label={ar ? "بداية الشفت" : "Shift starts"} value={shift.start} onChange={(event) => updateShift(index, "start", event.target.value)} required fullWidth slotProps={{ inputLabel: { shrink: true }, htmlInput: { dir: "ltr" } }} />
                  <TextField type="time" label={ar ? "نهاية الشفت" : "Shift ends"} value={shift.end} onChange={(event) => updateShift(index, "end", event.target.value)} required fullWidth slotProps={{ inputLabel: { shrink: true }, htmlInput: { dir: "ltr" } }} />
                </Stack>
              </Stack>
            </CardContent>
          </Card>;
        })}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between" }}>
          <Button type="button" variant="outlined" onClick={addShift} disabled={saving} startIcon={<AddRoundedIcon />} sx={{ fontWeight: 900, minHeight: 42 }}>
            {ar ? "إضافة شفت" : "Add shift"}
          </Button>
          <Typography variant="body2" color={summary ? "text.secondary" : "error.main"} sx={{ fontWeight: 800 }}>
            {ar ? `إجمالي ساعات الشفتات: ${totalHours} ساعة` : `Total shift hours: ${totalHours} hours`}
          </Typography>
        </Stack>
        {!summary && <Alert severity="warning" sx={{ borderRadius: 2 }}>{ar ? "تأكد من أن الشفتات مرتبة ولا تتداخل، وأن مجموع اليوم لا يتجاوز 24 ساعة." : "Keep shifts ordered and non-overlapping; the full schedule must fit within 24 hours."}</Alert>}
        <Typography variant="caption" color="text.secondary">{ar ? "يُسمح بعبور منتصف الليل. إدخال البداية والنهاية نفسيهما يعني شفتًا كاملًا مدته 24 ساعة ولا يمكن جمعه مع شفت آخر." : "Overnight shifts are supported. Matching start and end times mean one full 24-hour shift, which cannot be combined with another shift."}</Typography>
        <Button type="submit" variant="contained" disabled={saving || !summary} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineRoundedIcon />} sx={{ fontWeight: 900, whiteSpace: "nowrap", minHeight: 42, alignSelf: { xs: "stretch", sm: "flex-end" } }}>
          {ar ? "حفظ الدوام" : "Save hours"}
        </Button>
      </Stack>
    </Paper>
    {message && <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>{message}</Alert>}
    {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
    <Card elevation={0} sx={{ mt: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "background.default" }}><CardContent><Typography fontWeight={850}>{ar ? "تقارير الوردية في مكان مستقل" : "Shift reports have their own section"}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5, lineHeight: 1.7 }}>{ar ? "نُقلت جلسات الكاشير والطباعة إلى تبويب «الورديات» في لوحة المدير، كما أصبحت متاحة للكاشير من لوحة التشغيل." : "Cashier sessions and printing now live under the dedicated Shifts tab in the manager dashboard and are also available to cashiers."}</Typography></CardContent></Card>
  </Box>;
}
