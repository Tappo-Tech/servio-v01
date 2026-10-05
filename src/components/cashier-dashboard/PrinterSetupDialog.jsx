import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { discoverPrinters, getPrinterSettings, savePrinterSettings } from "../../utils/qzPrinting";

const COPY = {
  ar: {
    title: "إعداد الطباعة الصامتة",
    help: "ثبّت QZ Tray وشغّله على جهاز الكاشير، ثم تأكد أن الطابعة مضافة في نظام التشغيل. يتيح ذلك استخدام طابعات USB أو Bluetooth أو الشبكة عبر تعريفاتها. اختر حتى طابعتين لإرسال الفاتورة إليهما معًا.",
    certificate: "QZ Tray مجاني؛ لا يلزم اشتراك عند استخدام شهادة SERVIO الذاتية. لإخفاء التنبيهات يلزم تثبيت الشهادة مرة واحدة بصلاحية مسؤول وإضافة المفتاح الخاص إلى Vercel. راجع خطوات التفعيل في دليل التطوير.",
    refresh: "الاتصال واكتشاف الطابعات",
    refreshBusy: "جارٍ الاتصال…",
    paper: "مقاس الورق",
    printers: "الطابعات المكتشفة",
    noPrinters: "لم تظهر طابعات. تأكد من تشغيل QZ Tray وإضافة الطابعة في إعدادات النظام.",
    selectHint: "اختر طابعة واحدة أو اثنتين؛ الطابعات الافتراضية الوهمية غير محددة تلقائيًا.",
    autoPrint: "إرسال الفاتورة تلقائيًا بعد حفظ البيع",
    save: "حفظ الإعدادات",
    test: "حفظ واختبار الطباعة",
    close: "إغلاق",
    connected: "متصل بـQZ Tray",
    disconnected: "غير متصل",
    limit: "يمكن تحديد طابعتين كحد أقصى.",
    sizes: { "58mm": "لفة حرارية 58 مم", "80mm": "لفة حرارية 80 مم", A4: "ورق A4 (ليزر/مكتبي)" },
    saved: "تم حفظ إعدادات الطباعة على هذا الجهاز.",
  },
  en: {
    title: "Silent printing setup",
    help: "Install and run QZ Tray on the cashier device, then make sure the printer is installed in the operating system. This supports USB, Bluetooth, or network printers through their drivers. Select up to two printers to receive each receipt.",
    certificate: "QZ Tray is free; the SERVIO self-signed certificate avoids a QZ subscription. To suppress prompts, install the certificate once as an administrator and add the private signing key in Vercel. See the development guide.",
    refresh: "Connect and discover printers",
    refreshBusy: "Connecting…",
    paper: "Paper size",
    printers: "Discovered printers",
    noPrinters: "No printers found. Make sure QZ Tray is running and the printer is installed in the OS.",
    selectHint: "Select one or two printers; virtual/default queues are not selected automatically.",
    autoPrint: "Send receipt automatically after saving a sale",
    save: "Save settings",
    test: "Save and test print",
    close: "Close",
    connected: "Connected to QZ Tray",
    disconnected: "Not connected",
    limit: "Select up to two printers.",
    sizes: { "58mm": "58 mm thermal roll", "80mm": "80 mm thermal roll", A4: "A4 paper (laser/office)" },
    saved: "Printing settings saved on this device.",
  },
};

export default function PrinterSetupDialog({ open, onClose, language = "ar", autoPrint, onAutoPrintChange, onTest }) {
  const text = COPY[language] || COPY.ar;
  const [settings, setSettings] = useState(() => getPrinterSettings());
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!open) return;
    setSettings(getPrinterSettings());
    setAvailablePrinters([]);
    setConnected(false);
    setError("");
    setNotice("");
  }, [open]);

  const refreshPrinters = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const names = await discoverPrinters();
      setAvailablePrinters(names);
      setSettings((current) => ({ ...current, printers: current.printers.filter((name) => names.includes(name)) }));
      setConnected(true);
      if (!names.length) setError(text.noPrinters);
    } catch (cause) {
      setConnected(false);
      setError(cause?.message || text.noPrinters);
    } finally {
      setBusy(false);
    }
  };

  const togglePrinter = (name) => {
    setError("");
    setNotice("");
    if (!settings.printers.includes(name) && settings.printers.length >= 2) {
      setError(text.limit);
      return;
    }
    setSettings((current) => {
      const selected = current.printers.includes(name);
      return { ...current, printers: selected ? current.printers.filter((printer) => printer !== name) : [...current.printers, name] };
    });
  };

  const save = () => {
    try {
      const saved = savePrinterSettings(settings);
      setSettings(saved);
      setNotice(text.saved);
      setError("");
      return saved;
    } catch (cause) {
      setError(cause?.message || "Unable to save printer settings");
      return null;
    }
  };

  const handleTest = () => {
    const saved = save();
    if (!saved) return;
    if (!saved.printers.length) {
      setError(language === "en" ? "Select at least one printer first." : "اختر طابعة واحدة على الأقل أولًا.");
      return;
    }
    onTest?.();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle dir={language === "ar" ? "rtl" : "ltr"}>{text.title}</DialogTitle>
      <DialogContent dir={language === "ar" ? "rtl" : "ltr"}>
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">{text.help}</Typography>
          <Alert severity="info">{text.certificate}</Alert>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
            <Chip size="small" color={connected ? "success" : "default"} label={connected ? text.connected : text.disconnected} />
            <Button variant="outlined" startIcon={busy ? <CircularProgress size={16} /> : <RefreshRoundedIcon />} disabled={busy} onClick={refreshPrinters}>
              {busy ? text.refreshBusy : text.refresh}
            </Button>
          </Stack>
          <FormControl fullWidth size="small">
            <InputLabel id="servio-paper-width-label">{text.paper}</InputLabel>
            <Select labelId="servio-paper-width-label" value={settings.paperWidth} label={text.paper} onChange={(event) => setSettings((current) => ({ ...current, paperWidth: event.target.value }))}>
              {Object.entries(text.sizes).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
            </Select>
          </FormControl>
          <Box>
            <Typography fontWeight={800} sx={{ mb: 0.5 }}>{text.printers}</Typography>
            <Typography variant="caption" color="text.secondary">{text.selectHint}</Typography>
            {availablePrinters.length ? (
              <FormGroup sx={{ mt: 0.5, maxHeight: 220, overflowY: "auto" }}>
                {availablePrinters.map((printer) => (
                  <FormControlLabel key={printer} control={<Checkbox checked={settings.printers.includes(printer)} onChange={() => togglePrinter(printer)} />} label={printer} />
                ))}
              </FormGroup>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>{text.noPrinters}</Typography>
            )}
          </Box>
          <FormControlLabel control={<Switch checked={autoPrint} onChange={onAutoPrintChange} />} label={text.autoPrint} />
          {error && <Alert severity="error">{error}</Alert>}
          {notice && <Alert severity="success">{notice}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
        <Button onClick={onClose} color="inherit">{text.close}</Button>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={save}>{text.save}</Button>
          <Button variant="contained" startIcon={<PrintRoundedIcon />} onClick={handleTest}>{text.test}</Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
