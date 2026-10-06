import { useEffect, useMemo, useState } from "react";
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
  Drawer,
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
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { v4 as uuidV4 } from "uuid";
import PaymentStatusControl from "../components/cashier-dashboard/orders/PaymentStatusControl";
import { useMenu } from "../context/MenuContext";
import { useOrders } from "../context/OrdersContext";
import { useStore } from "../context/StoreInfoContext";
import { useTenant } from "../context/TenantContext";
import { useLanguage } from "../context/LanguageContext";
import InvoiceModal from "../components/manager-dashboard/orders/OrderPill";
import PrinterSetupDialog from "../components/cashier-dashboard/PrinterSetupDialog";
import CashierShiftGate from "../components/cashier-dashboard/CashierShiftGate";
import PrinterBridgeStatus from "../components/cashier-dashboard/PrinterBridgeStatus";
import CategoryPrintRoutingDrawer from "../components/manager-dashboard/menu-control/CategoryPrintRoutingDrawer";
import { useShift } from "../context/ShiftContext";
import { useUser } from "../context/UserContext";
import { calculateInclusiveVat, roundMoney, toMinorUnits } from "../utils/taxUtils";
import { buildAddonChoices, normalizeAddonItemIds, normalizeAddonLimit, normalizeAddonOptions, normalizeSelectedAddons, toggleSelectedAddon } from "../utils/menuItemOptions";
import { getAddonSelectionSignature, getCartLineKey } from "../utils/cartItemUtils";

const AUTO_PRINT_KEY = "servio.cashier.autoPrintAfterSave";

