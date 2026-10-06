import { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import supabase from "../../../supabase";
import { useStore } from "../../../context/StoreInfoContext";
import { useShift } from "../../../context/ShiftContext";
import { useLanguage } from "../../../context/LanguageContext";

export default function ShiftSettings() {
  const { storeInfo, refreshStoreInfo } = useStore();
  const { sessions, loadSessions } = useShift();
  const { language } = useLanguage();
  const ar = language !== "en";
  const [form, setForm] = useState({ start: storeInfo?.workday_start?.slice(0, 5) || "08:00", end: storeInfo?.workday_end?.slice(0, 5) || "00:00", hours: storeInfo?.workday_hours || "16" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm({ start: storeInfo?.workday_start?.slice(0, 5) || "08:00", end: storeInfo?.workday_end?.slice(0, 5) || "00:00", hours: storeInfo?.workday_hours || "16" }); }, [storeInfo?.workday_start, storeInfo?.workday_end, storeInfo?.workday_hours]);
  useEffect(() => { void loadSessions(); }, [loadSessions]);

  const saveHours = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    const { error: saveError } = await supabase.from("store").update({ workday_start: form.start || null, workday_end: form.end || null, workday_hours: Number(form.hours) || null }).eq("tenant_id", storeInfo.tenant_id);
    if (saveError) setError(saveError.message); else { setMessage(ar ? "تم حفظ ساعات الدوام." : "Working hours saved."); await refreshStoreInfo?.(); }
    setSaving(false);
  };
  const printSession = (session) => {
    const cashier = session.cashiers?.full_name || session.cashiers?.username || (ar ? "كاشير" : "Cashier");
    const win = window.open("", "_blank", "width=760,height=700");
    if (!win) return;
    win.document.write(`<html dir="${ar ? "rtl" : "ltr"}"><head><title>${ar ? "تقرير وردية" : "Shift report"}</title><style>body{font-family:Arial,sans-serif;padding:28px;line-height:1.8}h1{margin:0 0 16px}table{width:100%;border-collapse:collapse}td{border-bottom:1px solid #ddd;padding:8px}td:last-child{text-align:end;font-weight:bold}</style></head><body><h1>${ar ? "تقرير وردية الكاشير" : "Cashier shift report"}</h1><table>${[[ar ? "الكاشير" : "Cashier", cashier],[ar ? "البداية" : "Opened", new Date(session.opened_at).toLocaleString(ar ? "ar-SA" : "en-US")],[ar ? "النهاية" : "Closed", session.closed_at ? new Date(session.closed_at).toLocaleString(ar ? "ar-SA" : "en-US") : (ar ? "مفتوحة" : "Open")],[ar ? "إجمالي المبيعات" : "Total sales", Number(session.total_sales || 0).toFixed(2)],[ar ? "الكاش" : "Cash", Number(session.cash_sales || 0).toFixed(2)],[ar ? "الشبكة / البطاقة" : "Card / network", Number(session.card_sales || 0).toFixed(2)],[ar ? "المحفظة" : "Wallet", Number(session.wallet_sales || 0).toFixed(2)],[ar ? "التحويل" : "Transfer", Number(session.transfer_sales || 0).toFixed(2)],[ar ? "طرق أخرى" : "Other", Number(session.other_sales || 0).toFixed(2)],[ar ? "بداية الكاش" : "Opening cash", Number(session.opening_cash || 0).toFixed(2)],[ar ? "نهاية الكاش" : "Closing cash", session.closing_cash == null ? "—" : Number(session.closing_cash).toFixed(2)]].map(([a,b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join("")}</table><script>window.print()</script></body></html>`);
    win.document.close();
  };
  return <Box sx={{ maxWidth: 900, mx: "auto" }}>
    <Typography variant="h6" fontWeight={900}>{ar ? "ساعات الدوام والورديات" : "Working hours and shifts"}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{ar ? "حدد وقت بداية ونهاية العمل وعدد الساعات، وراقب جلسات الكاشير وتقارير الإغلاق." : "Set opening and closing times and monitor cashier sessions and closing reports."}</Typography>
    <Paper component="form" onSubmit={saveHours} variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, mb: 3 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}><TextField type="time" label={ar ? "تبدأ الساعة" : "Starts at"} value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} InputLabelProps={{ shrink: true }} inputProps={{ dir: "ltr" }} /><TextField type="time" label={ar ? "تنتهي الساعة" : "Ends at"} value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} InputLabelProps={{ shrink: true }} inputProps={{ dir: "ltr" }} /><TextField type="number" label={ar ? "عدد الساعات" : "Hours"} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} inputProps={{ min: 0, max: 24, step: "0.5", dir: "ltr" }} /><Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : <AccessTimeRoundedIcon />} sx={{ fontWeight: 850 }}>{ar ? "حفظ ساعات الدوام" : "Save hours"}</Button></Stack>
    </Paper>
    {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1 }}>{ar ? "جلسات الكاشير" : "Cashier sessions"}</Typography>
    <Stack spacing={1}>{sessions.map((session) => <Paper key={session.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}><Box sx={{ flex: 1, minWidth: 210 }}><Typography fontWeight={850}>{session.cashiers?.full_name || session.cashiers?.username || (ar ? "كاشير" : "Cashier")}</Typography><Typography variant="caption" color="text.secondary">{new Date(session.opened_at).toLocaleString(ar ? "ar-SA" : "en-US")} → {session.closed_at ? new Date(session.closed_at).toLocaleString(ar ? "ar-SA" : "en-US") : (ar ? "مفتوحة" : "Open")}</Typography></Box><Box><Typography fontWeight={900}>{Number(session.total_sales || 0).toFixed(2)} {storeInfo?.currency || "ر.س"}</Typography><Typography variant="caption" color="text.secondary">{ar ? "كاش" : "Cash"}: {Number(session.cash_sales || 0).toFixed(2)} · {ar ? "شبكة" : "Card"}: {Number(session.card_sales || 0).toFixed(2)}</Typography></Box><Button size="small" variant="outlined" startIcon={<PrintRoundedIcon />} onClick={() => printSession(session)}>{ar ? "طباعة التقرير" : "Print report"}</Button></Paper>)}{!sessions.length && <Divider><Typography variant="caption" color="text.secondary">{ar ? "لا توجد جلسات محفوظة بعد" : "No saved sessions yet"}</Typography></Divider>}</Stack>
  </Box>;
}
