// نافذة إنشاء طلب كاشير مباشرة من واجهة الطلبات الواردة بدل صفحة POS مستقلة.
import { useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, DialogActions, DialogContent, DialogTitle,
  FormControl, Grid, IconButton, InputLabel, MenuItem, Select, Stack, TextField, ToggleButton,
  ToggleButtonGroup, Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import ShoppingCartCheckoutRoundedIcon from "@mui/icons-material/ShoppingCartCheckoutRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { FullscreenDialog as Dialog } from "../../common/FullscreenOverlays";
import InvoiceModal from "../../manager-dashboard/orders/OrderPill";
import { useMenu } from "../../../context/MenuContext";
import { useOrders } from "../../../context/OrdersContext";
import { useStore } from "../../../context/StoreInfoContext";
import { useTenant } from "../../../context/TenantContext";
import { useShift } from "../../../context/ShiftContext";
import { useUser } from "../../../context/UserContext";
import { useLanguage } from "../../../context/LanguageContext";
import { buildAddonChoices, normalizeAddonItemIds, normalizeAddonLimit, normalizeAddonOptions, normalizeSelectedAddons, toggleSelectedAddon } from "../../../utils/menuItemOptions";
import { getAddonSelectionSignature, getCartLineKey } from "../../../utils/cartItemUtils";

const PAYMENT_METHODS = {
  ar: [
    ["cash", "نقدًا"], ["card", "بطاقة / شبكة (مدى)"], ["wallet", "محفظة رقمية"],
    ["transfer", "تحويل بنكي"], ["other", "أخرى"], ["split", "نقدًا + شبكة"],
  ],
  en: [
    ["cash", "Cash"], ["card", "Card / network (mada)"], ["wallet", "Digital wallet"],
    ["transfer", "Bank transfer"], ["other", "Other"], ["split", "Cash + network"],
  ],
};

const formatAmount = (value, language) => new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-SA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 20,
}).format(Number(value) || 0);

