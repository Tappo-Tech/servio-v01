import { useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, TextField, Typography } from "@mui/material";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import { useLanguage } from "../../context/LanguageContext";
import { useUser } from "../../context/UserContext";
import { useShift } from "../../context/ShiftContext";

export default function CashierShiftGate() {
  const { user } = useUser();
  const { language } = useLanguage();
  const { currentShift, loading, error, openShift, closeShift } = useShift();
  const [openCash, setOpenCash] = useState("0");
  const [closeCash, setCloseCash] = useState("");
  const [notes, setNotes] = useState("");
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  if (user?.role !== "cashier") return null;
  const ar = language !== "en";
  const start = async () => {
    setBusy(true);
    const result = await openShift(openCash);
    setBusy(false);
    if (!result.error) setDialog(null);
  };
  const finish = async () => {
    setBusy(true);
    const result = await closeShift(closeCash, notes);
    setBusy(false);
    if (!result.error) { setDialog(null); setCloseCash(""); setNotes(""); }
  };
  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      {!loading && !currentShift && (
        <Dialog open fullWidth maxWidth="xs" disableEscapeKeyDown>
          <DialogTitle dir={ar ? "rtl" : "ltr"}>{ar ? "ابدأ ورديتك" : "Start your shift"}</DialogTitle>
          <DialogContent dir={ar ? "rtl" : "ltr"}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{ar ? "أدخل رصيد الكاش الموجود عند بداية الوردية، ثم ابدأ العمل." : "Enter the cash float at the beginning of your shift, then start working."}</Typography>
            <TextField fullWidth label={ar ? "رصيد بداية الوردية" : "Opening cash"} type="number" inputProps={{ min: 0, step: "0.01", dir: "ltr" }} value={openCash} onChange={(event) => setOpenCash(event.target.value)} autoFocus />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}><Button fullWidth variant="contained" disabled={busy} startIcon={<PlayCircleOutlineRoundedIcon />} onClick={start}>{ar ? "بدء الوردية" : "Start shift"}</Button></DialogActions>
        </Dialog>
      )}
      {currentShift && (
        <Paper variant="outlined" sx={{ mb: 1.5, p: 1.2, borderRadius: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap", bgcolor: "rgba(22,163,74,.04)" }}>
          <Box><Typography variant="caption" color="text.secondary">{ar ? "الوردية الحالية" : "Current shift"}</Typography><Typography fontWeight={850}>{new Date(currentShift.opened_at).toLocaleTimeString(ar ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })} · {ar ? "بداية الكاش" : "Opening cash"}: {Number(currentShift.opening_cash || 0).toFixed(2)}</Typography></Box>
          <Button size="small" color="error" variant="outlined" startIcon={<StopCircleOutlinedIcon />} onClick={() => setDialog("close")} sx={{ fontWeight: 800 }}>{ar ? "إنهاء الوردية" : "End shift"}</Button>
        </Paper>
      )}
      <Dialog open={dialog === "close"} onClose={() => !busy && setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle dir={ar ? "rtl" : "ltr"}>{ar ? "إنهاء الوردية" : "Close shift"}</DialogTitle>
        <DialogContent dir={ar ? "rtl" : "ltr"}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{ar ? "سيتم حفظ إجمالي المبيعات وتفصيل الكاش والشبكة وباقي طرق الدفع." : "The system will save total sales and the cash, card, and other payment breakdown."}</Typography>
          <Stack spacing={1.5}><TextField fullWidth label={ar ? "رصيد الكاش عند الإغلاق" : "Closing cash"} type="number" inputProps={{ min: 0, step: "0.01", dir: "ltr" }} value={closeCash} onChange={(event) => setCloseCash(event.target.value)} autoFocus /><TextField fullWidth multiline minRows={2} label={ar ? "ملاحظات (اختياري)" : "Notes (optional)"} value={notes} onChange={(event) => setNotes(event.target.value)} /></Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}><Button onClick={() => setDialog(null)} disabled={busy} color="inherit">{ar ? "إلغاء" : "Cancel"}</Button><Button variant="contained" color="error" disabled={busy || closeCash === ""} onClick={finish}>{ar ? "حفظ وإنهاء" : "Save and close"}</Button></DialogActions>
      </Dialog>
    </>
  );
}
