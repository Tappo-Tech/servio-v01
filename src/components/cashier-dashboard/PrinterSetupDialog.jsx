import { useEffect, useRef, useState } from "react";
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
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import {
  createPrinterSettingsFile,
  discoverPrinters,
  getDiscoveredPrinters,
  getPrinterSettings,
  parsePrinterSettingsFile,
  reconnectSavedPrinters,
  savePrinterSettings,
} from "../../utils/qzPrinting";

const COPY = {
  ar: {
    title: "إعداد الطابعة",
    help: "ثبّت QZ Tray وشغّله على جهاز الكاشير، ثم أضف الطابعة في نظام التشغيل. يحفظ SERVIO الاختيارات محليًا ويعيد الاتصال والاكتشاف عند دخول الكاشير؛ اختر الطابعات مرة واحدة فقط. يدعم USB وBluetooth والشبكة عبر تعريفاتها.",
    certificate: "QZ Tray مجاني؛ لا يلزم اشتراك عند استخدام شهادة SERVIO الذاتية. لإخفاء التنبيهات يلزم تثبيت الشهادة مرة واحدة بصلاحية مسؤول وإضافة المفتاح الخاص إلى Vercel. راجع خطوات التفعيل في دليل التطوير.",
    refresh: "الاتصال واكتشاف الطابعات",
    refreshBusy: "جارٍ الاتصال…",
    paper: "مقاس الورق",
    printers: "الطابعات المكتشفة",
    kitchenPrinter: "طابعة تذكرة المطبخ",
    kitchenHelp: "تذكرة المطبخ تعرض رقم الطلب والطاولة والأصناف والكميات والإضافات والملاحظات فقط، دون أسعار. هذا الإعداد خاص بهذا الجهاز ويمكن أن يختلف عن طابعات الكاشير.",
    unpaidPolicy: "توجيه الفواتير حسب حالة السداد",
    unpaidPolicyHelp: "الفاتورة المدفوعة تُطبع للمطبخ والكاشير دائمًا. اختر وجهة الفاتورة غير المدفوعة.",
    unpaidKitchenOnly: "المطبخ فقط (الافتراضي)",
    unpaidKitchenAndCashier: "المطبخ والكاشير",
    noKitchenPrinter: "لم تُحدد طابعة للمطبخ",
    kitchenNotFound: "الطابعة المحفوظة غير مكتشفة على هذا الجهاز. أعد الاتصال وتحقق منها قبل الطباعة.",
    noPrinters: "لم تظهر طابعات. تأكد من تشغيل QZ Tray وإضافة الطابعة في إعدادات النظام.",
    cachedPrinters: "هذه آخر أسماء طابعات اكتُشفت على هذا الجهاز. أعد الاتصال للتحقق من توفرها الآن.",
    missingSavedPrinters: "بقيت أسماء الطابعات المحفوظة دون حذف؛ تحقق من تشغيلها أو توصيلها:",
    notDetected: "غير متاحة حاليًا",
    selectHint: "اختر طابعة واحدة أو اثنتين؛ الطابعات الافتراضية الوهمية غير محددة تلقائيًا.",
    autoPrint: "إرسال الفاتورة تلقائيًا بعد حفظ البيع",
    save: "حفظ الإعدادات",
    test: "حفظ واختبار الطباعة",
    close: "إغلاق",
    connected: "متصل بـQZ Tray",
    disconnected: "غير متصل",
    limit: "يمكن تحديد طابعتين كحد أقصى.",
    sizes: { "58mm": "لفة حرارية 58 مم", "80mm": "لفة حرارية 80 مم", A4: "ورق A4 (ليزر/مكتبي)" },
    saved: "تم حفظ إعدادات الطباعة وقائمة الطابعات محليًا على هذا الجهاز.",
    importFile: "استيراد ملف الإعداد",
    exportFile: "تنزيل ملف الإعداد",
    imported: "تم استيراد الملف. اتصل لاكتشاف الطابعات والتحقق من أسمائها.",
    exported: "تم تنزيل ملف إعداد الطابعة.",
    importError: "تعذر قراءة ملف الإعداد. استخدم ملف SERVIO بصيغة JSON.",
  },
  en: {
    title: "Printer setup",
    help: "Install and run QZ Tray on this cashier device, then install the printer in the operating system. SERVIO saves the choices locally and reconnects/discovers them when the cashier opens; select printers only once. USB, Bluetooth, and network printers work through their drivers.",
    certificate: "QZ Tray is free; the SERVIO self-signed certificate avoids a QZ subscription. To suppress prompts, install the certificate once as an administrator and add the private signing key in Vercel. See the development guide.",
    refresh: "Connect and discover printers",
    refreshBusy: "Connecting…",
    paper: "Paper size",
    printers: "Discovered printers",
    kitchenPrinter: "Kitchen ticket printer",
    kitchenHelp: "Kitchen tickets contain the order number, table, item names, quantities, add-ons, and notes only. This device-specific setting can be different from the cashier printers.",
    unpaidPolicy: "Route invoices by payment status",
    unpaidPolicyHelp: "Paid invoices always print to both kitchen and cashier. Choose where unpaid invoices should print.",
    unpaidKitchenOnly: "Kitchen only (default)",
    unpaidKitchenAndCashier: "Kitchen and cashier",
    noKitchenPrinter: "No kitchen printer selected",
    kitchenNotFound: "Saved kitchen printer was not discovered on this device. Reconnect and verify it before printing.",
    noPrinters: "No printers found. Make sure QZ Tray is running and the printer is installed in the OS.",
    cachedPrinters: "These are the last printer names discovered on this device. Reconnect to verify which ones are available now.",
    missingSavedPrinters: "Saved printer names were kept; check whether these queues are running or connected:",
    notDetected: "currently unavailable",
    selectHint: "Select one or two printers; virtual/default queues are not selected automatically.",
    autoPrint: "Send receipt automatically after saving a sale",
    save: "Save settings",
    test: "Save and test print",
    close: "Close",
    connected: "Connected to QZ Tray",
    disconnected: "Not connected",
    limit: "Select up to two printers.",
    sizes: { "58mm": "58 mm thermal roll", "80mm": "80 mm thermal roll", A4: "A4 paper (laser/office)" },
    saved: "Printing settings and discovered printer names saved locally on this device.",
    importFile: "Import settings file",
    exportFile: "Download settings file",
    imported: "Settings file imported. Connect to discover printers and verify their names.",
    exported: "Printer settings file downloaded.",
    importError: "Could not read the settings file. Use a SERVIO JSON file.",
  },
};

