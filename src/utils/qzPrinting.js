import supabase from "../supabase";
import { buildReceiptHtml } from "./receiptHtml";

const SETTINGS_KEY = "servio.qzPrinterSettings.v1";
const PAPER_WIDTHS = ["58mm", "80mm", "A4"];
const PAGE_WIDTH_INCHES = { "58mm": 58 / 25.4, "80mm": 80 / 25.4, A4: 210 / 25.4 };
const DEFAULT_SETTINGS = { printers: [], paperWidth: "80mm" };
let securityConfigured = false;
let connectionPromise = null;
let qzLoadPromise = null;

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

export function getPrinterSettings() {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}");
    return {
      printers: Array.isArray(saved.printers) ? [...new Set(saved.printers.filter((name) => typeof name === "string" && name.trim()))].slice(0, 2) : [],
      paperWidth: PAPER_WIDTHS.includes(saved.paperWidth) ? saved.paperWidth : DEFAULT_SETTINGS.paperWidth,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function savePrinterSettings(settings) {
  const normalized = {
    printers: Array.isArray(settings?.printers) ? [...new Set(settings.printers.filter((name) => typeof name === "string" && name.trim()))].slice(0, 2) : [],
    paperWidth: PAPER_WIDTHS.includes(settings?.paperWidth) ? settings.paperWidth : DEFAULT_SETTINGS.paperWidth,
  };
  if (typeof window !== "undefined") window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
  return normalized;
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
  const qz = await connectQzTray();
  const printers = await qz.printers.find();
  return [...new Set((Array.isArray(printers) ? printers : []).filter((name) => typeof name === "string" && name.trim()))].sort((a, b) => a.localeCompare(b));
}

export async function printReceipt(order, storeInfo, options = {}) {
  const settings = options.settings || getPrinterSettings();
  if (!settings.printers.length) {
    const error = new Error("لم تُحدد طابعة بعد. افتح إعداد الطابعة واختر طابعة واحدة أو اثنتين.");
    error.code = "QZ_NO_PRINTERS_SELECTED";
    throw error;
  }
  const qz = await connectQzTray();
  const width = PAPER_WIDTHS.includes(settings.paperWidth) ? settings.paperWidth : DEFAULT_SETTINGS.paperWidth;
  const html = buildReceiptHtml({ ...options, order, storeInfo, language: options.language, currency: options.currency, paperWidth: width });
  const succeeded = [];
  const failed = [];
  // تسلسل الإرسال يمنع تداخل مهام QZ إذا اختيرت طابعتان ويحدد نتيجة كل واحدة بوضوح.
  for (const printer of settings.printers) {
    const config = qz.configs.create(printer, { margins: 0, scaleContent: true });
    try {
      await qz.print(config, [{
        type: "pixel",
        format: "html",
        flavor: "plain",
        data: html,
        options: { pageWidth: PAGE_WIDTH_INCHES[width] },
      }]);
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
