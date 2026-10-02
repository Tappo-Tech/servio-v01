import { useState } from "react";

// MUI COMPONENTS
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

// ANIMATION
import { motion } from "framer-motion";

// ICONS
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";

// HELPERS
import { formatTimeAgo } from "../../../utils/helpers";

// CONTEXTS
import { useOrders } from "../../../context/OrdersContext";
import InvoiceModal from "../../manager-dashboard/orders/OrderPill";

function OrderItemCard({ order }) {
  const { updateOrderStatus } = useOrders();
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      style={{ marginBottom: "16px" }}
    >
      <Card
        elevation={0}
        sx={{
          width: "100%",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "18px",
          background: "rgba(255,255,255,.86)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: "0 12px 34px rgba(23,26,47,.06)",
          transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
          "&:hover": {
            boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
            borderColor: "primary.light",
          },
        }}
      >
        {/* هيدر الكارت */}
        <Box
          sx={{
            p: { xs: 1.5, md: 2 },
            pb: { xs: 1.25, md: 1.5 },
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 800, color: "text.primary" }}
          >
            طاولة {order.table_number}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 600,
              fontSize: "0.74rem",
              bgcolor: "rgba(244,121,32,.07)",
              px: 1,
              py: 0.3,
              borderRadius: "6px",
            }}
          >
            {formatTimeAgo(order.created_at)}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: "dashed" }} />

        {/* عناصر الطلب */}
        <CardContent sx={{ p: 2, py: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {order.items.map((item) => (
              <Box
                key={item.cartItemId || item.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "text.primary" }}
                >
                  <Box
                    component="span"
                    sx={{ color: "primary.main", fontWeight: 800, mr: 0.5 }}
                  >
                    {item.quantity}x
                  </Box>{" "}
                  {item.name}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", fontWeight: 600 }}
                >
                  {item.price} ر.س
                </Typography>
              </Box>
            ))}
          </Box>

          {/* الملاحظات */}
          {order.notes && (
            <Box
              sx={{
                mt: 1.5,
                p: 1.2,
                borderRadius: "8px",
                bgcolor: "warning.50",
                border: "1px solid",
                borderColor: "warning.100",
                display: "flex",
                alignItems: "center",
                gap: 0.8,
              }}
            >
              <FiberManualRecordIcon
                sx={{ fontSize: 8, color: "warning.main" }}
              />
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: "warning.dark" }}
              >
                ملاحظة: {order.notes}
              </Typography>
            </Box>
          )}
        </CardContent>

        {/* زر الطباعة متاح من أول لحظة حتى يخرج رقم الطاولة والأصناف قبل بدء التحضير. */}
        <CardActions sx={{ p: 1.5, pt: 0.5, pb: 0 }}>
          <Button size="small" variant="outlined" startIcon={<PrintRoundedIcon />} onClick={() => setIsInvoiceOpen(true)} sx={{ borderRadius: "10px", fontWeight: 800 }}>
            طباعة الفاتورة
          </Button>
        </CardActions>

        {/* أزرار الإجراءات */}
        <CardActions sx={{ p: 1.5, pt: 0.5 }}>
          {order.status === "pending" && (
            <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
              <Button
                color="primary"
                fullWidth
                size="medium"
                variant="contained"
                disableElevation
                onClick={() => updateOrderStatus(order.id, "preparing")}
                sx={{ borderRadius: "10px", fontWeight: 700, py: 0.9 }}
              >
                بدء التحضير
              </Button>
              <Button
                color="error"
                size="medium"
                variant="outlined"
                onClick={() => updateOrderStatus(order.id, "cancelled")}
                sx={{ borderRadius: "10px", fontWeight: 700, minWidth: "75px" }}
              >
                إلغاء
              </Button>
            </Box>
          )}

          {order.status === "preparing" && (
            <Button
              color="info"
              fullWidth
              size="medium"
              variant="contained"
              disableElevation
              onClick={() => updateOrderStatus(order.id, "ready")}
              sx={{
                borderRadius: "10px",
                fontWeight: 700,
                py: 0.9,
                color: "white",
              }}
            >
              جاهز للتسليم
            </Button>
          )}

          {order.status === "ready" && (
            <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
              <Button
                color="success"
                fullWidth
                size="medium"
                variant="contained"
                disableElevation
                onClick={() => updateOrderStatus(order.id, "served")}
                sx={{ borderRadius: "10px", fontWeight: 700, py: 0.9 }}
              >
                تم الاستلام
              </Button>
              <Button
                color="warning"
                size="medium"
                variant="outlined"
                onClick={() => updateOrderStatus(order.id, "unclaimed")}
                sx={{ borderRadius: "10px", fontWeight: 700, minWidth: "90px" }}
              >
                لم يُستلم
              </Button>
            </Box>
          )}
        </CardActions>
      </Card>
      <InvoiceModal open={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} order={order} />
    </motion.div>
  );
}

export default OrderItemCard;
