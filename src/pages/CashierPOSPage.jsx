import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  CircularProgress,
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
import { useMenu } from "../context/MenuContext";
import { useOrders } from "../context/OrdersContext";
import { useStore } from "../context/StoreInfoContext";
import { useTenant } from "../context/TenantContext";
import { useLanguage } from "../context/LanguageContext";
import InvoiceModal from "../components/manager-dashboard/orders/OrderPill";
import { calculateInclusiveVat, roundMoney } from "../utils/taxUtils";

const copy = {
  ar: {
    title: "كاشير — طلب جديد",
    subtitle: "أضف الأصناف، راجع السلة، ثم أرسل الطلب للمطبخ واطبع الإيصال.",
    back: "العودة للطلبات",
    search: "ابحث عن صنف",
    all: "الكل",
    add: "إضافة",
    cart: "سلة الطلب",
    empty: "اختر صنفًا من المنيو لبدء الطلب.",
    clear: "تفريغ السلة",
    location: "رقم الطاولة أو نوع الطلب",
    locationHint: "مثال: 4 أو سفري",
    notes: "ملاحظات للمطبخ (اختياري)",
    vatNote: "الأسعار شاملة لضريبة القيمة المضافة 15%؛ تُفصل الضريبة في الفاتورة ولا تزيد المبلغ المستحق.",
    net: "المبلغ قبل الضريبة",
    vat: "ضريبة القيمة المضافة 15% (مضمنة)",
    gross: "الإجمالي المستحق (شامل الضريبة)",
    submit: "إرسال للمطبخ وإصدار الفاتورة",
    submitting: "جارٍ حفظ الطلب…",
    saved: "تم حفظ الطلب؛ سيظهر الآن في شاشة الطلبات الحية.",
    error: "تعذر حفظ الطلب. تحقق من الاتصال ثم حاول مرة أخرى.",
    noItems: "لا توجد أصناف متاحة تطابق البحث.",
    loading: "جارٍ تحميل المنيو…",
    reload: "إعادة المحاولة",
    image: "صورة الصنف",
    cashier: "طلب كاشير",
  },
  en: {
    title: "Cashier — New order",
    subtitle: "Add items, review the cart, then send the order to the kitchen and print a receipt.",
    back: "Back to orders",
    search: "Search menu items",
    all: "All",
    add: "Add",
    cart: "Order cart",
    empty: "Choose an item from the menu to start an order.",
    clear: "Clear cart",
    location: "Table number or order type",
    locationHint: "For example: 4 or Takeaway",
    notes: "Kitchen notes (optional)",
    vatNote: "Menu prices include 15% VAT; the invoice separates the VAT amount without increasing the amount due.",
    net: "Amount before VAT",
    vat: "VAT 15% (included)",
    gross: "Amount due (VAT included)",
    submit: "Send to kitchen & issue invoice",
    submitting: "Saving order…",
    saved: "Order saved and sent to the live kitchen queue.",
    error: "Could not save the order. Check your connection and try again.",
    noItems: "No available items match this search.",
    loading: "Loading menu…",
    reload: "Retry",
    image: "Item image",
    cashier: "Cashier order",
  },
};

const formatAmount = (value, language) => new Intl.NumberFormat(
  language === "ar" ? "ar-SA" : "en-SA",
  { minimumFractionDigits: 2, maximumFractionDigits: 2 },
).format(Number(value) || 0);

