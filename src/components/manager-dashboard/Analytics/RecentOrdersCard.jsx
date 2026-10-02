// MUI COMPONENTS
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";

// ICONS
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";

// CONTEXTS
import { useAnalytics } from "../../../context/AnalyticsContext";
import { useLanguage } from "../../../context/LanguageContext";

function RecentOrdersCard() {
  const { recentOrders } = useAnalytics();
  const { t, language } = useLanguage();

  // خريطة بسيطة لحالة الطلب
  const getStatusChip = (status) => {
    switch (status) {
      case "completed":
        return (
          <Chip
            label={t("managerComplete")}
            size="small"
            color="success"
            sx={{ fontSize: "0.7rem", height: 20 }}
          />
        );
      case "pending":
        return (
          <Chip
            label={t("managerPending")}
            size="small"
            color="warning"
            sx={{ fontSize: "0.7rem", height: 20 }}
          />
        );
      default:
        return (
          <Chip
            label={t("managerNew")}
            size="small"
            color="primary"
            sx={{ fontSize: "0.7rem", height: 20 }}
          />
        );
    }
  };

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
        <Box
          sx={{
            mb: 2,
            textAlign: "start",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: "#0f172a",
              fontSize: "1.1rem",
            }}
          >
            {t("managerRecent")}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#64748b", fontWeight: 600 }}
          >
            {t("managerLive")}
          </Typography>
        </Box>

        <Divider sx={{ mb: 1.5, borderColor: "#f1f5f9" }} />

        {/* LIST */}
        <List disablePadding>
          {recentOrders && recentOrders.length > 0 ? (
            recentOrders.map((order, index) => (
              <ListItem
                key={order.id || index}
                disableGutters
                sx={{
                  py: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between", // تم التعديل من justify إلى justifyContent
                  borderBottom:
                    index !== recentOrders.length - 1
                      ? "1px dashed #f1f5f9"
                      : "none",
                }}
              >
                {/* LEFT SIDE: TABLE & ORDER INFO */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar
                    sx={{
                      width: 38,
                      height: 38,
                      bgcolor: "#f0fdf4",
                      color: "#16a34a",
                      border: "1px solid #bbf7d0",
                    }}
                  >
                    <ReceiptLongRoundedIcon fontSize="small" />
                  </Avatar>

                  <Box sx={{ textAlign: "start" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          color: "#0f172a",
                          fontSize: "0.95rem",
                          lineHeight: 1.2,
                        }}
                      >
                        {t("table")} {order.table_number || order.table || "—"}
                      </Typography>
                      {getStatusChip(order.status)}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#64748b",
                        fontWeight: 500,
                        fontSize: "0.8rem",
                      }}
                    >
                      {order.items?.length || 0} {t("managerItemCount")} •{" "}
                      {order.created_at
                        ? new Date(order.created_at).toLocaleTimeString(
                            language === "ar" ? "ar-SA" : "en-US",
                            { hour: "2-digit", minute: "2-digit" },
                          )
                        : t("managerNow")}
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
                  {(order.total_price || 0).toFixed(2)}{" "}
                  <Typography
                    component="span"
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#64748b",
                    }}
                  >
                    {t("currencySar")}
                  </Typography>
                </Typography>
              </ListItem>
            ))
          ) : (
            <Typography
              variant="body2"
              sx={{ color: "#94a3b8", textAlign: "center", py: 3 }}
            >
              {t("managerNoRecent")}
            </Typography>
          )}
        </List>
      </CardContent>
    </Card>
  );
}

export default RecentOrdersCard;
