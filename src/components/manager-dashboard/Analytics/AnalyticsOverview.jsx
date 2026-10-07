// MUI COMPONENTS
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";

// CONTEXTS
import { useAnalytics } from "../../../context/AnalyticsContext";
import { useLanguage } from "../../../context/LanguageContext";

function AnalyticsOverview() {
  const { t, language } = useLanguage();
  const {
    todaysOrders,
    totalSalesToday,
    aovToday,
    salesGrowth,
    aovGrowth,
    ordersGrowth,
    analyticsReady,
    ordersLoadError,
    reloadOrders,
  } = useAnalytics();
  const operationalDayLabel = language === "ar" ? "اليوم التشغيلي" : "Operational day";

  // دالة مساعدة لتنسيق شريحة نسبة النمو ديناميكياً
  const renderGrowthChip = (growthValue) => {
    const val = Number(growthValue);
    const isPositive = val >= 0;

    return (
      <Chip
        label={`${isPositive ? "+" : ""} ${val}%`}
        size="small"
        sx={{
          backgroundColor: isPositive ? "#e8f5e9" : "#ffebee",
          color: isPositive ? "#2e7d32" : "#c62828",
          fontWeight: 700,
          borderRadius: "8px",
          direction: "ltr", // للحفاظ على ترتيب الإشارة والنسبة المئوية
        }}
      />
    );
  };

  return (
    <Box sx={{ mb: 1, pt: 3 }}>
      {/* HEADING */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 800,
            mb: 0.2,
            color: "text.primary",
            textAlign: "start",
          }}
        >
          {t("managerPerformance")}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ color: "text.secondary", fontWeight: 600, textAlign: "start" }}
        >
          {t("managerBusiness")}
        </Typography>
      </Box>

      {/* عند تعذر جلب الطلبات نعرض حالة واضحة بدل رقم صفر يوحي بعدم وجود مبيعات. */}
      {ordersLoadError && (
        <Box role="status" sx={{ mb: 2, color: "error.main", display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2">{t("unexpectedError")}</Typography>
          <Button size="small" color="error" onClick={reloadOrders}>
            {language === "ar" ? "إعادة المحاولة" : "Retry"}
          </Button>
        </Box>
      )}

      {/* ANALYTICS OVERVIEW CARDS */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 2.5,
          "& > .MuiCard-root": { position: "relative", overflow: "hidden", "&::before": { content: '""', position: "absolute", insetInline: 0, top: 0, height: 6, background: "#F47920" } },
          "& > .MuiCard-root:nth-of-type(2)::before": { background: "#2878C8" },
          "& > .MuiCard-root:nth-of-type(3)::before": { background: "#159A68" },
        }}
      >
        {/* CARD 1: TOTAL SALES */}
        <Card
          elevation={0}
          sx={{
            borderRadius: "16px",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0px 4px 20px rgba(0,0,0,0.02)",
          }}
        >
          <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontWeight: 600,
                mb: 1,
                textAlign: "start",
              }}
            >
              {language === "ar" ? `إجمالي المبيعات · ${operationalDayLabel}` : `Total sales · ${operationalDayLabel}`}
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "end",
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {analyticsReady ? totalSalesToday : "—"}{" "}
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ fontWeight: 700 }}
                >
                  {t("currencySar")}
                </Typography>
              </Typography>
              {analyticsReady && renderGrowthChip(salesGrowth)}
            </Box>
          </CardContent>
        </Card>

        {/* CARD 2: AOV */}
        <Card
          elevation={0}
          sx={{
            borderRadius: "16px",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0px 4px 20px rgba(0,0,0,0.02)",
          }}
        >
          <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontWeight: 600,
                mb: 1,
                textAlign: "start",
              }}
            >
              {t("managerAov")}
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "end",
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {analyticsReady ? aovToday : "—"}{" "}
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ fontWeight: 700 }}
                >
                  {t("currencySar")}
                </Typography>
              </Typography>
              {analyticsReady && renderGrowthChip(aovGrowth)}
            </Box>
          </CardContent>
        </Card>

        {/* CARD 3: TOTAL ORDERS */}
        <Card
          elevation={0}
          sx={{
            borderRadius: "16px",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0px 4px 20px rgba(0,0,0,0.02)",
          }}
        >
          <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontWeight: 600,
                mb: 1,
                textAlign: "start",
              }}
            >
              {language === "ar" ? `إجمالي الطلبات · ${operationalDayLabel}` : `Total orders · ${operationalDayLabel}`}
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "end",
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {analyticsReady ? todaysOrders.length : "—"}
              </Typography>
              {analyticsReady && renderGrowthChip(ordersGrowth)}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default AnalyticsOverview;
