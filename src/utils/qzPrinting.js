import supabase from "../supabase";
import { buildReceiptHtml } from "./receiptHtml";
import { renderReceiptHtmlToImages } from "./receiptImageRenderer";

const SETTINGS_KEY = "servio.qzPrinterSettings.v1";
const DISCOVERED_PRINTERS_KEY = "servio.qzDiscoveredPrinters.v1";
const PAPER_WIDTHS = ["58mm", "80mm", "A4"];
const PAPER_WIDTH_MM = { "58mm": 58, "80mm": 80, A4: 210 };
const UNPAID_INVOICE_POLICIES = new Set(["kitchen_only", "kitchen_and_cashier"]);
const DEFAULT_SETTINGS = { printers: [], paperWidth: "80mm", kitchenPrinter: "", categoryPrinters: {}, unpaidInvoicePolicy: "kitchen_only" };
const SETTINGS_FILE_VERSION = 3;
let securityConfigured = false;
let connectionPromise = null;
let qzLoadPromise = null;
let printerDiscoveryPromise = null;

async function loadQzTray() {
  if (typeof window === "undefined") throw new Error("QZ Tray printing is available in the browser only");
  if (window.qz) return window.qz;
  if (!qzLoadPromise) {
    qzLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/qz-tray.js";
      script.async = true;
      script.onload = () => window.qz ? resolve(window.qz) : reject(new Error("تعذر تحميل مكتبة QZ Tray"));
      script.onerror = () => reject(new Error("تعذر تحميل مكتبة الطباعة المحلية"));
      document.head.appendChild(script);
    }).catch((error) => {
      qzLoadPromise = null;
      throw error;
    });
  }
  return qzLoadPromise;
}

function configureSecurity(qz) {
  if (securityConfigured) return;
  qz.security.setCertificatePromise((resolve, reject) => {
    fetch("/servio-qz-certificate.txt", { cache: "no-store" })
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error("تعذر تحميل شهادة SERVIO للطباعة"))))
      .then(resolve, reject);
  }, { rejectOnFailure: true });
  qz.security.setSignatureAlgorithm("SHA512");
  qz.security.setSignaturePromise((toSign) => (resolve, reject) => {
    (async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) throw new Error("يجب تسجيل دخول موظف قبل الطباعة");
      const response = await fetch("/api/qz/signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ request: toSign }),
        cache: "no-store",
      });
      const signature = await response.text();
      if (!response.ok) throw new Error(signature || "تعذر توقيع أمر الطباعة؛ راجع إعداد مفتاح QZ في Vercel");
      resolve(signature.trim());
    })().catch(reject);
  });
  securityConfigured = true;
}

function normalizePrinterSettings(settings) {
  const categoryPrinters = settings?.categoryPrinters && typeof settings.categoryPrinters === "object" && !Array.isArray(settings.categoryPrinters)
    ? Object.fromEntries(Object.entries(settings.categoryPrinters)
      .filter(([categoryId, name]) => categoryId.trim() && typeof name === "string" && name.trim())
      .map(([categoryId, name]) => [categoryId, name.trim()]))
    : {};
  return {
    printers: Array.isArray(settings?.printers)
      ? [...new Set(settings.printers.filter((name) => typeof name === "string" && name.trim()).map((name) => name.trim()))].slice(0, 2)
      : [],
    paperWidth: PAPER_WIDTHS.includes(settings?.paperWidth) ? settings.paperWidth : DEFAULT_SETTINGS.paperWidth,
    kitchenPrinter: typeof settings?.kitchenPrinter === "string" ? settings.kitchenPrinter.trim() : "",
    categoryPrinters,
    unpaidInvoicePolicy: UNPAID_INVOICE_POLICIES.has(settings?.unpaidInvoicePolicy) ? settings.unpaidInvoicePolicy : DEFAULT_SETTINGS.unpaidInvoicePolicy,
  };
}

