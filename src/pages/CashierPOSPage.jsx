import { FullscreenDialog as Dialog } from "../components/common/FullscreenOverlays";
import { FullscreenDrawer as Drawer } from "../components/common/FullscreenOverlays";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Chip, CircularProgress, DialogActions, DialogContent, DialogTitle, Divider, FormControl, IconButton, InputLabel, InputAdornment, MenuItem, Paper, Select, Stack, TextField, Typography } from "@mui/material";
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
import { useBranch } from "../context/BranchContext";
import { useLanguage } from "../context/LanguageContext";
import InvoiceModal from "../components/manager-dashboard/orders/OrderPill";
import PrinterSetupDialog from "../components/cashier-dashboard/PrinterSetupDialog";
import CashierShiftGate from "../components/cashier-dashboard/CashierShiftGate";
import PrinterBridgeStatus from "../components/cashier-dashboard/PrinterBridgeStatus";
import CategoryPrintRoutingDrawer from "../components/manager-dashboard/menu-control/CategoryPrintRoutingDrawer";
import { useShift } from "../context/ShiftContext";
import { useUser } from "../context/UserContext";
import NewTableOrderAlert from "../components/cashier-dashboard/orders/NewTableOrderAlert";
import { toMinorUnits } from "../utils/taxUtils";
import { buildKitchenOrderDelta } from "../utils/orderKitchenDelta";
import { buildAddonChoices, normalizeAddonItemIds, normalizeAddonLimit, normalizeAddonOptions, normalizeSelectedAddons, toggleSelectedAddon } from "../utils/menuItemOptions";
import { getAddonSelectionSignature, getCartLineKey } from "../utils/cartItemUtils";

const AUTO_PRINT_KEY = "servio.cashier.autoPrintAfterSave";
const POS_CARD_ACCENTS = ["#F47920", "#2878C8", "#159A68", "#8B5CF6", "#D96210", "#0F766E"];