/**
 * نقطة بيع للكاشير: تحتفظ بسلة محلية مستقلة حتى لا تختلط بسلة عميل المنيو العام.
 * تأكيد الطلب يستخدم OrdersContext نفسه، فيُحفظ بحالة pending ويصل للمطبخ عبر Realtime.
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
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [savedMessage, setSavedMessage] = useState("");

  const availableItems = useMemo(() => items.filter((item) => item.available), [items]);
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

  // تُحوّل الأسعار إلى هللات قبل الجمع حتى يبقى إجمالي السلة والفاتورة متطابقين.
  const grossMinorUnits = cart.reduce((sum, item) => (
    sum + Math.round((Number(item.price) || 0) * 100) * item.quantity
  ), 0);
  const grossAmount = grossMinorUnits / 100;
  const breakdown = calculateInclusiveVat(grossAmount);
  const amount = (value) => `${formatAmount(value, language)} ${currency}`;

  const addItem = (menuItem) => {
    setSavedMessage("");
    setCheckoutError("");
    setCart((current) => {
      const existing = current.find((row) => row.id === menuItem.id);
      if (existing) return current.map((row) => row.id === menuItem.id ? { ...row, quantity: row.quantity + 1 } : row);
      return [...current, { id: menuItem.id, name: menuItem.name, price: roundMoney(menuItem.price), quantity: 1 }];
    });
  };

  const changeQuantity = (itemId, delta) => {
    setCart((current) => current
      .map((item) => item.id === itemId ? { ...item, quantity: item.quantity + delta } : item)
      .filter((item) => item.quantity > 0));
  };

  const submitOrder = async () => {
    if (!tenantId || cart.length === 0 || saving) return;
    setSaving(true);
    setCheckoutError("");
    setSavedMessage("");
    try {
      const result = await addOrder({
        items: cart,
        // total_price يخزّن المبلغ الإجمالي الذي يدفعه الزبون، وهو شامل VAT كما أُكد من المستخدم.
        total_price: grossAmount,
        table_number: tableNumber.trim() || text.cashier,
        notes: notes.trim() || null,
      });
      if (result?.error || !result?.data) throw result?.error || new Error(text.error);
      setInvoiceOrder(result.data);
      setCart([]);
      setNotes("");
      setSavedMessage(text.saved);
    } catch (error) {
      console.error("تعذر إنشاء طلب الكاشير:", error?.message || error);
      setCheckoutError(text.error);
    } finally {
      setSaving(false);
    }
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
            <Button variant="outlined" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/dashboard")} sx={{ borderRadius: 2.5, fontWeight: 800, whiteSpace: "nowrap" }}>
              {text.back}
            </Button>
          </Stack>
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
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))", xl: "repeat(3,minmax(0,1fr))" }, gap: 1.1 }}>
                {visibleItems.map((item) => (
                  <Card key={item.id} elevation={0} sx={{ border: "1px solid rgba(23,26,47,.1)", borderRadius: 2.5, overflow: "hidden", transition: "transform .16s ease, box-shadow .16s ease", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(23,26,47,.09)" } }}>
                    <CardActionArea onClick={() => addItem(item)} sx={{ p: 1.1, minHeight: 112 }}>
                      <Stack direction="row" alignItems="center" spacing={1.2}>
                        {item.image ? (
                          <Box component="img" src={item.image} alt={item.name || text.image} loading="lazy" sx={{ width: 72, height: 78, borderRadius: 1.8, objectFit: "cover", flex: "0 0 auto", bgcolor: "grey.100" }} onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />
                        ) : (
                          <Box sx={{ width: 72, height: 78, borderRadius: 1.8, display: "grid", placeItems: "center", bgcolor: "rgba(244,121,32,.08)", color: "primary.main", flex: "0 0 auto" }}><ReceiptLongRoundedIcon /></Box>
                        )}
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography fontWeight={850} sx={{ lineHeight: 1.35 }}>{item.name}</Typography>
                          <Typography variant="body2" fontWeight={800} color="primary.main" sx={{ mt: .6 }}>{amount(item.price)}</Typography>
                          <Typography variant="caption" color="text.secondary">{text.add}</Typography>
                        </Box>
                        <AddRoundedIcon color="primary" />
                      </Stack>
                    </CardActionArea>
                  </Card>
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
                  const lineTotal = Math.round(Number(item.price) * 100) * item.quantity / 100;
                  return (
                    <Box key={item.id} sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 1, alignItems: "center", py: .7 }}>
                      <Box sx={{ minWidth: 0 }}><Typography fontWeight={800} noWrap>{item.name}</Typography><Typography variant="caption" color="text.secondary">{amount(lineTotal)}</Typography></Box>
                      <Stack direction="row" alignItems="center" spacing={.2}>
                        <IconButton size="small" aria-label={language === "ar" ? "تقليل الكمية" : "Decrease quantity"} onClick={() => changeQuantity(item.id, -1)}><RemoveRoundedIcon fontSize="small" /></IconButton>
                        <Typography sx={{ minWidth: 22, textAlign: "center", fontWeight: 900 }}>{item.quantity}</Typography>
                        <IconButton size="small" aria-label={language === "ar" ? "زيادة الكمية" : "Increase quantity"} onClick={() => changeQuantity(item.id, 1)}><AddRoundedIcon fontSize="small" /></IconButton>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
            <Divider sx={{ mb: 1.5 }} />
            <TextField fullWidth size="small" label={text.location} placeholder={text.locationHint} value={tableNumber} onChange={(event) => setTableNumber(event.target.value)} sx={{ mb: 1.2 }} />
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
      <InvoiceModal open={Boolean(invoiceOrder)} onClose={() => setInvoiceOrder(null)} order={invoiceOrder} />
    </Box>
  );
}

export default CashierPOSPage;
