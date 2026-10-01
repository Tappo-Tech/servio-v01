// COMPONENTS
import OrderItemCard from "./OrderItemCard";

// MUI COMPONENTS
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";

// ANIMATION
import { AnimatePresence } from "framer-motion";

// CONTEXTS
import { useOrders } from "../../../context/OrdersContext";

// ICONS
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { useLanguage } from "../../../context/LanguageContext";

const COLUMNS = [
  { key: "pending", title: "newOrder", color: "warning" },
  { key: "preparing", title: "preparing", color: "info" },
  { key: "ready", title: "ready", color: "success" },
];

function LiveOrders() {
  const { orders } = useOrders();
  const { t } = useLanguage();

  const activeOrders = orders.filter((order) => !order.is_completed);

  const getOrdersByStatus = (status) =>
    activeOrders.filter((order) => order.status === status);

  return (
    <Grid container spacing={3}>
      {COLUMNS.map((col) => {
        const columnOrders = getOrdersByStatus(col.key);

        return (
          <Grid key={col.key} size={{xs: 12, md: 4}}>
            {/* عنوان العمود بنفس طابع لوحة التحكم */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.35, md: 1.55 },
                mb: 1.7,
                borderRadius: "15px",
                border: "1px solid",
                borderColor: "rgba(255,255,255,.7)",
                background: "rgba(248,250,252,.72)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                boxShadow: "0 10px 26px rgba(23,26,47,.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FiberManualRecordIcon
                  fontSize="small"
                  sx={{ color: `${col.color}.main`, fontSize: 14 }}
                />
                <Typography variant="subtitle1" fontWeight={700}>
                  {t(col.title)}
                </Typography>
              </Box>

              <Chip
                label={columnOrders.length}
                size="small"
                sx={{
                  bgcolor: (theme) => theme.palette[col.color].main + "18",
                  color: `${col.color}.main`,
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  borderRadius: "8px",
                  px: 0.5,
                }}
              />
            </Paper>

            {/* الحاوية ذات الانتقالات السلسة */}
            <Box sx={{ minHeight: "200px" }}>
              <AnimatePresence mode="popLayout">
                {columnOrders.map((order) => (
                  <OrderItemCard key={order.id} order={order} />
                ))}
              </AnimatePresence>
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default LiveOrders;