import { useEffect, useRef } from "react";

// MUI COMPONENTS
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Divider,
  Button,
} from "@mui/material";

// ICONS
import PrintIcon from "@mui/icons-material/Print";

// OTHERS
import dayjs from "dayjs";

// CONTEXTS
import { useStore } from "../../../context/StoreInfoContext";
import { useLanguage } from "../../../context/LanguageContext";
import { calculateInclusiveVat, roundMoney } from "../../../utils/taxUtils";

function InvoiceModal({ open, onClose, order, autoPrint = false, isTest = false }) {
  const { t, language } = useLanguage();
  const { storeInfo = {} } = useStore();
  const autoPrintedOrderRef = useRef(null);

  useEffect(() => {
    if (!open) {
      autoPrintedOrderRef.current = null;
      return undefined;
    }
    if (!autoPrint || !order?.id || autoPrintedOrderRef.current === order.id) return undefined;

    // نافذة الطباعة يحددها المتصفح/نظام التشغيل؛ يبقى زر الطباعة اليدوي متاحًا كمسار احتياطي.
    const timer = window.setTimeout(() => {
      autoPrintedOrderRef.current = order.id;
      window.print();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [autoPrint, open, order?.id]);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const currency = storeInfo.currency || t("currencySar");
  const shortOrderId = String(order.id || "").slice(-6).toUpperCase();
  const invoiceAmounts = calculateInclusiveVat(order.total_price);
  const money = (value) => `${new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)} ${currency}`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-invoice, #printable-invoice * {
              visibility: visible !important;
            }
            #printable-invoice {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              padding: 0 !important;
            }
          }
        `}
      </style>

      <DialogContent id="printable-invoice">
        <Box sx={{ textAlign: "center", mb: 2 }}>
          {storeInfo.logo_url && (
            <Box
              component="img"
              src={storeInfo.logo_url}
              alt={storeInfo.store_name || "Logo"}
              sx={{
                width: 80,
                height: 80,
                borderRadius: 2,
                objectFit: "cover",
                mx: "auto",
                mb: 1,
              }}
            />
          )}
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {storeInfo.store_name || t("storeFallback")}
          </Typography>

          {storeInfo.tax_number && (
            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
            >
              {t("managerTax")}: {storeInfo.tax_number}
            </Typography>
          )}
          {storeInfo.address && (
            <Typography variant="caption" display="block" color="text.secondary">
              {language === "ar" ? "العنوان" : "Address"}: {storeInfo.address}
            </Typography>
          )}

          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
          >
            {t("invoiceSimple")}
          </Typography>
          {isTest && (
            <Typography variant="caption" color="warning.main" display="block" sx={{ mt: .6, fontWeight: 900 }}>
              {language === "ar" ? "اختبار الطابعة — ليست فاتورة بيع" : "Printer test — not a sale invoice"}
            </Typography>
          )}
          <Typography variant="caption" display="block">
            {dayjs(order.created_at).format("DD/MM/YY · hh:mm A")}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: "dashed", my: 1.5 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {t("managerOrderNumber")}: #{shortOrderId}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {t("managerTable")}: {order.table_number}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: "dashed", my: 1.5 }} />

        <Box sx={{ my: 2 }}>
          {order.items?.map((item, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              <Typography variant="body2">
                {item.name} × {item.quantity}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {money(roundMoney(Number(item.price) * Number(item.quantity || 1)))}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ borderStyle: "dashed", my: 1.5 }} />

        {order.notes && (
          <Typography variant="caption" display="block" sx={{ mb: 1 }}>
            {t("managerNotes")}: {order.notes}
          </Typography>
        )}

        <Box sx={{ mt: 2, pt: 1 }}>
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>
            {language === "ar" ? "أسعار الأصناف شاملة لضريبة القيمة المضافة 15%." : "Item prices include 15% VAT."}
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: .8 }}>
            <Typography variant="body2">{language === "ar" ? "المبلغ قبل الضريبة" : "Amount before VAT"}</Typography>
            <Typography variant="body2">{money(invoiceAmounts.net)}</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2">{language === "ar" ? "ضريبة القيمة المضافة 15% (مضمنة)" : "VAT 15% (included)"}</Typography>
            <Typography variant="body2">{money(invoiceAmounts.vat)}</Typography>
          </Box>
          <Divider sx={{ borderStyle: "dashed", my: 1 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", pt: .3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{language === "ar" ? "الإجمالي المستحق (شامل الضريبة)" : "Total due (VAT included)"}</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{money(invoiceAmounts.gross)}</Typography>
          </Box>
        </Box>

        <Divider sx={{ borderStyle: "dashed", my: 1.5 }} />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.5,
            mt: 1,
          }}
        >
          {storeInfo.phone && (
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {t("phone")}: {storeInfo.phone}
            </Typography>
          )}
          {storeInfo.email && (
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {t("email")}: {storeInfo.email}
            </Typography>
          )}
        </Box>

        <Typography
          variant="caption"
          align="center"
          display="block"
          sx={{ mt: 2, color: "text.secondary", fontWeight: 700 }}
        >
          {storeInfo.receipt_footer || t("receiptThanks")}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
        <Button onClick={onClose} color="inherit">
          {language === "ar" ? "إغلاق" : "Close"}
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          color="primary"
        >
          {language === "ar" ? "طباعة" : "Print"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default InvoiceModal;
