import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import LocalPrintshopOutlinedIcon from "@mui/icons-material/LocalPrintshopOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import supabase from "../../supabase";
import { useTenant } from "../../context/TenantContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  aggregateSalesReport,
  createCsvText,
  createSalesSeries,
  getPresetDateRange,
  getUtcDateBounds,
} from "../../utils/salesReportUtils";

const PAGE_SIZE = 500;

const COPY = {
  ar: {
    title: "تقارير المبيعات",
    subtitle: "ملخص واضح للمبيعات المكتملة وأداء الأصناف خلال الفترة المختارة.",
    daily: "اليوم",
    weekly: "هذا الأسبوع",
    monthly: "هذا الشهر",
    range: "الفترة",
    gross: "إجمالي المبيعات شامل الضريبة",
    net: "صافي المبيعات قبل الضريبة",
    vat: "ضريبة القيمة المضافة المستخرجة · 15/115",
    orders: "الطلبات المكتملة",
    average: "متوسط قيمة الطلب",
    itemQuantity: "الوحدات المباعة",
    dailyTrend: "المبيعات حسب الساعة",
    periodTrend: "المبيعات حسب اليوم",
    topItems: "الأصناف الأعلى مبيعًا",
    rank: "الترتيب",
    item: "الصنف",
    quantity: "الكمية",
    itemSales: "مبيعات الصنف",
    saveCsv: "حفظ تقرير CSV",
    print: "طباعة التقرير",
    refresh: "تحديث البيانات",
    loading: "جارٍ إعداد التقرير…",
    error: "تعذر تحميل بيانات التقرير. تحقق من الاتصال والصلاحيات ثم أعد المحاولة.",
    noData: "لا توجد مبيعات مكتملة خلال هذه الفترة.",
    note: "يُحسب تاريخ البيع من وقت إكمال الطلب، أو وقت إنشائه للطلبات القديمة، حسب المنطقة الزمنية المحلية للجهاز. المبيعات تشمل الإجمالي المسجل بالأسعار النهائية الشاملة للضريبة، وتُستخرج VAT على مستوى كل طلب. لا يعرض التقرير توزيع طرق الدفع أو الخصومات/الاستردادات لأنها لا تُحفظ حاليًا كبيانات منظمة.",
    csvTitle: "تقرير مبيعات SERVIO",
    csvFrom: "من",
    csvTo: "إلى",
    currency: "ر.س",
    unknownItem: "صنف بدون اسم",
  },
  en: {
    title: "Sales reports",
    subtitle: "A clear summary of completed sales and item performance for the selected period.",
    daily: "Today",
    weekly: "This week",
    monthly: "This month",
    range: "Period",
    gross: "Total sales incl. VAT",
    net: "Net sales before VAT",
    vat: "VAT extracted · 15/115",
    orders: "Completed orders",
    average: "Average order value",
    itemQuantity: "Items sold",
    dailyTrend: "Sales by hour",
    periodTrend: "Sales by day",
    topItems: "Top-selling items",
    rank: "Rank",
    item: "Item",
    quantity: "Quantity",
    itemSales: "Item sales",
    saveCsv: "Save CSV report",
    print: "Print report",
    refresh: "Refresh data",
    loading: "Preparing report…",
    error: "Could not load report data. Check connection and permissions, then try again.",
    noData: "There are no completed sales in this period.",
    note: "Sales date uses the order completion time, or creation time for legacy orders, in the device's local time zone. Sales use stored final prices inclusive of VAT; VAT is extracted per order. Payment-method, discount, and refund breakdowns are not shown because these are not currently stored as structured order data.",
    csvTitle: "SERVIO sales report",
    csvFrom: "From",
    csvTo: "To",
    currency: "SAR",
    unknownItem: "Unnamed item",
  },
};

function localDateForDisplay(value, locale) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(year, month - 1, day));
}