const newCartItemId = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export default function CashierQuickOrderDialog({ open, onClose }) {
  const { items = [], categoriesList = [] } = useMenu();
  const { addOrder } = useOrders();
  const { storeInfo = {} } = useStore();
  const { tenantId } = useTenant();
  const { currentShift } = useShift();
  const { user } = useUser();
  const { language } = useLanguage();
  const ar = language !== "en";
  const currency = storeInfo.currency || (ar ? "ر.س" : "SAR");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState("dineIn");
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [addonItem, setAddonItem] = useState(null);
  const [addonDraft, setAddonDraft] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  const availableItems = useMemo(() => items.filter((item) => item.available && item.isAvailableForSale !== false), [items]);
  const visibleItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return availableItems.filter((item) => (
      (categoryId === "all" || String(item.category_id) === String(categoryId))
      && (!query || `${item.name || ""} ${item.description || ""}`.toLocaleLowerCase().includes(query))
    ));
  }, [availableItems, categoryId, search]);
  const total = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * Number(item.quantity || 0), 0);
  const addonChoices = addonItem ? buildAddonChoices(addonItem, availableItems) : [];
  const addonLimit = addonItem ? normalizeAddonLimit(addonItem.max_addons, addonChoices) : 0;

  const addToCart = (menuItem, selectedAddons = []) => {
    const normalized = normalizeSelectedAddons(selectedAddons, buildAddonChoices(menuItem, availableItems), normalizeAddonLimit(menuItem.max_addons, buildAddonChoices(menuItem, availableItems)));
    const signature = getAddonSelectionSignature(normalized);
    const row = {
      id: menuItem.id,
      category_id: menuItem.category_id || null,
      cartItemId: newCartItemId(),
      name: menuItem.name,
      price: Number(menuItem.price) || 0,
      quantity: 1,
      addon_options: normalizeAddonOptions(menuItem.addon_options),
      free_addon_item_ids: normalizeAddonItemIds(menuItem.free_addon_item_ids),
      max_addons: normalizeAddonLimit(menuItem.max_addons, buildAddonChoices(menuItem, availableItems)),
      selected_addons: normalized,
    };
    setCart((current) => {
      const existing = current.find((item) => String(item.id) === String(menuItem.id) && getAddonSelectionSignature(item.selected_addons) === signature);
      return existing
        ? current.map((item) => item.cartItemId === existing.cartItemId ? { ...item, quantity: Number(item.quantity) + 1 } : item)
        : [...current, row];
    });
    setAddonItem(null);
    setAddonDraft([]);
    setError("");
  };

  const chooseItem = (item) => {
    const choices = buildAddonChoices(item, availableItems);
    if (normalizeAddonLimit(item.max_addons, choices) > 0 && choices.length > 0) {
      setAddonDraft([]);
      setAddonItem(item);
    } else addToCart(item);
  };

  const changeQuantity = (lineId, delta) => setCart((current) => current
    .map((item) => getCartLineKey(item) === String(lineId) ? { ...item, quantity: Number(item.quantity) + delta } : item)
    .filter((item) => item.quantity > 0));

  const checkout = async () => {
    if (saving) return;
    if (!tenantId) { setError(ar ? "تعذر تحديد النشاط؛ حدّث الصفحة ثم حاول مجددًا." : "The store is unavailable. Refresh and try again."); return; }
    if (user?.role === "cashier" && !currentShift?.id) { setError(ar ? "ابدأ الوردية أولًا قبل تسجيل البيع." : "Start your shift before recording a sale."); return; }
    if (!cart.length) { setError(ar ? "أضف صنفًا واحدًا على الأقل." : "Add at least one item."); return; }
    if (paymentStatus === "paid" && !paymentMethod) { setError(ar ? "اختر طريقة الدفع لإتمام البيع." : "Choose a payment method to complete the sale."); return; }
    if (cart.some((row) => !availableItems.some((item) => String(item.id) === String(row.id)))) {
      setError(ar ? "توجد أصناف نفدت أو توقفت؛ أزلها من السلة ثم حدّث المنيو." : "Some items are unavailable. Remove them and refresh the menu.");
      return;
    }
    const cash = Number(cashAmount) || 0;
    const card = Number(cardAmount) || 0;
    if (paymentStatus === "paid" && paymentMethod === "split" && (cash < 0 || card < 0 || Math.abs(cash + card - total) > 0.01)) {
      setError(ar ? "يجب أن يساوي مجموع النقد والشبكة إجمالي الطلب." : "Cash and card must equal the order total.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const result = await addOrder({
        items: cart,
        total_price: total,
        cashier_session_id: currentShift?.id || null,
        table_number: orderType === "takeaway"
          ? (ar ? "سفري" : "Takeaway")
          : tableNumber.trim() ? `${ar ? "محلي" : "Dine-in"} - ${tableNumber.trim()}` : (ar ? "محلي" : "Dine-in"),
        notes: notes.trim() || null,
        payment_status: paymentStatus,
        payment_method: paymentStatus === "paid" ? paymentMethod : null,
        cash_amount: paymentStatus !== "paid" ? null : paymentMethod === "split" ? cash : paymentMethod === "cash" ? total : 0,
        card_amount: paymentStatus !== "paid" ? null : paymentMethod === "split" ? card : paymentMethod === "card" ? total : 0,
        completeImmediately: paymentStatus === "paid",
      });
      if (result?.error || !result?.data) throw result?.error || new Error(ar ? "تعذر حفظ الطلب." : "Could not save the order.");
      setInvoiceOrder(result.data);
      setCart([]);
      setNotes("");
      setTableNumber("");
      setPaymentStatus("paid");
      setPaymentMethod("");
      setCashAmount("");
      setCardAmount("");
      onClose?.();
    } catch (saveError) {
      setError(saveError?.message || (ar ? "تعذر حفظ البيع؛ حاول مجددًا." : "Could not save the sale. Try again."));
    } finally {
      setSaving(false);
    }
  };

  return <>
    <Dialog open={open} onClose={() => !saving && onClose?.()} fullWidth maxWidth="lg" aria-labelledby="cashier-quick-order-title">
      <DialogTitle id="cashier-quick-order-title" sx={{ fontWeight: 900 }}>{ar ? "طلب كاشير جديد" : "New cashier order"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField size="small" fullWidth label={ar ? "بحث عن صنف" : "Search menu items"} value={search} onChange={(event) => setSearch(event.target.value)} InputProps={{ startAdornment: <SearchRoundedIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} /> }} />
            <FormControl size="small" sx={{ minWidth: { sm: 210 } }}>
              <InputLabel id="cashier-order-category">{ar ? "التصنيف" : "Category"}</InputLabel>
              <Select labelId="cashier-order-category" value={categoryId} label={ar ? "التصنيف" : "Category"} onChange={(event) => setCategoryId(event.target.value)}>
                <MenuItem value="all">{ar ? "كل الأصناف" : "All items"}</MenuItem>
                {categoriesList.map((category) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>

          <Grid container spacing={1}>
            {visibleItems.map((item) => <Grid size={{ xs: 6, sm: 4, md: 3 }} key={item.id}>
              <Card variant="outlined" sx={{ height: "100%", borderRadius: 2.5 }}>
                <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
                  {item.image && <Box component="img" src={item.image} alt={item.name} sx={{ width: "100%", height: 95, objectFit: "cover", borderRadius: 1.5, mb: 1 }} />}
                  <Typography variant="body2" fontWeight={800} sx={{ minHeight: 38 }}>{item.name}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>{formatAmount(item.price, language)} {currency}</Typography>
                  <Button fullWidth size="small" variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => chooseItem(item)}>{ar ? "إضافة" : "Add"}</Button>
                </CardContent>
              </Card>
            </Grid>)}
            {visibleItems.length === 0 && <Grid size={{ xs: 12 }}><Typography color="text.secondary" align="center" sx={{ py: 2 }}>{ar ? "لا توجد أصناف متاحة تطابق البحث." : "No available items match this search."}</Typography></Grid>}
          </Grid>

          <Box sx={{ borderTop: 1, borderColor: "divider", pt: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1 }}>{ar ? "سلة الطلب" : "Order cart"} · {cart.reduce((count, item) => count + Number(item.quantity), 0)}</Typography>
            {!cart.length ? <Typography variant="body2" color="text.secondary">{ar ? "اختر أصنافًا من المنيو لإضافتها هنا." : "Choose items from the menu to add them here."}</Typography> : <Stack spacing={.75}>
              {cart.map((item) => <Box key={item.cartItemId} sx={{ display: "flex", alignItems: "center", gap: 1, py: .6, borderBottom: "1px solid", borderColor: "divider" }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={750} noWrap>{item.name}</Typography>
                  {item.selected_addons?.length > 0 && <Typography variant="caption" color="text.secondary" noWrap>{item.selected_addons.map((addon) => addon.name).join(ar ? "، " : ", ")}</Typography>}
                </Box>
                <IconButton size="small" aria-label={ar ? "تقليل الكمية" : "Decrease quantity"} onClick={() => changeQuantity(getCartLineKey(item), -1)}><RemoveRoundedIcon fontSize="small" /></IconButton>
                <Typography variant="body2" sx={{ minWidth: 24, textAlign: "center" }}>{item.quantity}</Typography>
                <IconButton size="small" aria-label={ar ? "زيادة الكمية" : "Increase quantity"} onClick={() => changeQuantity(getCartLineKey(item), 1)}><AddRoundedIcon fontSize="small" /></IconButton>
                <Typography variant="body2" fontWeight={800} sx={{ minWidth: 82, textAlign: "end" }}>{formatAmount(Number(item.price) * Number(item.quantity), language)}</Typography>
                <IconButton size="small" color="error" aria-label={ar ? "حذف الصنف" : "Remove item"} onClick={() => setCart((current) => current.filter((row) => row.cartItemId !== item.cartItemId))}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
              </Box>)}
            </Stack>}
          </Box>

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small"><InputLabel id="cashier-order-type">{ar ? "نوع الطلب" : "Order type"}</InputLabel><Select labelId="cashier-order-type" label={ar ? "نوع الطلب" : "Order type"} value={orderType} onChange={(event) => setOrderType(event.target.value)}><MenuItem value="dineIn">{ar ? "محلي" : "Dine-in"}</MenuItem><MenuItem value="takeaway">{ar ? "سفري" : "Takeaway"}</MenuItem></Select></FormControl>
            </Grid>
            {orderType === "dineIn" && <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth size="small" label={ar ? "رقم الطاولة (اختياري)" : "Table number (optional)"} value={tableNumber} onChange={(event) => setTableNumber(event.target.value)} /></Grid>}
            <Grid size={{ xs: 12 }}><TextField fullWidth size="small" label={ar ? "ملاحظات الطلب (اختياري)" : "Order notes (optional)"} value={notes} onChange={(event) => setNotes(event.target.value)} /></Grid>
            <Grid size={{ xs: 12 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                <Typography variant="body2" fontWeight={850}>{ar ? "حالة الدفع" : "Payment status"}</Typography>
                <ToggleButtonGroup size="small" exclusive value={paymentStatus} onChange={(_, value) => { if (value) { setPaymentStatus(value); if (value === "unpaid") { setPaymentMethod(""); setCashAmount(""); setCardAmount(""); } } }}>
                  <ToggleButton value="paid">{ar ? "مدفوع" : "Paid"}</ToggleButton>
                  <ToggleButton value="unpaid">{ar ? "غير مدفوع" : "Unpaid"}</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Grid>
            {paymentStatus === "paid" && <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small" required><InputLabel id="cashier-order-payment">{ar ? "طريقة الدفع *" : "Payment method *"}</InputLabel><Select labelId="cashier-order-payment" required label={ar ? "طريقة الدفع *" : "Payment method *"} value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}><MenuItem value=""><em>{ar ? "اختر طريقة الدفع" : "Select a payment method"}</em></MenuItem>{PAYMENT_METHODS[ar ? "ar" : "en"].map(([method, label]) => <MenuItem key={method} value={method}>{label}</MenuItem>)}</Select></FormControl>
            </Grid>}
            {paymentStatus === "paid" && paymentMethod === "split" && <>
              <Grid size={{ xs: 12, sm: 3 }}><TextField fullWidth size="small" type="number" label={ar ? "المبلغ النقدي" : "Cash amount"} value={cashAmount} onChange={(event) => setCashAmount(event.target.value)} inputProps={{ min: 0, step: "0.01", inputMode: "decimal" }} /></Grid>
              <Grid size={{ xs: 12, sm: 3 }}><TextField fullWidth size="small" type="number" label={ar ? "مبلغ الشبكة" : "Card amount"} value={cardAmount} onChange={(event) => setCardAmount(event.target.value)} inputProps={{ min: 0, step: "0.01", inputMode: "decimal" }} /></Grid>
            </>}
          </Grid>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ borderTop: 1, borderColor: "divider", pt: 1.5 }}>
            <Typography fontWeight={900}>{ar ? "الإجمالي" : "Total"}</Typography>
            <Chip color="primary" label={`${formatAmount(total, language)} ${currency}`} sx={{ fontWeight: 900 }} />
          </Stack>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={saving}>{ar ? "إلغاء" : "Cancel"}</Button>
        <Button variant="contained" startIcon={<ShoppingCartCheckoutRoundedIcon />} onClick={checkout} disabled={saving || !cart.length || (paymentStatus === "paid" && !paymentMethod)}>
          {saving ? (ar ? "جارٍ حفظ الطلب…" : "Saving order…") : (ar ? "حفظ البيع" : "Save sale")}
        </Button>
      </DialogActions>
    </Dialog>

    <Dialog open={Boolean(addonItem)} onClose={() => { setAddonItem(null); setAddonDraft([]); }} fullWidth maxWidth="xs" aria-labelledby="cashier-addon-title">
      <DialogTitle id="cashier-addon-title">{ar ? "اختر الإضافات المجانية" : "Choose free add-ons"}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{addonItem?.name} · {ar ? "اختر حتى" : "Choose up to"} {addonLimit}</Typography>
        <Stack spacing={.5}>{addonChoices.map((choice) => {
          const checked = addonDraft.some((selected) => selected.id ? `item:${selected.id}` === choice.key : `text:${selected.name.toLocaleLowerCase()}` === choice.key);
          return <Button key={choice.key} variant={checked ? "contained" : "outlined"} onClick={() => setAddonDraft((current) => toggleSelectedAddon(current, choice, addonChoices, addonLimit))}>{choice.name}</Button>;
        })}</Stack>
      </DialogContent>
      <DialogActions><Button onClick={() => { setAddonItem(null); setAddonDraft([]); }}>{ar ? "إلغاء" : "Cancel"}</Button><Button variant="contained" onClick={() => addonItem && addToCart(addonItem, addonDraft)}>{ar ? "إضافة للسلة" : "Add to cart"}</Button></DialogActions>
    </Dialog>

    <InvoiceModal open={Boolean(invoiceOrder)} onClose={() => setInvoiceOrder(null)} order={invoiceOrder} autoPrint={(() => { try { return window.localStorage.getItem("servio.cashier.autoPrintAfterSave") !== "false"; } catch { return true; } })()} />
  </>;
}
