import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import dayjs from "dayjs";

import { useStore } from "../../../context/StoreInfoContext";
import { useLanguage } from "../../../context/LanguageContext";
import { useMenu } from "../../../context/MenuContext";
import { calculateInclusiveVat, roundMoney } from "../../../utils/taxUtils";
import { buildOrderReceiptGroups } from "../../../utils/categoryReceiptUtils";
import { getPrinterSettings, printKitchenTicketGroups, printOrderByPaymentStatus, printReceipt, printReceiptGroups, resolveInvoicePrintPlan } from "../../../utils/qzPrinting";

function ReceiptPreview({ order, storeInfo, language, currency, isTest, receiptTitle, amounts }) {
  const shortOrderId = order?.displayOrderNumber || order?.order_number || String(order?.id || "").slice(-6).toUpperCase();
  const invoiceAmounts = amounts || calculateInclusiveVat(order?.total_price);
  const money = (value) => `${new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)} ${currency}`;
  const orderAdjustment = roundMoney(Number(order?.receipt_adjustment) || 0);
  const paymentMethods = language === "ar"
    ? { cash: "نقدًا", card: "بطاقة / شبكة (مدى)", wallet: "محفظة رقمية", transfer: "تحويل بنكي", other: "أخرى" }
    : { cash: "Cash", card: "Card / network (mada)", wallet: "Digital wallet", transfer: "Bank transfer", other: "Other" };
  const paymentMethod = paymentMethods[order?.payment_method] || (language === "ar" ? "غير محددة" : "Not specified");

  return (
    <Box
      className="receipt-group"
      sx={{
        pb: 2,
        mb: 2,
        borderBottom: "1px dashed",
        borderColor: "divider",
        "&:last-of-type": { pb: 0, mb: 0, borderBottom: 0 },
        "@media print": { breakInside: "avoid" },
      }}
    >
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Box
          component="img"
          src={storeInfo.logo_url || "/logo-icon.webp"}
          alt={storeInfo.store_name || "SERVIO"}
          onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/logo-icon.webp"; }}
          sx={{ width: 80, height: 80, borderRadius: 2, objectFit: "contain", mx: "auto", mb: 1 }}
        />
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          {storeInfo.store_name || (language === "ar" ? "متجر SERVIO" : "SERVIO Store")}
        </Typography>
        {storeInfo.tax_number && (
          <Typography variant="caption" display="block" color="text.secondary">
            {language === "ar" ? "الرقم الضريبي" : "VAT No."}: {storeInfo.tax_number}
          </Typography>
        )}
        {storeInfo.address && (
        <Typography variant="caption" display="block" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
          {language === "ar" ? "العنوان" : "Address"}: {storeInfo.address}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" display="block">
          {receiptTitle || (language === "ar" ? "فاتورة مبيعات" : "Sales receipt")}
        </Typography>
        {isTest && (
          <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.6, fontWeight: 900 }}>
            {language === "ar" ? "اختبار الطابعة — ليست فاتورة بيع" : "Printer test — not a sale invoice"}
          </Typography>
        )}
        <Typography variant="caption" display="block">
          {dayjs(order?.created_at || new Date()).format("DD/MM/YY · hh:mm A")}
        </Typography>
      </Box>

      <Divider sx={{ borderStyle: "dashed", my: 1.5 }} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0,1fr) auto" }, mb: 1, gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {language === "ar" ? "رقم الطلب" : "Order"}: #{shortOrderId}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {language === "ar" ? "النوع / الطاولة" : "Type / table"}: {order?.table_number || "—"}
        </Typography>
      </Box>
      <Divider sx={{ borderStyle: "dashed", my: 1.5 }} />

      <Box sx={{ my: 2 }}>
        {(Array.isArray(order?.items) ? order.items : []).map((item, index) => (
          <Box key={`${item.id || item.cartItemId || item.name}-${index}`} sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 1, mb: 1, minWidth: 0 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{item.name} × {item.quantity}</Typography>
              {Array.isArray(item.selected_addons) && item.selected_addons.length > 0 && (
                <Typography variant="caption" display="block" color="text.secondary">
                  {language === "ar" ? "إضافات: " : "Add-ons: "}
                  {item.selected_addons.map((addon) => typeof addon === "string" ? addon : addon?.name).filter(Boolean).join(language === "ar" ? "، " : ", ")}
                </Typography>
              )}
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
              {money(roundMoney(Number(item.price) * Number(item.quantity || 1)))}
            </Typography>
          </Box>
        ))}
      </Box>

      {orderAdjustment !== 0 && (
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, gap: 1 }}>
          <Typography variant="body2">{language === "ar" ? "تسوية الطلب" : "Order adjustment"}</Typography>
          <Typography variant="body2">{money(orderAdjustment)}</Typography>
        </Box>
      )}

      <Divider sx={{ borderStyle: "dashed", my: 1.5 }} />
      {order?.notes && (
        <Typography variant="caption" display="block" sx={{ mb: 1 }}>
          {language === "ar" ? "ملاحظات" : "Notes"}: {order.notes}
        </Typography>
      )}
      <Box sx={{ mt: 2, pt: 1 }}>
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>
          {language === "ar" ? "أسعار الأصناف شاملة لضريبة القيمة المضافة 15%." : "Item prices include 15% VAT."}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.8, gap: 1 }}>
          <Typography variant="body2">{language === "ar" ? "المبلغ قبل الضريبة" : "Amount before VAT"}</Typography>
          <Typography variant="body2">{money(invoiceAmounts.net)}</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, gap: 1 }}>
          <Typography variant="body2">{language === "ar" ? "ضريبة القيمة المضافة 15% (مضمنة)" : "VAT 15% (included)"}</Typography>
          <Typography variant="body2">{money(invoiceAmounts.vat)}</Typography>
        </Box>
        <Divider sx={{ borderStyle: "dashed", my: 1 }} />
        <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", alignItems: "start", pt: 0.3, gap: 1 }}>
          <Typography variant="subtitle1" sx={{ minWidth: 0, fontWeight: 900, fontSize: { xs: ".92rem", sm: "1rem" }, overflowWrap: "anywhere" }}>{language === "ar" ? "الإجمالي المستحق (شامل الضريبة)" : "Total due (VAT included)"}</Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 900, whiteSpace: "nowrap", fontSize: { xs: ".92rem", sm: "1rem" } }}>{money(invoiceAmounts.gross)}</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1, gap: 1 }}>
          <Typography variant="body2" fontWeight={800}>{language === "ar" ? "حالة الدفع" : "Payment"}</Typography>
          <Chip
            size="small"
            color={order?.payment_status === "paid" ? "success" : order?.payment_status === "unpaid" ? "warning" : "default"}
            label={order?.payment_status === "paid" ? (language === "ar" ? "مدفوع" : "Paid") : order?.payment_status === "unpaid" ? (language === "ar" ? "غير مدفوع" : "Unpaid") : (language === "ar" ? "غير محدد" : "Not set")}
            sx={{ fontWeight: 850 }}
          />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.7, gap: 1 }}>
          <Typography variant="body2" fontWeight={800}>{language === "ar" ? "طريقة الدفع" : "Payment method"}</Typography>
          <Typography variant="body2" color="text.secondary">{paymentMethod}</Typography>
        </Box>
      </Box>

      <Divider sx={{ borderStyle: "dashed", my: 1.5 }} />
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, mt: 1 }}>
        {storeInfo.phone && <Typography variant="caption" sx={{ fontWeight: 600 }}>{language === "ar" ? "هاتف" : "Phone"}: {storeInfo.phone}</Typography>}
        {storeInfo.email && <Typography variant="caption" sx={{ fontWeight: 600 }}>{language === "ar" ? "البريد" : "Email"}: {storeInfo.email}</Typography>}
      </Box>
      <Typography variant="caption" align="center" display="block" sx={{ mt: 2, color: "text.secondary", fontWeight: 700 }}>
        {storeInfo.receipt_footer || (language === "ar" ? "شكرًا لزيارتكم" : "Thank you for your visit")}
      </Typography>
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

