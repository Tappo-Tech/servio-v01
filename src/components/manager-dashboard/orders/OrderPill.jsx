import { FullscreenDialog as Dialog } from "../../common/FullscreenOverlays";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Alert, Box, Button, DialogActions, DialogContent, Divider, Chip, Stack, Typography } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import dayjs from "dayjs";

import { useStore } from "../../../context/StoreInfoContext";
import { useLanguage } from "../../../context/LanguageContext";
import { useMenu } from "../../../context/MenuContext";
import { roundMoney } from "../../../utils/taxUtils";
import { buildOrderReceiptGroups } from "../../../utils/categoryReceiptUtils";
import { getPrinterSettings, printKitchenTicketGroups, printOrderByPaymentStatus, printReceipt, printReceiptGroups, resolveInvoicePrintPlan } from "../../../utils/qzPrinting";

function ReceiptPreview({ order, storeInfo, language, currency, isTest, receiptTitle, receiptType = "cashier" }) {
  const isKitchen = receiptType === "kitchen";
  const shortOrderId = order?.displayOrderNumber || order?.order_number || "—";
  const money = (value) => `${new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)} ${currency}`;
  const orderAdjustment = roundMoney(Number(order?.receipt_adjustment) || 0);
  const paymentMethods = language === "ar"
    ? { cash: "نقدًا", card: "بطاقة / شبكة (مدى)", wallet: "محفظة رقمية", transfer: "تحويل بنكي", other: "أخرى" }
    : { cash: "Cash", card: "Card / network (mada)", wallet: "Digital wallet", transfer: "Bank transfer", other: "Other" };
  const paymentMethod = paymentMethods[order?.payment_method] || (language === "ar" ? "غير محددة" : "Not specified");
  const label = language === "ar"
    ? { internal: "إيصال داخلي — ليس فاتورة ضريبية", kitchen: "تذكرة المطبخ", total: "الإجمالي", add: "إضافة", remove: "إلغاء", notes: "ملاحظات", order: "رقم الطلب", table: "النوع / الطاولة", payment: "حالة الدفع", paymentMethod: "طريقة الدفع" }
    : { internal: "INTERNAL RECEIPT — NOT A TAX INVOICE", kitchen: "Kitchen ticket", total: "Total", add: "ADD", remove: "CANCEL", notes: "Notes", order: "Order", table: "Type / table", payment: "Payment", paymentMethod: "Payment method" };

  return (
    <Box className="receipt-group" sx={{ pb: 2, mb: 2, borderBottom: "1px dashed", borderColor: "divider", "&:last-of-type": { pb: 0, mb: 0, borderBottom: 0 }, "@media print": { breakInside: "avoid" } }}>
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Box component="img" src={storeInfo.logo_url || "/logo-icon.webp"} alt={storeInfo.store_name || "SERVIO"} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/logo-icon.webp"; }} sx={{ width: 80, height: 80, borderRadius: 2, objectFit: "contain", mx: "auto", mb: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 900 }}>{storeInfo.store_name || (language === "ar" ? "متجر SERVIO" : "SERVIO Store")}</Typography>
        {storeInfo.address && <Typography variant="caption" display="block" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{language === "ar" ? "العنوان" : "Address"}: {storeInfo.address}</Typography>}
        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 900 }}>{isKitchen ? (receiptTitle || label.kitchen) : label.internal}</Typography>
        {isTest && <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.6, fontWeight: 900 }}>{language === "ar" ? "اختبار الطابعة — ليس بيعًا" : "Printer test — not a sale"}</Typography>}
        <Typography variant="caption" display="block">{dayjs(order?.created_at || new Date()).format("DD/MM/YY · hh:mm A")}</Typography>
      </Box>
      <Divider sx={{ borderStyle: "dashed", my: 1.5 }} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0,1fr) auto" }, mb: 1, gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{label.order}: #{shortOrderId}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{label.table}: {order?.table_number || "—"}</Typography>
      </Box>
      <Divider sx={{ borderStyle: "dashed", my: 1.5 }} />
      <Box sx={{ my: 2 }}>
        {(Array.isArray(order?.items) ? order.items : []).map((item, index) => (
          <Box key={`${item.id || item.cartItemId || item.name}-${index}`} sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 1, mb: 1, minWidth: 0 }}>
            <Box sx={{ minWidth: 0 }}>
              {isKitchen && item.kitchenAction && <Typography variant="caption" display="block" color={item.kitchenAction === "remove" ? "error.main" : "primary.main"} sx={{ fontWeight: 950 }}>{item.kitchenAction === "remove" ? label.remove : label.add}</Typography>}
              <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{item.name} × {item.quantity}</Typography>
              {Array.isArray(item.selected_addons) && item.selected_addons.length > 0 && <Typography variant="caption" display="block" color="text.secondary">{language === "ar" ? "إضافات: " : "Add-ons: "}{item.selected_addons.map((addon) => typeof addon === "string" ? addon : addon?.name).filter(Boolean).join(language === "ar" ? "، " : ", ")}</Typography>}
            </Box>
            {!isKitchen && <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>{money(roundMoney(Number(item.price) * Number(item.quantity || 1)))}</Typography>}
          </Box>
        ))}
      </Box>
      {order?.notes && <Typography variant="caption" display="block" sx={{ mb: 1 }}>{label.notes}: {order.notes}</Typography>}
      {!isKitchen && <>
        {orderAdjustment !== 0 && <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, gap: 1 }}><Typography variant="body2">{language === "ar" ? "تسوية الطلب" : "Order adjustment"}</Typography><Typography variant="body2">{money(orderAdjustment)}</Typography></Box>}
        <Divider sx={{ borderStyle: "dashed", my: 1.5 }} />
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}><Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{label.total}</Typography><Typography variant="subtitle1" sx={{ fontWeight: 900, whiteSpace: "nowrap" }}>{money(order?.total_price)}</Typography></Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1, gap: 1 }}><Typography variant="body2" fontWeight={800}>{label.payment}</Typography><Chip size="small" color={order?.payment_status === "paid" ? "success" : order?.payment_status === "unpaid" ? "warning" : "default"} label={order?.payment_status === "paid" ? (language === "ar" ? "مدفوع" : "Paid") : order?.payment_status === "unpaid" ? (language === "ar" ? "غير مدفوع" : "Unpaid") : (language === "ar" ? "غير محدد" : "Not set")} sx={{ fontWeight: 850 }} /></Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.7, gap: 1 }}><Typography variant="body2" fontWeight={800}>{label.paymentMethod}</Typography><Typography variant="body2" color="text.secondary">{paymentMethod}</Typography></Box>
      </>}
      <Divider sx={{ borderStyle: "dashed", my: 1.5 }} />
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, mt: 1 }}>{storeInfo.phone && <Typography variant="caption" sx={{ fontWeight: 600 }}>{language === "ar" ? "هاتف" : "Phone"}: {storeInfo.phone}</Typography>}{storeInfo.email && <Typography variant="caption" sx={{ fontWeight: 600 }}>{language === "ar" ? "البريد" : "Email"}: {storeInfo.email}</Typography>}</Box>
      {!isKitchen && <Typography variant="caption" align="center" display="block" sx={{ mt: 2, color: "text.secondary", fontWeight: 700 }}>{storeInfo.receipt_footer || (language === "ar" ? "شكرًا لزيارتكم" : "Thank you for your visit")}</Typography>}
    </Box>
  );
}

