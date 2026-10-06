import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Divider, Drawer, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Select, Stack, Switch, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { useLanguage } from "../../../context/LanguageContext";
import { discoverPrinters, getPrinterSettings, savePrinterSettings } from "../../../utils/qzPrinting";

export default function CategoryPrintRoutingDrawer({ open, onClose, categories = [], onUpdateCategories }) {
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;
  const { language } = useLanguage();
  const isArabic = language !== "en";
  const [settings, setSettings] = useState(() => getPrinterSettings());
  const [separateDraft, setSeparateDraft] = useState({});
  const [printers, setPrinters] = useState([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const text = isArabic ? {
    title: "توجيه طابعات التصنيفات",
    subtitle: "احفظ طابعة لكل تصنيف، وفعّل الفصل إذا أردت فاتورة مستقلة. سيطبق النظام التعيين المحفوظ تلقائيًا عند الطباعة.",
    shared: "التعيين محفوظ على مستوى المتجر ويظهر للمدير والكاشير بعد تسجيل الدخول. يجب أن يكون اسم الطابعة نفسه مثبتًا ومكتشفًا عبر QZ Tray على كل جهاز كاشير.",
    discover: "اكتشاف طابعات هذا الجهاز", discovering: "جارٍ الاتصال…", none: "لم تُكتشف طابعات. شغّل QZ Tray ثم أعد المحاولة.",
    separate: "اطبع هذا التصنيف في فاتورة مستقلة", route: "الطابعة المخصصة للتصنيف", fallback: "طابعة فاتورة الكاشير الافتراضية", notFound: "اسم الطابعة محفوظ، لكنه غير مثبت أو غير متصل على هذا الجهاز.",
    save: "حفظ التوجيه", close: "إغلاق", saved: "تم حفظ التوجيه على المتجر وسيستخدم تلقائيًا عند الطباعة.", empty: "أضف تصنيفًا أولًا من إدارة المنيو.",
    enabled: "مفصول عن الفاتورة الرئيسية", disabled: "ضمن الفاتورة الرئيسية",
  } : {
    title: "Category printer routing",
    subtitle: "Assign a printer to each category and enable separate receipts when needed. Saved routes are applied automatically when printing.",
    shared: "Routes are saved for the store and shared with managers and cashiers. The same printer queue name must be installed and discovered by QZ Tray on each cashier device.",
    discover: "Discover printers on this device", discovering: "Connecting…", none: "No printers found. Start QZ Tray and retry.",
    separate: "Print this category on a separate receipt", route: "Printer for this category", fallback: "Default cashier receipt printer", notFound: "The saved printer is not installed or connected on this device.",
    save: "Save routes", close: "Close", saved: "Routes saved for this store and will be applied automatically.", empty: "Add a category in menu management first.",
    enabled: "Separate from the main receipt", disabled: "Included in the main receipt",
  };

  const printerOptions = useMemo(() => [...new Set([...printers, ...Object.values(settings.categoryPrinters || {})].filter(Boolean))], [printers, settings.categoryPrinters]);

  useEffect(() => {
    if (!open) return;
    const saved = getPrinterSettings();
    const categoryPrinters = { ...(saved.categoryPrinters || {}) };
    const separate = {};
    categoriesRef.current.forEach((category) => {
      const id = String(category.id);
      separate[id] = Boolean(category.separate_print);
      if (Object.prototype.hasOwnProperty.call(category, "printer_name")) {
        if (category.printer_name) categoryPrinters[id] = String(category.printer_name);
        else delete categoryPrinters[id];
      }
    });
    setSettings({ ...saved, categoryPrinters });
    setSeparateDraft(separate);
    setPrinters([]);
    setError("");
    setNotice("");
  }, [open, categories.length]);

  const handleDiscover = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      const names = await discoverPrinters();
      setPrinters(names);
      if (!names.length) setError(text.none);
    } catch (cause) {
      setError(cause?.message || text.none);
    } finally { setBusy(false); }
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

  const handleSave = async () => {
    if (saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      if (!onUpdateCategories) throw new Error(isArabic ? "تعذر الاتصال بخدمة حفظ توجيه التصنيفات." : "Category route persistence is unavailable.");
      const routes = categories.map((category) => {
        const id = String(category.id);
        const printerName = String(settings.categoryPrinters?.[id] || "").trim();
        return {
          category_id: category.id,
          separate_print: Boolean(separateDraft[id]),
          printer_name: printerName || null,
        };
      });
      const result = await onUpdateCategories(routes);
      if (result?.error) throw result.error;
      const saved = savePrinterSettings({ ...settings, categoryPrinters: {} });
      setSettings((current) => ({ ...current, ...saved, categoryPrinters: { ...(current.categoryPrinters || {}) } }));
      setNotice(text.saved);
    } catch (cause) {
      setError(cause?.message || (isArabic ? "تعذر حفظ توجيه الطابعات." : "Could not save printer routes."));
    } finally { setSaving(false); }
  };

  return <Drawer anchor={isArabic ? "right" : "left"} open={open} onClose={onClose} sx={(theme) => ({ zIndex: theme.zIndex.drawer + 3, "& .MuiDrawer-paper": { zIndex: theme.zIndex.drawer + 3, width: { xs: "100%", sm: 520 }, boxSizing: "border-box" } })}>
    <Box dir={isArabic ? "rtl" : "ltr"} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 2.25, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
        <Stack direction="row" spacing={1.1} alignItems="flex-start"><PrintRoundedIcon color="primary" sx={{ mt: .4 }} /><Box><Typography variant="h6" fontWeight={950}>{text.title}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5, lineHeight: 1.7 }}>{text.subtitle}</Typography></Box></Stack>
        <IconButton onClick={onClose} aria-label={text.close}><CloseRoundedIcon /></IconButton>
      </Box>
      <Divider />
      <Box sx={{ flex: 1, overflowY: "auto", p: 2.25 }}>
        <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2, lineHeight: 1.7 }}>{text.shared}</Alert>
        <Button fullWidth variant="outlined" startIcon={busy ? <CircularProgress size={17} /> : <RefreshRoundedIcon />} disabled={busy} onClick={handleDiscover} sx={{ mb: 1.5, borderRadius: 2, fontWeight: 850 }}>{busy ? text.discovering : text.discover}</Button>
        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
        {notice && <Alert severity="success" sx={{ mb: 1.5 }}>{notice}</Alert>}
        {!categories.length ? <Box sx={{ py: 7, textAlign: "center" }}><Typography color="text.secondary">{text.empty}</Typography></Box> : <Stack spacing={1.2}>
          {categories.map((category) => {
            const id = String(category.id);
            const assignedPrinter = settings.categoryPrinters?.[id] || "__default__";
            const separate = Boolean(separateDraft[id]);
            return <Box key={category.id} sx={{ p: 1.6, borderRadius: 2.5, border: "1px solid", borderColor: separate ? "primary.light" : "divider", bgcolor: separate ? "rgba(244,121,32,.045)" : "background.paper" }}>
              <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" gap={1}>
                <Box sx={{ minWidth: 0 }}><Typography fontWeight={900} noWrap>{category.name}</Typography><Typography variant="caption" color="text.secondary">{separate ? text.enabled : text.disabled}</Typography></Box>
                <FormControlLabel label={text.separate} labelPlacement="start" control={<Switch checked={separate} onChange={() => { setSeparateDraft((current) => ({ ...current, [id]: !current[id] })); setNotice(""); }} disabled={saving} color="primary" />} sx={{ m: 0, flexShrink: 0, alignSelf: { xs: "flex-start", sm: "auto" }, "& .MuiFormControlLabel-label": { fontSize: ".76rem", fontWeight: 800 } }} />
              </Stack>
              <FormControl fullWidth size="small" sx={{ mt: 1.3 }}><InputLabel id={`category-printer-${category.id}`}>{text.route}</InputLabel><Select labelId={`category-printer-${category.id}`} value={assignedPrinter} label={text.route} onChange={(event) => handlePrinterChange(category.id, event.target.value)} disabled={saving}><MenuItem value="__default__">{text.fallback}</MenuItem>{printerOptions.map((printer) => <MenuItem key={printer} value={printer}>{printer}</MenuItem>)}</Select></FormControl>
              {assignedPrinter !== "__default__" && !printers.includes(assignedPrinter) && <Typography variant="caption" color="warning.main" display="block" sx={{ mt: .6 }}>{text.notFound}</Typography>}
            </Box>;
          })}
        </Stack>}
      </Box>
      <Divider />
      <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1} sx={{ p: 2.25 }}><Button fullWidth variant="outlined" color="inherit" onClick={onClose}>{text.close}</Button><Button fullWidth variant="contained" startIcon={saving ? <CircularProgress size={17} color="inherit" /> : <SaveRoundedIcon />} disabled={saving || !categories.length} onClick={handleSave} sx={{ fontWeight: 900 }}>{saving ? (isArabic ? "جارٍ الحفظ…" : "Saving…") : text.save}</Button></Stack>
    </Box>
  </Drawer>;
}