export function getPrinterSettings() {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}");
    return normalizePrinterSettings(saved);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function savePrinterSettings(settings) {
  const normalized = normalizePrinterSettings(settings);
  if (typeof window !== "undefined") window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
  return normalized;
}

export function getDiscoveredPrinters() {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(DISCOVERED_PRINTERS_KEY) || "{}");
    const names = Array.isArray(stored) ? stored : stored?.printers;
    return [...new Set((Array.isArray(names) ? names : [])
      .filter((name) => typeof name === "string" && name.trim())
      .map((name) => name.trim()))]
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function persistDiscoveredPrinters(printers) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISCOVERED_PRINTERS_KEY, JSON.stringify({
      printers,
      discoveredAt: new Date().toISOString(),
    }));
  } catch {
    // Discovery still works for this session if browser storage is unavailable.
  }
}

// ملف الإعداد لا يحوي أسرارًا؛ أسماء الطابعات تخص جهاز التشغيل ويمكن نقله إلى كاشير آخر.
export function createPrinterSettingsFile(settings, autoPrintAfterSave = true) {
  const normalized = normalizePrinterSettings(settings);
  return `${JSON.stringify({
    app: "SERVIO",
    schemaVersion: SETTINGS_FILE_VERSION,
    printers: normalized.printers,
    paperWidth: normalized.paperWidth,
    kitchenPrinter: normalized.kitchenPrinter,
    categoryPrinters: normalized.categoryPrinters,
    unpaidInvoicePolicy: normalized.unpaidInvoicePolicy,
    autoPrintAfterSave: Boolean(autoPrintAfterSave),
  }, null, 2)}\n`;
}

export function parsePrinterSettingsFile(contents) {
  let payload;
  try {
    payload = JSON.parse(contents);
  } catch {
    throw new Error("ملف الإعداد غير صالح أو ليس JSON صحيحًا.");
  }
  if (!payload || payload.app !== "SERVIO" || ![1, 2, SETTINGS_FILE_VERSION].includes(payload.schemaVersion)) {
    throw new Error("هذا ليس ملف إعداد طابعة SERVIO مدعومًا.");
  }
  if (!Array.isArray(payload.printers) || payload.printers.length > 2 || payload.printers.some((name) => typeof name !== "string" || !name.trim())) {
    throw new Error("يجب أن يحتوي الملف أسماء صفر إلى طابعتين صحيحتين.");
  }
  if (!PAPER_WIDTHS.includes(payload.paperWidth)) {
    throw new Error("مقاس الورق يجب أن يكون 58mm أو 80mm أو A4.");
  }
  if (payload.autoPrintAfterSave !== undefined && typeof payload.autoPrintAfterSave !== "boolean") {
    throw new Error("قيمة الطباعة التلقائية في الملف يجب أن تكون true أو false.");
  }
  if (payload.unpaidInvoicePolicy !== undefined && !UNPAID_INVOICE_POLICIES.has(payload.unpaidInvoicePolicy)) {
    throw new Error("سياسة طباعة الفاتورة غير المدفوعة في الملف غير صالحة.");
  }
  if (payload.kitchenPrinter !== undefined && typeof payload.kitchenPrinter !== "string") {
    throw new Error("اسم طابعة المطبخ في الملف غير صالح.");
  }
  if (payload.categoryPrinters !== undefined && (!payload.categoryPrinters || typeof payload.categoryPrinters !== "object" || Array.isArray(payload.categoryPrinters))) {
    throw new Error("تعيينات طابعات التصنيفات في الملف غير صالحة.");
  }
  return {
    settings: normalizePrinterSettings(payload),
    autoPrintAfterSave: payload.autoPrintAfterSave,
  };
}

export async function connectQzTray() {
  const qz = await loadQzTray();
  configureSecurity(qz);
  if (qz.websocket.isActive()) return qz;
  if (!connectionPromise) {
    connectionPromise = qz.websocket.connect({ retries: 2, delay: 1 })
      .then(() => qz)
      .finally(() => { connectionPromise = null; });
  }
  return connectionPromise;
}

