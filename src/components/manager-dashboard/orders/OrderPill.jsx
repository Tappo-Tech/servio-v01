// MUI COMPONENTS
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Divider,
  Button,
} from "@mui/material";

// ICONS
import PrintIcon from "@mui/icons-material/Print";

// OTHERS
import dayjs from "dayjs";

// CONTEXTS
import { useStore } from "../../../context/StoreInfoContext";

function InvoiceModal({ open, onClose, order }) {
  const { storeInfo = {} } = useStore();

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const currency = storeInfo.currency || "ر.س";
  const shortOrderId = String(order.id || "").slice(-6).toUpperCase();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-invoice, #printable-invoice * {
              visibility: visible !important;
            }
            #printable-invoice {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              padding: 0 !important;
            }
          }
        `}
      </style>

      <DialogContent id="printable-invoice">
        <Box sx={{ textAlign: "center", mb: 2 }}>
          {storeInfo.logo_url && (
            <Box
              component="img"
              src={storeInfo.logo_url}
              alt={storeInfo.store_name || "Logo"}
              sx={{
                width: 80,
                height: 80,
                borderRadius: 2,
                objectFit: "cover",
                mx: "auto",
                mb: 1,
              }}
            />
          )}
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {storeInfo.store_name || "المتجر"}
          </Typography>

          {storeInfo.tax_number && (
            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
            >
              الرقم الضريبي: {storeInfo.tax_number}
            </Typography>
          )}

          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
          >
            فاتورة مبسطة
          </Typography>
          <Typography variant="caption" display="block">
            {dayjs(order.created_at).format("DD/MM/YY · hh:mm A")}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: "dashed", my: 1.5 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            رقم الطلب: #{order.id}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            طاولة: {order.table_number}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: "dashed", my: 1.5 }} />

        <Box sx={{ my: 2 }}>
          {order.items?.map((item, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              <Typography variant="body2">
                {item.name} × {item.quantity}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {item.price * item.quantity} {currency}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ borderStyle: "dashed", my: 1.5 }} />

        {order.notes && (
          <Typography variant="caption" display="block" sx={{ mb: 1 }}>
            ملاحظات: {order.notes}
          </Typography>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 2,
            pt: 1,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
            المجموع الكلي:
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
            {order.total_price} {currency}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: "dashed", my: 1.5 }} />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.5,
            mt: 1,
          }}
        >
          {storeInfo.phone && (
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              هاتف: {storeInfo.phone}
            </Typography>
          )}
          {storeInfo.email && (
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              البريد: {storeInfo.email}
            </Typography>
          )}
        </Box>

        <Typography
          variant="caption"
          align="center"
          display="block"
          sx={{ mt: 2, color: "text.secondary", fontWeight: 700 }}
        >
          {storeInfo.receipt_footer || "شكراً لزيارتكم!"}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
        <Button onClick={onClose} color="inherit">
          إغلاق
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          color="primary"
        >
          طباعة
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default InvoiceModal;