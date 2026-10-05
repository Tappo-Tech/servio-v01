import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import ShoppingCartCheckoutRoundedIcon from "@mui/icons-material/ShoppingCartCheckoutRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { v4 as uuidV4 } from "uuid";
import { useMenu } from "../context/MenuContext";
import { useOrders } from "../context/OrdersContext";
import { useStore } from "../context/StoreInfoContext";
import { useTenant } from "../context/TenantContext";
import { useLanguage } from "../context/LanguageContext";
import InvoiceModal from "../components/manager-dashboard/orders/OrderPill";
import PrinterSetupDialog from "../components/cashier-dashboard/PrinterSetupDialog";
import { calculateInclusiveVat, roundMoney, toMinorUnits } from "../utils/taxUtils";
import { buildAddonChoices, normalizeAddonItemIds, normalizeAddonLimit, normalizeAddonOptions, normalizeSelectedAddons, toggleSelectedAddon } from "../utils/menuItemOptions";
import { getAddonSelectionSignature, getCartLineKey } from "../utils/cartItemUtils";

const AUTO_PRINT_KEY = "servio.cashier.autoPrintAfterSave";

const copy = {
  ar: {
    title: "كاشير — بيع جديد",
    subtitle: "اختر الأصناف وعدّل السلة ثم اعتمد البيع مكتملًا وأصدر الفاتورة؛ لا يُرسل هذا الطلب للمطبخ.",
    back: "العودة للطلبات",
    search: "ابحث عن صنف",
    all: "الكل",
    add: "إضافة",
    cart: "سلة البيع",
    empty: "اختر صنفًا من المنيو لبدء البيع.",
    clear: "تفريغ السلة",
    orderType: "نوع الطلب",
    dineIn: "محلي",
    takeaway: "سفري",
    tableNumber: "رقم الطاولة (اختياري)",
    tableNumberHint: "مثال: 4",
    notes: "ملاحظات على الفاتورة (اختياري)",
    vatNote: "الأسعار شاملة VAT 15%؛ نفصل الضريبة من الإجمالي من دون زيادته.",
    net: "المبلغ قبل الضريبة",
    vat: "ضريبة القيمة المضافة 15% (مضمنة)",
    gross: "الإجمالي المستحق (شامل الضريبة)",
    submit: "اعتماد البيع مكتملًا وطباعة الفاتورة",
    submitting: "جارٍ حفظ البيع…",
    saved: "تم تسجيل البيع كمكتمل وإضافته إلى سجل المبيعات وإجمالي اليوم.",
    error: "تعذر حفظ الفاتورة. تحقق من الاتصال والصلاحية ثم حاول مرة أخرى.",
    noItems: "لا توجد أصناف متاحة تطابق البحث.",
    loading: "جارٍ تحميل المنيو…",
    reload: "إعادة المحاولة",
    image: "صورة الصنف",
    addonsTitle: "اختر الإضافات المجانية",
    addonBadge: "إضافات",
    addonsLimit: "اختَر حتى",
    addonsHint: "الإضافات لا تزيد سعر الصنف. اختر الخيارات المطلوبة قبل الإضافة للسلة.",
    addToSale: "إضافة إلى سلة البيع",
    cancel: "إلغاء",
    cashier: "طلب كاشير",
    printerSetup: "إعداد الطابعة",
    autoPrint: "إرسال الفاتورة تلقائيًا بعد حفظ البيع عبر QZ Tray",
    printerHelp: "تُرسل الفاتورة إلى الطابعات المختارة في إعداد QZ Tray. عند عدم توفر الجسر تبقى نافذة النظام كبديل يدوي.",
    testPrint: "اكتشاف الطابعات / اختبار الفاتورة",
    close: "إغلاق",
    printerTestItem: "اختبار الطباعة",
    printerTestLocation: "اختبار طابعة — لا يوجد طلب",
  },
  en: {
    title: "Cashier — New sale",
    subtitle: "Choose items, edit the cart, then save the sale as completed and issue its invoice; it is not sent to a kitchen.",
    back: "Back to orders",
    search: "Search menu items",
    all: "All",
    add: "Add",
    cart: "Sale cart",
    empty: "Choose an item from the menu to start a sale.",
    clear: "Clear cart",
    orderType: "Order type",
    dineIn: "Dine-in",
    takeaway: "Takeaway",
    tableNumber: "Table number (optional)",
    tableNumberHint: "For example: 4",
    notes: "Invoice/order notes (optional)",
    vatNote: "Menu prices include 15% VAT; it is separated from the total without increasing it.",
    net: "Amount before VAT",
    vat: "VAT 15% (included)",
    gross: "Amount due (VAT included)",
    submit: "Complete sale and print invoice",
    submitting: "Saving sale…",
    saved: "Sale marked completed and added to history and today's sales.",
    error: "Could not save the invoice. Check the connection and access, then try again.",
    noItems: "No available items match this search.",
    loading: "Loading menu…",
    reload: "Retry",
    image: "Item image",
    addonsTitle: "Choose free add-ons",
    addonBadge: "Add-ons",
    addonsLimit: "Choose up to",
    addonsHint: "Add-ons do not change the item price. Choose options before adding it to the sale.",
    addToSale: "Add to sale cart",
    cancel: "Cancel",
    cashier: "Cashier sale",
    printerSetup: "Printer setup",
    autoPrint: "Send the receipt automatically through QZ Tray after saving a sale",
    printerHelp: "The receipt is sent to the printers selected in QZ Tray settings. If the bridge is unavailable, the system dialog remains available as a manual fallback.",
    testPrint: "Discover printers / test receipt",
    close: "Close",
    printerTestItem: "Printer test",
    printerTestLocation: "Printer test — no order",
  },
};