export async function discoverPrinters() {
  if (!printerDiscoveryPromise) {
    printerDiscoveryPromise = (async () => {
      const qz = await connectQzTray();
      const printers = await qz.printers.find();
      const names = [...new Set((Array.isArray(printers) ? printers : [])
        .filter((name) => typeof name === "string" && name.trim())
        .map((name) => name.trim()))]
        .sort((a, b) => a.localeCompare(b));
      persistDiscoveredPrinters(names);
      return names;
    })().finally(() => { printerDiscoveryPromise = null; });
  }
  return printerDiscoveryPromise;
}

export async function reconnectSavedPrinters(additionalPrinterNames = []) {
  const availablePrinters = await discoverPrinters();
  const settings = getPrinterSettings();
  const savedPrinterNames = [...new Set([
    ...settings.printers,
    settings.kitchenPrinter,
    ...Object.values(settings.categoryPrinters),
    ...(Array.isArray(additionalPrinterNames) ? additionalPrinterNames : []),
  ].filter((name) => typeof name === "string" && name.trim()))];
  const available = new Set(availablePrinters);
  const matchedPrinters = savedPrinterNames.filter((name) => available.has(name));
  const missingPrinters = savedPrinterNames.filter((name) => !available.has(name));
  return { availablePrinters, savedPrinterNames, matchedPrinters, missingPrinters };
}

export async function printReceipt(order, storeInfo, options = {}) {
  const settings = options.settings || getPrinterSettings();
  const printers = Array.isArray(options.printersOverride) ? options.printersOverride : settings.printers;
  if (!printers.length) {
    const error = new Error("لم تُحدد طابعة بعد. افتح إعداد الطابعة واختر طابعة واحدة أو اثنتين.");
    error.code = "QZ_NO_PRINTERS_SELECTED";
    throw error;
  }
  const qz = await connectQzTray();
  const width = PAPER_WIDTHS.includes(settings.paperWidth) ? settings.paperWidth : DEFAULT_SETTINGS.paperWidth;
  const html = buildReceiptHtml({ ...options, order, storeInfo, language: options.language, currency: options.currency, paperWidth: width });
  const images = await renderReceiptHtmlToImages(html, width);
  if (!images.length) throw new Error("تعذر إنشاء صورة الإيصال للطباعة");
  const succeeded = [];
  const failed = [];
  const pageWidth = PAPER_WIDTH_MM[width];
  const data = images.map((image) => ({ type: "pixel", format: "image", flavor: "base64", data: image.data }));
  // يُرسل PNG بدل نص HTML: المتصفح يشكّل العربية أولًا، ثم تطبع QZ الصورة دون نافذة حوار.
  // تسلسل الإرسال يمنع تداخل مهام QZ عند اختيار أكثر من طابعة.
  for (const printer of printers) {
    const config = qz.configs.create(printer, {
      margins: 0,
      scaleContent: true,
      units: "mm",
      size: {
        width: pageWidth,
        height: width === "A4" ? 297 : pageWidth * images[0].height / images[0].width,
      },
      colorType: "grayscale",
      interpolation: "bicubic",
    });
    try {
      await qz.print(config, data);
      succeeded.push(printer);
    } catch {
      failed.push(printer);
    }
  }
  if (failed.length) {
    const error = new Error(succeeded.length
      ? `تم إرسال الفاتورة إلى ${succeeded.join("، ")}، وتعذر الإرسال إلى ${failed.join("، ")}.`
      : `تعذر الإرسال إلى الطابعة: ${failed.join("، ")}.`);
    error.code = "QZ_PARTIAL_PRINT_FAILURE";
    error.succeededPrinters = succeeded;
    error.failedPrinters = failed;
    throw error;
  }
  return { printers: succeeded, paperWidth: width };
}

function copyPrintedByGroup(source) {
  return Object.fromEntries(Object.entries(source || {}).map(([key, names]) => [key, [...new Set(Array.isArray(names) ? names.filter((name) => typeof name === "string" && name) : [])]]));
}

