import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { useLanguage } from "../../../context/LanguageContext";
import { discoverPrinters, getPrinterSettings, savePrinterSettings } from "../../../utils/qzPrinting";

export default function CategoryPrintRoutingDrawer({ open, onClose, categories = [], onUpdateCategory }) {
  const { language } = useLanguage();
  const isArabic = language !== "en";
  const [settings, setSettings] = useState(() => getPrinterSettings());
  const [printers, setPrinters] = useState([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyCategoryId, setBusyCategoryId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const text = isArabic
    ? {
      title: "توجيه فواتير التصنيفات", subtitle: "فعّل الفصل لكل تصنيف، ثم اختر الطابعة التي تستقبل فاتورته على جهاز الكاشير الحالي.",
      local: "الإعداد محفوظ على هذا الجهاز فقط؛ أعده على كل جهاز كاشير يستخدم طابعات مختلفة.",
      discover: "الاتصال واكتشاف الطابعات", discovering: "جارٍ الاتصال…", none: "لم تُكتشف طابعات بعد. شغّل QZ Tray ثم أعد المحاولة.",
      separate: "اطبع هذا التصنيف منفصلًا", route: "الطابعة المخصصة للتصنيف", fallback: "استخدم طابعات فاتورة الكاشير", notFound: "اسم الطابعة محفوظ لكنه غير موجود ضمن الطابعات المكتشفة.",
      save: "حفظ توجيه الطابعات", close: "إغلاق", saved: "حُفظت تعيينات الطابعات على هذا الجهاز.", empty: "أضف تصنيفًا أولًا من إدارة التصنيفات.",
      enabled: "التصنيف مفصول: ستُجمع أصنافه في فاتورة مستقلة.", disabled: "التصنيف غير مفصول: سيظهر ضمن فاتورة الكاشير الرئيسية.",
    }
    : {
      title: "Category receipt routing", subtitle: "Enable a separate receipt per category, then choose its printer on this cashier device.",
      local: "Printer names are saved on this device only; repeat setup on each cashier device with different printers.",
      discover: "Connect and discover printers", discovering: "Connecting…", none: "No printers discovered. Start QZ Tray and retry.",
      separate: "Print this category separately", route: "Printer for this category", fallback: "Use cashier receipt printers", notFound: "This saved printer name is not among the discovered queues.",
      save: "Save printer routes", close: "Close", saved: "Printer routes saved on this device.", empty: "Add a category from menu management first.",
      enabled: "Separate receipt enabled; items in this category will be grouped together.", disabled: "Separate receipt disabled; items stay on the main cashier receipt.",
    };

  const printerOptions = useMemo(() => [...new Set([...printers, ...Object.values(settings.categoryPrinters || {})].filter(Boolean))], [printers, settings.categoryPrinters]);

  useEffect(() => {
    if (!open) return;
    setSettings(getPrinterSettings());
    setPrinters([]);
    setError("");
    setNotice("");
  }, [open]);

  const handleDiscover = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const names = await discoverPrinters();
      setPrinters(names);
      if (!names.length) setError(text.none);
    } catch (cause) {
      setError(cause?.message || text.none);
    } finally {
      setBusy(false);
    }
  };

  const handleSeparateToggle = async (category) => {
    if (!onUpdateCategory || busyCategoryId) return;
    setBusyCategoryId(category.id);
    setError("");
    setNotice("");
    try {
      const result = await onUpdateCategory({ ...category, separate_print: !Boolean(category.separate_print) });
      if (result?.error) throw result.error;
    } catch (cause) {
      setError(cause?.message || (isArabic ? "تعذر تحديث حالة الفصل." : "Could not update separate receipt setting."));
    } finally {
      setBusyCategoryId(null);
    }
  };

  const handlePrinterChange = (categoryId, printer) => {
    setSettings((current) => {
      const categoryPrinters = { ...(current.categoryPrinters || {}) };
      if (printer && printer !== "__default__") categoryPrinters[String(categoryId)] = printer;
      else delete categoryPrinters[String(categoryId)];
      return { ...current, categoryPrinters };
    });
    setNotice("");
  };

  const handleSave = () => {
    setSaving(true);
    setError("");
    try {
      const saved = savePrinterSettings(settings);
      setSettings(saved);
      setNotice(text.saved);
    } catch (cause) {
      setError(cause?.message || (isArabic ? "تعذر حفظ الإعداد." : "Could not save printer routes."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      anchor={isArabic ? "right" : "left"}
      open={open}
      onClose={onClose}
      sx={(theme) => ({ zIndex: theme.zIndex.drawer + 3, "& .MuiDrawer-paper": { zIndex: theme.zIndex.drawer + 3, width: { xs: "100%", sm: 500 }, boxSizing: "border-box" } })}
    >
      <Box dir={isArabic ? "rtl" : "ltr"} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ p: 2.25, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
          <Stack direction="row" spacing={1.1} alignItems="flex-start">
            <PrintRoundedIcon color="primary" sx={{ mt: 0.4 }} />
            <Box>
              <Typography variant="h6" fontWeight={950}>{text.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{text.subtitle}</Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} aria-label={text.close}><CloseRoundedIcon /></IconButton>
        </Box>
        <Divider />
        <Box sx={{ flex: 1, overflowY: "auto", p: 2.25 }}>
          <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2 }}>{text.local}</Alert>
          <Button fullWidth variant="outlined" startIcon={busy ? <CircularProgress size={17} /> : <RefreshRoundedIcon />} disabled={busy} onClick={handleDiscover} sx={{ mb: 1.5, borderRadius: 2, fontWeight: 850 }}>
            {busy ? text.discovering : text.discover}
          </Button>
          {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
          {notice && <Alert severity="success" sx={{ mb: 1.5 }}>{notice}</Alert>}
          {!categories.length ? (
            <Box sx={{ py: 7, textAlign: "center" }}><Typography color="text.secondary">{text.empty}</Typography></Box>
          ) : (
            <Stack spacing={1.2}>
              {categories.map((category) => {
                const assignedPrinter = settings.categoryPrinters?.[String(category.id)] || "__default__";
                return (
                  <Box key={category.id} sx={{ p: 1.6, borderRadius: 2.5, border: "1px solid", borderColor: category.separate_print ? "primary.light" : "divider", bgcolor: category.separate_print ? "rgba(244,121,32,.045)" : "background.paper" }}>
                    <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" gap={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={900} noWrap>{category.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{category.separate_print ? text.enabled : text.disabled}</Typography>
                      </Box>
                      <FormControlLabel
                        label={text.separate}
                        labelPlacement="start"
                        control={<Switch checked={Boolean(category.separate_print)} onChange={() => handleSeparateToggle(category)} disabled={Boolean(busyCategoryId)} color="primary" />}
                        sx={{ m: 0, flexShrink: 0, alignSelf: { xs: "flex-start", sm: "auto" }, "& .MuiFormControlLabel-label": { fontSize: "0.76rem", fontWeight: 800 } }}
                      />
                    </Stack>
                    <FormControl fullWidth size="small" sx={{ mt: 1.3 }}>
                      <InputLabel id={`category-printer-${category.id}`}>{text.route}</InputLabel>
                      <Select
                        labelId={`category-printer-${category.id}`}
                        value={assignedPrinter}
                        label={text.route}
                        onChange={(event) => handlePrinterChange(category.id, event.target.value)}
                      >
                        <MenuItem value="__default__">{text.fallback}</MenuItem>
                        {printerOptions.map((printer) => <MenuItem key={printer} value={printer}>{printer}</MenuItem>)}
                      </Select>
                    </FormControl>
                    {assignedPrinter !== "__default__" && !printers.includes(assignedPrinter) && (
                      <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.6 }}>{text.notFound}</Typography>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
        <Divider />
        <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1} sx={{ p: 2.25 }}>
          <Button fullWidth variant="outlined" color="inherit" onClick={onClose}>{text.close}</Button>
          <Button fullWidth variant="contained" startIcon={saving ? <CircularProgress size={17} color="inherit" /> : <SaveRoundedIcon />} disabled={saving} onClick={handleSave} sx={{ fontWeight: 900 }}>
            {saving ? (isArabic ? "جارٍ الحفظ…" : "Saving…") : text.save}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
