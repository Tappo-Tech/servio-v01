// MUI COMPONENTS
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";

// CONTEXTS
import { useAnalytics } from "../../../context/AnalyticsContext";
import { useLanguage } from "../../../context/LanguageContext";

function AnalyticsOverview() {
  const { t } = useLanguage();
  const {
    todaysOrders,
    totalSalesToday,
    aovToday,
    salesGrowth,
    aovGrowth,
    ordersGrowth,
  } = useAnalytics();

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
              {t("managerSalesToday")}
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "end",
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {totalSalesToday}{" "}
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ fontWeight: 700 }}
                >
                  {t("currencySar")}
                </Typography>
              </Typography>
              {renderGrowthChip(salesGrowth)}
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
                {aovToday}{" "}
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ fontWeight: 700 }}
                >
                  {t("currencySar")}
                </Typography>
              </Typography>
              {renderGrowthChip(aovGrowth)}
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
              {t("managerOrdersTodayCount")}
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "end",
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {todaysOrders.length}
              </Typography>
              {renderGrowthChip(ordersGrowth)}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default AnalyticsOverview;