const copy = {
  ar: {
    title: "كاشير — بيع جديد",
    subtitle: "اختر الأصناف واحفظ البيع. الإيصال المطبوع داخلي وليس فاتورة ضريبية.",
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
    splitPayment: "تقسيم الدفع",
    cashAmount: "المبلغ النقدي",
    cardAmount: "مبلغ الشبكة",
    splitPaymentHint: "يجب أن يساوي مجموع النقد والشبكة إجمالي الطلب.",
    dineIn: "محلي",
    takeaway: "سفري",
    tableNumber: "رقم الطاولة (اختياري)",
    tableNumberHint: "مثال: 4",
    notes: "ملاحظات الطلب (اختياري)",
    gross: "الإجمالي",
    submit: "حفظ البيع",
    saveEdit: "حفظ التعديل",
    editSaved: "تم حفظ التعديل. لم تتم إعادة طباعة تذكرة الطلب كاملة.",
    kitchenUpdate: "طباعة تحديث المطبخ",
    internalReceipt: "طباعة الإيصال الداخلي",
    submitting: "جارٍ حفظ البيع…",
    saved: "تم حفظ البيع وإضافته إلى سجل المبيعات وإجمالي اليوم.",
    error: "تعذر حفظ الطلب. تحقق من الاتصال والصلاحية ثم حاول مرة أخرى.",
    unavailableCart: "تعذر حفظ البيع؛ توجد أصناف لم تعد متاحة بسبب حالة الصنف أو نفاد أحد مكوناته. أزلها من السلة ثم حدّث المنيو.",
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
    autoPrint: "طباعة الإيصال تلقائيًا بعد الحفظ عبر QZ Tray",
    printerHelp: "يُرسل الإيصال الداخلي إلى الطابعات المختارة في إعداد QZ Tray. عند عدم توفر الجسر تبقى نافذة النظام كبديل يدوي.",
    testPrint: "اكتشاف الطابعات / اختبار الإيصال",
    close: "إغلاق",
    printerTestItem: "اختبار الطباعة",
    printerTestLocation: "اختبار طابعة — لا يوجد طلب",
    shiftRequired: "ابدأ الوردية وسجّل رصيد البداية قبل اعتماد أي بيع.",
    categoryPrinters: "طابعات التصنيفات",
  },
  en: {
    title: "Cashier — New sale",
    subtitle: "Choose items and save the sale. Printed receipts are internal and are not tax invoices.",
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
    splitPayment: "Split payment",
    cashAmount: "Cash amount",
    cardAmount: "Network amount",
    splitPaymentHint: "Cash plus network must equal the order total.",
    dineIn: "Dine-in",
    takeaway: "Takeaway",
    tableNumber: "Table number (optional)",
    tableNumberHint: "For example: 4",
    notes: "Order notes (optional)",
    gross: "Total",
    submit: "Save sale",
    saveEdit: "Save changes",
    editSaved: "Changes saved. The full kitchen ticket was not printed again.",
    kitchenUpdate: "Print kitchen update",
    internalReceipt: "Print internal receipt",
    submitting: "Saving sale…",
    saved: "Sale saved and added to history and today's sales.",
    error: "Could not save the order. Check the connection and access, then try again.",
    unavailableCart: "The sale could not be saved because some items are no longer available. Remove them from the cart and refresh the menu.",
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
    autoPrint: "Automatically print the receipt after saving via QZ Tray",
    printerHelp: "The internal receipt is sent to the printers selected in QZ Tray settings. If the bridge is unavailable, the system dialog remains available as a manual fallback.",
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
  { minimumFractionDigits: 2, maximumFractionDigits: 20 },
).format(Number(value) || 0);

/**
 * شاشة بيع للكاشير: اختيار سريع لنوع الطلب، سلة مستقلة، وإتمام البيع مع الفاتورة.
 * إعداد الطابعات محفوظ لكل متصفح/جهاز، والطباعة تمر عبر QZ Tray عند تهيئته.
 */
function CashierPOSPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, categoriesList, menuLoading, menuError, refreshMenu, updateCategoryPrintRoutes } = useMenu();
  const { addOrder, updateOrder, updateOrderPaymentStatus, deleteOrder } = useOrders();
  const { storeInfo = {} } = useStore();
  const { tenantId, loading: tenantLoading } = useTenant();
  const { selectedBranchId: branchId } = useBranch();
  const { language } = useLanguage();
  const { currentShift } = useShift();
  const { user } = useUser();
  const shiftRequired = user?.role === "cashier";
  const text = copy[language] || copy.ar;
  const currency = storeInfo.currency || (language === "ar" ? "ر.س" : "SAR");
  const unpaidStorageKey = `servio.pos.unpaidOrders.${tenantId || "none"}.${branchId || "none"}.${user?.id || "anon"}.${currentShift?.id || "no-shift"}`;

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [categoryOrderReady, setCategoryOrderReady] = useState(false);
  const [draggingCategory, setDraggingCategory] = useState(null);
  const holdTimerRef = useRef(null);
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState("dineIn");
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [addonDialogItem, setAddonDialogItem] = useState(null);
  const [addonDraft, setAddonDraft] = useState([]);
  const [invoiceIsTest, setInvoiceIsTest] = useState(false);
  const [invoiceAutoPrint, setInvoiceAutoPrint] = useState(true);
  const [invoiceIsEditMode, setInvoiceIsEditMode] = useState(false);
  const [invoiceKitchenUpdateItems, setInvoiceKitchenUpdateItems] = useState([]);
  const [invoicePrintMode, setInvoicePrintMode] = useState("order");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [settlementTarget, setSettlementTarget] = useState(null);
  const [settlementMethod, setSettlementMethod] = useState("");
  const [settlementCashAmount, setSettlementCashAmount] = useState("");
  const [settlementCardAmount, setSettlementCardAmount] = useState("");
  const [settlementSaving, setSettlementSaving] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [savedMessage, setSavedMessage] = useState("");
  const [printerSetupOpen, setPrinterSetupOpen] = useState(false);
  const [categoryRoutingOpen, setCategoryRoutingOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editingOrderSnapshot, setEditingOrderSnapshot] = useState(null);
  const [savedEditOrder, setSavedEditOrder] = useState(null);
  const [autoPrintAfterSave, setAutoPrintAfterSave] = useState(() => {
    try {
      return window.localStorage.getItem(AUTO_PRINT_KEY) !== "false";
    } catch {
      return true;
    }
  });

  const loadOrderForEdit = useCallback((order) => {
    const tableValue = String(order?.table_number || "");
    const isTakeaway = /^(takeaway|سفري)$/i.test(tableValue.trim());
    const parsedTable = isTakeaway ? "" : tableValue.replace(/^(محلي|dine[ -]?in)(?:\s*[-–:]\s*)?/i, "").trim();
    setCart(Array.isArray(order?.items) ? order.items.map((item) => ({ ...item, cartItemId: item.cartItemId || uuidV4(), quantity: Number(item.quantity || 1) })) : []);
    setOrderType(isTakeaway ? "takeaway" : "dineIn");
    setTableNumber(parsedTable);
    setPaymentStatus(order?.payment_status === "paid" ? "paid" : "unpaid");
    setPaymentMethod(order?.payment_method || null);
    setCashAmount(Number(order?.cash_amount ?? (order?.payment_method === "cash" ? order?.total_price : 0)) || 0);
    setCardAmount(Number(order?.card_amount ?? (order?.payment_method === "card" ? order?.total_price : 0)) || 0);
    setNotes(order?.notes || "");
    setEditingOrderId(order?.id || null);
    setEditingOrderSnapshot(order || null);
    setSavedEditOrder(null);
    setCheckoutError("");
    setSavedMessage(language === "ar" ? "تم تحميل الطلب في السلة للتعديل." : "The order is loaded into the cart for editing.");
  }, [language]);

  useEffect(() => {
    if (!tenantId) return;
    try {
      const stored = JSON.parse(window.localStorage.getItem(unpaidStorageKey) || "[]");
      const now = Date.now();
      const valid = Array.isArray(stored)
        ? stored.filter((row) => !row?._localExpiresAt || Number(row._localExpiresAt) > now)
        : [];
      setUnpaidOrders(valid);
    } catch {
      setUnpaidOrders([]);
    }
  }, [unpaidStorageKey]);

  useEffect(() => {
    if (!tenantId || !branchId || !user?.id || !currentShift?.id) return;
    try {
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
      const persisted = unpaidOrders.map((row) => ({ ...row, _localExpiresAt: row._localExpiresAt || expiresAt }));
      window.localStorage.setItem(unpaidStorageKey, JSON.stringify(persisted));
    } catch { /* storage is optional */ }
  }, [tenantId, branchId, user?.id, currentShift?.id, unpaidOrders, unpaidStorageKey]);

  useEffect(() => {
    if (!tenantId) { setCategoryOrderReady(false); return; }
    try {
      const saved = JSON.parse(window.localStorage.getItem(`servio.pos.categoryOrder.${tenantId}`) || "[]");
      setCategoryOrder(Array.isArray(saved) ? saved.map(String) : []);
    } catch {
      setCategoryOrder([]);
    }
    setCategoryOrderReady(true);
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId || !categoryOrderReady) return;
    try { window.localStorage.setItem(`servio.pos.categoryOrder.${tenantId}`, JSON.stringify(categoryOrder)); } catch { /* storage is optional */ }
  }, [tenantId, categoryOrder, categoryOrderReady]);

  useEffect(() => {
    const editOrder = location.state?.editOrder;
    if (!editOrder?.id || editingOrderId === editOrder.id) return;
    loadOrderForEdit(editOrder);
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  }, [location.state, editingOrderId, loadOrderForEdit]);

  const availableItems = useMemo(() => items.filter((item) => item.available && item.isAvailableForSale !== false), [items]);
  const addonChoiceCounts = useMemo(() => new Map(availableItems.map((item) => (
    [String(item.id), buildAddonChoices(item, availableItems).length]
  ))), [availableItems]);
  const categories = useMemo(() => categoriesList.filter((category) => (
    availableItems.some((item) => item.category_id === category.id)
  )), [categoriesList, availableItems]);
  const orderedCategories = useMemo(() => {
    const byId = new Map(categories.map((category) => [String(category.id), category]));
    const saved = categoryOrder.map((id) => byId.get(String(id))).filter(Boolean);
    const savedIds = new Set(saved.map((category) => String(category.id)));
    return [...saved, ...categories.filter((category) => !savedIds.has(String(category.id)))];
  }, [categories, categoryOrder]);

  const startCategoryHold = (categoryId) => {
    window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = window.setTimeout(() => setDraggingCategory(String(categoryId)), 420);
  };
  const stopCategoryHold = () => {
    window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
    setDraggingCategory(null);
  };
  const moveCategoryBefore = (targetId) => {
    if (!draggingCategory || String(targetId) === draggingCategory) return;
    const ids = orderedCategories.map((category) => String(category.id));
    const fromIndex = ids.indexOf(draggingCategory);
    const targetIndex = ids.indexOf(String(targetId));
    if (fromIndex < 0 || targetIndex < 0) return;
    ids.splice(fromIndex, 1);
    ids.splice(targetIndex, 0, draggingCategory);
    setCategoryOrder(ids);
  };
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

  // احفظ الدقة الكاملة التي يحددها المدير؛ التقريب يقتصر على العرض فقط.
  const grossAmount = cart.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * Number(item.quantity || 0),
    0,
  );
  const cartItemCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
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
      price: Number(menuItem.price) || 0,
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

  const markKitchenTicketPrinted = (orderId, printedItems = []) => {
    const printMetadata = { _kitchenTicketSent: true, _kitchenPrintBaseline: printedItems, _pendingKitchenDelta: [] };
    setUnpaidOrders((current) => current.map((order) => order.id === orderId ? { ...order, ...printMetadata } : order));
    setInvoiceOrder((current) => current?.id === orderId ? { ...current, ...printMetadata } : current);
    setSavedEditOrder((current) => current?.id === orderId ? { ...current, ...printMetadata } : current);
  };

  const markKitchenUpdatePrinted = (orderId, currentItems = []) => {
    const orderNumber = savedEditOrder?.id === orderId
      ? savedEditOrder.order_number
      : unpaidOrders.find((order) => order.id === orderId)?.order_number;
    const printMetadata = { _kitchenTicketSent: true, _kitchenPrintBaseline: currentItems, _pendingKitchenDelta: [] };
    setUnpaidOrders((current) => current.map((order) => order.id === orderId ? { ...order, ...printMetadata } : order));
    setSavedEditOrder((current) => current?.id === orderId ? { ...current, ...printMetadata } : current);
    setInvoiceKitchenUpdateItems([]);
    setInvoiceOrder(null);
    setInvoiceIsEditMode(false);
    setSavedMessage(language === "ar" ? `تم إرسال تحديث المطبخ للطلب #${orderNumber || "—"}.` : `Kitchen update sent for order #${orderNumber || "—"}.`);
  };

  const openKitchenUpdate = (order) => {
    const delta = Array.isArray(order?._pendingKitchenDelta) ? order._pendingKitchenDelta : [];
    if (!delta.length) return;
    setInvoiceOrder(order);
    setInvoiceIsTest(false);
    setInvoiceAutoPrint(false);
    setInvoicePrintMode("kitchen-update");
    setInvoiceIsEditMode(true);
    setInvoiceKitchenUpdateItems(delta);
  };

  const openInternalReceipt = (order) => {
    setInvoiceOrder(order);
    setInvoiceIsTest(false);
    setInvoiceAutoPrint(false);
    setInvoicePrintMode("cashier");
    setInvoiceIsEditMode(true);
    setInvoiceKitchenUpdateItems(Array.isArray(order?._pendingKitchenDelta) ? order._pendingKitchenDelta : []);
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
    // اختبار الطابعة يجب أن يرسل أمرًا فعليًا فورًا، بغض النظر عن تفضيل الطباعة التلقائية للمبيعات.
    setInvoiceAutoPrint(true);
    setInvoiceIsEditMode(false);
    setInvoiceKitchenUpdateItems([]);
    setInvoicePrintMode("order");
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
    const unavailableItems = cart.filter((cartItem) => !availableItems.some((item) => String(item.id) === String(cartItem.id)));
    if (unavailableItems.length) {
      setCheckoutError(text.unavailableCart);
      return;
    }
    if (shiftRequired && !currentShift?.id) { setCheckoutError(text.shiftRequired); return; }
    if (paymentMethod === "split" && Math.abs(Number(cashAmount || 0) + Number(cardAmount || 0) - grossAmount) > 0.01) {
      setCheckoutError(text.splitPaymentHint);
      return;
    }
    setSaving(true);
    setCheckoutError("");
    setSavedMessage("");
    try {
      const isEditing = Boolean(editingOrderId);
      const previousOrder = editingOrderSnapshot || unpaidOrders.find((order) => order.id === editingOrderId) || null;
      const hasPrintedKitchenTicket = isEditing ? previousOrder?._kitchenTicketSent !== false : false;
      const kitchenBaseline = isEditing
        ? (hasPrintedKitchenTicket ? (previousOrder?._kitchenPrintBaseline || previousOrder?.items || []) : [])
        : [];
      const kitchenDelta = isEditing ? buildKitchenOrderDelta(kitchenBaseline, cart) : [];
      const orderInput = {
        items: cart,
        // يحفظ الإجمالي كما هو من أسعار أصناف المنيو الحالية.
        total_price: grossAmount,
        cashier_session_id: currentShift?.id || null,
        table_number: orderType === "takeaway"
          ? text.takeaway
          : tableNumber.trim() ? `${text.dineIn} - ${tableNumber.trim()}` : text.dineIn,
        notes: notes.trim() || null,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        cash_amount: paymentMethod === "split" ? Number(cashAmount || 0) : paymentMethod === "cash" ? grossAmount : 0,
        card_amount: paymentMethod === "split" ? Number(cardAmount || 0) : paymentMethod === "card" ? grossAmount : 0,
        // لا يُغلق الطلب محاسبيًا قبل تسجيل السداد.
        completeImmediately: paymentStatus === "paid",
      };
      const result = isEditing
        ? await updateOrder(editingOrderId, orderInput)
        : await addOrder(orderInput);
      if (result?.error || !result?.data) throw result?.error || new Error(text.error);
      const savedOrder = isEditing
        ? {
          ...result.data,
          _kitchenTicketSent: hasPrintedKitchenTicket,
          _kitchenPrintBaseline: kitchenBaseline,
          _pendingKitchenDelta: kitchenDelta,
        }
        : { ...result.data, _kitchenTicketSent: false, _kitchenPrintBaseline: [], _pendingKitchenDelta: [] };
      setInvoiceIsTest(false);
      setInvoiceAutoPrint(isEditing ? false : autoPrintAfterSave);
      setInvoiceIsEditMode(isEditing);
      setInvoiceKitchenUpdateItems(kitchenDelta);
      setInvoicePrintMode("order");
      setInvoiceOrder(savedOrder);
      if (paymentStatus !== "paid") {
        setUnpaidOrders((current) => isEditing
          ? current.map((row) => row.id === editingOrderId ? savedOrder : row)
          : [...current.filter((row) => row.id !== savedOrder.id), savedOrder]);
      } else if (isEditing) {
        setUnpaidOrders((current) => current.filter((row) => row.id !== editingOrderId));
      }
      if (isEditing) setSavedEditOrder(savedOrder);
      setCart([]);
      setNotes("");
      setPaymentStatus("unpaid");
      setPaymentMethod(null);
      setEditingOrderId(null);
      setEditingOrderSnapshot(null);
      setCartDrawerOpen(false);
      setSavedMessage(isEditing
        ? `${text.editSaved}${savedOrder.order_number ? ` #${savedOrder.order_number}` : ""}`
        : text.saved);
    } catch (error) {
      console.error("تعذر حفظ بيع الكاشير:", { code: error?.code, status: error?.status, message: error?.message });
      setCheckoutError(String(error?.message || "").includes("MENU_ITEM_UNAVAILABLE") ? text.unavailableCart : text.error);
    } finally {
      setSaving(false);
    }
  };

  const openSettlement = (order) => {
    setCheckoutError("");
    setSettlementTarget(order);
    setSettlementMethod("");
    setSettlementCashAmount("");
    setSettlementCardAmount("");
  };

  const settleUnpaidOrder = async () => {
    if (!settlementTarget || !settlementMethod || settlementSaving) return;
    const order = settlementTarget;
    const cash = Number(settlementCashAmount) || 0;
    const card = Number(settlementCardAmount) || 0;
    const total = Number(order.total_price) || 0;
    if (settlementMethod === "split" && (cash < 0 || card < 0 || Math.abs(cash + card - total) > 0.01)) {
      setCheckoutError(language === "ar" ? "يجب أن يساوي مجموع النقد والشبكة إجمالي الطلب." : "Cash and card amounts must equal the order total.");
      return;
    }
    setSettlementSaving(true);
    const result = await updateOrderPaymentStatus(order.id, "paid", {
      method: settlementMethod,
      cashAmount: cash,
      cardAmount: card,
    });
    setSettlementSaving(false);
    if (result?.error) {
      setCheckoutError(language === "ar" ? "تعذر تسجيل السداد. أعد المحاولة." : "Could not record payment. Retry.");
      return;
    }
    const paidOrder = { ...order, ...result.data, payment_status: "paid", paid_at: result.data?.paid_at || new Date().toISOString() };
    setUnpaidOrders((current) => current.filter((row) => row.id !== order.id));
    setSettlementTarget(null);
    setInvoiceIsTest(false);
    setInvoiceAutoPrint(true);
    setInvoiceIsEditMode(false);
    setInvoiceKitchenUpdateItems([]);
    setInvoicePrintMode("cashier");
    setInvoiceOrder(paidOrder);
    setSavedMessage(language === "ar" ? "تم تسجيل السداد؛ سيُطبع الإيصال الداخلي فقط دون تكرار تذكرة المطبخ." : "Payment recorded; only the internal receipt will print, without resending the kitchen ticket.");
  };

  const confirmDeleteUnpaidOrder = async () => {
    if (!deleteTarget) return;
    const result = await deleteOrder(deleteTarget.id);
    if (result?.error) {
      setCheckoutError(language === "ar" ? "تعذر حذف الطلب المعلق." : "Could not delete the pending order.");
    } else {
      setUnpaidOrders((current) => current.filter((row) => row.id !== deleteTarget.id));
      setSavedMessage(language === "ar" ? "تم حذف الطلب المعلق." : "Pending order deleted.");
    }
    setDeleteTarget(null);
  };

  const editUnpaidOrder = (order) => {
    loadOrderForEdit(order);
  };

  const closeInvoice = () => {
    setInvoiceOrder(null);
    setInvoiceIsTest(false);
    setInvoiceIsEditMode(false);
    setInvoiceKitchenUpdateItems([]);
    setInvoicePrintMode("order");
  };

  const renderCartContents = (mobileView = false) => (
    <Box sx={{ p: mobileView ? { xs: 2, sm: 2.5 } : 0, pb: mobileView ? "calc(16px + env(safe-area-inset-bottom))" : 0 }}>
      <Stack direction="row"    sx={{ mb: 1.35 , alignItems: "center", justifyContent: "space-between", gap: 1}}>
        <Stack direction="row"  spacing={1} sx={{ minWidth: 0 , alignItems: "center"}}>
          <ShoppingCartCheckoutRoundedIcon color="primary" />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={950} sx={{ fontSize: { xs: "1.05rem", sm: "1.2rem" } }}>{text.cart}</Typography>
            {cart.length > 0 && <Typography variant="caption" color="text.secondary">{cartItemCount} {text.selectedCount}</Typography>}
          </Box>
        </Stack>
        <Stack direction="row"  spacing={.25} sx={{ alignItems: "center" }}>
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
        <Stack spacing={1} sx={{ py: 1.1, pr: .25 }}>
          {cart.map((item, itemIndex) => {
            const lineTotal = toMinorUnits(item.price) * item.quantity / 100;
            const lineId = getCartLineKey(item);
            return (
              <Box key={lineId} sx={{ position: "relative", display: "grid", gridTemplateColumns: "32px minmax(0,1fr) auto", gap: 1, alignItems: "center", p: 1.1, borderRadius: 2.4, bgcolor: itemIndex % 2 === 0 ? "rgba(255,255,255,.88)" : "rgba(238,241,247,.72)", border: "1px solid rgba(23,26,47,.09)", borderInlineStart: "4px solid #F47920", boxShadow: "0 5px 14px rgba(23,26,47,.045)" }}>
                <Box sx={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "rgba(244,121,32,.14)", color: "primary.dark", fontWeight: 950, fontSize: ".82rem", fontVariantNumeric: "tabular-nums" }}>{itemIndex + 1}</Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={950} sx={{ fontSize: { xs: ".9rem", sm: ".98rem" }, lineHeight: 1.25, overflowWrap: "anywhere", color: "#171A2F" }}>{item.name}</Typography>
                  {item.selected_addons?.length > 0 && (
                    <Stack direction="row" spacing={.4} useFlexGap  sx={{ mt: .55 , flexWrap: "wrap"}}>
                      {item.selected_addons.map((addon, addonIndex) => <Chip key={`${lineId}-addon-${addonIndex}`} label={typeof addon === "string" ? addon : addon.name} size="small" sx={{ height: 22, fontSize: ".68rem", fontWeight: 800, bgcolor: "rgba(40,120,200,.10)", color: "#245F99", maxWidth: "100%", "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" } }} />)}
                    </Stack>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: .55, fontWeight: 750 }}>{amount(item.price)} {language === "ar" ? "للوحدة" : "each"}</Typography>
                </Box>
                <Stack  spacing={.65} sx={{ alignItems: "flex-end" }}>
                  <Typography sx={{ fontWeight: 950, color: "primary.dark", fontSize: { xs: ".9rem", sm: "1rem" }, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{amount(lineTotal)}</Typography>
                  <Stack direction="row"  sx={{ borderRadius: 1.7, bgcolor: "#171A2F", p: .25, gap: .2 , alignItems: "center"}}>
                    <IconButton size="small" aria-label={language === "ar" ? "تقليل الكمية" : "Decrease quantity"} onClick={() => changeQuantity(lineId, -1)} sx={{ color: "#fff", width: 29, height: 29, borderRadius: 1.2, "&:hover": { bgcolor: "rgba(255,255,255,.15)" } }}><RemoveRoundedIcon fontSize="small" /></IconButton>
                    <Typography sx={{ minWidth: 25, textAlign: "center", color: "#fff", fontWeight: 950, fontSize: ".9rem", fontVariantNumeric: "tabular-nums" }}>{item.quantity}</Typography>
                    <IconButton size="small" aria-label={language === "ar" ? "زيادة الكمية" : "Increase quantity"} onClick={() => changeQuantity(lineId, 1)} sx={{ color: "#fff", width: 29, height: 29, borderRadius: 1.2, "&:hover": { bgcolor: "rgba(255,255,255,.15)" } }}><AddRoundedIcon fontSize="small" /></IconButton>
                  </Stack>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}

      <Divider sx={{ mb: 1.4 }} />
      <TextField fullWidth size="small" multiline minRows={2} label={text.notes} value={notes} onChange={(event) => setNotes(event.target.value.slice(0, 500))}   slotProps={{ htmlInput: { maxLength: 500 } }}/>
      <Box sx={{ mt: 1.25, p: 1.1, borderRadius: 2, bgcolor: "rgba(23,26,47,.025)", border: "1px solid", borderColor: "divider" }}>
        <PaymentStatusControl value={paymentStatus} method={paymentMethod} onChange={setPaymentStatus} onMethodChange={(method) => { setPaymentMethod(method); if (method === "split") { setCashAmount(Number(grossAmount.toFixed(2))); setCardAmount(0); } }} language={language} allowSplit />
        {paymentMethod === "split" && (
          <Box sx={{ mt: .7, p: 1, borderRadius: 2, bgcolor: "rgba(244,121,32,.08)", border: "1px solid rgba(244,121,32,.28)" }}>
            <Typography variant="caption" fontWeight={850} color="text.secondary" sx={{ display: "block", mb: .7 }}>{text.splitPaymentHint}</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={.8}>
              <TextField size="small" fullWidth type="number" label={text.cashAmount} value={cashAmount} onChange={(event) => setCashAmount(Math.max(0, Number(event.target.value) || 0))}   slotProps={{ htmlInput: { min: 0, step: "0.01" } }}/>
              <TextField size="small" fullWidth type="number" label={text.cardAmount} value={cardAmount} onChange={(event) => setCardAmount(Math.max(0, Number(event.target.value) || 0))}   slotProps={{ htmlInput: { min: 0, step: "0.01" } }}/>
            </Stack>
            <Typography variant="caption" sx={{ display: "block", mt: .7, fontWeight: 900, color: Math.abs(Number(cashAmount || 0) + Number(cardAmount || 0) - grossAmount) <= .01 ? "success.main" : "error.main" }}>
              {amount(Number(cashAmount || 0) + Number(cardAmount || 0))} / {amount(grossAmount)}
            </Typography>
          </Box>
        )}
      </Box>

      {cart.length > 0 && (
        <Box sx={{ mt: 1.25, p: 1.35, borderRadius: 2.2, bgcolor: "#f7f8fb", border: "1px solid rgba(23,26,47,.07)" }}>
          <Stack spacing={.65}>
            <Stack direction="row"   sx={{ justifyContent: "space-between", gap: 1 }}><Typography fontWeight={950} sx={{ minWidth: 0 }}>{text.gross}</Typography><Typography fontWeight={950} color="primary.main" sx={{ whiteSpace: "nowrap" }}>{amount(grossAmount)}</Typography></Stack>
          </Stack>
        </Box>
      )}

      {savedMessage && <Alert severity="success" sx={{ mt: 1.2 }}>{savedMessage}</Alert>}
      {savedEditOrder && (
        <Alert severity="info" sx={{ mt: 1.2 }}>
          <Typography variant="body2" fontWeight={850} sx={{ mb: .75 }}>
            {language === "ar" ? `الطلب #${savedEditOrder.order_number || "—"} محفوظ.` : `Order #${savedEditOrder.order_number || "—"} saved.`}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={.6}>
            {savedEditOrder._pendingKitchenDelta?.length > 0 && <Button size="small" variant="outlined" onClick={() => openKitchenUpdate(savedEditOrder)}>{text.kitchenUpdate}</Button>}
            {savedEditOrder.payment_status === "paid" && <Button size="small" variant="outlined" onClick={() => openInternalReceipt(savedEditOrder)}>{text.internalReceipt}</Button>}
          </Stack>
        </Alert>
      )}
      {shiftRequired && !currentShift && <Alert severity="warning" sx={{ mt: 1.2, borderRadius: 2 }}>{text.shiftRequired}</Alert>}
      {checkoutError && <Alert severity="error" sx={{ mt: 1.2 }}>{checkoutError}</Alert>}
      {unpaidOrders.length > 0 && (
        <Box sx={{ mt: 1.5, p: 1.35, borderRadius: 2.2, bgcolor: "rgba(244,121,32,.07)", border: "1px solid", borderColor: "warning.light" }}>
          <Typography fontWeight={900} sx={{ mb: .35 }}>{language === "ar" ? "أصناف معلقة — بانتظار الدفع" : "Pending items — awaiting payment"}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>{language === "ar" ? "تظل الطلبات هنا حتى تسجيل السداد. بعد التعديل تُطبع الأصناف الجديدة أو المتغيرة فقط عند اختيارك." : "Orders stay here until payment is recorded. After an edit, only new or changed items print when you choose."}</Typography>
          <Stack spacing={.8}>
            {unpaidOrders.map((order) => (
              <Box key={order.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, p: .85, borderRadius: 1.6, bgcolor: "background.paper" }}>
                <Box sx={{ minWidth: 0 }}><Typography variant="body2" fontWeight={850} noWrap>#{order.order_number || order.displayOrderNumber || "—"} · {order.table_number}</Typography><Typography variant="caption" color="text.secondary" sx={{ display: "block" }} noWrap>{(order.items || []).map((item) => `${item.quantity}× ${item.name}`).join(language === "ar" ? "، " : ", ")}</Typography><Typography variant="caption" color="text.secondary">{amount(order.total_price)}</Typography></Box>
                <Stack direction="row" spacing={.35} useFlexGap   sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {order._pendingKitchenDelta?.length > 0 && <Button size="small" variant="outlined" onClick={() => openKitchenUpdate(order)} sx={{ minWidth: 0, px: .8 }}>{text.kitchenUpdate}</Button>}
                  <Button size="small" variant="outlined" onClick={() => editUnpaidOrder(order)}>{language === "ar" ? "تعديل" : "Edit"}</Button>
                  <Button size="small" variant="contained" color="success" onClick={() => openSettlement(order)}>{language === "ar" ? "تسجيل السداد" : "Record payment"}</Button>
                  <IconButton size="small" color="error" aria-label={language === "ar" ? "حذف الطلب المعلق" : "Delete pending order"} onClick={() => setDeleteTarget(order)}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
      <Box sx={{ position: mobileView ? "sticky" : "static", bottom: 0, pt: 1.2, bgcolor: mobileView ? "background.paper" : "transparent" }}>
        <Button fullWidth variant="contained" size="large" startIcon={saving ? <CircularProgress size={19} color="inherit" /> : <ShoppingCartCheckoutRoundedIcon />} disabled={!tenantId || cart.length === 0 || saving || (shiftRequired && !currentShift?.id)} onClick={submitOrder} sx={{ py: 1.2, minHeight: 50, borderRadius: 2.2, fontWeight: 900 }}>
          {saving ? text.submitting : editingOrderId ? text.saveEdit : text.submit}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box className="cashier-pos-page" dir={language === "ar" ? "rtl" : "ltr"} sx={{ minHeight: "100vh", minWidth: 0, background: "radial-gradient(circle at 84% 4%, rgba(244,121,32,.14), transparent 23%), linear-gradient(135deg, #fff8f1 0%, #f7f8fb 46%, #eef1f7 100%)", py: { xs: 1.25, md: 3 }, pb: { xs: cart.length ? 12 : 1.25, md: 3 }, px: { xs: 1.25, sm: 2.5, lg: 4 }, "& .MuiPaper-root, & .MuiCard-root": { backdropFilter: "none", WebkitBackdropFilter: "none", boxShadow: "0 5px 16px rgba(23,26,47,.045)" } }}>
      <NewTableOrderAlert />
      <Box sx={{ maxWidth: 1540, minWidth: 0, mx: "auto" }}>
        <CashierShiftGate />
        <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.2, md: 2.6 }, mb: 2, borderRadius: { xs: 2.5, md: 3.5 }, border: "1px solid rgba(255,255,255,.2)", background: "linear-gradient(120deg, #171A2F 0%, #202744 66%, #2d3555 100%)", color: "#fff", boxShadow: "0 18px 40px rgba(23,26,47,.18)", position: "relative", overflow: "hidden", "&:after": { content: '""', position: "absolute", width: 220, height: 220, borderRadius: "50%", background: "rgba(244,121,32,.18)", insetInlineEnd: -85, top: -110 } }}>
          <Stack direction="row"    sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Stack direction="row"  spacing={1.2} sx={{ minWidth: 0, position: "relative", zIndex: 1 , alignItems: "center"}}>
              <Box sx={{ width: 46, height: 46, borderRadius: 2.4, display: "grid", placeItems: "center", bgcolor: "rgba(244,121,32,.16)", border: "1px solid rgba(244,121,32,.35)" }}><PointOfSaleRoundedIcon sx={{ fontSize: 29, color: "#FF9B57" }} /></Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" fontWeight={950} sx={{ fontSize: { xs: "1.08rem", sm: "1.45rem" }, lineHeight: 1.25, letterSpacing: "-.02em" }}>{text.title}</Typography>
                <Typography variant="body2" sx={{ display: { xs: "none", sm: "block" }, mt: .35, color: "rgba(255,255,255,.68)" }}>{text.subtitle}</Typography>
                <Stack direction="row" spacing={.7} sx={{ mt: .8 }}>
                  <Chip size="small" label={currentShift ? (language === "ar" ? "الوردية مفتوحة" : "Shift open") : (language === "ar" ? "لا توجد وردية" : "No shift")} sx={{ height: 25, color: "#fff", bgcolor: currentShift ? "rgba(21,154,104,.28)" : "rgba(244,121,32,.2)", border: "1px solid rgba(255,255,255,.14)", fontWeight: 850 }} />
                  <Chip size="small" label={`${cartItemCount} ${text.selectedCount}`} sx={{ display: { xs: "none", sm: "inline-flex" }, height: 25, color: "rgba(255,255,255,.82)", bgcolor: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", fontWeight: 800 }} />
                </Stack>
              </Box>
            </Stack>
            <Stack direction="row" spacing={0.5} sx={{ display: { xs: "flex", sm: "none" }, flex: "0 0 auto", position: "relative", zIndex: 1 }}>
              <IconButton aria-label={text.categoryPrinters} title={text.categoryPrinters} onClick={() => setCategoryRoutingOpen(true)} sx={{ color: "#fff", border: "1px solid rgba(255,255,255,.25)", borderRadius: 2 }}><CategoryOutlinedIcon fontSize="small" /></IconButton>
              <IconButton aria-label={text.printerSetup} title={text.printerSetup} onClick={() => setPrinterSetupOpen(true)} sx={{ color: "#fff", border: "1px solid rgba(255,255,255,.25)", borderRadius: 2 }}><PrintRoundedIcon fontSize="small" /></IconButton>
              <IconButton aria-label={text.back} title={text.back} onClick={() => navigate("/dashboard")} sx={{ color: "#fff", border: "1px solid rgba(255,255,255,.25)", borderRadius: 2 }}><ArrowBackRoundedIcon fontSize="small" /></IconButton>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ display: { xs: "none", sm: "flex" }, position: "relative", zIndex: 1 }}>
              <Button variant="outlined" startIcon={<PrintRoundedIcon />} onClick={() => setCategoryRoutingOpen(true)} sx={{ borderRadius: 2.5, fontWeight: 800, whiteSpace: "nowrap", color: "#fff", borderColor: "rgba(255,255,255,.28)", "&:hover": { borderColor: "#FF9B57", bgcolor: "rgba(255,255,255,.06)" } }}>
                {text.categoryPrinters}
              </Button>
              <Button variant="outlined" startIcon={<PrintRoundedIcon />} onClick={() => setPrinterSetupOpen(true)} sx={{ borderRadius: 2.5, fontWeight: 800, whiteSpace: "nowrap", color: "#fff", borderColor: "rgba(255,255,255,.28)", "&:hover": { borderColor: "#FF9B57", bgcolor: "rgba(255,255,255,.06)" } }}>
                {text.printerSetup}
              </Button>
              <Button variant="contained" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/dashboard")} sx={{ borderRadius: 2.5, fontWeight: 850, whiteSpace: "nowrap", bgcolor: "#F47920", "&:hover": { bgcolor: "#D96210" } }}>
                {text.back}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", sm: "flex-end" }, minWidth: 0, mb: 1.5 }}>
          <PrinterBridgeStatus language={language} categoryPrinterNames={categoryPrinterNames} />
        </Box>

        {/* وضع نوع الطلب قبل شبكة المنيو والسلة يضمن ظهوره دون تمرير، خصوصًا على الهاتف. */}
        <Paper elevation={0} sx={{ p: { xs: 1.35, sm: 2 }, mb: 2, borderRadius: { xs: 2.5, md: 3 }, border: "1px solid rgba(23,26,47,.08)", background: "rgba(255,255,255,.94)", boxShadow: "0 8px 22px rgba(23,26,47,.045)" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 280px" }, gap: 1.5, alignItems: "center" }}>
            <Stack direction={{ xs: "column", sm: "row" }}  spacing={1.2} sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
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

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1.2fr) minmax(265px, .8fr)", lg: "minmax(0, 1.55fr) minmax(320px, .75fr)" }, gap: { xs: 1.25, md: 2 }, alignItems: "start" }}>
          <Paper elevation={0} sx={{ p: { xs: 1.35, sm: 2.1 }, borderRadius: { xs: 2.5, md: 3.5 }, border: "1px solid rgba(23,26,47,.08)", minWidth: 0, display: "grid", gridTemplateColumns: { xs: "1fr", md: filtersOpen ? "156px minmax(0,1fr)" : "minmax(0,1fr)" }, gridTemplateRows: "auto auto auto auto", columnGap: { md: 1.8 }, alignItems: "start", boxShadow: "0 10px 26px rgba(23,26,47,.045)" }}>
            <TextField
              fullWidth
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={text.search}


              sx={{ mb: 1.5, gridColumn: { xs: "1", md: "1 / -1" }, alignSelf: "start" }}
             slotProps={{ htmlInput: { "aria-label": text.search }, input: {
                startAdornment: <InputAdornment position="start"><SearchRoundedIcon color="action" /></InputAdornment>,
                endAdornment: search ? <InputAdornment position="end"><IconButton size="small" aria-label={text.clearSearch} onClick={() => setSearch("")} edge="end"><CloseRoundedIcon fontSize="small" /></IconButton></InputAdornment> : null,
              } }}/>
            <Stack direction="row"   sx={{ gridColumn: { xs: "1", md: filtersOpen ? "1" : "1 / -1" }, mb: .8, alignSelf: "start" , alignItems: "center", justifyContent: "space-between"}}>
              <Typography variant="caption" fontWeight={900} color="text.secondary">{language === "ar" ? "التصنيفات" : "Categories"}</Typography>
              <IconButton size="small" aria-label={filtersOpen ? (language === "ar" ? "إخفاء الفلاتر" : "Hide filters") : (language === "ar" ? "إظهار الفلاتر" : "Show filters")} onClick={() => setFiltersOpen((open) => !open)}><ArrowBackRoundedIcon sx={{ transform: filtersOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} fontSize="small" /></IconButton>
            </Stack>
            {filtersOpen && <Stack direction={{ xs: "row", md: "column" }} spacing={0.8} sx={{ gridColumn: { xs: "1", md: "1" }, gridRow: { xs: "3", md: "3" }, position: { md: "sticky" }, top: { md: 12 }, zIndex: 2, maxHeight: { md: "calc(100dvh - 150px)" }, minHeight: 0, overflowX: { xs: "auto", md: "visible" }, overflowY: { xs: "visible", md: "auto" }, alignSelf: "start", pb: 1, mb: .5, maxWidth: "100%", scrollbarWidth: "thin", "& > *": { flexShrink: 0, justifyContent: { md: "flex-start" }, width: { md: "100%" }, minHeight: { md: 42 }, borderRadius: { md: 1.8 } } }}>
              <Chip label={text.all} clickable color={selectedCategory === "all" ? "primary" : "default"} variant={selectedCategory === "all" ? "filled" : "outlined"} onClick={() => setSelectedCategory("all")} />
              {orderedCategories.map((category) => (
                <Chip
                  key={category.id}
                  label={language === "en" ? (category.name_en || category.name) : category.name}
                  clickable
                  color={selectedCategory === category.id ? "primary" : "default"}
                  variant={selectedCategory === category.id ? "filled" : "outlined"}
                  onClick={() => setSelectedCategory(category.id)}
                  onPointerDown={() => startCategoryHold(category.id)}
                  onPointerUp={stopCategoryHold}
                  onPointerCancel={stopCategoryHold}
                  onPointerEnter={() => moveCategoryBefore(category.id)}
                  draggable
                  onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; setDraggingCategory(String(category.id)); }}
                  onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; moveCategoryBefore(category.id); }}
                  onDrop={(event) => { event.preventDefault(); moveCategoryBefore(category.id); stopCategoryHold(); }}
                  onDragEnd={stopCategoryHold}
                  title={language === "ar" ? "اضغط باستمرار ثم اسحب لترتيب الفلتر" : "Press and hold, then drag to reorder this filter"}
                  sx={{ opacity: draggingCategory === String(category.id) ? .55 : 1, cursor: draggingCategory ? "grabbing" : "grab", userSelect: "none", touchAction: "auto" }}
                />
              ))}
            </Stack>}

            <Box sx={{ gridColumn: { xs: "1", md: filtersOpen ? "2" : "1" }, gridRow: { xs: filtersOpen ? "4" : "3", md: "3" }, minWidth: 0, minHeight: 0, pr: { md: .35 } }}>
            {tenantLoading || menuLoading ? (
              <Box sx={{ py: 8, display: "grid", justifyItems: "center", gap: 1 }}><CircularProgress /><Typography color="text.secondary">{text.loading}</Typography></Box>
            ) : menuError ? (
              <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refreshMenu?.()}>{text.reload}</Button>}>{menuError}</Alert>
            ) : visibleItems.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 8 }}>{text.noItems}</Typography>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: { xs: .8, sm: 1.4 } }}>
                {visibleItems.map((item, itemIndex) => {
                  const category = categoryById.get(item.category_id);
                  const cardAccent = POS_CARD_ACCENTS[itemIndex % POS_CARD_ACCENTS.length];
                  return (
                  <Button
                    key={item.id}
                    fullWidth
                    variant="outlined"
                    onClick={() => handleSelectItem(item)}
                    aria-label={`${text.add} ${item.name || text.image} ${amount(item.price)}`}
                    sx={{
                      minWidth: 0, minHeight: { xs: 158, sm: 210 }, p: 0,
                      borderColor: `${cardAccent}55`, borderTop: `5px solid ${cardAccent}`, borderRadius: 3, color: "text.primary",
                      bgcolor: "background.paper", display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "flex-start",
                      textAlign: language === "ar" ? "right" : "left", overflow: "hidden",
                      boxShadow: `0 7px 20px ${cardAccent}18`, transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
                      "&:hover": { borderColor: cardAccent, bgcolor: "background.paper", transform: "translateY(-3px)", boxShadow: `0 14px 30px ${cardAccent}35` },
                      "&:hover .pos-product-image": { transform: "scale(1.04)" },
                    }}
                  >
                    <Box sx={{ position: "relative", width: "100%", height: { xs: 78, sm: 118 }, overflow: "hidden", bgcolor: "rgba(23,26,47,.045)" }}>
                      {item.image ? (
                        <Box className="pos-product-image" component="img" src={item.image} alt={item.name || text.image} loading="lazy" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .35s ease" }} onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />
                      ) : (
                        <Box sx={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "primary.main", background: "linear-gradient(145deg, rgba(244,121,32,.10), rgba(23,26,47,.035))" }}><ReceiptLongRoundedIcon sx={{ fontSize: 34, opacity: .8 }} /></Box>
                      )}
                      {category && <Chip size="small" label={language === "en" ? (category.name_en || category.name) : category.name} sx={{ position: "absolute", top: 8, insetInlineStart: 8, bgcolor: "rgba(255,255,255,.96)", fontWeight: 800, maxWidth: "80%", height: 24 }} />}
                      <Box sx={{ position: "absolute", bottom: 8, insetInlineEnd: 8, width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: "50%", color: "primary.main", bgcolor: "rgba(255,255,255,.94)", boxShadow: "0 3px 9px rgba(23,26,47,.14)" }}><AddRoundedIcon fontSize="small" /></Box>
                    </Box>
                    <Box sx={{ p: { xs: 1, sm: 1.35 }, minWidth: 0, width: "100%", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: .6 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={950} sx={{ fontSize: { xs: ".86rem", sm: ".98rem" }, color: "secondary.main", lineHeight: 1.28, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", overflowWrap: "anywhere", minHeight: "2.1em" }}>{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: .25, display: { xs: "none", sm: "-webkit-box" }, WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.25, minHeight: "1.25em" }}>{item.description || " "}</Typography>
                      </Box>
                      <Stack direction="row"    sx={{ alignItems: "center", justifyContent: "space-between", gap: .5 }}>
                        <Typography variant="body2" fontWeight={950} color="primary.main" sx={{ overflowWrap: "anywhere" }}>{amount(item.price)}</Typography>
                        {normalizeAddonLimit(item.max_addons, addonChoiceCounts.get(String(item.id)) || 0) > 0 && <Chip label={text.addonBadge} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: ".58rem", fontWeight: 850, "& .MuiChip-label": { px: .7 } }} />}
                      </Stack>
                    </Box>
                  </Button>
                  );
                })}
              </Box>
            )}
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ display: { xs: "none", sm: "block" }, position: { sm: "sticky" }, top: { sm: 12 }, alignSelf: "start", maxHeight: { sm: "calc(100dvh - 24px)" }, overflowY: { sm: "auto" }, overscrollBehaviorY: "auto", p: { sm: 1.5, md: 1.9 }, borderRadius: { sm: 2.5, md: 3.5 }, border: "1px solid rgba(23,26,47,.1)", minWidth: 0, background: "linear-gradient(180deg, rgba(255,255,255,.98), rgba(247,248,251,.96))", boxShadow: "0 14px 34px rgba(23,26,47,.08)" }}>
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
        <Box component="footer" sx={{ display: { xs: "block", sm: "none" }, position: "fixed", insetInline: 0, bottom: 0, zIndex: (theme) => theme.zIndex.appBar + 1, px: 1.25, pt: .9, pb: "calc(10px + env(safe-area-inset-bottom))", bgcolor: "rgba(246,247,249,.98)", borderTop: "1px solid rgba(23,26,47,.08)" }}>
          <Button fullWidth variant="contained" onClick={() => setCartDrawerOpen(true)} aria-label={`${text.cartReview}: ${cartItemCount} ${text.selectedCount}, ${amount(grossAmount)}`} sx={{ minHeight: 58, px: 1.6, borderRadius: 2.6, bgcolor: "secondary.main", color: "common.white", textTransform: "none", boxShadow: "0 8px 22px rgba(23,26,47,.18)", "&:hover": { bgcolor: "secondary.dark" } }}>
            <Stack direction="row"   sx={{ width: "100%" , alignItems: "center", justifyContent: "space-between"}}>
              <Stack direction="row"  spacing={1} sx={{ minWidth: 0, textAlign: "start" , alignItems: "center"}}>
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

      <Dialog
        open={Boolean(settlementTarget)}
        onClose={() => !settlementSaving && setSettlementTarget(null)}
        fullWidth
        maxWidth="sm"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        <DialogTitle sx={{ fontWeight: 950 }}>
          {language === "ar" ? "تأكيد سداد الطلب" : "Confirm payment"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Typography color="text.secondary">
              {language === "ar" ? "اختر طريقة الدفع لتسجيل السداد. اختيار الطريقة إلزامي." : "Choose a payment method to record settlement. This selection is required."}
            </Typography>
            <Typography fontWeight={900}>
              {language === "ar" ? "إجمالي الطلب: " : "Order total: "}{amount(settlementTarget?.total_price)}
            </Typography>
            <FormControl fullWidth required>
              <InputLabel id="settlement-method-label">{language === "ar" ? "طريقة الدفع *" : "Payment method *"}</InputLabel>
              <Select
                labelId="settlement-method-label"
                label={language === "ar" ? "طريقة الدفع *" : "Payment method *"}
                value={settlementMethod}
                onChange={(event) => setSettlementMethod(event.target.value)}
                required
              >
                <MenuItem value="cash">{language === "ar" ? "نقدًا" : "Cash"}</MenuItem>
                <MenuItem value="card">{language === "ar" ? "بطاقة / شبكة (مدى)" : "Card / network (mada)"}</MenuItem>
                <MenuItem value="split">{language === "ar" ? "نقدًا + شبكة" : "Cash + network"}</MenuItem>
                <MenuItem value="wallet">{language === "ar" ? "محفظة رقمية" : "Digital wallet"}</MenuItem>
                <MenuItem value="transfer">{language === "ar" ? "تحويل بنكي" : "Bank transfer"}</MenuItem>
                <MenuItem value="other">{language === "ar" ? "أخرى" : "Other"}</MenuItem>
              </Select>
            </FormControl>
            {settlementMethod === "split" && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  fullWidth
                  type="number"
                  label={language === "ar" ? "المبلغ النقدي" : "Cash amount"}
                  value={settlementCashAmount}
                  onChange={(event) => setSettlementCashAmount(event.target.value)}

                  required
                 slotProps={{ htmlInput: { min: 0, step: "0.01", inputMode: "decimal" } }}/>
                <TextField
                  fullWidth
                  type="number"
                  label={language === "ar" ? "مبلغ الشبكة" : "Card amount"}
                  value={settlementCardAmount}
                  onChange={(event) => setSettlementCardAmount(event.target.value)}

                  required
                 slotProps={{ htmlInput: { min: 0, step: "0.01", inputMode: "decimal" } }}/>
              </Stack>
            )}
            {settlementMethod === "split" && (
              <Typography variant="caption" color={Math.abs((Number(settlementCashAmount) || 0) + (Number(settlementCardAmount) || 0) - (Number(settlementTarget?.total_price) || 0)) <= 0.01 ? "success.main" : "error.main"} fontWeight={850}>
                {language === "ar" ? "مجموع المبلغين: " : "Combined amount: "}{amount((Number(settlementCashAmount) || 0) + (Number(settlementCardAmount) || 0))}
              </Typography>
            )}
            {checkoutError && <Alert severity="error">{checkoutError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setSettlementTarget(null)} color="inherit" disabled={settlementSaving}>
            {language === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            onClick={settleUnpaidOrder}
            color="success"
            variant="contained"
            disabled={!settlementMethod || settlementSaving || (settlementMethod === "split" && Math.abs((Number(settlementCashAmount) || 0) + (Number(settlementCardAmount) || 0) - (Number(settlementTarget?.total_price) || 0)) > 0.01)}
          >
            {settlementSaving ? (language === "ar" ? "جارٍ تسجيل السداد…" : "Recording payment…") : (language === "ar" ? "تأكيد السداد" : "Confirm payment")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 950 }}>{language === "ar" ? "حذف الطلب المعلق؟" : "Delete pending order?"}</DialogTitle>
        <DialogContent>{language === "ar" ? "سيتم حذف الطلب غير المدفوع نهائيًا من الطلبات المعلقة. هل تريد المتابعة؟" : "This unpaid order will be permanently removed from the pending orders. Continue?"}</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">{language === "ar" ? "إلغاء" : "Cancel"}</Button>
          <Button onClick={confirmDeleteUnpaidOrder} color="error" variant="contained">{language === "ar" ? "حذف الطلب" : "Delete order"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(addonDialogItem)} onClose={closeAddonDialog} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 950 }}>{text.addonsTitle}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Stack direction="row"    sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}>
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
        key={invoiceOrder ? `${invoiceOrder.id}-${invoiceOrder.payment_status || "test"}-${invoicePrintMode}` : "invoice"}
        open={Boolean(invoiceOrder)}
        onClose={closeInvoice}
        order={invoiceOrder}
        autoPrint={invoiceAutoPrint}
        isTest={invoiceIsTest}
        printMode={invoicePrintMode}
        isInternalReceipt
        suppressKitchenReprint
        isEditMode={invoiceIsEditMode}
        kitchenUpdateItems={invoiceKitchenUpdateItems}
        onKitchenTicketPrinted={markKitchenTicketPrinted}
        onKitchenUpdatePrinted={markKitchenUpdatePrinted}
      />
    </Box>
  );
}

export default CashierPOSPage;
