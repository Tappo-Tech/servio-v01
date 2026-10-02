// MUI COMPONENTS
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Avatar from "@mui/material/Avatar";

// CONTEXT
import { useAnalytics } from "../../../context/AnalyticsContext";
import { useLanguage } from "../../../context/LanguageContext";

function TopSellingProductsCard() {
  const { topProducts } = useAnalytics();
  const { t } = useLanguage();

  // بيانات fallback مطابقة للصورة في حال عدم وجود طلبات
  const displayProducts =
    topProducts.length > 0
      ? topProducts
      : [
          { name: "Flat White", quantity: 214, totalRevenue: 963.0 },
          { name: "Iced Matcha Latte", quantity: 158, totalRevenue: 916.4 },
          { name: "Cinnamon Roll", quantity: 122, totalRevenue: 475.8 },
        ];

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "16px",
        border: "1px solid",
        borderColor: "#e3e8ef",
        boxShadow: "0px 1px 3px rgba(0,0,0,0.02)",
        bgcolor: "#ffffff",
        height: "100%",
      }}
    >
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        {/* HEADER */}
        <Box sx={{ mb: 2, textAlign: "start" }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: "#0f172a",
              fontSize: "1.1rem",
            }}
          >
            {t("managerTopItems")}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2, borderColor: "#f1f5f9" }} />

        {/* LIST */}
        <List disablePadding>
          {displayProducts.map((product, index) => (
            <ListItem
              key={index}
              disableGutters
              sx={{
                py: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* LEFT SIDE: RANK & INFO */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {/* CIRCULAR RANK */}
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    bgcolor: "#f8fafc",
                    color: "#0f172a",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {index + 1}
                </Avatar>

                {/* NAME & ORDER COUNT */}
                <Box sx={{ textAlign: "start" }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontSize: "0.95rem",
                      lineHeight: 1.2,
                    }}
                  >
                    {product.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#64748b",
                      fontWeight: 500,
                      fontSize: "0.8rem",
                    }}
                  >
                    {product.quantity} {t("managerItemCount")}
                  </Typography>
                </Box>
              </Box>

              {/* RIGHT SIDE: REVENUE */}
              <Typography
                sx={{
                  fontWeight: 800,
                  color: "#0f172a",
                  fontSize: "1rem",
                  letterSpacing: "-0.02em",
                }}
              >
                {product.totalRevenue.toFixed(2)}{" "}
                <Typography
                  component="span"
                  sx={{ fontSize: "0.8rem", fontWeight: 700 }}
                >
                  {t("currencySar")}
                </Typography>
              </Typography>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export default TopSellingProductsCard;