function recordPrintedPrinters(printedByGroup, groupKey, names) {
  printedByGroup[groupKey] = [...new Set([...(printedByGroup[groupKey] || []), ...(names || [])])];
}

// كل مجموعة تُرسل كوظيفة طباعة مستقلة؛ مسار الاستئناف يتجاوز الطابعات التي تأكد إرسالها.
export async function printReceiptGroups(groups, storeInfo, options = {}) {
  if (!Array.isArray(groups) || groups.length === 0) {
    throw new Error("لا توجد فواتير جاهزة للطباعة.");
  }

  const baseSettings = options.settings || getPrinterSettings();
  const printedByGroup = copyPrintedByGroup(options.alreadyPrintedByGroup);
  let lastResult = null;
  let printedReceiptCount = 0;
  const sentPrinters = new Set();
  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index];
    const groupKey = String(group.key ?? index);
    const categoryPrinter = !options.ignoreCategoryPrinters && group.categoryId
      ? (group.printerName || baseSettings.categoryPrinters?.[String(group.categoryId)])
      : null;
    const targetPrinters = categoryPrinter ? [categoryPrinter] : baseSettings.printers;
    const completedPrinters = new Set(printedByGroup[groupKey] || []);
    const printersToPrint = targetPrinters.filter((printer) => !completedPrinters.has(printer));
    if (!targetPrinters.length) {
      const error = new Error("لم تُحدد طابعة كاشير. افتح إعداد الطابعة واختر طابعة واحدة على الأقل.");
      error.code = "QZ_NO_PRINTERS_SELECTED";
      error.failedGroupKey = groupKey;
      error.alreadyPrintedByGroup = copyPrintedByGroup(printedByGroup);
      error.printedReceiptCount = printedReceiptCount;
      error.totalReceiptCount = groups.length;
      throw error;
    }
    if (!printersToPrint.length) continue;
    try {
      lastResult = await printReceipt(group.order, storeInfo, {
        ...options,
        settings: baseSettings,
        printersOverride: printersToPrint,
        receiptTitle: group.receiptTitle,
        taxBreakdown: group.amounts,
      });
      (lastResult.printers || []).forEach((printer) => sentPrinters.add(printer));
      recordPrintedPrinters(printedByGroup, groupKey, lastResult.printers);
      printedReceiptCount += 1;
    } catch (error) {
      const groupError = new Error(error?.message || "تعذرت طباعة إحدى الفواتير.");
      groupError.code = error?.code || "QZ_RECEIPT_GROUP_PRINT_FAILURE";
      groupError.succeededPrinters = error?.succeededPrinters || [];
      groupError.failedPrinters = error?.failedPrinters || [];
      recordPrintedPrinters(printedByGroup, groupKey, groupError.succeededPrinters);
      groupError.failedGroupKey = groupKey;
      groupError.alreadyPrintedByGroup = copyPrintedByGroup(printedByGroup);
      groupError.printedReceiptCount = printedReceiptCount;
      groupError.totalReceiptCount = groups.length;
      throw groupError;
    }
  }

  return { ...(lastResult || {}), printers: [...sentPrinters], receiptCount: printedReceiptCount };
}