function InvoiceModal({ open, onClose, order, autoPrint = false, isTest = false, printMode = "order" }) {
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

  const getPrintErrorMessage = useCallback((error) => {
    const base = error?.message || (language === "ar" ? "تعذرت الطباعة عبر QZ Tray" : "QZ Tray printing failed");
    if (error?.kitchenPrintResult?.receiptCount) {
      const partial = language === "ar" ? "تم إرسال تذكرة المطبخ قبل تعذر فاتورة الكاشير." : "The kitchen ticket was sent before the cashier receipt failed.";
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
    if (cashierReceiptCount) destinations.push(language === "ar" ? "فاتورة الكاشير" : "cashier receipt");
    if (destinations.length) {
      const label = destinations.join(" + ");
      return language === "ar" ? `أُرسلت ${label} إلى: ${printers.join("، ")}` : `Sent ${label} to: ${printers.join(", ")}`;
    }
    if (language === "ar") {
      const sentText = receiptCount > 1 ? `أُرسلت ${receiptCount} إيصالات` : "أُرسلت الفاتورة";
      return `${sentText} إلى: ${printers.join("، ")}`;
    }
    const receiptLabel = receiptCount === 1 ? "receipt" : "receipts";
    return `${receiptCount} ${receiptLabel} sent to: ${printers.join(", ")}`;
  }, [language]);

  const runGroupedPrint = () => {
    if (menuLoading) throw new Error(language === "ar" ? "جارٍ تحميل إعدادات التصنيفات، حاول بعد لحظات." : "Category settings are still loading; try again shortly.");
    if (menuError) throw new Error(language === "ar" ? "تعذر تحميل إعدادات التصنيفات؛ أعد تحميل المنيو قبل الطباعة." : "Category settings could not be loaded. Reload the menu before printing.");
    const settings = getPrinterSettings();
    if (printMode === "cashier") {
      return printReceipt(order, storeInfo, {
        language,
        currency,
        settings,
        printersOverride: settings.printers.filter((printer) => printer !== settings.kitchenPrinter),
      });
    }
    if (isTest) return printReceiptGroups(receiptGroups, storeInfo, { language, currency, isTest, settings });
    return printOrderByPaymentStatus(order, receiptGroups, storeInfo, { language, currency, settings });
  };

  const runKitchenPrint = () => {
    if (menuLoading) throw new Error(language === "ar" ? "جارٍ تحميل إعدادات التصنيفات، حاول بعد لحظات." : "Category settings are still loading; try again shortly.");
    if (menuError) throw new Error(language === "ar" ? "تعذر تحميل إعدادات التصنيفات؛ أعد تحميل المنيو قبل الطباعة." : "Category settings could not be loaded. Reload the menu before printing.");
    return printKitchenTicketGroups(receiptGroups, storeInfo, { language, currency });
  };

  useEffect(() => {
    if (!open) {
      setPrintState(null);
      return undefined;
    }
    if (!autoPrint || !order?.id || autoPrintedOrderRef.current === order.id || menuLoading) return undefined;
    if (menuError) {
      setPrintState({ severity: "error", message: language === "ar" ? "تعذر تحميل إعدادات التصنيفات؛ لم تُطبع الفاتورة لتجنب دمج أصناف يفترض فصلها." : "Category settings could not be loaded; printing was paused to avoid combining items that should be separate." });
      return undefined;
    }

    const timer = window.setTimeout(() => {
      autoPrintedOrderRef.current = order.id;
      setPrinting(true);
      (autoPrint === "kitchen"
        ? printKitchenTicketGroups(receiptGroups, storeInfo, { language, currency, settings: getPrinterSettings() })
        : isTest
          ? printReceiptGroups(receiptGroups, storeInfo, { language, currency, isTest })
          : printOrderByPaymentStatus(order, receiptGroups, storeInfo, { language, currency, settings: getPrinterSettings() }))
        .then((result) => {
          setRetryState(null);
          setPrintState({ severity: "success", message: getPrintSuccessMessage(result) });
        })
        .catch((error) => {
          setRetryState(getPrintRetryState(error, order?.id));
          setPrintState({ severity: "error", message: getPrintErrorMessage(error) });
        })
        .finally(() => setPrinting(false));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [autoPrint, open, order?.id, order, storeInfo, language, currency, isTest, menuLoading, menuError, receiptGroups, getPrintErrorMessage, getPrintSuccessMessage]);

  if (!order) return null;

  const printerSettings = getPrinterSettings();
  const printPlan = resolveInvoicePrintPlan(order, printerSettings);
  const activeRetryState = retryState?.orderId === order?.id ? retryState : null;
  const paperWidth = printerSettings.paperWidth;
  const browserPageSize = paperWidth === "A4" ? "A4 portrait" : `${paperWidth} auto`;
  const browserReceiptWidth = paperWidth === "A4" ? "190mm" : paperWidth;

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
      const prefix = language === "ar" ? (result.receiptCount > 1 ? "أُرسلت تذاكر المطبخ" : "أُرسلت تذكرة المطبخ") : (result.receiptCount > 1 ? "Kitchen tickets sent" : "Kitchen ticket sent");
      setPrintState({ severity: "success", message: `${prefix}: ${result.printers.join(language === "ar" ? "، " : ", ")}` });
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
        const result = await printKitchenTicketGroups(receiptGroups, storeInfo, {
          language,
          currency,
          settings: getPrinterSettings(),
          alreadyPrintedByGroup: activeRetryState.alreadyPrintedByGroup,
        });
        const prefix = language === "ar" ? "أُرسلت تذاكر المطبخ المتبقية" : "Remaining kitchen tickets sent";
        setPrintState({ severity: "success", message: `${prefix}: ${result.printers.join(language === "ar" ? "، " : ", ")}` });
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
    setPrinting(true);
    setPrintState(null);
    try {
      await printKitchenTicketGroups(receiptGroups, storeInfo, { language, currency, settings: printerSettings });
      setPrintState({
        severity: "info",
        message: language === "ar"
          ? "أُرسلت تذكرة المطبخ عبر QZ؛ أكمل طباعة إيصال الكاشير في نافذة النظام."
          : "Kitchen ticket sent through QZ; complete the cashier receipt in the system dialog.",
      });
      window.setTimeout(() => window.print(), 100);
    } catch (error) {
      setRetryState(getPrintRetryState(error, order?.id));
      setPrintState({ severity: "error", message: getPrintErrorMessage(error) });
    } finally {
      setPrinting(false);
    }
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
        {!isTest && order.payment_status === "unpaid" && !printPlan.cashier && <Alert severity="info" sx={{ mb: 1.5, "@media print": { display: "none" } }}>{language === "ar" ? "غير مدفوع: تُرسل تذكرة المطبخ فقط؛ تُتاح فاتورة الكاشير بعد تسجيل السداد." : "Unpaid: only the kitchen ticket is sent. The cashier receipt is available after payment is recorded."}</Alert>}
        {menuError && (
          <Alert
            severity="warning"
            action={<Button color="inherit" size="small" onClick={() => refreshMenu?.()}>{language === "ar" ? "إعادة المحاولة" : "Retry"}</Button>}
            sx={{ mb: 1.5, "@media print": { display: "none" } }}
          >
            {language === "ar" ? "تعذر تحميل إعدادات التصنيفات؛ أعد المحاولة قبل الطباعة." : "Category printing settings could not be loaded. Retry before printing."}
          </Alert>
        )}
        {receiptGroups.map((group) => (
          <ReceiptPreview
            key={group.key}
            order={group.order}
            storeInfo={storeInfo}
            language={language}
            currency={currency}
            isTest={isTest}
            receiptTitle={group.receiptTitle}
            amounts={group.amounts}
          />
        ))}
      </DialogContent>

      <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, flexWrap: "wrap", gap: 1, "& .MuiButton-root": { minWidth: { xs: "100%", sm: "auto" } } }}>
        <Button onClick={onClose} color="inherit">{language === "ar" ? "إغلاق" : "Close"}</Button>
        <Button variant="text" onClick={handleBrowserFallback} color="inherit" disabled={printing || menuLoading || Boolean(menuError) || Boolean(activeRetryState) || (!isTest && !printPlan.cashier)} title={language === "ar" ? "يفتح حوار طباعة يدوي؛ الفاتورة العادية ترسل تذكرة المطبخ عبر QZ أولًا." : "Opens a manual print dialog; regular invoices send the kitchen ticket through QZ first."}>
          {isTest
            ? (language === "ar" ? "نافذة النظام (اختبار)" : "System dialog (test)")
            : (language === "ar" ? "إيصال الكاشير عبر النظام" : "Cashier receipt (system dialog)")}
        </Button>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handleKitchenPrint} disabled={printing || menuLoading || Boolean(menuError) || Boolean(activeRetryState)}>
            {language === "ar" ? "تذكرة المطبخ" : "Kitchen ticket"}
          </Button>
          <Button variant="contained" startIcon={printing ? undefined : <PrintIcon />} onClick={handlePrint} color="primary" disabled={printing || menuLoading || Boolean(menuError) || Boolean(activeRetryState)}>
            {printing ? (language === "ar" ? "جارٍ الطباعة…" : "Printing…") : (language === "ar" ? "طباعة حسب حالة السداد" : "Print by payment status")}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

export default InvoiceModal;