function createReportRows(report, text, from, to, currency) {
  return [
    [text.csvTitle],
    [text.csvFrom, from],
    [text.csvTo, to],
    [],
    [text.gross, report.gross, currency],
    [text.net, report.net, currency],
    [text.vat, report.vat, currency],
    [text.orders, report.orderCount],
    [text.average, report.averageOrder, currency],
    [text.itemQuantity, report.itemQuantity],
    [],
    [text.topItems],
    [text.rank, text.item, text.quantity, text.itemSales, currency],
    ...report.topItems.map((item, index) => [index + 1, item.name || text.unknownItem, item.quantity, item.revenue, currency]),
  ];
}

function MetricCard({ title, value, detail, accent = "primary.main" }) {
  return (
    <Card className="reports-print-card" elevation={0} sx={{ height: "100%", borderRadius: 3, border: "1px solid rgba(23,26,47,.08)", position: "relative", overflow: "hidden" }}>
      <Box sx={{ position: "absolute", insetInlineStart: 0, top: 0, bottom: 0, width: 4, bgcolor: accent }} />
      <CardContent sx={{ p: { xs: 1.8, sm: 2.2 }, "&:last-child": { pb: { xs: 1.8, sm: 2.2 } } }}>
        <Typography variant="body2" color="text.secondary" fontWeight={700} sx={{ lineHeight: 1.5 }}>{title}</Typography>
        <Typography variant="h5" fontWeight={950} sx={{ mt: 1, fontSize: { xs: "1.25rem", sm: "1.45rem" }, overflowWrap: "anywhere" }}>{value}</Typography>
        {detail && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: .5 }}>{detail}</Typography>}
      </CardContent>
    </Card>
  );
}

