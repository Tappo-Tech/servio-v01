// مكوّن واجهة `ShiftReports` ضمن مجموعة `manager-dashboard`.
import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, ButtonGroup, Card, CardContent, Chip, CircularProgress, Divider, Paper, Stack, Typography } from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import LocalPrintshopOutlinedIcon from "@mui/icons-material/LocalPrintshopOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import { useShift } from "../../context/ShiftContext";
import supabase from "../../supabase";
import { useTenant } from "../../context/TenantContext";
import { useStore } from "../../context/StoreInfoContext";
import { useLanguage } from "../../context/LanguageContext";
import { buildShiftReportHtml } from "../../utils/shiftReportHtml";

const printSafe = (value) => String(value ?? "—").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));

function Metric({ label, value, detail }) {
  return <Card elevation={0} sx={{ height: "100%", minWidth: 0, border: "1px solid", borderColor: "divider", borderRadius: 3 }}><CardContent sx={{ p: { xs: 1.45, sm: 2.25 }, "&:last-child": { pb: { xs: 1.45, sm: 2.25 } } }}><Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ fontSize: { xs: ".75rem", sm: ".875rem" } }}>{label}</Typography><Typography variant="h5" fontWeight={950} sx={{ mt: .7, fontSize: { xs: "1.05rem", sm: "1.5rem" }, overflowWrap: "anywhere", fontVariantNumeric: "tabular-nums" }}>{value}</Typography>{detail && <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflowWrap: "anywhere" }}>{detail}</Typography>}</CardContent></Card>;
}

