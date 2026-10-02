// MUI COMPONENTS
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

// CHART
import { BarChart } from "@mui/x-charts/BarChart";

// CONTEXTS
import { useAnalytics } from "../../../context/AnalyticsContext";
import { useLanguage } from "../../../context/LanguageContext";

function SalesTrendChart() {
  const theme = useTheme();
  const { t } = useLanguage();
  const { setViewType, isDaily, currentLabels, currentSales } =
    useAnalytics("daily");
  const hordText = isDaily ? t("managerDaily") : t("managerWeekly");

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "16px",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0px 4px 20px rgba(0,0,0,0.02)",
      }}
    >
      {/* HEADER SECTION */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ textAlign: "start" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t("managerSalesTrend")} {hordText}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("managerReport")} {hordText}
          </Typography>
        </Box>

        <ButtonGroup
          sx={{ direction: "ltr" }}
          size="small"
          aria-label="analytics view toggle"
        >
          <Button
            variant={!isDaily ? "contained" : "outlined"}
            onClick={() => setViewType("weekly")}
            sx={{ borderRadius: "8px" }}
          >
            {t("managerWeekly")}
          </Button>
          <Button
            variant={isDaily ? "contained" : "outlined"}
            onClick={() => setViewType("daily")}
            sx={{ borderRadius: "8px" }}
          >
            {t("managerDaily")}
          </Button>
        </ButtonGroup>
      </Box>

      {/* CHART CONTENT */}
      <CardContent
        sx={{
          pt: 0,
          pb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box sx={{ width: "100%", height: 320 }}>
          <BarChart
            xAxis={[
              {
                scaleType: "band",
                data: currentLabels,
                disableTicks: true,
              },
            ]}
            yAxis={[
              {
                disableLine: true,
                disableTicks: true,
                valueFormatter: () => "",
              },
            ]}
            series={[
              {
                data: currentSales,
                label: t("managerSales"),
                color: theme.palette.primary.main,
                valueFormatter: (value) => `${value} ${t("currencySar")}`,
              },
            ]}
            grid={{ horizontal: false }}
            margin={{ left: 0, right: 40, top: 10, bottom: 15 }}
            borderRadius={8}
            sx={{
              ".MuiChartsAxis-bottom .MuiChartsAxis-tickLabel": {
                fill: theme.palette.text.secondary,
                fontSize: "3.5rem",
                fontWeight: 500,
                fontFamily: theme.typography.fontFamily,
              },
              ".MuiChartsAxis-bottom .MuiChartsAxis-line": {
                stroke: theme.palette.divider,
                strokeWidth: 1,
                opacity: 0.6,
              },
              ".MuiChartsAxis-left": {
                display: "none",
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

export default SalesTrendChart;