function Reports() {
  const { tenantId, storeInfo, loading: tenantLoading } = useTenant();
  const { language, t } = useLanguage();
  const text = COPY[language] || COPY.ar;
  const locale = language === "ar" ? "ar-SA" : "en-SA";
  const [period, setPeriod] = useState("daily");
  const [refreshKey, setRefreshKey] = useState(0);
  const [reportClock, setReportClock] = useState(() => new Date());
  const range = useMemo(() => getPresetDateRange(period, reportClock), [period, reportClock]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refreshReport = () => {
    setReportClock(new Date());
    setRefreshKey((key) => key + 1);
  };

  useEffect(() => {
    if (tenantLoading) return undefined;
    if (!tenantId) {
      setOrders([]);
      setLoading(false);
      setError(text.error);
      return undefined;
    }

    let active = true;
    const loadReportOrders = async () => {
      setLoading(true);
      setError("");
      setOrders([]);
      try {
        const { start, endExclusive } = getUtcDateBounds(range.from, range.to);
        // نقرأ الأعمدة الضرورية فقط ونقسم النتائج؛ لا نحمّل تاريخًا خارج الفترة ولا نطلب صور الأصناف.
        const saleDateFilter = `and(completed_at.gte.${start},completed_at.lt.${endExclusive}),and(completed_at.is.null,created_at.gte.${start},created_at.lt.${endExclusive})`;
        const allRows = [];
        for (let offset = 0; active; offset += PAGE_SIZE) {
          const { data, error: queryError } = await supabase
            .from("orders")
            .select("id,created_at,completed_at,status,total_price,items")
            .eq("tenant_id", tenantId)
            .in("status", ["served", "unclaimed"])
            .or(saleDateFilter)
            .order("created_at", { ascending: true })
            .order("id", { ascending: true })
            .range(offset, offset + PAGE_SIZE - 1);
          if (queryError) throw queryError;
          const page = data || [];
          allRows.push(...page);
          if (page.length < PAGE_SIZE) break;
        }
        if (active) setOrders(allRows);
      } catch (loadError) {
        if (active) {
          setOrders([]);
          setError(text.error);
          console.error("تعذر تحميل تقرير المبيعات:", { code: loadError?.code, status: loadError?.status, message: loadError?.message });
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadReportOrders();
    return () => { active = false; };
  }, [tenantId, tenantLoading, range.from, range.to, refreshKey, text.error]);

  const report = useMemo(() => aggregateSalesReport(orders), [orders]);
  const series = useMemo(() => createSalesSeries(orders, range.from, range.to, period, locale), [orders, range.from, range.to, period, locale]);
  const currency = storeInfo?.currency || t("currencySar") || text.currency;
  const formatMoney = (value) => `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)} ${currency}`;
  const fromLabel = localDateForDisplay(range.from, locale);
  const toLabel = localDateForDisplay(range.to, locale);
  const rangeLabel = range.from === range.to ? fromLabel : `${fromLabel} – ${toLabel}`;
  const seriesMax = Math.max(1, ...series.map((point) => point.total));
  const chartMinimumWidth = period === "daily" ? 760 : period === "monthly" ? 700 : 0;

  const handleCsvDownload = () => {
    const csv = createCsvText(createReportRows(report, text, range.from, range.to, currency));
    const blobUrl = window.URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `servio-sales-${range.from}-${range.to}.csv`;
    link.click();
    window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 0);
  };

  const metricCards = [
    { title: text.gross, value: formatMoney(report.gross), accent: "primary.main" },
    { title: text.net, value: formatMoney(report.net), accent: "secondary.main" },
    { title: text.vat, value: formatMoney(report.vat), accent: "success.main" },
    { title: text.orders, value: new Intl.NumberFormat(locale).format(report.orderCount), accent: "info.main" },
    { title: text.average, value: formatMoney(report.averageOrder), accent: "warning.main" },
    { title: text.itemQuantity, value: new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(report.itemQuantity), accent: "secondary.light" },
  ];

  return (
    <Box component="main" dir={language === "ar" ? "rtl" : "ltr"} className="reports-print-page" sx={{ width: "100%", minWidth: 0 }}>
      <style>{`@media print { @page { size: A4 portrait; margin: 12mm; } .reports-no-print { display: none !important; } .reports-print-page { background: #fff !important; padding: 0 !important; } .reports-print-card { box-shadow: none !important; break-inside: avoid; } }`}</style>
      <Stack spacing={{ xs: 2, md: 2.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" gap={1.5}>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <AssessmentOutlinedIcon color="primary" sx={{ fontSize: { xs: 30, sm: 36 } }} />
            <Box>
              <Typography variant="h4" component="h1" fontWeight={950} sx={{ fontSize: { xs: "1.6rem", sm: "2rem" } }}>{text.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: .3 }}>{text.subtitle}</Typography>
            </Box>
          </Stack>
          <Chip label={`${text.range}: ${rangeLabel}`} color="primary" variant="outlined" sx={{ alignSelf: { xs: "flex-start", md: "center" }, fontWeight: 800, maxWidth: "100%" }} />
        </Stack>

        <Stack className="reports-no-print" direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" gap={1.2}>
          <ToggleButtonGroup
            exclusive
            value={period}
            onChange={(_, value) => { if (value) setPeriod(value); }}
            aria-label={text.range}
            size="small"
            sx={{ alignSelf: { xs: "stretch", sm: "flex-start" }, bgcolor: "background.paper", flexWrap: "wrap", "& .MuiToggleButton-root": { px: { xs: 1.3, sm: 2.2 }, py: 1, fontWeight: 800, flex: { xs: 1, sm: "initial" } } }}
          >
            <ToggleButton value="daily">{text.daily}</ToggleButton>
            <ToggleButton value="weekly">{text.weekly}</ToggleButton>
            <ToggleButton value="monthly">{text.monthly}</ToggleButton>
          </ToggleButtonGroup>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={refreshReport} disabled={loading} sx={{ fontWeight: 800 }}>
              {text.refresh}
            </Button>
            <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={handleCsvDownload} disabled={loading || Boolean(error)} sx={{ fontWeight: 800 }}>
              {text.saveCsv}
            </Button>
            <Button variant="contained" startIcon={<LocalPrintshopOutlinedIcon />} onClick={() => window.print()} disabled={loading || Boolean(error)} sx={{ fontWeight: 800 }}>
              {text.print}
            </Button>
          </Stack>
        </Stack>

        <Typography variant="caption" color="text.secondary" className="reports-print-card" sx={{ mt: -1, fontWeight: 700 }}>
          {text.csvFrom}: {fromLabel} · {text.csvTo}: {toLabel}
        </Typography>

        {error && <Alert severity="error" action={<Button color="inherit" size="small" onClick={refreshReport}>{text.refresh}</Button>}>{error}</Alert>}
        {loading ? (
          <Card elevation={0} className="reports-print-card" sx={{ borderRadius: 3, border: "1px solid rgba(23,26,47,.08)" }}>
            <CardContent><Stack direction="row" alignItems="center" justifyContent="center" spacing={1.2} sx={{ py: 4 }}><CircularProgress size={24} /><Typography color="text.secondary">{text.loading}</Typography></Stack></CardContent>
          </Card>
        ) : !error && report.orderCount === 0 ? (
          <Alert severity="info" className="reports-print-card" sx={{ borderRadius: 3 }}>{text.noData}</Alert>
        ) : !error ? (
          <>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", xl: "repeat(6, minmax(0, 1fr))" }, gap: 1.2 }}>
              {metricCards.map((metric) => <MetricCard key={metric.title} {...metric} />)}
            </Box>

            <Card elevation={0} className="reports-print-card" sx={{ borderRadius: 3, border: "1px solid rgba(23,26,47,.08)" }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                  <Typography variant="h6" fontWeight={900}>{period === "daily" ? text.dailyTrend : text.periodTrend}</Typography>
                  <Typography variant="caption" color="text.secondary">{currency}</Typography>
                </Stack>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ overflowX: "auto", pb: .5 }}>
                  <Stack direction="row" alignItems="flex-end" justifyContent={series.length < 10 ? "space-around" : "flex-start"} spacing={series.length < 10 ? 1 : .5} sx={{ minWidth: chartMinimumWidth, height: 190, px: .5 }}>
                    {series.map((point) => {
                      const barHeight = point.total > 0 ? Math.max(4, (point.total / seriesMax) * 125) : 2;
                      return (
                        <Tooltip key={point.key} title={`${point.label}: ${formatMoney(point.total)}`} arrow>
                          <Box aria-label={`${point.label}: ${formatMoney(point.total)}`} sx={{ flex: series.length < 10 ? 1 : "0 0 24px", minWidth: 20, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: .7 }}>
                            <Box sx={{ width: series.length > 12 ? 12 : { xs: 18, sm: 24 }, height: barHeight, borderRadius: "6px 6px 2px 2px", bgcolor: point.total > 0 ? "primary.main" : "rgba(23,26,47,.10)", transition: "height .2s ease" }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: ".66rem", whiteSpace: "nowrap", transform: series.length > 20 ? "rotate(-45deg)" : "none", transformOrigin: "top center" }}>{point.label}</Typography>
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Stack>
                </Box>
              </CardContent>
            </Card>

            <Card elevation={0} className="reports-print-card" sx={{ borderRadius: 3, border: "1px solid rgba(23,26,47,.08)" }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 1.2 }}>
                  <Typography variant="h6" fontWeight={900}>{text.topItems}</Typography>
                  <Chip size="small" label={report.topItems.length} variant="outlined" />
                </Stack>
                {report.topItems.length ? (
                  <TableContainer sx={{ overflowX: "auto" }}>
                    <Table size="small" sx={{ minWidth: 440 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell align="center">{text.rank}</TableCell>
                          <TableCell>{text.item}</TableCell>
                          <TableCell align="right">{text.quantity}</TableCell>
                          <TableCell align="right">{text.itemSales}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {report.topItems.map((item, index) => (
                          <TableRow key={item.key} hover>
                            <TableCell align="center"><Chip size="small" label={index + 1} /></TableCell>
                            <TableCell sx={{ fontWeight: 750, maxWidth: 220, overflowWrap: "anywhere" }}>{item.name || text.unknownItem}</TableCell>
                            <TableCell align="right">{new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(item.quantity)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>{formatMoney(item.revenue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : <Typography color="text.secondary" sx={{ py: 2 }}>{text.noData}</Typography>}
              </CardContent>
            </Card>
          </>
        ) : null}

        <Alert severity="info" icon={false} className="reports-print-card" sx={{ borderRadius: 2.5, lineHeight: 1.75, fontSize: ".82rem" }}>
          {text.note}
        </Alert>
      </Stack>
    </Box>
  );
}

export default Reports;