// تذكرة المطبخ لا تتضمن أسعارًا؛ المجموعة المفصولة تذهب إلى طابعتها المحلية، والبقية إلى طابعة المطبخ العامة.
export async function printKitchenTicketGroups(groups, storeInfo, options = {}) {
  if (!Array.isArray(groups) || groups.length === 0) throw new Error("لا توجد أصناف جاهزة لتذكرة المطبخ.");
  const settings = options.settings || getPrinterSettings();
  const printedByGroup = copyPrintedByGroup(options.alreadyPrintedByGroup);
  let lastResult = null;
  let printedReceiptCount = 0;
  const sentPrinters = new Set();

  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index];
    const groupKey = String(group.key ?? index);
    const categoryPrinter = group.categoryId ? (group.printerName || settings.categoryPrinters?.[String(group.categoryId)]) : "";
    const printer = categoryPrinter || settings.kitchenPrinter;
    if (!printer) {
      const error = new Error("حدد طابعة المطبخ من إعداد الطابعة، أو عيّن طابعة للتصنيف المنفصل.");
      error.code = "QZ_NO_KITCHEN_PRINTER";
      error.failedGroupKey = groupKey;
      error.alreadyPrintedByGroup = copyPrintedByGroup(printedByGroup);
      error.printedReceiptCount = printedReceiptCount;
      error.totalReceiptCount = groups.length;
      throw error;
    }
    if ((printedByGroup[groupKey] || []).includes(printer)) continue;
    try {
      const title = group.isSeparate && group.categoryName
        ? (options.language === "en" ? `Kitchen ticket — ${group.categoryName}` : `تذكرة مطبخ — ${group.categoryName}`)
        : null;
      lastResult = await printReceipt(group.order, storeInfo, {
        ...options,
        receiptType: "kitchen",
        receiptTitle: title,
        settings: { ...settings, printers: [printer] },
      });
      (lastResult.printers || []).forEach((sentPrinter) => sentPrinters.add(sentPrinter));
      recordPrintedPrinters(printedByGroup, groupKey, lastResult.printers);
      printedReceiptCount += 1;
    } catch (error) {
      const groupError = new Error(error?.message || "تعذرت طباعة تذكرة مطبخ.");
      groupError.code = error?.code || "QZ_KITCHEN_TICKET_PRINT_FAILURE";
      groupError.succeededPrinters = error?.succeededPrinters || [];
      groupError.failedPrinters = error?.failedPrinters || [];
      recordPrintedPrinters(printedByGroup, groupKey, groupError.succeededPrinters);
      groupError.failedGroupKey = groupKey;
      groupError.alreadyPrintedByGroup = copyPrintedByGroup(printedByGroup);
      groupError.printedReceiptCount = printedReceiptCount;
      groupError.totalReceiptCount = groups.length;
      throw groupError;
    }
  }
  return { ...lastResult, printers: [...sentPrinters], receiptCount: printedReceiptCount };
}

export function resolveInvoicePrintPlan(order, settings = getPrinterSettings()) {
  const normalized = normalizePrinterSettings(settings);
  const paymentStatus = order?.payment_status;
  const cashier = paymentStatus === "paid"
    || (paymentStatus === "unpaid" && normalized.unpaidInvoicePolicy === "kitchen_and_cashier");
  return { kitchen: true, cashier, paymentStatus };
}

export async function printOrderByPaymentStatus(order, groups, storeInfo, options = {}) {
  const settings = options.settings || getPrinterSettings();
  const plan = resolveInvoicePrintPlan(order, settings);
  let kitchenResult;
  let cashierResult = null;

  try {
    kitchenResult = await printKitchenTicketGroups(groups, storeInfo, { ...options, settings });
  } catch (error) {
    error.printDestination = "kitchen";
    throw error;
  }

  if (plan.cashier) {
    try {
      cashierResult = await printReceiptGroups(groups, storeInfo, { ...options, settings, ignoreCategoryPrinters: true });
    } catch (error) {
      error.kitchenPrintResult = kitchenResult;
      error.printDestination = "cashier";
      throw error;
    }
  }

  return {
    printers: [...new Set([...(kitchenResult?.printers || []), ...(cashierResult?.printers || [])])],
    receiptCount: (kitchenResult?.receiptCount || 0) + (cashierResult?.receiptCount || 0),
    kitchenReceiptCount: kitchenResult?.receiptCount || 0,
    cashierReceiptCount: cashierResult?.receiptCount || 0,
    destinations: plan.cashier ? ["kitchen", "cashier"] : ["kitchen"],
    paymentStatus: plan.paymentStatus,
  };
}