const copy = {
  ar: {
    title: "كاشير — بيع جديد",
    subtitle: "اختر الأصناف وعدّل السلة ثم اعتمد الطلب؛ تُطبع تذكرة المطبخ دائمًا، وتُضاف فاتورة الكاشير إذا كان مدفوعًا.",
    back: "العودة للطلبات",
    search: "ابحث عن صنف",
    all: "الكل",
    add: "إضافة",
    cart: "سلة البيع",
    cartReview: "مراجعة السلة",
    selectedCount: "عناصر",
    clearSearch: "مسح البحث",
    empty: "اختر صنفًا من المنيو لبدء البيع.",
    clear: "تفريغ السلة",
    orderType: "نوع الطلب",
    paid: "مدفوع",
    unpaid: "غير مدفوع",
    paymentStatus: "حالة الدفع",
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
    autoPrint: "طباعة اختبار الطابعة تلقائيًا عبر QZ Tray",
    printerHelp: "تُرسل الفاتورة إلى الطابعات المختارة في إعداد QZ Tray. عند عدم توفر الجسر تبقى نافذة النظام كبديل يدوي.",
    testPrint: "اكتشاف الطابعات / اختبار الفاتورة",
    close: "إغلاق",
    printerTestItem: "اختبار الطباعة",
    printerTestLocation: "اختبار طابعة — لا يوجد طلب",
    shiftRequired: "ابدأ الوردية وسجّل رصيد البداية قبل اعتماد أي بيع.",
    categoryPrinters: "طابعات التصنيفات",
  },
  en: {
    title: "Cashier — New sale",
    subtitle: "Choose items and save the sale; a kitchen ticket always prints, and paid sales also print the cashier invoice.",
    back: "Back to orders",
    search: "Search menu items",
    all: "All",
    add: "Add",
    cart: "Sale cart",
    cartReview: "Review cart",
    selectedCount: "items",
    clearSearch: "Clear search",
    empty: "Choose an item from the menu to start a sale.",
    clear: "Clear cart",
    orderType: "Order type",
    paid: "Paid",
    unpaid: "Unpaid",
    paymentStatus: "Payment status",
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
    autoPrint: "Automatically print the printer test through QZ Tray",
    printerHelp: "The receipt is sent to the printers selected in QZ Tray settings. If the bridge is unavailable, the system dialog remains available as a manual fallback.",
    testPrint: "Discover printers / test receipt",
    close: "Close",
    printerTestItem: "Printer test",
    printerTestLocation: "Printer test — no order",
    shiftRequired: "Start your shift and record the opening cash before completing a sale.",
    categoryPrinters: "Category printers",
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
  const { items, categoriesList, menuLoading, menuError, refreshMenu, updateCategoryPrintRoutes } = useMenu();
  const { addOrder, updateOrderPaymentStatus } = useOrders();
  const { storeInfo = {} } = useStore();
  const { tenantId, loading: tenantLoading } = useTenant();
  const { language } = useLanguage();
  const { currentShift } = useShift();
  const { user } = useUser();
  const shiftRequired = user?.role === "cashier";
  const text = copy[language] || copy.ar;
  const currency = storeInfo.currency || (language === "ar" ? "ر.س" : "SAR");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState("dineIn");
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [paymentMethod, setPaymentMethod] = useState(null);
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
  const [categoryRoutingOpen, setCategoryRoutingOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [autoPrintAfterSave, setAutoPrintAfterSave] = useState(() => {
    try {
      return window.localStorage.getItem(AUTO_PRINT_KEY) !== "false";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!tenantId) return;
    try {
      const stored = JSON.parse(window.localStorage.getItem(`servio.pos.unpaidOrders.${tenantId}`) || "[]");
      setUnpaidOrders(Array.isArray(stored) ? stored : []);
    } catch {
      setUnpaidOrders([]);
    }
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    try { window.localStorage.setItem(`servio.pos.unpaidOrders.${tenantId}`, JSON.stringify(unpaidOrders)); } catch { /* storage is optional */ }
  }, [tenantId, unpaidOrders]);

  const availableItems = useMemo(() => items.filter((item) => item.available), [items]);
  const addonChoiceCounts = useMemo(() => new Map(availableItems.map((item) => (
    [String(item.id), buildAddonChoices(item, availableItems).length]
  ))), [availableItems]);
  const categories = useMemo(() => categoriesList.filter((category) => (
    availableItems.some((item) => item.category_id === category.id)
  )), [categoriesList, availableItems]);
  const categoryPrinterNames = useMemo(() => categoriesList
    .map((category) => category.printer_name)
    .filter((name) => typeof name === "string" && name.trim()), [categoriesList]);
  const categoryById = useMemo(() => new Map(categoriesList.map((category) => [category.id, category])), [categoriesList]);
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
  const cartItemCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
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
      category_id: menuItem.category_id || null,
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
    if (shiftRequired && !currentShift?.id) { setCheckoutError(text.shiftRequired); return; }
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
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        completeImmediately: true,
      });
      if (result?.error || !result?.data) throw result?.error || new Error(text.error);
      setInvoiceIsTest(false);
      setInvoiceOrder(result.data);
      if (paymentStatus !== "paid") setUnpaidOrders((current) => [...current.filter((row) => row.id !== result.data.id), result.data]);
      setCart([]);
      setNotes("");
      setPaymentStatus("unpaid");
      setPaymentMethod(null);
      setCartDrawerOpen(false);
      setSavedMessage(text.saved);
    } catch (error) {
      console.error("تعذر حفظ بيع الكاشير:", { code: error?.code, status: error?.status, message: error?.message });
      setCheckoutError(text.error);
    } finally {
      setSaving(false);
    }
  };

  const settleUnpaidOrder = async (order) => {
    const result = await updateOrderPaymentStatus(order.id, "paid");
    if (result?.error) {
      setCheckoutError(language === "ar" ? "تعذر تسجيل السداد. أعد المحاولة." : "Could not record payment. Retry.");
      return;
    }
    const paidOrder = { ...order, payment_status: "paid", paid_at: new Date().toISOString() };
    setUnpaidOrders((current) => current.filter((row) => row.id !== order.id));
    setInvoiceIsTest(false);
    setInvoiceOrder(paidOrder);
    setSavedMessage(language === "ar" ? "تم تسجيل السداد. يمكنك الآن طباعة فاتورة الكاشير." : "Payment recorded. The cashier invoice is now available to print.");
  };

  const closeInvoice = () => {
    setInvoiceOrder(null);
    setInvoiceIsTest(false);
  };

  const renderCartContents = (mobileView = false) => (
    <Box sx={{ p: mobileView ? { xs: 2, sm: 2.5 } : 0, pb: mobileView ? "calc(16px + env(safe-area-inset-bottom))" : 0 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 1.35 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
          <ShoppingCartCheckoutRoundedIcon color="primary" />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={950} sx={{ fontSize: { xs: "1.05rem", sm: "1.2rem" } }}>{text.cart}</Typography>
            {cart.length > 0 && <Typography variant="caption" color="text.secondary">{cartItemCount} {text.selectedCount}</Typography>}
          </Box>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={.25}>
          {cart.length > 0 && (
            <>
              <Button size="small" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => { setCart([]); if (mobileView) setCartDrawerOpen(false); }} sx={{ display: { xs: "none", sm: "inline-flex" } }}>
                {text.clear}
              </Button>
              <IconButton aria-label={text.clear} title={text.clear} color="error" onClick={() => { setCart([]); setCartDrawerOpen(false); }} sx={{ display: { xs: "inline-flex", sm: "none" } }}>
                <DeleteOutlineRoundedIcon />
              </IconButton>
            </>
          )}
          {mobileView && <IconButton aria-label={text.close} onClick={() => setCartDrawerOpen(false)}><CloseRoundedIcon /></IconButton>}
        </Stack>
      </Stack>
      <Divider />

      {cart.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 5 }}>{text.empty}</Typography>
      ) : (
        <Stack spacing={0.7} sx={{ py: 1.1, maxHeight: mobileView ? "30dvh" : { sm: "min(32vh, 300px)", lg: "min(38vh, 420px)" }, overflowY: "auto", overscrollBehavior: "contain" }}>
          {cart.map((item) => {
            const lineTotal = toMinorUnits(item.price) * item.quantity / 100;
            const lineId = getCartLineKey(item);
            return (
              <Box key={lineId} sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: .75, alignItems: "center", py: .65, borderBottom: "1px solid rgba(23,26,47,.06)" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={950} sx={{ fontSize: { xs: ".86rem", sm: ".92rem" }, lineHeight: 1.25, overflowWrap: "anywhere" }}>{item.name}</Typography>
                  {item.selected_addons?.length > 0 && (
                    <Typography variant="caption" color="primary.main" display="block" sx={{ overflowWrap: "anywhere" }}>
                      {item.selected_addons.map((addon) => addon.name).join(language === "ar" ? "، " : ", ")}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">{amount(lineTotal)}</Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={.1}>
                  <IconButton size="small" aria-label={language === "ar" ? "تقليل الكمية" : "Decrease quantity"} onClick={() => changeQuantity(lineId, -1)}><RemoveRoundedIcon fontSize="small" /></IconButton>
                  <Typography sx={{ minWidth: 22, textAlign: "center", fontWeight: 900 }}>{item.quantity}</Typography>
                  <IconButton size="small" aria-label={language === "ar" ? "زيادة الكمية" : "Increase quantity"} onClick={() => changeQuantity(lineId, 1)}><AddRoundedIcon fontSize="small" /></IconButton>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}

      <Divider sx={{ mb: 1.4 }} />
      <TextField fullWidth size="small" multiline minRows={2} label={text.notes} value={notes} onChange={(event) => setNotes(event.target.value.slice(0, 500))} inputProps={{ maxLength: 500 }} />
      <Box sx={{ mt: 1.25, p: 1.1, borderRadius: 2, bgcolor: "rgba(23,26,47,.025)", border: "1px solid", borderColor: "divider" }}>
        <PaymentStatusControl value={paymentStatus} method={paymentMethod} onChange={setPaymentStatus} onMethodChange={setPaymentMethod} language={language} />
      </Box>

      {cart.length > 0 && (
        <Box sx={{ mt: 1.25, p: 1.35, borderRadius: 2.2, bgcolor: "#f7f8fb", border: "1px solid rgba(23,26,47,.07)" }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: .8, lineHeight: 1.5 }}>{text.vatNote}</Typography>
          <Stack spacing={.65}>
            <Stack direction="row" justifyContent="space-between" gap={1}><Typography variant="body2" color="text.secondary">{text.net}</Typography><Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>{amount(breakdown.net)}</Typography></Stack>
            <Stack direction="row" justifyContent="space-between" gap={1}><Typography variant="body2" color="text.secondary">{text.vat}</Typography><Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>{amount(breakdown.vat)}</Typography></Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between" gap={1}><Typography fontWeight={950} sx={{ minWidth: 0 }}>{text.gross}</Typography><Typography fontWeight={950} color="primary.main" sx={{ whiteSpace: "nowrap" }}>{amount(grossAmount)}</Typography></Stack>
          </Stack>
        </Box>
      )}

      {savedMessage && <Alert severity="success" sx={{ mt: 1.2 }}>{savedMessage}</Alert>}
      {shiftRequired && !currentShift && <Alert severity="warning" sx={{ mt: 1.2, borderRadius: 2 }}>{text.shiftRequired}</Alert>}
      {checkoutError && <Alert severity="error" sx={{ mt: 1.2 }}>{checkoutError}</Alert>}
      {unpaidOrders.length > 0 && (
        <Box sx={{ mt: 1.5, p: 1.35, borderRadius: 2.2, bgcolor: "rgba(244,121,32,.07)", border: "1px solid", borderColor: "warning.light" }}>
          <Typography fontWeight={900} sx={{ mb: .35 }}>{language === "ar" ? "أصناف معلقة — بانتظار الدفع" : "Pending items — awaiting payment"}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>{language === "ar" ? "تظل الطلبات هنا بعد طباعة تذكرة المطبخ حتى تسجيل السداد، ثم تُطبع فاتورة الكاشير." : "Orders stay here after the kitchen ticket prints until payment is recorded, then the cashier invoice prints."}</Typography>
          <Stack spacing={.8}>
            {unpaidOrders.map((order) => (
              <Box key={order.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, p: .85, borderRadius: 1.6, bgcolor: "background.paper" }}>
                <Box sx={{ minWidth: 0 }}><Typography variant="body2" fontWeight={850} noWrap>#{String(order.id).slice(-6).toUpperCase()} · {order.table_number}</Typography><Typography variant="caption" color="text.secondary" sx={{ display: "block" }} noWrap>{(order.items || []).map((item) => `${item.quantity}× ${item.name}`).join(language === "ar" ? "، " : ", ")}</Typography><Typography variant="caption" color="text.secondary">{amount(order.total_price)}</Typography></Box>
                <Button size="small" variant="contained" color="success" onClick={() => settleUnpaidOrder(order)}>{language === "ar" ? "تسجيل السداد" : "Record payment"}</Button>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
      <Box sx={{ position: mobileView ? "sticky" : "static", bottom: 0, pt: 1.2, bgcolor: mobileView ? "background.paper" : "transparent" }}>
        <Button fullWidth variant="contained" size="large" startIcon={saving ? <CircularProgress size={19} color="inherit" /> : <ShoppingCartCheckoutRoundedIcon />} disabled={!tenantId || cart.length === 0 || saving || (shiftRequired && !currentShift?.id)} onClick={submitOrder} sx={{ py: 1.2, minHeight: 50, borderRadius: 2.2, fontWeight: 900 }}>
          {saving ? text.submitting : text.submit}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box dir={language === "ar" ? "rtl" : "ltr"} sx={{ minHeight: "100vh", minWidth: 0, bgcolor: "#f6f7f9", py: { xs: 1.25, md: 3 }, pb: { xs: cart.length ? 12 : 1.25, md: 3 }, px: { xs: 1.25, sm: 2.5, lg: 4 } }}>
      <Box sx={{ maxWidth: 1500, minWidth: 0, mx: "auto" }}>
        <CashierShiftGate />
        <Paper elevation={0} sx={{ p: { xs: 1.8, sm: 2.5 }, mb: 2.2, borderRadius: 3, border: "1px solid rgba(23,26,47,.08)", background: "rgba(255,255,255,.92)" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
              <PointOfSaleRoundedIcon color="primary" sx={{ fontSize: 34 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" fontWeight={950} sx={{ fontSize: { xs: "1.12rem", sm: "1.5rem" }, lineHeight: 1.25 }}>{text.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" }, mt: .25 }}>{text.subtitle}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={0.5} sx={{ display: { xs: "flex", sm: "none" }, flex: "0 0 auto" }}>
              <IconButton aria-label={text.categoryPrinters} title={text.categoryPrinters} onClick={() => setCategoryRoutingOpen(true)} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}><CategoryOutlinedIcon fontSize="small" /></IconButton>
              <IconButton aria-label={text.printerSetup} title={text.printerSetup} onClick={() => setPrinterSetupOpen(true)} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}><PrintRoundedIcon fontSize="small" /></IconButton>
              <IconButton aria-label={text.back} title={text.back} onClick={() => navigate("/dashboard")} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}><ArrowBackRoundedIcon fontSize="small" /></IconButton>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ display: { xs: "none", sm: "flex" } }}>
              <Button variant="outlined" startIcon={<PrintRoundedIcon />} onClick={() => setCategoryRoutingOpen(true)} sx={{ borderRadius: 2.5, fontWeight: 800, whiteSpace: "nowrap" }}>
                {text.categoryPrinters}
              </Button>
              <Button variant="outlined" startIcon={<PrintRoundedIcon />} onClick={() => setPrinterSetupOpen(true)} sx={{ borderRadius: 2.5, fontWeight: 800, whiteSpace: "nowrap" }}>
                {text.printerSetup}
              </Button>
              <Button variant="outlined" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/dashboard")} sx={{ borderRadius: 2.5, fontWeight: 800, whiteSpace: "nowrap" }}>
                {text.back}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", sm: "flex-end" }, minWidth: 0, mb: 1.5 }}>
          <PrinterBridgeStatus language={language} categoryPrinterNames={categoryPrinterNames} />
        </Box>

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

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1.2fr) minmax(265px, .8fr)", lg: "minmax(0, 1.55fr) minmax(300px, .75fr)" }, gap: { xs: 1.25, md: 2 }, alignItems: "start" }}>
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.2 }, borderRadius: 3, border: "1px solid rgba(23,26,47,.08)", minWidth: 0 }}>
            <TextField
              fullWidth
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={text.search}
              inputProps={{ "aria-label": text.search }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchRoundedIcon color="action" /></InputAdornment>,
                endAdornment: search ? <InputAdornment position="end"><IconButton size="small" aria-label={text.clearSearch} onClick={() => setSearch("")} edge="end"><CloseRoundedIcon fontSize="small" /></IconButton></InputAdornment> : null,
              }}
              sx={{ mb: 1.5 }}
            />
            <Stack direction="row" spacing={0.8} sx={{ overflowX: "auto", pb: 1.2, mb: .8, maxWidth: "100%", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" }, "& > *": { flexShrink: 0 } }}>
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
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", md: "repeat(3,minmax(0,1fr))", xl: "repeat(4,minmax(0,1fr))" }, gap: { xs: .8, sm: 1.4 } }}>
                {visibleItems.map((item) => {
                  const category = categoryById.get(item.category_id);
                  return (
                  <Button
                    key={item.id}
                    fullWidth
                    variant="outlined"
                    onClick={() => handleSelectItem(item)}
                    aria-label={`${text.add} ${item.name || text.image} ${amount(item.price)}`}
                    sx={{
                      minWidth: 0, minHeight: { xs: 158, sm: 210 }, p: 0,
                      borderColor: "rgba(23,26,47,.10)", borderRadius: 3, color: "text.primary",
                      bgcolor: "background.paper", display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "flex-start",
                      textAlign: language === "ar" ? "right" : "left", overflow: "hidden",
                      boxShadow: "0 5px 18px rgba(23,26,47,.035)", transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
                      "&:hover": { borderColor: "primary.main", bgcolor: "background.paper", transform: "translateY(-2px)", boxShadow: "0 12px 26px rgba(23,26,47,.10)" },
                      "&:hover .pos-product-image": { transform: "scale(1.04)" },
                    }}
                  >
                    <Box sx={{ position: "relative", width: "100%", height: { xs: 78, sm: 118 }, overflow: "hidden", bgcolor: "rgba(23,26,47,.045)" }}>
                      {item.image ? (
                        <Box className="pos-product-image" component="img" src={item.image} alt={item.name || text.image} loading="lazy" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .35s ease" }} onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />
                      ) : (
                        <Box sx={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "primary.main", background: "linear-gradient(145deg, rgba(244,121,32,.10), rgba(23,26,47,.035))" }}><ReceiptLongRoundedIcon sx={{ fontSize: 34, opacity: .8 }} /></Box>
                      )}
                      {category && <Chip size="small" label={language === "en" ? (category.name_en || category.name) : category.name} sx={{ position: "absolute", top: 8, insetInlineStart: 8, bgcolor: "rgba(255,255,255,.92)", backdropFilter: "blur(8px)", fontWeight: 800, maxWidth: "80%", height: 24 }} />}
                      <Box sx={{ position: "absolute", bottom: 8, insetInlineEnd: 8, width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: "50%", color: "primary.main", bgcolor: "rgba(255,255,255,.94)", boxShadow: "0 3px 9px rgba(23,26,47,.14)" }}><AddRoundedIcon fontSize="small" /></Box>
                    </Box>
                    <Box sx={{ p: { xs: 1, sm: 1.35 }, minWidth: 0, width: "100%", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: .6 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={900} sx={{ fontSize: { xs: ".82rem", sm: ".94rem" }, lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", overflowWrap: "anywhere", minHeight: "2.1em" }}>{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: .25, display: { xs: "none", sm: "-webkit-box" }, WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.25, minHeight: "1.25em" }}>{item.description || " "}</Typography>
                      </Box>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={.5}>
                        <Typography variant="body2" fontWeight={950} color="primary.main" sx={{ overflowWrap: "anywhere" }}>{amount(item.price)}</Typography>
                        {normalizeAddonLimit(item.max_addons, addonChoiceCounts.get(String(item.id)) || 0) > 0 && <Chip label={text.addonBadge} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: ".58rem", fontWeight: 850, "& .MuiChip-label": { px: .7 } }} />}
                      </Stack>
                    </Box>
                  </Button>
                  );
                })}
              </Box>
            )}
          </Paper>

          <Paper elevation={0} sx={{ display: { xs: "none", sm: "block" }, p: { sm: 1.6, md: 2 }, borderRadius: 3, border: "1px solid rgba(23,26,47,.08)", position: { sm: "sticky" }, top: { sm: 12 }, minWidth: 0, boxShadow: { sm: "0 8px 24px rgba(23,26,47,.07)" } }}>
            {renderCartContents(false)}
          </Paper>
        </Box>
      </Box>

      <Drawer
        anchor="bottom"
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        sx={{ display: { xs: "block", sm: "none" } }}
        slotProps={{ paper: { sx: { maxHeight: "92dvh", overflowY: "auto", borderTopLeftRadius: 22, borderTopRightRadius: 22, bgcolor: "background.paper" } } }}
      >
        <Box sx={{ width: "100%", maxWidth: 680, mx: "auto" }}>{renderCartContents(true)}</Box>
      </Drawer>
      {cart.length > 0 && (
        <Box component="footer" sx={{ display: { xs: "block", sm: "none" }, position: "fixed", insetInline: 0, bottom: 0, zIndex: (theme) => theme.zIndex.appBar + 1, px: 1.25, pt: .9, pb: "calc(10px + env(safe-area-inset-bottom))", bgcolor: "rgba(246,247,249,.94)", backdropFilter: "blur(14px)", borderTop: "1px solid rgba(23,26,47,.08)" }}>
          <Button fullWidth variant="contained" onClick={() => setCartDrawerOpen(true)} aria-label={`${text.cartReview}: ${cartItemCount} ${text.selectedCount}, ${amount(grossAmount)}`} sx={{ minHeight: 58, px: 1.6, borderRadius: 2.6, bgcolor: "secondary.main", color: "common.white", textTransform: "none", boxShadow: "0 8px 22px rgba(23,26,47,.18)", "&:hover": { bgcolor: "secondary.dark" } }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: "100%" }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, textAlign: "start" }}>
                <ShoppingCartCheckoutRoundedIcon sx={{ color: "primary.light" }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={900} sx={{ lineHeight: 1.2 }}>{text.cartReview}</Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,.7)" }}>{cartItemCount} {text.selectedCount}</Typography>
                </Box>
              </Stack>
              <Typography fontWeight={950} sx={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{amount(grossAmount)}</Typography>
            </Stack>
          </Button>
        </Box>
      )}

      <PrinterSetupDialog
        open={printerSetupOpen}
        onClose={() => setPrinterSetupOpen(false)}
        language={language}
        autoPrint={autoPrintAfterSave}
        onAutoPrintChange={handleAutoPrintChange}
        onTest={openPrinterTest}
      />
      <CategoryPrintRoutingDrawer open={categoryRoutingOpen} onClose={() => setCategoryRoutingOpen(false)} categories={categoriesList} onUpdateCategories={updateCategoryPrintRoutes} />

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
        key={invoiceOrder ? `${invoiceOrder.id}-${invoiceOrder.payment_status || "test"}` : "invoice"}
        open={Boolean(invoiceOrder)}
        onClose={closeInvoice}
        order={invoiceOrder}
        autoPrint={invoiceIsTest ? autoPrintAfterSave : true}
        isTest={invoiceIsTest}
      />
    </Box>
  );
}

export default CashierPOSPage;
