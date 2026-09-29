// HOOKS
import { useState } from "react";

// MUI COMPONENTS
import {
  SwipeableDrawer,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Stack,
} from "@mui/material";

// ICONS
import CloseIcon from "@mui/icons-material/Close";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";

// CONTEXTS
import { useWaiterCalls } from "../../context/WaiterCallsContext";

const REASON_OPTIONS = [
  "طلب الفاتورة ",
  "مساعدة في الطلب ",
  "أدوات إضافية ",
  "تنظيف الطاولة ",
];

function CallWaiterConfirm({ open, close, tableNumber = "1" }) {
  const [selectedReason, setSelectedReason] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { addCall } = useWaiterCalls(); 

  const handleReasonToggle = (reason) => {
    setSelectedReason((prev) => (prev === reason ? "" : reason));
  };

  const handleConfirm = () => {
    setLoading(true);

    // إضافة النداء للكونتكست
    addCall(tableNumber, selectedReason);

    setTimeout(() => {
      setLoading(false);
      setIsSent(true);

      setTimeout(() => {
        if (close) close();
        setTimeout(() => {
          setIsSent(false);
          setSelectedReason("");
        }, 300);
      }, 1500);
    }, 400);
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={close}
      onOpen={() => {}}
      disableSwipeToOpen={true}
      slotProps={{
        paper: {
          dir: "rtl",
          sx: {
            borderTopLeftRadius: "24px",
            borderTopRightRadius: "24px",
            maxHeight: "80dvh",
            backgroundColor: "background.paper",
          },
        },
      }}
    >
      <Box
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          gap: 3,
        }}
      >
        <Box
          sx={{
            width: "45px",
            height: "4px",
            backgroundColor: "grey.300",
            borderRadius: "2px",
            mx: "auto",
            mb: 2,
            flexShrink: 0,
          }}
        />

        {!isSent ? (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                استدعاء الجرسون
              </Typography>
              <IconButton
                onClick={close}
                size="small"
                sx={{ backgroundColor: "grey.100" }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Stack spacing={2.5} sx={{ py: 1 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "16px",
                    backgroundColor: "primary.50",
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <NotificationsActiveIcon fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    طاولة رقم {tableNumber}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    اختر سبب الاستدعاء ليصل إشعار واضح للكاشير
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {REASON_OPTIONS.map((reason) => (
                  <Chip
                    key={reason}
                    label={reason}
                    clickable
                    onClick={() => handleReasonToggle(reason)}
                    color={selectedReason === reason ? "primary" : "default"}
                    variant={selectedReason === reason ? "filled" : "outlined"}
                    sx={{
                      borderRadius: "12px",
                      px: 0.5,
                      py: 2,
                      fontWeight: "500",
                    }}
                  />
                ))}
              </Box>
            </Stack>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              onClick={handleConfirm}
              sx={{
                borderRadius: "14px",
                py: 1.8,
                fontWeight: "bold",
                fontSize: "1rem",
                mt: 3,
              }}
            >
              {loading ? "جاري الإرسال..." : "تأكيد النداء"}
            </Button>
          </>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 6,
            }}
          >
            <CheckCircleOutlinedIcon
              color="success"
              sx={{ fontSize: "4rem", mb: 1.5 }}
            />
            <Typography variant="h6" sx={{ fontWeight: "bold" }} gutterBottom>
              تم استدعاء الجرسون!
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", textAlign: "center" }}
            >
              الجرسون في طريقه لطاولتك الآن.
            </Typography>
          </Box>
        )}
      </Box>
    </SwipeableDrawer>
  );
}

export default CallWaiterConfirm;