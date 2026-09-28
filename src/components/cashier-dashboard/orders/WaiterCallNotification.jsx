// MUI COMPONENTS
import {
  Drawer,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  IconButton,
  Grid,
} from "@mui/material";

// ICONS
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

// CONTEXTS
import { useWaiterCalls } from "../../../context/WaiterCallsContext";

// OTHERS
import { formatTimeAgo } from "../../../utils/helpers";

function WaiterCallNotification({ open, close }) {
  const { calls, resolveCall } = useWaiterCalls(); 

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={close}
      slotProps={{
        paper: {
          dir: "rtl",
          sx: {
            width: { xs: "100%", sm: "450px" },
            p: 3,
            backgroundColor: "#f8fafc",
          },
        },
      }}
    >
      {/* هيدر النافذة */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: "900", color: "text.primary" }}>
            إشعارات نداء الجرسون
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: "700", color: "text.secondary" }}>
            النداءات المعلقة: {calls.length}
          </Typography>
        </Box>
        <IconButton onClick={() => close()} sx={{ backgroundColor: "#ffffff" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* المحتوى */}
      {calls.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: "16px",
            border: "1px dashed #cbd5e1",
            backgroundColor: "#ffffff",
            mt: 2,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 48, color: "success", mb: 1 }} />
          <Typography variant="subtitle1" fontWeight="bold" color="secondary">
            لا توجد نداءات معلقة
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {calls.map((call) => (
            <Grid size={12} key={call.id}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                }}
              >
                <CardContent sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                      <TableRestaurantIcon sx={{ color: "primary.main" }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: "700" }}>
                        طاولة {call.table_number}
                      </Typography>
                    </Stack>
                    <Stack direction="row" sx={{ alignItems: "center", gap: 0.5, color: "text.secondary" }}>
                      <AccessTimeIcon sx={{ fontSize: 14 }} />
                      <Typography variant="caption">{formatTimeAgo(call.created_at)}</Typography>
                    </Stack>
                  </Box>

                  <Chip label={call.reason} size="small" sx={{ alignSelf: "flex-start", fontWeight: "500" }} />

                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    onClick={() => resolveCall(call.id)}
                    sx={{
                      borderRadius: "8px",
                      backgroundColor: "success",
                      fontWeight: "bold",
                      boxShadow: "none",
                      "&:hover": { backgroundColor: "success" },
                    }}
                  >
                    تم التلبية
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Drawer>
  );
}

export default WaiterCallNotification;