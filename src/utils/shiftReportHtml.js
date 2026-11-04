// دوال مساعدة `shiftReportHtml` لمنطق التطبيق واختباراته.
import { aggregateTableTurnover, buildTableTurnoverDetails } from "./tableOrderUtils";
import { getWorkdaySchedule } from "./workdayUtils";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
  }[character]));
}

function safeImageSource(value) {
  const source = String(value || "").trim();
  if (/^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(source)) return source;
  if (/^https?:\/\//i.test(source) || source.startsWith("/")) return source;
  return "/logo-icon.webp";
}

function formatDate(value, locale) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function buildShiftReportHtml(session, storeInfo = {}, language = "ar", orders = [], { managerReport = false } = {}) {
  const ar = language !== "en";
  const locale = ar ? "ar-SA" : "en-SA";
  const currency = escapeHtml(storeInfo.currency || (ar ? "ر.س" : "SAR"));
  const money = (value) => `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)} ${currency}`;
  const labels = ar
    ? { title: "تقرير وردية الكاشير", cashier: "الكاشير", opened: "بداية الوردية", closed: "نهاية الوردية", status: "الحالة", open: "مفتوحة", completed: "مغلقة", opening: "رصيد بداية الكاش", closing: "رصيد نهاية الكاش", total: "إجمالي المبيعات", cash: "نقدًا", card: "شبكة", turnover: "سرعة دوران الطاولات", tableCount: "عدد الطاولات المستخدمة", turns: "عدد الطلبات على الطاولات", averageTurns: "متوسط الطلبات للطاولة", averageDuration: "متوسط مدة إكمال الطلب", details: "تفاصيل طلبات الطاولات", table: "الطاولة", order: "رقم الطلب", orderTime: "وقت الطلب", previousGap: "الفاصل عن الطلب السابق", duration: "مدة الإكمال", noDetails: "لا توجد طلبات طاولات مكتملة في هذه الوردية.", minute: "دقيقة", notes: "ملاحظات", generated: "تقرير تشغيلي", printSize: "مقاس الطباعة", print: "طباعة", a4: "A4", thermal58: "حراري 58mm", thermal80: "حراري 80mm", systemDefault: "افتراضي النظام", description: "البيان", value: "القيمة" }
    : { title: "Cashier shift report", cashier: "Cashier", opened: "Shift opened", closed: "Shift closed", status: "Status", open: "Open", completed: "Closed", opening: "Opening cash", closing: "Closing cash", total: "Total sales", cash: "Cash", card: "Network", turnover: "Table turnover", tableCount: "Tables used", turns: "Table orders", averageTurns: "Average orders per table", averageDuration: "Average order completion time", details: "Table order details", table: "Table", order: "Order number", orderTime: "Order time", previousGap: "Gap since previous order", duration: "Completion time", noDetails: "No completed physical-table orders in this shift.", minute: "min", notes: "Notes", generated: "Operations report", printSize: "Print size", print: "Print", a4: "A4", thermal58: "Thermal 58mm", thermal80: "Thermal 80mm", systemDefault: "System default", description: "Description", value: "Value" };
  const cashier = session?.cashier_name || session?.cashier_username || (ar ? "كاشير" : "Cashier");
  const logo = safeImageSource(storeInfo.logo_url);
  const turnover = managerReport ? aggregateTableTurnover(orders, getWorkdaySchedule(storeInfo)) : null;
  const turnoverDetails = managerReport ? buildTableTurnoverDetails(orders, getWorkdaySchedule(storeInfo)) : [];
  const minutes = (value) => value == null ? "—" : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)} ${labels.minute}`;
  const turnoverRows = turnoverDetails.flatMap((group) => group.orders.map((order) => `<tr><td data-label="${escapeHtml(labels.table)}">${escapeHtml(group.table)}</td><td data-label="${escapeHtml(labels.order)}">${escapeHtml(order.orderNumber)}</td><td data-label="${escapeHtml(labels.orderTime)}">${escapeHtml(formatDate(order.createdAt, locale))}</td><td data-label="${escapeHtml(labels.previousGap)}">${escapeHtml(minutes(order.gapMinutes))}</td><td data-label="${escapeHtml(labels.duration)}">${escapeHtml(minutes(order.durationMinutes))}</td><td data-label="${escapeHtml(labels.total)}">${escapeHtml(money(order.totalPrice))}</td></tr>`)).join("");
  const rows = [
    [labels.cashier, cashier],
    [labels.opened, formatDate(session?.opened_at, locale)],
    [labels.closed, formatDate(session?.closed_at, locale)],
    [labels.status, session?.status === "open" ? labels.open : labels.completed],
    [labels.opening, money(session?.opening_cash)],
    [labels.closing, session?.closing_cash == null ? "—" : money(session.closing_cash)],
    [labels.total, money(session?.total_sales)],
    [labels.cash, money(session?.cash_sales)],
    [labels.card, money(session?.card_sales)],
    ...(!managerReport ? [[ar ? "محفظة" : "Wallet", money(session?.wallet_sales)], [ar ? "تحويل" : "Transfer", money(session?.transfer_sales)], [ar ? "طرق أخرى" : "Other methods", money(session?.other_sales)]] : []),
  ];
  const pageRules = managerReport
    ? '@page thermal58{size:58mm auto;margin:2mm}@page thermal80{size:80mm auto;margin:2mm}body[data-paper="58"]{page:thermal58}body[data-paper="80"]{page:thermal80}'
    : '@page{size:A4 portrait;margin:16mm}@page thermal58{size:58mm auto;margin:3mm}@page thermal80{size:80mm auto;margin:4mm}body[data-paper="58"]{page:thermal58}body[data-paper="80"]{page:thermal80}';
  const thermalPrintRules = managerReport
    ? 'body[data-paper="58"],body[data-paper="80"]{font-size:8pt}.thermal-table,.thermal-table tbody,.thermal-table tr,.thermal-table td{display:block;width:100%}.thermal-table thead{display:none}.thermal-table tr{margin:0 0 5px;padding:2px;border:1px solid #cbd5e1;break-inside:avoid}.thermal-table td{display:flex;justify-content:space-between;gap:6px;padding:2px;border:0;text-align:start}.thermal-table td::before{content:attr(data-label);font-weight:700;max-width:48%}.thermal-table.metrics tbody tr{display:flex}.thermal-table.metrics th,.thermal-table.metrics td{display:block;width:50%}.thermal-table.metrics td::before{content:none}'
    : 'body[data-paper="58"],body[data-paper="80"]{width:100%;font-size:9pt}';
  const printToolbar = managerReport
    ? `<div class="print-tools"><label for="paper-size">${escapeHtml(labels.printSize)}</label><select id="paper-size"><option value="system">${escapeHtml(labels.systemDefault)}</option><option value="58">${escapeHtml(labels.thermal58)}</option><option value="80">${escapeHtml(labels.thermal80)}</option></select><button type="button" onclick="window.print()">${escapeHtml(labels.print)}</button></div>`
    : `<div class="print-tools"><label for="paper-size">${escapeHtml(labels.printSize)}</label><select id="paper-size"><option value="a4">${escapeHtml(labels.a4)}</option><option value="58">${escapeHtml(labels.thermal58)}</option><option value="80">${escapeHtml(labels.thermal80)}</option></select><button type="button" onclick="window.print()">${escapeHtml(labels.print)}</button></div>`;
  const printScript = managerReport
    ? "document.getElementById('paper-size').addEventListener('change',event=>{document.body.dataset.paper=event.target.value});window.onafterprint=()=>window.close()"
    : "document.getElementById('paper-size').addEventListener('change',event=>{document.body.dataset.paper=event.target.value});window.onafterprint=()=>window.close()";
  const styles = `<style>
    ${pageRules}
    *{box-sizing:border-box}
    body{font-family:Arial,Tahoma,sans-serif;color:#171a2f;margin:0;line-height:1.6}
    .report{max-width:760px;margin:0 auto}
    .brand{text-align:center;padding-bottom:18px;border-bottom:2px solid #f47920}
    .logo{width:72px;height:72px;object-fit:contain;margin:0 auto 8px;display:block}
    .brand h1{font-size:24px;margin:0;font-weight:800}
    .brand p{margin:4px 0 0;color:#64748b}
    .store{font-size:15px;color:#64748b;margin:10px 0 0}
    .summary{margin:22px 0 12px;font-size:13px;color:#64748b}
    .meta{display:flex;justify-content:space-between;gap:12px;margin:14px 0;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px}
    .meta strong{color:#171a2f}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th,td{padding:12px 14px;border-bottom:1px solid #e2e8f0;text-align:start}
    th{background:#f8fafc;color:#475569;font-size:13px}
    td:last-child{font-weight:700;text-align:end}
    .notes{margin-top:18px;padding:14px;border:1px solid #e2e8f0;border-radius:10px;white-space:pre-wrap}
    .turnover{margin-top:22px}.turnover-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.turnover-metrics div{padding:10px;border:1px solid #e2e8f0;border-radius:8px}.turnover-metrics strong{display:block;margin-top:5px}.details{font-size:12px;table-layout:fixed;overflow-wrap:anywhere}
    .footer{margin-top:22px;text-align:center;color:#64748b;font-size:12px}
    .print-tools{display:flex;align-items:center;justify-content:center;gap:10px;margin:0 auto 18px;padding:10px;background:#fff7ed;border:1px solid #f47920;border-radius:8px}
    .print-tools label{font-weight:700}
    .print-tools select,.print-tools button{font:inherit;padding:8px;border:1px solid #f47920;border-radius:5px;background:#fff}
    .print-tools button{background:#f47920;color:#fff;font-weight:700;cursor:pointer}
    @media print{.print-tools{display:none!important}${thermalPrintRules}.brand{padding-bottom:8px}.logo{width:40px;height:40px}.brand h1{font-size:13pt}.brand p,.store{font-size:8pt}.meta{display:block;padding:5px;margin:7px 0}.meta span{display:block}table{margin-top:5px}th,td{padding:4px 3px;font-size:8pt}.turnover-metrics{grid-template-columns:1fr}.turnover-metrics div{padding:5px}.notes{margin-top:8px;padding:6px}.footer{margin-top:8px}}
  </style>`;
  return `<!doctype html><html lang="${ar ? "ar" : "en"}" dir="${ar ? "rtl" : "ltr"}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(labels.title)}</title>${styles}</head><body data-paper="${managerReport ? "system" : "a4"}"><main class="report">${printToolbar}<header class="brand"><img class="logo" src="${escapeHtml(logo)}" alt="${escapeHtml(storeInfo.store_name || "SERVIO")}" onerror="this.onerror=null;this.src='/logo-icon.webp'"><h1>${escapeHtml(labels.title)}</h1><p>${escapeHtml(labels.generated)}</p><div class="store">${escapeHtml(storeInfo.store_name || "SERVIO")}</div></header><section class="meta"><span>${escapeHtml(labels.cashier)}: <strong>${escapeHtml(cashier)}</strong></span><span>${escapeHtml(labels.status)}: <strong>${escapeHtml(session?.status === "open" ? labels.open : labels.completed)}</strong></span></section><table class="${managerReport ? "thermal-table" : ""}"><thead><tr><th>${escapeHtml(labels.description)}</th><th>${escapeHtml(labels.value)}</th></tr></thead><tbody>${rows.map(([label, value]) => `<tr><td data-label="">${escapeHtml(label)}</td><td data-label="${escapeHtml(label)}">${escapeHtml(value)}</td></tr>`).join("")}</tbody></table>${managerReport ? `<section class="turnover"><h2>${escapeHtml(labels.turnover)}</h2><div class="turnover-metrics"><div>${escapeHtml(labels.tableCount)}<strong>${escapeHtml(turnover.tableCount)}</strong></div><div>${escapeHtml(labels.turns)}<strong>${escapeHtml(turnover.totalTurns)}</strong></div><div>${escapeHtml(labels.averageTurns)}<strong>${escapeHtml(turnover.averageTurnsPerTable)}</strong></div><div>${escapeHtml(labels.averageDuration)}<strong>${escapeHtml(minutes(turnover.averageMinutes))}</strong></div></div><h3>${escapeHtml(labels.details)}</h3><table class="details thermal-table"><thead><tr><th>${escapeHtml(labels.table)}</th><th>${escapeHtml(labels.order)}</th><th>${escapeHtml(labels.orderTime)}</th><th>${escapeHtml(labels.previousGap)}</th><th>${escapeHtml(labels.duration)}</th><th>${escapeHtml(labels.total)}</th></tr></thead><tbody>${turnoverRows || `<tr><td colspan="6">${escapeHtml(labels.noDetails)}</td></tr>`}</tbody></table></section>` : ""}${session?.notes ? `<section class="notes"><strong>${escapeHtml(labels.notes)}:</strong> ${escapeHtml(session.notes)}</section>` : ""}<footer class="footer">${escapeHtml(storeInfo.receipt_footer || (ar ? "شكرًا لزيارتكم" : "Thank you for your business"))}</footer></main><script>${printScript}</script></body></html>`;
}
