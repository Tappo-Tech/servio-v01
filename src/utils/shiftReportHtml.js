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

export function buildShiftReportHtml(session, storeInfo = {}, language = "ar") {
  const ar = language !== "en";
  const locale = ar ? "ar-SA" : "en-SA";
  const currency = escapeHtml(storeInfo.currency || (ar ? "ر.س" : "SAR"));
  const money = (value) => `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)} ${currency}`;
  const labels = ar
    ? { title: "تقرير وردية الكاشير", cashier: "الكاشير", opened: "بداية الوردية", closed: "نهاية الوردية", status: "الحالة", open: "مفتوحة", completed: "مغلقة", opening: "رصيد بداية الكاش", closing: "رصيد نهاية الكاش", total: "إجمالي المبيعات", cash: "نقدًا", card: "بطاقة / شبكة", wallet: "محفظة", transfer: "تحويل", other: "طرق أخرى", notes: "ملاحظات", generated: "تقرير تشغيلي" }
    : { title: "Cashier shift report", cashier: "Cashier", opened: "Shift opened", closed: "Shift closed", status: "Status", open: "Open", completed: "Closed", opening: "Opening cash", closing: "Closing cash", total: "Total sales", cash: "Cash", card: "Card / network", wallet: "Wallet", transfer: "Transfer", other: "Other methods", notes: "Notes", generated: "Operations report" };
  const cashier = session?.cashier_name || session?.cashier_username || (ar ? "كاشير" : "Cashier");
  const logo = safeImageSource(storeInfo.logo_url);
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
    [labels.wallet, money(session?.wallet_sales)],
    [labels.transfer, money(session?.transfer_sales)],
    [labels.other, money(session?.other_sales)],
  ];
  return `<!doctype html><html lang="${ar ? "ar" : "en"}" dir="${ar ? "rtl" : "ltr"}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(labels.title)}</title><style>
    @page{size:A4 portrait;margin:16mm}*{box-sizing:border-box}body{font-family:Arial,Tahoma,sans-serif;color:#171a2f;margin:0;line-height:1.6}.report{max-width:760px;margin:0 auto}.brand{text-align:center;padding-bottom:18px;border-bottom:2px solid #f47920}.logo{width:72px;height:72px;object-fit:contain;margin:0 auto 8px;display:block}.brand h1{font-size:24px;margin:0;font-weight:800}.brand p{margin:4px 0 0;color:#64748b}.store{font-size:15px;color:#64748b;margin:10px 0 0}.summary{margin:22px 0 12px;font-size:13px;color:#64748b}.meta{display:flex;justify-content:space-between;gap:12px;margin:14px 0;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px}.meta strong{color:#171a2f}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{padding:12px 14px;border-bottom:1px solid #e2e8f0;text-align:start}th{background:#f8fafc;color:#475569;font-size:13px}td:last-child{font-weight:700;text-align:end}.notes{margin-top:18px;padding:14px;border:1px solid #e2e8f0;border-radius:10px;white-space:pre-wrap}.footer{margin-top:22px;text-align:center;color:#64748b;font-size:12px}@media print{.meta{background:#fff}}
  </style></head><body><main class="report"><header class="brand"><img class="logo" src="${escapeHtml(logo)}" alt="${escapeHtml(storeInfo.store_name || "SERVIO")}" onerror="this.onerror=null;this.src='/logo-icon.webp'"><h1>${escapeHtml(labels.title)}</h1><p>${escapeHtml(labels.generated)}</p><div class="store">${escapeHtml(storeInfo.store_name || "SERVIO")}</div></header><section class="meta"><span>${escapeHtml(labels.cashier)}: <strong>${escapeHtml(cashier)}</strong></span><span>${escapeHtml(labels.status)}: <strong>${escapeHtml(session?.status === "open" ? labels.open : labels.completed)}</strong></span></section><table><thead><tr><th>${ar ? "البيان" : "Description"}</th><th>${ar ? "القيمة" : "Value"}</th></tr></thead><tbody>${rows.map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join("")}</tbody></table>${session?.notes ? `<section class="notes"><strong>${escapeHtml(labels.notes)}:</strong> ${escapeHtml(session.notes)}</section>` : ""}<footer class="footer">${escapeHtml(storeInfo.receipt_footer || (ar ? "شكرًا لزيارتكم" : "Thank you for your business"))}</footer></main><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));</script></body></html>`;
}