export default function ShiftReports({ managerOnlyFeatures = false }) {
  const { sessions, currentShift, loadSessions } = useShift();
  const { tenantId } = useTenant();
  const { storeInfo = {} } = useStore();
  const { language } = useLanguage();
  const ar = language !== "en";
  const locale = ar ? "ar-SA" : "en-SA";
  const [range, setRange] = useState("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [printingSessionId, setPrintingSessionId] = useState(null);
  const text = ar ? {
    title: "تقارير الورديات", subtitle: "سجل إغلاق ورديات الكاشير واطبع تقريرًا تفصيليًا لكل جلسة.", week: "7 أيام", month: "30 يومًا", all: "الكل", refresh: "تحديث", printAll: "طباعة البيانات الظاهرة", open: "مفتوحة", closed: "مغلقة", cashier: "الكاشير", start: "البداية", end: "النهاية", total: "إجمالي المبيعات", cash: "نقدًا", card: "شبكة", opening: "بداية الكاش", closing: "نهاية الكاش", print: "طباعة التقرير", empty: "لا توجد ورديات ضمن الفترة المحددة.", loading: "جارٍ تحميل الورديات…", error: "تعذر تحميل سجل الورديات. تحقق من الاتصال والصلاحيات ثم أعد المحاولة.", count: "عدد الورديات", totalSales: "إجمالي المبيعات المسجلة", note: "تُعرض أحدث 200 جلسة محفوظة. الطباعة تشمل البيانات الظاهرة ضمن الفترة المحددة.", currency: "ر.س",
  } : {
    title: "Shift reports", subtitle: "Review cashier shift closures and print a detailed report for each session.", week: "7 days", month: "30 days", all: "All", refresh: "Refresh", printAll: "Print visible data", open: "Open", closed: "Closed", cashier: "Cashier", start: "Opened", end: "Closed", total: "Total sales", cash: "Cash", card: "Card", opening: "Opening cash", closing: "Closing cash", print: "Print report", empty: "No shifts in the selected period.", loading: "Loading shifts…", error: "Could not load shift history. Check connection and permissions, then retry.", count: "Shifts", totalSales: "Recorded sales total", note: "Showing the latest 200 saved sessions. Printing includes the data visible in the selected period.", currency: "SAR",
  };
  const money = (value) => `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)} ${storeInfo.currency || text.currency}`;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    loadSessions(200).then((result) => {
      if (!active) return;
      if (result?.error) setError(text.error);
    }).catch(() => {
      if (active) setError(text.error);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [loadSessions, refreshKey, text.error]);

  const filtered = useMemo(() => {
    const now = new Date();
    const days = range === "week" ? 7 : range === "month" ? 30 : null;
    const since = days ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)) : null;
    return (sessions || []).filter((session) => !since || new Date(session.opened_at) >= since);
  }, [sessions, range]);
  const closed = filtered.filter((session) => session.status === "closed");
  const recordedSales = closed.reduce((sum, session) => sum + Number(session.total_sales || 0), 0);
  const openCount = filtered.filter((session) => session.status === "open").length;

  const printSession = async (session) => {
    const printWindow = window.open("", "_blank", "width=900,height=760");
    if (!printWindow) {
      setError(ar ? "اسمح بفتح النوافذ المنبثقة لطباعة التقرير." : "Allow pop-up windows to print this report.");
      return;
    }
    setPrintingSessionId(session.id);
    printWindow.document.open();
    printWindow.document.write(`<html><body style="font-family:Arial,sans-serif;padding:24px">${ar ? "جارٍ إعداد تقرير الوردية…" : "Preparing shift report…"}</body></html>`);
    printWindow.document.close();
    if (!managerOnlyFeatures) {
      printWindow.document.open();
      printWindow.document.write(buildShiftReportHtml(session, storeInfo, language));
      printWindow.document.close();
      return;
    }
    try {
      if (!tenantId || !session?.id) throw new Error("Missing shift scope");
      const pageSize = 500;
      const orders = [];
      for (let offset = 0; ; offset += pageSize) {
        let query = supabase.from("orders")
          .select("id,created_at,completed_at,status,payment_status,total_price,table_number")
          .eq("tenant_id", tenantId)
          .eq("cashier_session_id", session.id)
          .in("status", ["ready", "served", "unclaimed"])
          .order("created_at", { ascending: true })
          .order("id", { ascending: true })
          .range(offset, offset + pageSize - 1);
        if (session.branch_id) query = query.eq("branch_id", session.branch_id);
        const { data, error: queryError } = await query;
        if (queryError) throw queryError;
        const page = data || [];
        orders.push(...page);
        if (page.length < pageSize) break;
      }
      printWindow.document.open();
      printWindow.document.write(buildShiftReportHtml(session, storeInfo, language, orders, { managerReport: true }));
      printWindow.document.close();
    } catch (loadError) {
      printWindow.close();
      setError(ar ? "تعذر تحميل طلبات الوردية للطباعة. حدّث البيانات ثم أعد المحاولة." : "Could not load shift orders for printing. Refresh and try again.");
      console.error("تعذر تحميل طلبات الوردية للطباعة:", { code: loadError?.code, message: loadError?.message });
    } finally {
      setPrintingSessionId(null);
    }
  };

  const printFilteredShifts = () => {
    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) { setError(ar ? "اسمح بفتح النوافذ المنبثقة لطباعة التقرير." : "Allow pop-up windows to print this report."); return; }
    const rows = filtered.map((session) => `<tr><td>${printSafe(session.cashier_name || session.cashier_username || (ar ? "كاشير" : "Cashier"))}</td><td>${printSafe(session.status === "open" ? text.open : text.closed)}</td><td>${printSafe(new Date(session.opened_at).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }))}</td><td>${printSafe(session.closed_at ? new Date(session.closed_at).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) : text.open)}</td><td>${printSafe(money(session.total_sales))}</td><td>${printSafe(money(session.cash_sales))}</td><td>${printSafe(money(session.card_sales))}</td></tr>`).join("");
    const thermalRows = filtered.map((session) => `<article class="thermal-record"><header><strong>${printSafe(session.cashier_name || session.cashier_username || (ar ? "كاشير" : "Cashier"))}</strong><strong>${printSafe(money(session.total_sales))}</strong></header><div>${printSafe(text.start)}: ${printSafe(new Date(session.opened_at).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }))}</div><div>${printSafe(text.end)}: ${printSafe(session.closed_at ? new Date(session.closed_at).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) : text.open)}</div><div>${printSafe(text.closed)}: ${printSafe(session.status === "open" ? text.open : text.closed)}</div><div>${printSafe(text.cash)}: ${printSafe(money(session.cash_sales))}</div><div>${printSafe(text.card)}: ${printSafe(money(session.card_sales))}</div></article>`).join("");
    const printCss = managerOnlyFeatures
      ? `@page{margin:12mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#171A2F;margin:0}h1{font-size:22px;margin:0 0 6px}.meta{color:#606778;font-size:12px;margin-bottom:18px}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#171A2F;color:#fff;font-weight:700;text-align:start}th,td{border:1px solid #d9dde5;padding:8px;text-align:start}tbody tr:nth-child(even){background:#f7f8fa}.print-tools{display:flex;justify-content:flex-end;margin-bottom:16px}.print-tools button{font:inherit;padding:7px 12px;border:1px solid #f47920;border-radius:5px;background:#f47920;color:#fff;font-weight:bold}@media print{.print-tools{display:none!important}}`
      : `@page{size:A4 landscape;margin:12mm}@page thermal58{size:58mm auto;margin:3mm}@page thermal80{size:80mm auto;margin:4mm}body[data-paper="58"]{page:thermal58}body[data-paper="80"]{page:thermal80}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#171A2F;margin:0}h1{font-size:22px;margin:0 0 6px}.meta{color:#606778;font-size:12px;margin-bottom:18px}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#171A2F;color:#fff;font-weight:700;text-align:start}th,td{border:1px solid #d9dde5;padding:8px;text-align:start}tbody tr:nth-child(even){background:#f7f8fa}.print-tools{display:flex;align-items:center;gap:8px;padding:10px;margin-bottom:16px;background:#fff7ed;border:1px solid #f47920;border-radius:8px}.print-tools label{font-weight:bold}.print-tools select,.print-tools button{font:inherit;padding:7px;border:1px solid #f47920;border-radius:5px;background:#fff}.print-tools button{background:#f47920;color:#fff;font-weight:bold}.thermal-list{display:none}body[data-paper="58"] .desktop-table,body[data-paper="80"] .desktop-table{display:none}body[data-paper="58"] .thermal-list,body[data-paper="80"] .thermal-list{display:block}.thermal-record{padding:7px 0;border-bottom:1px dashed #777;overflow-wrap:anywhere}.thermal-record header{display:flex;justify-content:space-between;gap:4px;margin-bottom:4px}.thermal-record div{margin:2px 0}@media print{.print-tools{display:none!important}body[data-paper="58"],body[data-paper="80"]{width:100%;font-size:8pt}body[data-paper="58"] h1,body[data-paper="80"] h1{font-size:12pt}body[data-paper="58"] .meta,body[data-paper="80"] .meta{font-size:8pt;margin-bottom:8px}.thermal-record{break-inside:avoid}}`;
    const printTools = managerOnlyFeatures
      ? `<div class="print-tools"><button type="button" onclick="window.print()">${ar ? "طباعة" : "Print"}</button></div>`
      : `<div class="print-tools"><label for="paper-size">${ar ? "مقاس الطباعة" : "Print size"}</label><select id="paper-size"><option value="a4">A4</option><option value="58">${ar ? "حراري 58mm" : "Thermal 58mm"}</option><option value="80">${ar ? "حراري 80mm" : "Thermal 80mm"}</option></select><button type="button" onclick="window.print()">${ar ? "طباعة" : "Print"}</button></div>`;
    const printScript = managerOnlyFeatures ? "window.onafterprint=()=>window.close()" : "document.getElementById('paper-size').addEventListener('change',event=>{document.body.dataset.paper=event.target.value});window.onafterprint=()=>window.close()";
    printWindow.document.write(`<!doctype html><html lang="${language}" dir="${ar ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${printSafe(text.title)}</title><style>${printCss}</style></head><body data-paper="a4">${printTools}<h1>${printSafe(text.title)}</h1><div class="meta">${printSafe(text.printAll)} · ${filtered.length} ${printSafe(text.count)}</div><table class="desktop-table"><thead><tr><th>${printSafe(text.cashier)}</th><th>${printSafe(text.open)}</th><th>${printSafe(text.start)}</th><th>${printSafe(text.end)}</th><th>${printSafe(text.total)}</th><th>${printSafe(text.cash)}</th><th>${printSafe(text.card)}</th></tr></thead><tbody>${rows || `<tr><td colspan="7">${printSafe(text.empty)}</td></tr>`}</tbody></table>${managerOnlyFeatures ? "" : `<section class="thermal-list">${thermalRows || `<p>${printSafe(text.empty)}</p>`}</section>`}<script>${printScript}</script></body></html>`);
    printWindow.document.close();
  };

  return <Box component="main" dir={ar ? "rtl" : "ltr"} sx={{ width: "100%", minWidth: 0 }}>
    <style>{`@media print { @page { size: A4 portrait; margin: 12mm; } .shift-report-no-print { display: none !important; } .shift-report-page { background: #fff !important; padding: 0 !important; } .shift-report-row { break-inside: avoid; box-shadow: none !important; } }`}</style>
    <Stack spacing={{ xs: 2, md: 2.5 }} className="shift-report-page">
      <Stack direction={{ xs: "column", md: "row" }}    sx={{ alignItems: { xs: "stretch", md: "center" }, justifyContent: "space-between", gap: 1.5 }}>
        <Stack direction="row" spacing={1.25}  sx={{ alignItems: "center" }}><Box sx={{ width: 46, height: 46, display: "grid", placeItems: "center", borderRadius: 3, bgcolor: "rgba(244,121,32,.10)", color: "primary.main" }}><AccessTimeRoundedIcon /></Box><Box><Typography variant="h4" component="h1" fontWeight={950} sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}>{text.title}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .3 }}>{text.subtitle}</Typography></Box></Stack>
        <Stack className="shift-report-no-print" direction="row" spacing={1} sx={{ width: { xs: "100%", md: "auto" } }}><Button fullWidth variant="outlined" startIcon={<RefreshRoundedIcon />} disabled={loading} onClick={() => setRefreshKey((value) => value + 1)} sx={{ flex: 1 }}>{text.refresh}</Button><Button fullWidth variant="contained" startIcon={<LocalPrintshopOutlinedIcon />} disabled={loading || Boolean(error) || !filtered.length} onClick={printFilteredShifts} sx={{ flex: 1 }}>{text.printAll}</Button></Stack>
      </Stack>

      <Stack className="shift-report-no-print" direction={{ xs: "column", sm: "row" }}   sx={{ justifyContent: "space-between", gap: 1.25 }}>
        <ButtonGroup dir={ar ? "rtl" : "ltr"} size="small" variant="outlined" aria-label={ar ? "الفترة" : "Date range"} sx={{ width: { xs: "100%", sm: "auto" }, flexDirection: ar ? "row-reverse" : "row", "& .MuiButtonGroup-grouped": { minWidth: 0, flex: 1, px: { xs: .75, sm: 1.5 }, whiteSpace: "nowrap" } }}>
          <Button variant={range === "week" ? "contained" : "outlined"} onClick={() => setRange("week")}>{text.week}</Button>
          <Button variant={range === "month" ? "contained" : "outlined"} onClick={() => setRange("month")}>{text.month}</Button>
          <Button variant={range === "all" ? "contained" : "outlined"} onClick={() => setRange("all")}>{text.all}</Button>
        </ButtonGroup>
        {currentShift && <Chip color="success" variant="outlined" label={`${text.open}: ${new Date(currentShift.opened_at).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}`} sx={{ height: "auto", maxWidth: "100%", alignSelf: { xs: "stretch", sm: "auto" }, "& .MuiChip-label": { display: "block", whiteSpace: "normal", py: .5 } }} />}
      </Stack>

      {error && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => setRefreshKey((value) => value + 1)}>{text.refresh}</Button>}>{error}</Alert>}
      {loading ? <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}><Stack direction="row" spacing={1.2}   sx={{ justifyContent: "center", alignItems: "center" }}><CircularProgress size={23} /><Typography color="text.secondary">{text.loading}</Typography></Stack></Paper> : !error && <>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", sm: "repeat(2,minmax(0,1fr))" }, gap: { xs: .9, sm: 1.5 } }}>
          <Metric label={text.count} value={new Intl.NumberFormat(locale).format(filtered.length)} detail={`${new Intl.NumberFormat(locale).format(openCount)} ${text.open}`} />
          <Metric label={text.totalSales} value={money(recordedSales)} detail={ar ? "للورديات المغلقة ضمن الفترة" : "Closed shifts in this period"} />
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }}    sx={{ mt: .5 , alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between", gap: .4}}><Typography variant="h6" fontWeight={900}>{ar ? "سجل الجلسات" : "Session history"}</Typography><Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, overflowWrap: "anywhere" }}>{text.note}</Typography></Stack>
        {!filtered.length ? <Alert severity="info" sx={{ borderRadius: 3 }}>{text.empty}</Alert> : <Stack spacing={1.2}>
          {filtered.map((session) => {
            const cashierName = session.cashier_name || session.cashier_username || (ar ? "كاشير" : "Cashier");
            return <Paper key={session.id} className="shift-report-row" variant="outlined" sx={{ p: { xs: 1.35, sm: 2 }, borderRadius: 3, display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", sm: "minmax(0,1fr) auto auto" }, gap: { xs: 1.1, sm: 1.5 }, alignItems: "center", minWidth: 0 }}>
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={.8}   useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
                  <PointOfSaleOutlinedIcon color="primary" fontSize="small" />
                  <Typography fontWeight={900} sx={{ minWidth: 0, maxWidth: "100%", overflowWrap: "anywhere" }}>{cashierName}</Typography>
                  <Chip size="small" color={session.status === "open" ? "success" : "default"} variant="outlined" label={session.status === "open" ? text.open : text.closed} />
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: .2, sm: 1.4 }} sx={{ mt: .6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{text.start}: {new Date(session.opened_at).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{text.end}: {session.closed_at ? new Date(session.closed_at).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) : text.open}</Typography>
                </Stack>
              </Box>
              <Box sx={{ minWidth: 0, textAlign: { xs: "start", sm: "end" } }}>
                <Typography fontWeight={950} sx={{ overflowWrap: "anywhere", fontVariantNumeric: "tabular-nums" }}>{money(session.total_sales)}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflowWrap: "anywhere" }}>{text.cash}: {money(session.cash_sales)} · {text.card}: {money(session.card_sales)}</Typography>
              </Box>
              <Button className="shift-report-no-print" fullWidth variant="outlined" startIcon={<LocalPrintshopOutlinedIcon />} disabled={managerOnlyFeatures && printingSessionId === session.id} onClick={() => printSession(session)} sx={{ fontWeight: 800, whiteSpace: "normal" }}>{managerOnlyFeatures && printingSessionId === session.id ? (ar ? "جارٍ تجهيز الطباعة…" : "Preparing print…") : text.print}</Button>
            </Paper>;
          })}
        </Stack>}
      </>}
      <Divider />
    </Stack>
  </Box>;
}