function getPrintRetryState(error, orderId) {
  const alreadyPrintedByGroup = error?.alreadyPrintedByGroup || {};
  if (error?.printDestination === "cashier" && error?.kitchenPrintResult?.receiptCount) {
    return { orderId, destination: "cashier", alreadyPrintedByGroup };
  }
  if (error?.printDestination === "kitchen" && Object.values(alreadyPrintedByGroup).some((printers) => Array.isArray(printers) && printers.length > 0)) {
    return { orderId, destination: "kitchen", alreadyPrintedByGroup };
  }
  return null;
}

function InvoiceModal({
  open,
  onClose,
  order,
  autoPrint = false,
  isTest = false,
  printMode = "order",
  isInternalReceipt = false,
  suppressKitchenReprint = false,
  isEditMode = false,
  kitchenUpdateItems = [],
  onKitchenTicketPrinted,
  onKitchenUpdatePrinted,
}) {
  const { t, language } = useLanguage();
  const { storeInfo = {} } = useStore();
  const { categoriesList = [], items: menuItems = [], menuLoading, menuError, refreshMenu } = useMenu();
  const autoPrintedOrderRef = useRef(null);
  const [printState, setPrintState] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [retryState, setRetryState] = useState(null);
  const currency = storeInfo.currency || t("currencySar");
  const receiptGroups = useMemo(
    () => buildOrderReceiptGroups(order, categoriesList, menuItems, language),
    [order, categoriesList, menuItems, language],
  );
  const kitchenUpdateOrder = useMemo(
    () => ({ ...order, items: Array.isArray(kitchenUpdateItems) ? kitchenUpdateItems : [] }),
    [order, kitchenUpdateItems],
  );
  const kitchenUpdateGroups = useMemo(
    () => isEditMode ? buildOrderReceiptGroups(kitchenUpdateOrder, categoriesList, menuItems, language) : [],
    [isEditMode, kitchenUpdateOrder, categoriesList, menuItems, language],
  );

  const getPrintErrorMessage = useCallback((error) => {
    const base = error?.message || (language === "ar" ? "تعذرت الطباعة عبر QZ Tray" : "QZ Tray printing failed");
    if (error?.kitchenPrintResult?.receiptCount) {
      const partial = language === "ar" ? "تم إرسال تذكرة المطبخ قبل تعذر الإيصال الداخلي." : "The kitchen ticket was sent before the internal receipt failed.";
      return `${base} ${partial}`;
    }
    if (!error?.printedReceiptCount) return base;
    const partial = language === "ar"
      ? `تم إرسال ${error.printedReceiptCount} من ${error.totalReceiptCount} إيصالات قبل التعثر.`
      : `${error.printedReceiptCount} of ${error.totalReceiptCount} receipts were sent before the failure.`;
    return `${base} ${partial}`;
  }, [language]);

  const getPrintSuccessMessage = useCallback((result) => {
    const { printers = [], receiptCount = 0, kitchenReceiptCount = 0, cashierReceiptCount = 0 } = result || {};
    const destinations = [];
    if (kitchenReceiptCount) destinations.push(language === "ar" ? "تذكرة المطبخ" : "kitchen ticket");
    if (cashierReceiptCount) destinations.push(language === "ar" ? "الإيصال الداخلي" : "internal receipt");
    if (destinations.length) {
      const label = destinations.join(" + ");
      return language === "ar" ? `أُرسلت ${label} إلى: ${printers.join("، ")}` : `Sent ${label} to: ${printers.join(", ")}`;
    }
    if (language === "ar") {
      const sentText = receiptCount > 1 ? `أُرسلت ${receiptCount} إيصالات` : "أُرسل الإيصال الداخلي";
      return `${sentText} إلى: ${printers.join("، ")}`;
    }
    const receiptLabel = receiptCount === 1 ? "receipt" : "receipts";
    return `${receiptCount} ${receiptLabel} sent to: ${printers.join(", ")}`;
  }, [language]);

  const runGroupedPrint = () => {
    if (menuLoading) throw new Error(language === "ar" ? "جارٍ تحميل إعدادات التصنيفات، حاول بعد لحظات." : "Category settings are still loading; try again shortly.");
    if (menuError) throw new Error(language === "ar" ? "تعذر تحميل إعدادات التصنيفات؛ أعد تحميل المنيو قبل الطباعة." : "Category settings could not be loaded. Reload the menu before printing.");
    const settings = getPrinterSettings();
    if (printMode === "kitchen-update") return runKitchenPrint();
    if (isTest) return printReceiptGroups(receiptGroups, storeInfo, { language, currency, isTest, settings });
    if (printMode === "cashier" || isInternalReceipt) {
      return printReceipt(order, storeInfo, {
        language,
        currency,
        settings,
        printersOverride: settings.printers.filter((printer) => printer !== settings.kitchenPrinter),
      });
    }
    return printOrderByPaymentStatus(order, receiptGroups, storeInfo, { language, currency, settings });
  };

  const runKitchenPrint = () => {
    if (menuLoading) throw new Error(language === "ar" ? "جارٍ تحميل إعدادات التصنيفات، حاول بعد لحظات." : "Category settings are still loading; try again shortly.");
    if (menuError) throw new Error(language === "ar" ? "تعذر تحميل إعدادات التصنيفات؛ أعد تحميل المنيو قبل الطباعة." : "Category settings could not be loaded. Reload the menu before printing.");
    const groups = isEditMode ? kitchenUpdateGroups : receiptGroups;
    if (isEditMode && !groups.some((group) => group.items?.length)) {
      throw new Error(language === "ar" ? "لا توجد أصناف جديدة أو معدلة لإرسالها للمطبخ." : "There are no new or changed items to send to the kitchen.");
    }
    return printKitchenTicketGroups(groups, storeInfo, { language, currency, settings: getPrinterSettings(), isModification: isEditMode });
  };

  useEffect(() => {
    if (!open) {
      setPrintState(null);
      return undefined;
    }
    if (!autoPrint || isEditMode || !order?.id || autoPrintedOrderRef.current === order.id || menuLoading) return undefined;
    if (menuError) {
      setPrintState({ severity: "error", message: language === "ar" ? "تعذر تحميل إعدادات التصنيفات؛ لم تُطبع الفاتورة لتجنب دمج أصناف يفترض فصلها." : "Category settings could not be loaded; printing was paused to avoid combining items that should be separate." });
      return undefined;
    }

    const timer = window.setTimeout(() => {
      autoPrintedOrderRef.current = order.id;
      setPrinting(true);
      (printMode === "cashier"
        ? (() => { const settings = getPrinterSettings(); return printReceipt(order, storeInfo, { language, currency, settings, printersOverride: settings.printers.filter((printer) => printer !== settings.kitchenPrinter) }); })()
        : autoPrint === "kitchen"
          ? printKitchenTicketGroups(receiptGroups, storeInfo, { language, currency, settings: getPrinterSettings() })
        : isTest
          ? printReceiptGroups(receiptGroups, storeInfo, { language, currency, isTest })
          : printOrderByPaymentStatus(order, receiptGroups, storeInfo, { language, currency, settings: getPrinterSettings() }))
        .then((result) => {
          setRetryState(null);
          setPrintState({ severity: "success", message: getPrintSuccessMessage(result) });
          if (!isTest && (result?.kitchenReceiptCount > 0 || (autoPrint === "kitchen" && result?.receiptCount > 0))) {
            onKitchenTicketPrinted?.(order.id, order.items);
          }
        })
        .catch((error) => {
          setRetryState(getPrintRetryState(error, order?.id));
          setPrintState({ severity: "error", message: getPrintErrorMessage(error) });
          if (!isTest && error?.kitchenPrintResult?.receiptCount > 0) {
            onKitchenTicketPrinted?.(order.id, order.items);
          }
        })
        .finally(() => setPrinting(false));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [autoPrint, open, order?.id, order, storeInfo, language, currency, isTest, printMode, isEditMode, menuLoading, menuError, receiptGroups, getPrintErrorMessage, getPrintSuccessMessage, onKitchenTicketPrinted]);

  if (!order) return null;

  const printerSettings = getPrinterSettings();
  const printPlan = resolveInvoicePrintPlan(order, printerSettings);
  const activeRetryState = retryState?.orderId === order?.id ? retryState : null;
  const paperWidth = printerSettings.paperWidth;
  const browserPageSize = paperWidth === "A4" ? "A4 portrait" : `${paperWidth} auto`;
  const browserReceiptWidth = paperWidth === "A4" ? "190mm" : paperWidth;
  const showKitchenPrintButton = isEditMode
    ? kitchenUpdateItems.length > 0
    : (!suppressKitchenReprint || order?._kitchenTicketSent === false);

  const handlePrint = async () => {
    setPrinting(true);
    setPrintState(null);
    try {
      const result = await runGroupedPrint();
      setRetryState(null);
      setPrintState({ severity: "success", message: getPrintSuccessMessage(result) });
    } catch (error) {
      setRetryState(getPrintRetryState(error, order?.id));
      setPrintState({ severity: "error", message: getPrintErrorMessage(error) });
    } finally {
      setPrinting(false);
    }
  };

  const handleKitchenPrint = async () => {
    setPrinting(true);
    setPrintState(null);
    try {
      const result = await runKitchenPrint();
      setRetryState(null);
      const prefix = isEditMode
        ? (language === "ar" ? (result.receiptCount > 1 ? "أُرسلت تحديثات المطبخ" : "أُرسل تحديث المطبخ") : (result.receiptCount > 1 ? "Kitchen updates sent" : "Kitchen update sent"))
        : (language === "ar" ? (result.receiptCount > 1 ? "أُرسلت تذاكر المطبخ" : "أُرسلت تذكرة المطبخ") : (result.receiptCount > 1 ? "Kitchen tickets sent" : "Kitchen ticket sent"));
      setPrintState({ severity: "success", message: `${prefix}: ${result.printers.join(language === "ar" ? "، " : ", ")}` });
      if (isEditMode) onKitchenUpdatePrinted?.(order.id, order.items);
      else onKitchenTicketPrinted?.(order.id, order.items);
    } catch (error) {
      setRetryState(getPrintRetryState(error, order?.id));
      setPrintState({ severity: "error", message: getPrintErrorMessage(error) });
    } finally {
      setPrinting(false);
    }
  };

  const handleRetryRemaining = async () => {
    if (!activeRetryState) return;
    setPrinting(true);
    setPrintState(null);
    try {
      if (activeRetryState.destination === "cashier") {
        const settings = getPrinterSettings();
        const completedCashierPrinters = new Set(activeRetryState.alreadyPrintedByGroup?.cashier || []);
        const result = await printReceipt(order, storeInfo, {
          language,
          currency,
          settings,
          printersOverride: settings.printers.filter((printer) => printer !== settings.kitchenPrinter && !completedCashierPrinters.has(printer))
        });
        setPrintState({
          severity: "success",
          message: getPrintSuccessMessage({ ...result, kitchenReceiptCount: 0, cashierReceiptCount: result.receiptCount }),
        });
      } else {
        const kitchenGroups = isEditMode ? kitchenUpdateGroups : receiptGroups;
        const result = await printKitchenTicketGroups(kitchenGroups, storeInfo, {
          language,
          currency,
          settings: getPrinterSettings(),
          isModification: isEditMode,
          alreadyPrintedByGroup: activeRetryState.alreadyPrintedByGroup,
        });
        const prefix = isEditMode
          ? (language === "ar" ? "أُرسلت تحديثات المطبخ المتبقية" : "Remaining kitchen updates sent")
          : (language === "ar" ? "أُرسلت تذاكر المطبخ المتبقية" : "Remaining kitchen tickets sent");
        setPrintState({ severity: "success", message: `${prefix}: ${result.printers.join(language === "ar" ? "، " : ", ")}` });
        if (isEditMode) onKitchenUpdatePrinted?.(order.id, order.items);
        else onKitchenTicketPrinted?.(order.id, order.items);
      }
      setRetryState(null);
    } catch (error) {
      const nextRetry = getPrintRetryState(error, order?.id);
      setRetryState(nextRetry || (error?.alreadyPrintedByGroup
        ? { ...activeRetryState, alreadyPrintedByGroup: error.alreadyPrintedByGroup }
        : activeRetryState));
      setPrintState({ severity: "error", message: getPrintErrorMessage(error) });
    } finally {
      setPrinting(false);
    }
  };

  const handleBrowserFallback = async () => {
    if (isTest) {
      window.print();
      return;
    }
    if (printMode === "kitchen-update") {
      await handleKitchenPrint();
      return;
    }
    // نافذة النظام مخصصة للإيصال الداخلي فقط؛ لا نعيد إرسال تذكرة مطبخ قد طُبعت.
    window.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <style>
        {`
          @media print {
            @page { size: ${browserPageSize}; margin: 2mm; }
            body * { visibility: hidden !important; }
            #printable-invoice, #printable-invoice * { visibility: visible !important; }
            #printable-invoice {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: ${browserReceiptWidth} !important;
              max-width: ${browserReceiptWidth} !important;
              padding: 2mm !important;
            }
            #printable-invoice .receipt-group:not(:last-child) {
              break-after: page !important;
              page-break-after: always !important;
            }
          }
        `}
      </style>

      <DialogContent id="printable-invoice">
        {printState && <Alert severity={printState.severity} sx={{ mb: 1.5, "@media print": { display: "none" } }}>{printState.message}</Alert>}
        {activeRetryState && <Alert
          severity="warning"
          action={<Button color="inherit" size="small" onClick={handleRetryRemaining} disabled={printing}>
            {activeRetryState.destination === "cashier"
              ? (language === "ar" ? "أعد الكاشير فقط" : "Retry cashier only")
              : (language === "ar" ? "أعد المتبقي فقط" : "Retry remaining only")}
          </Button>}
          sx={{ mb: 1.5, "@media print": { display: "none" } }}
        >
          {activeRetryState.destination === "cashier"
            ? (language === "ar" ? "أُرسلت تذكرة المطبخ. أعد محاولة إيصالات الكاشير غير المرسلة فقط لتجنب تكرار التذاكر." : "Kitchen tickets were sent. Retry only cashier receipts not yet sent to avoid duplicate tickets.")
            : (language === "ar" ? "أُرسلت بعض تذاكر المطبخ؛ ستُعاد التذاكر غير المرسلة فقط." : "Some kitchen tickets were sent; only unsent tickets will be retried.")}
        </Alert>}
        {!isTest && order.payment_status === "unpaid" && !printPlan.cashier && <Alert severity="info" sx={{ mb: 1.5, "@media print": { display: "none" } }}>{language === "ar" ? "غير مدفوع: تُرسل تذكرة المطبخ فقط؛ يتاح الإيصال الداخلي بعد تسجيل السداد." : "Unpaid: only the kitchen ticket is sent. The internal receipt is available after payment is recorded."}</Alert>}
        {menuError && (
          <Alert
            severity="warning"
            action={<Button color="inherit" size="small" onClick={() => refreshMenu?.()}>{language === "ar" ? "إعادة المحاولة" : "Retry"}</Button>}
            sx={{ mb: 1.5, "@media print": { display: "none" } }}
          >
            {language === "ar" ? "تعذر تحميل إعدادات التصنيفات؛ أعد المحاولة قبل الطباعة." : "Category printing settings could not be loaded. Retry before printing."}
          </Alert>
        )}
        <ReceiptPreview
          order={printMode === "kitchen-update" ? kitchenUpdateOrder : order}
          storeInfo={storeInfo}
          language={language}
          currency={currency}
          isTest={isTest}
          receiptType={printMode === "kitchen-update" ? "kitchen" : "cashier"}
          receiptTitle={printMode === "kitchen-update" ? (language === "ar" ? "تعديل على الطلب" : "Order modification") : null}
        />
      </DialogContent>

      <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, flexWrap: "wrap", gap: 1, "& .MuiButton-root": { minWidth: { xs: "100%", sm: "auto" } } }}>
        <Button onClick={onClose} color="inherit">{language === "ar" ? "إغلاق" : "Close"}</Button>
        {printMode !== "kitchen-update" && <Button variant="text" onClick={handleBrowserFallback} color="inherit" disabled={printing || menuLoading || Boolean(menuError) || Boolean(activeRetryState) || (!isTest && !printPlan.cashier)} title={language === "ar" ? "يفتح نافذة طباعة الإيصال الداخلي فقط دون إعادة إرسال تذكرة المطبخ." : "Opens the internal-receipt print dialog only; it does not resend the kitchen ticket."}>
          {isTest ? (language === "ar" ? "نافذة النظام (اختبار)" : "System dialog (test)") : (language === "ar" ? "الإيصال الداخلي عبر النظام" : "Internal receipt (system dialog)")}
        </Button>}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          {showKitchenPrintButton && <Button variant="outlined" startIcon={<PrintIcon />} onClick={handleKitchenPrint} disabled={printing || menuLoading || Boolean(menuError) || Boolean(activeRetryState)}>
            {isEditMode ? (language === "ar" ? "طباعة تحديث المطبخ" : "Print kitchen update") : (language === "ar" ? "تذكرة المطبخ" : "Kitchen ticket")}
          </Button>}
          {printMode !== "kitchen-update" && <Button variant="contained" startIcon={printing ? undefined : <PrintIcon />} onClick={handlePrint} color="primary" disabled={printing || menuLoading || Boolean(menuError) || Boolean(activeRetryState) || (!isTest && !printPlan.cashier)}>
            {printing ? (language === "ar" ? "جارٍ الطباعة…" : "Printing…") : (isInternalReceipt ? (language === "ar" ? "طباعة الإيصال الداخلي" : "Print internal receipt") : (language === "ar" ? "طباعة حسب حالة السداد" : "Print by payment status"))}
          </Button>}
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

export default InvoiceModal;