export default function PrinterSetupDialog({ open, onClose, language = "ar", autoPrint, onAutoPrintChange, onTest }) {
  const text = COPY[language] || COPY.ar;
  const fileInputRef = useRef(null);
  const [settings, setSettings] = useState(() => getPrinterSettings());
  const [availablePrinters, setAvailablePrinters] = useState(() => getDiscoveredPrinters());
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const kitchenPrinterOptions = [...new Set([...availablePrinters, settings.kitchenPrinter].filter(Boolean))];
  const printerOptions = [...new Set([...availablePrinters, ...settings.printers].filter(Boolean))];
  const missingSavedPrinters = connected
    ? [...new Set([...settings.printers, settings.kitchenPrinter].filter((name) => name && !availablePrinters.includes(name)))]
    : [];

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSettings(getPrinterSettings());
    setAvailablePrinters(getDiscoveredPrinters());
    setConnected(false);
    setError("");
    setNotice("");
    reconnectSavedPrinters()
      .then(({ availablePrinters: names }) => {
        if (cancelled) return;
        setAvailablePrinters(names);
        setConnected(true);
        if (!names.length) setError(text.noPrinters);
      })
      .catch((cause) => {
        if (cancelled) return;
        setConnected(false);
        if (!getDiscoveredPrinters().length) setError(cause?.message || text.noPrinters);
      });
    return () => { cancelled = true; };
  }, [open, language, text.noPrinters]);

  const refreshPrinters = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const names = await discoverPrinters();
      setAvailablePrinters(names);
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

  const importSettingsFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = parsePrinterSettingsFile(await file.text());
      const saved = savePrinterSettings(parsed.settings);
      setSettings(saved);
      setAvailablePrinters([...new Set([...getDiscoveredPrinters(), ...saved.printers])]);
      setConnected(false);
      if (typeof parsed.autoPrintAfterSave === "boolean") {
        onAutoPrintChange?.({ target: { checked: parsed.autoPrintAfterSave } });
      }
      setNotice(text.imported);
      setError("");
    } catch (cause) {
      setError(cause?.message || text.importError);
      setNotice("");
    } finally {
      // السماح باختيار الملف نفسه مرة أخرى بعد تصحيح محتواه.
      event.target.value = "";
    }
  };

  const exportSettingsFile = () => {
    try {
      const contents = createPrinterSettingsFile(settings, autoPrint);
      const url = window.URL.createObjectURL(new Blob([contents], { type: "application/json;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "servio-printer-settings.json";
      link.click();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
      setNotice(text.exported);
      setError("");
    } catch (cause) {
      setError(cause?.message || text.importError);
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
          {!connected && availablePrinters.length > 0 && <Alert severity="info">{text.cachedPrinters}</Alert>}
          {missingSavedPrinters.length > 0 && <Alert severity="warning">{text.missingSavedPrinters} {missingSavedPrinters.join(language === "ar" ? "، " : ", ")}</Alert>}
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
                {printerOptions.map((printer) => (
                  <FormControlLabel key={printer} control={<Checkbox checked={settings.printers.includes(printer)} onChange={() => togglePrinter(printer)} />} label={availablePrinters.includes(printer) ? printer : `${printer} · ${text.notDetected}`} />
                ))}
              </FormGroup>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>{text.noPrinters}</Typography>
            )}
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", bgcolor: "rgba(23,26,47,.025)" }}>
            <Typography fontWeight={850} sx={{ mb: 0.35 }}>{text.kitchenPrinter}</Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>{text.kitchenHelp}</Typography>
            <FormControl fullWidth size="small">
              <InputLabel id="servio-kitchen-printer-label">{text.kitchenPrinter}</InputLabel>
              <Select
                labelId="servio-kitchen-printer-label"
                value={settings.kitchenPrinter || "__none__"}
                label={text.kitchenPrinter}
                onChange={(event) => setSettings((current) => ({ ...current, kitchenPrinter: event.target.value === "__none__" ? "" : event.target.value }))}
              >
                <MenuItem value="__none__">{text.noKitchenPrinter}</MenuItem>
                {kitchenPrinterOptions.map((printer) => <MenuItem key={printer} value={printer}>{printer}</MenuItem>)}
              </Select>
            </FormControl>
            {settings.kitchenPrinter && !availablePrinters.includes(settings.kitchenPrinter) && connected && (
              <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.6 }}>{text.kitchenNotFound}</Typography>
            )}
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
            <Typography fontWeight={850} sx={{ mb: 0.35 }}>{text.unpaidPolicy}</Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>{text.unpaidPolicyHelp}</Typography>
            <FormControl fullWidth size="small">
              <InputLabel id="servio-unpaid-invoice-policy-label">{text.unpaidPolicy}</InputLabel>
              <Select
                labelId="servio-unpaid-invoice-policy-label"
                value={settings.unpaidInvoicePolicy}
                label={text.unpaidPolicy}
                onChange={(event) => setSettings((current) => ({ ...current, unpaidInvoicePolicy: event.target.value }))}
              >
                <MenuItem value="kitchen_only">{text.unpaidKitchenOnly}</MenuItem>
                <MenuItem value="kitchen_and_cashier">{text.unpaidKitchenAndCashier}</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <input ref={fileInputRef} type="file" accept=".json,application/json" hidden onChange={importSettingsFile} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button fullWidth variant="outlined" startIcon={<UploadFileRoundedIcon />} onClick={() => fileInputRef.current?.click()}>
              {text.importFile}
            </Button>
            <Button fullWidth variant="text" startIcon={<DownloadRoundedIcon />} onClick={exportSettingsFile}>
              {text.exportFile}
            </Button>
          </Stack>
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