const formatAmount = (value, language) => new Intl.NumberFormat(
  language === "ar" ? "ar-SA" : "en-SA",
  { minimumFractionDigits: 2, maximumFractionDigits: 2 },
).format(Number(value) || 0);

/**
 * شاشة بيع للكاشير: اختيار سريع لنوع الطلب، سلة مستقلة، وإتمام البيع مع الفاتورة.
 * إعداد الطابعات محفوظ لكل متصفح/جهاز، والطباعة تمر عبر QZ Tray عند تهيئته.
 */
function CashierPOSPage() {
  const navigate = useNavigate();
  const { items, categoriesList, menuLoading, menuError, refreshMenu } = useMenu();
  const { addOrder } = useOrders();
  const { storeInfo = {} } = useStore();
  const { tenantId, loading: tenantLoading } = useTenant();
  const { language } = useLanguage();
  const text = copy[language] || copy.ar;
  const currency = storeInfo.currency || (language === "ar" ? "ر.س" : "SAR");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState("dineIn");
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [addonDialogItem, setAddonDialogItem] = useState(null);
  const [addonDraft, setAddonDraft] = useState([]);
  const [invoiceIsTest, setInvoiceIsTest] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [printerSetupOpen, setPrinterSetupOpen] = useState(false);
  const [autoPrintAfterSave, setAutoPrintAfterSave] = useState(() => {
    try {
      return window.localStorage.getItem(AUTO_PRINT_KEY) !== "false";
    } catch {
      return true;
    }
  });

  const availableItems = useMemo(() => items.filter((item) => item.available), [items]);
  const addonChoiceCounts = useMemo(() => new Map(availableItems.map((item) => (
    [String(item.id), buildAddonChoices(item, availableItems).length]
  ))), [availableItems]);
  const categories = useMemo(() => categoriesList.filter((category) => (
    availableItems.some((item) => item.category_id === category.id)
  )), [categoriesList, availableItems]);
  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return availableItems.filter((item) => (
      (selectedCategory === "all" || item.category_id === selectedCategory) &&
      (!normalizedSearch || `${item.name || ""} ${item.description || ""}`.toLocaleLowerCase().includes(normalizedSearch))
    ));
  }, [availableItems, search, selectedCategory]);
  const addonDialogChoices = addonDialogItem ? buildAddonChoices(addonDialogItem, availableItems) : [];
  const addonDialogLimit = addonDialogItem ? normalizeAddonLimit(addonDialogItem.max_addons, addonDialogChoices.length) : 0;
  const normalizedAddonDraft = normalizeSelectedAddons(addonDraft, addonDialogChoices, addonDialogLimit);
  const selectedAddonKeys = new Set(normalizedAddonDraft.map((addon) => addon.id ? `item:${addon.id}` : `text:${addon.name.toLocaleLowerCase()}`));

  // اجمع الأسعار بوحدة الهللة نفسها المستخدمة في شاشة المنيو العامة والفاتورة.
  const grossMinorUnits = cart.reduce(
    (sum, item) => sum + toMinorUnits(item.price) * item.quantity,
    0,
  );
  const grossAmount = grossMinorUnits / 100;
  const breakdown = calculateInclusiveVat(grossAmount);
  const amount = (value) => `${formatAmount(value, language)} ${currency}`;

  const addItem = (menuItem, selectedAddons = []) => {
    setSavedMessage("");
    setCheckoutError("");
    const choices = buildAddonChoices(menuItem, availableItems);
    const addonOptions = normalizeAddonOptions(menuItem.addon_options);
    const freeAddonItemIds = normalizeAddonItemIds(menuItem.free_addon_item_ids);
    const maxAddons = normalizeAddonLimit(menuItem.max_addons, choices.length);
    const normalizedAddons = normalizeSelectedAddons(selectedAddons, choices, maxAddons);
    const selectionSignature = getAddonSelectionSignature(normalizedAddons);
    const newLine = {
      id: menuItem.id,
      cartItemId: uuidV4(),
      name: menuItem.name,
      price: roundMoney(menuItem.price),
      quantity: 1,
      addon_options: addonOptions,
      free_addon_item_ids: freeAddonItemIds,
      max_addons: maxAddons,
      selected_addons: normalizedAddons,
    };
    setCart((current) => {
      const existing = current.find((row) => row.id === menuItem.id && getAddonSelectionSignature(row.selected_addons) === selectionSignature);
      if (existing) return current.map((row) => row.cartItemId === existing.cartItemId ? { ...row, quantity: row.quantity + 1 } : row);
      return [...current, newLine];
    });
  };

  const handleSelectItem = (menuItem) => {
    const choices = buildAddonChoices(menuItem, availableItems);
    if (normalizeAddonLimit(menuItem.max_addons, choices.length) > 0 && choices.length > 0) {
      setAddonDraft([]);
      setAddonDialogItem(menuItem);
      return;
    }
    addItem(menuItem);
  };

  const confirmAddonSelection = () => {
    if (!addonDialogItem) return;
    addItem(addonDialogItem, normalizedAddonDraft);
    setAddonDraft([]);
    setAddonDialogItem(null);
  };

  const closeAddonDialog = () => {
    setAddonDraft([]);
    setAddonDialogItem(null);
  };

  const changeQuantity = (lineId, delta) => {
    setCart((current) => current
      .map((item) => getCartLineKey(item) === String(lineId) ? { ...item, quantity: item.quantity + delta } : item)
      .filter((item) => item.quantity > 0));
  };

  const handleAutoPrintChange = (event) => {
    const enabled = event.target.checked;
    setAutoPrintAfterSave(enabled);
    try {
      window.localStorage.setItem(AUTO_PRINT_KEY, String(enabled));
    } catch {
      // يستمر الخيار لهذه الجلسة حتى لو منع المتصفح التخزين المحلي.
    }
  };

  const openPrinterTest = () => {
    const now = new Date();
    setPrinterSetupOpen(false);
    setCheckoutError("");
    setSavedMessage("");
    setInvoiceIsTest(true);
    setInvoiceOrder({
      id: `PRINTER-TEST-${now.getTime()}`,
      created_at: now,
      table_number: text.printerTestLocation,
      notes: null,
      total_price: 0,
      items: [{ id: "printer-test", name: text.printerTestItem, quantity: 1, price: 0 }],
    });
  };

  const submitOrder = async () => {
    if (!tenantId || cart.length === 0 || saving) return;
    setSaving(true);
    setCheckoutError("");
    setSavedMessage("");
    try {
      const result = await addOrder({
        items: cart,
        // المبلغ المحفوظ مستحق شامل VAT؛ والبيع النقدي المكتمل لا يمر بطابور المطبخ.
        total_price: grossAmount,
        table_number: orderType === "takeaway"
          ? text.takeaway
          : tableNumber.trim() ? `${text.dineIn} - ${tableNumber.trim()}` : text.dineIn,
        notes: notes.trim() || null,
        completeImmediately: true,
      });
      if (result?.error || !result?.data) throw result?.error || new Error(text.error);
      setInvoiceIsTest(false);
      setInvoiceOrder(result.data);
      setCart([]);
      setNotes("");
      setSavedMessage(text.saved);
    } catch (error) {
      console.error("تعذر حفظ بيع الكاشير:", { code: error?.code, status: error?.status, message: error?.message });
      setCheckoutError(text.error);
    } finally {
      setSaving(false);
    }
  };

  const closeInvoice = () => {
    setInvoiceOrder(null);
    setInvoiceIsTest(false);
  };

  return (
    <Box dir={language === "ar" ? "rtl" : "ltr"} sx={{ minHeight: "100vh", bgcolor: "#f6f7f9", py: { xs: 2, md: 3 }, px: { xs: 1.5, sm: 2.5, lg: 4 } }}>
      <Box sx={{ maxWidth: 1500, mx: "auto" }}>
        <Paper elevation={0} sx={{ p: { xs: 1.8, sm: 2.5 }, mb: 2.2, borderRadius: 3, border: "1px solid rgba(23,26,47,.08)", background: "rgba(255,255,255,.92)" }}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" gap={1.5}>
            <Stack direction="row" alignItems="center" spacing={1.3}>
              <PointOfSaleRoundedIcon color="primary" sx={{ fontSize: 34 }} />
              <Box>
                <Typography variant="h5" fontWeight={950}>{text.title}</Typography>
                <Typography variant="body2" color="text.secondary">{text.subtitle}</Typography>
              </Box>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="outlined" startIcon={<PrintRoundedIcon />} onClick={() => setPrinterSetupOpen(true)} sx={{ borderRadius: 2.5, fontWeight: 800, whiteSpace: "nowrap" }}>
                {text.printerSetup}
              </Button>
              <Button variant="outlined" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/dashboard")} sx={{ borderRadius: 2.5, fontWeight: 800, whiteSpace: "nowrap" }}>
                {text.back}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* وضع نوع الطلب قبل شبكة المنيو والسلة يضمن ظهوره دون تمرير، خصوصًا على الهاتف. */}
        <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, mb: 2.2, borderRadius: 3, border: "1px solid rgba(23,26,47,.08)", background: "rgba(255,255,255,.92)" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 280px" }, gap: 1.5, alignItems: "center" }}>
            <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} spacing={1.2}>
              <Typography variant="body2" color="text.secondary" fontWeight={850} sx={{ minWidth: { sm: 82 } }}>{text.orderType}</Typography>
              <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
                <Button fullWidth variant={orderType === "dineIn" ? "contained" : "outlined"} aria-pressed={orderType === "dineIn"} onClick={() => setOrderType("dineIn")} sx={{ minWidth: { sm: 130 }, minHeight: 48, borderRadius: 2, fontWeight: 900 }}>
                  {text.dineIn}
                </Button>
                <Button fullWidth variant={orderType === "takeaway" ? "contained" : "outlined"} aria-pressed={orderType === "takeaway"} onClick={() => setOrderType("takeaway")} sx={{ minWidth: { sm: 130 }, minHeight: 48, borderRadius: 2, fontWeight: 900 }}>
                  {text.takeaway}
                </Button>
              </Stack>
            </Stack>
            {orderType === "dineIn" && (
              <TextField fullWidth size="small" label={text.tableNumber} placeholder={text.tableNumberHint} value={tableNumber} onChange={(event) => setTableNumber(event.target.value)} />
            )}
          </Box>
        </Paper>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.55fr) minmax(330px, .75fr)" }, gap: 2.2, alignItems: "start" }}>
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.2 }, borderRadius: 3, border: "1px solid rgba(23,26,47,.08)", minWidth: 0 }}>
            <TextField
              fullWidth
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={text.search}
              inputProps={{ "aria-label": text.search }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon color="action" /></InputAdornment> }}
              sx={{ mb: 1.5 }}
            />
            <Stack direction="row" spacing={0.8} sx={{ overflowX: "auto", pb: 1.5, mb: 1, "&::-webkit-scrollbar": { height: 5 } }}>
              <Chip label={text.all} clickable color={selectedCategory === "all" ? "primary" : "default"} variant={selectedCategory === "all" ? "filled" : "outlined"} onClick={() => setSelectedCategory("all")} />
              {categories.map((category) => (
                <Chip key={category.id} label={language === "en" ? (category.name_en || category.name) : category.name} clickable color={selectedCategory === category.id ? "primary" : "default"} variant={selectedCategory === category.id ? "filled" : "outlined"} onClick={() => setSelectedCategory(category.id)} />
              ))}
            </Stack>

            {tenantLoading || menuLoading ? (
              <Box sx={{ py: 8, display: "grid", justifyItems: "center", gap: 1 }}><CircularProgress /><Typography color="text.secondary">{text.loading}</Typography></Box>
            ) : menuError ? (
              <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refreshMenu?.()}>{text.reload}</Button>}>{menuError}</Alert>
            ) : visibleItems.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 8 }}>{text.noItems}</Typography>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", md: "repeat(3,minmax(0,1fr))", xl: "repeat(4,minmax(0,1fr))" }, gap: 1 }}>
                {visibleItems.map((item) => (
                  <Button
                    key={item.id}
                    fullWidth
                    variant="outlined"
                    onClick={() => handleSelectItem(item)}
                    aria-label={`${text.add} ${item.name || text.image} ${amount(item.price)}`}
                    sx={{
                      minHeight: 86,
                      px: 1,
                      py: 1,
                      borderColor: "rgba(23,26,47,.14)",
                      borderRadius: 2.5,
                      color: "text.primary",
                      textAlign: language === "ar" ? "right" : "left",
                      justifyContent: "space-between",
                      "&:hover": { borderColor: "primary.main", bgcolor: "rgba(244,121,32,.05)" },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.8} sx={{ minWidth: 0, flex: 1 }}>
                      {item.image ? (
                        <Box component="img" src={item.image} alt={item.name || text.image} loading="lazy" sx={{ width: 42, height: 42, borderRadius: 1.4, objectFit: "cover", flex: "0 0 auto", bgcolor: "grey.100" }} onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />
                      ) : (
                        <Box sx={{ width: 42, height: 42, borderRadius: 1.4, display: "grid", placeItems: "center", bgcolor: "rgba(244,121,32,.08)", color: "primary.main", flex: "0 0 auto" }}><ReceiptLongRoundedIcon fontSize="small" /></Box>
                      )}
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={850} noWrap>{item.name}</Typography>
                        <Stack direction="row" alignItems="center" spacing={0.55}>
                          <Typography variant="caption" fontWeight={850} color="primary.main">{amount(item.price)}</Typography>
                          {normalizeAddonLimit(item.max_addons, addonChoiceCounts.get(String(item.id)) || 0) > 0 && (
                            <Chip label={text.addonBadge} size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: "0.58rem", fontWeight: 850, "& .MuiChip-label": { px: 0.7 } }} />
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                    <AddRoundedIcon fontSize="small" color="primary" sx={{ flex: "0 0 auto", ml: .4 }} />
                  </Button>
                ))}
              </Box>
            )}
          </Paper>

          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.2 }, borderRadius: 3, border: "1px solid rgba(23,26,47,.08)", position: { lg: "sticky" }, top: { lg: 16 }, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Stack direction="row" alignItems="center" spacing={1}><ShoppingCartCheckoutRoundedIcon color="primary" /><Typography variant="h6" fontWeight={950}>{text.cart}</Typography></Stack>
              {cart.length > 0 && <Button size="small" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => setCart([])}>{text.clear}</Button>}
            </Stack>
            <Divider />
            {cart.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 5 }}>{text.empty}</Typography>
            ) : (
              <Stack spacing={1.1} sx={{ py: 1.5, maxHeight: { lg: "40vh" }, overflowY: "auto" }}>
                {cart.map((item) => {
                  const lineTotal = toMinorUnits(item.price) * item.quantity / 100;
                  const lineId = getCartLineKey(item);
                  return (
                    <Box key={lineId} sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 1, alignItems: "center", py: .7 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={800} noWrap>{item.name}</Typography>
                        {item.selected_addons?.length > 0 && (
                          <Typography variant="caption" color="primary.main" display="block" sx={{ overflowWrap: "anywhere" }}>
                            {item.selected_addons.map((addon) => addon.name).join(language === "ar" ? "، " : ", ")}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">{amount(lineTotal)}</Typography>
                      </Box>
                      <Stack direction="row" alignItems="center" spacing={.2}>
                        <IconButton size="small" aria-label={language === "ar" ? "تقليل الكمية" : "Decrease quantity"} onClick={() => changeQuantity(lineId, -1)}><RemoveRoundedIcon fontSize="small" /></IconButton>
                        <Typography sx={{ minWidth: 22, textAlign: "center", fontWeight: 900 }}>{item.quantity}</Typography>
                        <IconButton size="small" aria-label={language === "ar" ? "زيادة الكمية" : "Increase quantity"} onClick={() => changeQuantity(lineId, 1)}><AddRoundedIcon fontSize="small" /></IconButton>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
            <Divider sx={{ mb: 1.5 }} />
            <TextField fullWidth size="small" multiline minRows={2} label={text.notes} value={notes} onChange={(event) => setNotes(event.target.value.slice(0, 500))} inputProps={{ maxLength: 500 }} />

            {cart.length > 0 && (
              <Box sx={{ mt: 1.7, p: 1.5, borderRadius: 2.2, bgcolor: "#f7f8fb", border: "1px solid rgba(23,26,47,.07)" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>{text.vatNote}</Typography>
                <Stack spacing={.7}>
                  <Stack direction="row" justifyContent="space-between" gap={1}><Typography variant="body2" color="text.secondary">{text.net}</Typography><Typography variant="body2">{amount(breakdown.net)}</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between" gap={1}><Typography variant="body2" color="text.secondary">{text.vat}</Typography><Typography variant="body2">{amount(breakdown.vat)}</Typography></Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between" gap={1}><Typography fontWeight={950}>{text.gross}</Typography><Typography fontWeight={950} color="primary.main">{amount(grossAmount)}</Typography></Stack>
                </Stack>
              </Box>
            )}
            {savedMessage && <Alert severity="success" sx={{ mt: 1.3 }}>{savedMessage}</Alert>}
            {checkoutError && <Alert severity="error" sx={{ mt: 1.3 }}>{checkoutError}</Alert>}
            <Button fullWidth variant="contained" size="large" startIcon={saving ? <CircularProgress size={19} color="inherit" /> : <ShoppingCartCheckoutRoundedIcon />} disabled={!tenantId || cart.length === 0 || saving} onClick={submitOrder} sx={{ mt: 1.6, py: 1.25, borderRadius: 2.2, fontWeight: 900 }}>
              {saving ? text.submitting : text.submit}
            </Button>
          </Paper>
        </Box>
      </Box>

      <PrinterSetupDialog
        open={printerSetupOpen}
        onClose={() => setPrinterSetupOpen(false)}
        language={language}
        autoPrint={autoPrintAfterSave}
        onAutoPrintChange={handleAutoPrintChange}
        onTest={openPrinterTest}
      />

      <Dialog open={Boolean(addonDialogItem)} onClose={closeAddonDialog} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 950 }}>{text.addonsTitle}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={850} noWrap>{addonDialogItem?.name}</Typography>
                <Typography variant="caption" color="text.secondary">{amount(addonDialogItem?.price)}</Typography>
              </Box>
              <Chip
                size="small"
                color={normalizedAddonDraft.length >= addonDialogLimit ? "primary" : "default"}
                label={`${normalizedAddonDraft.length} / ${addonDialogLimit}`}
                sx={{ fontWeight: 900, borderRadius: 1.5 }}
              />
            </Stack>
            <Box
              role="group"
              aria-label={language === "ar" ? "الإضافات المتاحة" : "Available add-ons"}
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 165px), 1fr))",
                gap: 1,
                minWidth: 0,
              }}
            >
              {addonDialogChoices.map((choice) => {
                const selected = selectedAddonKeys.has(choice.key);
                const atLimit = normalizedAddonDraft.length >= addonDialogLimit;
                return (
                  <Button
                    key={choice.key}
                    fullWidth
                    variant={selected ? "contained" : "outlined"}
                    color={selected ? "primary" : "inherit"}
                    disabled={!selected && atLimit}
                    aria-pressed={selected}
                    startIcon={selected ? <CheckCircleRoundedIcon /> : <AddCircleOutlineRoundedIcon />}
                    onClick={() => setAddonDraft((current) => toggleSelectedAddon(current, choice, addonDialogChoices, addonDialogLimit))}
                    sx={{
                      minWidth: 0,
                      minHeight: 50,
                      px: 1.25,
                      py: 1,
                      borderRadius: 2.5,
                      fontWeight: 800,
                      justifyContent: "flex-start",
                      textAlign: "start",
                      textTransform: "none",
                      whiteSpace: "normal",
                      lineHeight: 1.3,
                      overflowWrap: "anywhere",
                      "& .MuiButton-startIcon": { flex: "0 0 auto" },
                      ...(selected
                        ? { boxShadow: "0 5px 14px rgba(244,121,32,.2)" }
                        : {
                            borderColor: "divider",
                            color: "text.primary",
                            bgcolor: "background.paper",
                            "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                          }),
                    }}
                  >
                    <Box component="span" sx={{ minWidth: 0, overflowWrap: "anywhere" }}>{choice.name}</Box>
                  </Button>
                );
              })}
            </Box>
            <Typography variant="caption" color="text.secondary">{text.addonsHint}</Typography>
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2,
            gap: 1,
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            "& .MuiButton-root": { minHeight: 44, borderRadius: 2, whiteSpace: "normal" },
          }}
        >
          <Button onClick={closeAddonDialog} color="inherit" sx={{ flex: { sm: "0 0 auto" } }}>
            {text.cancel}
          </Button>
          <Button onClick={confirmAddonSelection} variant="contained" sx={{ fontWeight: 850, flex: { sm: "1 1 auto" } }}>
            {text.addToSale}
          </Button>
        </DialogActions>
      </Dialog>

      <InvoiceModal
        open={Boolean(invoiceOrder)}
        onClose={closeInvoice}
        order={invoiceOrder}
        autoPrint={autoPrintAfterSave || invoiceIsTest}
        isTest={invoiceIsTest}
      />
    </Box>
  );
}

export default CashierPOSPage;
