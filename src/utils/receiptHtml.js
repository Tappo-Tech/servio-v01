import dayjs from "dayjs";
import { calculateInclusiveVat, roundMoney } from "./taxUtils";

const PAPER_SIZES = {
  "58mm": { page: 58, content: 54 },
  "80mm": { page: 80, content: 76 },
  A4: { page: 210, content: 190 },
};

export function escapeReceiptHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[character]));
}

function safeReceiptImageSource(value) {
  const source = String(value || "").trim();
  if (/^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(source)) return source;
  if (/^https?:\/\//i.test(source) || source.startsWith("/")) return source;
  return "";
}

function getItemRows(items, labels, language, formatMoney, receiptType) {
  return items.map((item) => {
    const quantity = Number(item?.quantity || 1);
    const name = escapeReceiptHtml(item?.name);
    const selectedAddons = (Array.isArray(item?.selected_addons) ? item.selected_addons : [])
      .map((addon) => typeof addon === "string" ? addon : addon?.name)
      .filter(Boolean)
      .map(escapeReceiptHtml);
    const addonLine = selectedAddons.length
      ? `<div class="muted addons">${labels.addons}: ${selectedAddons.join(language === "en" ? ", " : "، ")}</div>`
      : "";

    if (receiptType === "kitchen") {
      return `<div class="item-group"><div class="kitchen-item"><strong>${escapeReceiptHtml(quantity)} ×</strong><strong class="kitchen-name">${name}</strong></div>${addonLine}</div>`;
    }

    const lineTotal = roundMoney(Number(item?.price || 0) * quantity);
    return `<div class="item-group"><div class="row item"><span>${name} × ${escapeReceiptHtml(quantity)}</span><strong>${formatMoney(lineTotal)}</strong></div>${addonLine}</div>`;
  }).join("");
}

export function buildReceiptHtml({
  order,
  storeInfo = {},
  language = "ar",
  currency = "ر.س",
  paperWidth = "80mm",
  isTest = false,
  receiptTitle = null,
  taxBreakdown = null,
  receiptType = "cashier",
}) {
  const paper = PAPER_SIZES[paperWidth] || PAPER_SIZES["80mm"];
  const direction = language === "en" ? "ltr" : "rtl";
  const isKitchen = receiptType === "kitchen";
  const labels = language === "en"
    ? {
      invoice: "Cashier receipt", kitchen: "Kitchen ticket", order: "Order", table: "Table",
      notes: "Notes", addons: "Add-ons", adjustment: "Order adjustment", net: "Before VAT",
      vat: "VAT 15% included", total: "Total due (VAT included)", test: "PRINTER TEST — NOT A SALE",
      amountNote: "Prices include 15% Saudi VAT.", paid: "Paid", unpaid: "Unpaid", unknown: "Not set", itemCount: "Items",
      paymentMethod: "Payment method", methodUnknown: "Not specified", cash: "Cash", card: "Card / network (mada)", wallet: "Digital wallet", transfer: "Bank transfer", other: "Other",
    }
    : {
      invoice: "فاتورة الكاشير", kitchen: "تذكرة المطبخ", order: "رقم الطلب", table: "الطاولة",
      notes: "ملاحظات", addons: "إضافات", adjustment: "تسوية الطلب", net: "المبلغ قبل الضريبة",
      vat: "ضريبة القيمة المضافة 15% (مضمنة)", total: "الإجمالي المستحق (شامل الضريبة)", test: "اختبار طابعة — ليست فاتورة بيع",
      amountNote: "أسعار الأصناف شاملة لضريبة القيمة المضافة 15%.", paid: "مدفوع", unpaid: "غير مدفوع", unknown: "غير محدد", itemCount: "عدد الأصناف",
      paymentMethod: "طريقة الدفع", methodUnknown: "غير محددة", cash: "نقدًا", card: "بطاقة / شبكة (مدى)", wallet: "محفظة رقمية", transfer: "تحويل بنكي", other: "أخرى",
    };
  const orderItems = Array.isArray(order?.items) ? order.items : [];
  const itemCount = orderItems.reduce((sum, item) => sum + Math.max(0, Number(item?.quantity || 1)), 0);
  const shortId = String(order?.id || "").slice(-6).toUpperCase();
  const tableNumber = escapeReceiptHtml(order?.table_number || "—");
  const notes = order?.notes ? `<div class="notes"><strong>${labels.notes}:</strong> ${escapeReceiptHtml(order.notes)}</div>` : "";
  const formatMoney = (value) => `${new Intl.NumberFormat(language === "en" ? "en-SA" : "ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)} ${escapeReceiptHtml(currency)}`;
  const rows = getItemRows(orderItems, labels, language, formatMoney, isKitchen ? "kitchen" : "cashier");

  if (isKitchen) {
    return `<!doctype html><html lang="${language === "en" ? "en" : "ar"}" dir="${direction}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>
      @page { size: ${paper.page}mm auto; margin: 2mm; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; width: ${paper.page}mm; color: #111; background: #fff; }
      body { font-family: Tahoma, Arial, "Noto Naskh Arabic", sans-serif; font-size: 12pt; line-height: 1.5; direction: ${direction}; -webkit-print-color-adjust: exact; }
      .receipt { width: ${paper.content}mm; max-width: 100%; margin: 0 auto; overflow-wrap: anywhere; }
      .center { text-align: center; }
      .title { font-size: 16pt; font-weight: 900; margin: 0 0 3mm; }
      .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 2mm; }
      .meta { font-weight: 900; font-size: 11pt; }
      .rule { border: 0; border-top: 1px dashed #333; margin: 3mm 0; }
      .item-group { margin: 2.5mm 0; }
      .kitchen-item { display: flex; align-items: flex-start; justify-content: flex-start; gap: 2mm; direction: ${direction}; font-size: 13pt; line-height: 1.35; }
      .kitchen-item strong { font-weight: 900; }
      .kitchen-name { overflow-wrap: anywhere; }
      .muted { font-size: 10pt; }
      .addons { margin-top: 1mm; padding-inline-start: 3mm; font-weight: 700; }
      .count { font-weight: 900; }
      .notes { margin: 3mm 0 0; padding: 2mm; border: 1px dashed #555; font-weight: 700; white-space: pre-wrap; }
    </style></head><body><main class="receipt">
      <header class="center"><h1 class="title">${escapeReceiptHtml(receiptTitle || labels.kitchen)}</h1></header>
      <div class="row meta"><span>${labels.order}: #${escapeReceiptHtml(shortId)}</span><span>${labels.table}: ${tableNumber}</span></div>
      <hr class="rule"><div class="count">${labels.itemCount}: ${escapeReceiptHtml(itemCount)}</div>
      <section>${rows || `<div class="center muted">${language === "en" ? "No items" : "لا توجد أصناف"}</div>`}</section>
      ${notes}
    </main></body></html>`;
  }

  const hasTaxBreakdown = taxBreakdown && ["net", "vat", "gross"].every((key) => Number.isFinite(Number(taxBreakdown[key])));
  const amounts = hasTaxBreakdown
    ? { net: Number(taxBreakdown.net), vat: Number(taxBreakdown.vat), gross: Number(taxBreakdown.gross) }
    : calculateInclusiveVat(order?.total_price);
  const createdAt = dayjs(order?.created_at || new Date()).format("DD/MM/YY · hh:mm A");
  const storeName = escapeReceiptHtml(storeInfo.store_name || (language === "en" ? "SERVIO Store" : "متجر SERVIO"));
  const safeImage = safeReceiptImageSource(storeInfo.logo_url) || "/logo-icon.webp";
  const logo = `<img class="logo" src="${escapeReceiptHtml(safeImage)}" alt="${escapeReceiptHtml(storeName)}" crossorigin="anonymous" onerror="this.onerror=null;this.src='/logo-icon.webp'">`;
  const taxNumber = storeInfo.tax_number ? `<div>${language === "en" ? "VAT No." : "الرقم الضريبي"}: ${escapeReceiptHtml(storeInfo.tax_number)}</div>` : "";
  const address = storeInfo.address ? `<div>${escapeReceiptHtml(storeInfo.address)}</div>` : "";
  const contact = [
    storeInfo.phone && `${language === "en" ? "Phone" : "هاتف"}: ${escapeReceiptHtml(storeInfo.phone)}`,
    storeInfo.email && escapeReceiptHtml(storeInfo.email),
  ].filter(Boolean).map((entry) => `<div>${entry}</div>`).join("");
  const footer = escapeReceiptHtml(storeInfo.receipt_footer || (language === "en" ? "Thank you for your visit" : "شكرًا لزيارتكم"));
  const receiptAdjustment = roundMoney(Number(order?.receipt_adjustment) || 0);
  const adjustmentRow = receiptAdjustment
    ? `<div class="row amount-row"><span>${labels.adjustment}</span><span>${formatMoney(receiptAdjustment)}</span></div>`
    : "";
  const paymentStatus = order?.payment_status === "paid" ? labels.paid : order?.payment_status === "unpaid" ? labels.unpaid : labels.unknown;
  const paymentLabel = language === "en" ? "Payment" : "حالة الدفع";
  const paymentMethod = labels[order?.payment_method] || labels.methodUnknown;

  return `<!doctype html><html lang="${language === "en" ? "en" : "ar"}" dir="${direction}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>
    @page { size: ${paper.page}mm auto; margin: 2mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: ${paper.page}mm; color: #111; background: #fff; }
    body { font-family: Tahoma, Arial, "Noto Naskh Arabic", sans-serif; font-size: 11pt; line-height: 1.45; direction: ${direction}; -webkit-print-color-adjust: exact; }
    .receipt { width: ${paper.content}mm; max-width: 100%; margin: 0 auto; padding: 0; overflow-wrap: anywhere; }
    .center { text-align: center; }
    .logo { display: block; width: 20mm; height: 20mm; object-fit: contain; margin: 0 auto 2mm; }
    .store { font-size: 15pt; font-weight: 900; margin: 0 0 2mm; }
    .muted { font-size: 8.5pt; }
    .test { color: #9a3412; font-weight: 900; margin: 2mm 0; }
    .rule { border: 0; border-top: 1px dashed #333; margin: 3mm 0; }
    .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 2mm; }
    .item-group { margin: 1.8mm 0; }
    .item { margin: 0; }
    .item span { min-width: 0; }
    .item strong { white-space: nowrap; }
    .addons { margin-top: .4mm; padding-inline-start: 2mm; }
    .meta { font-weight: 800; }
    .amount-row { margin: 1.5mm 0; }
    .payment { font-weight: 900; margin-top: 1.5mm; }
    .total { font-weight: 900; font-size: 12pt; }
    .notes { margin: 2mm 0; white-space: pre-wrap; }
    .footer { margin-top: 4mm; font-weight: 700; }
  </style></head><body><main class="receipt">
    <header class="center">${logo}<h1 class="store">${storeName}</h1>${taxNumber}${address}<div class="muted">${escapeReceiptHtml(receiptTitle || labels.invoice)}</div>${isTest ? `<div class="test">${labels.test}</div>` : ""}<div class="muted">${escapeReceiptHtml(createdAt)}</div></header>
    <hr class="rule"><div class="row meta"><span>${labels.order}: #${escapeReceiptHtml(shortId)}</span><span>${labels.table}: ${tableNumber}</span></div>
    <hr class="rule"><section>${rows || `<div class="center muted">${language === "en" ? "No items" : "لا توجد أصناف"}</div>`}</section>${notes}
    <hr class="rule"><div class="muted">${labels.amountNote}</div>${adjustmentRow}<div class="row amount-row"><span>${labels.net}</span><span>${formatMoney(amounts.net)}</span></div><div class="row amount-row"><span>${labels.vat}</span><span>${formatMoney(amounts.vat)}</span></div>
    <hr class="rule"><div class="row total"><span>${labels.total}</span><span>${formatMoney(amounts.gross)}</span></div><div class="row payment"><span>${paymentLabel}</span><span>${escapeReceiptHtml(paymentStatus)}</span></div><div class="row payment"><span>${labels.paymentMethod}</span><span>${escapeReceiptHtml(paymentMethod)}</span></div><hr class="rule">
    <footer class="center muted">${contact}<div class="footer">${footer}</div></footer>
  </main></body></html>`;
}
