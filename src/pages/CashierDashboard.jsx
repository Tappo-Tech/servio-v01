// COMPONENTS
import DashboardHeader from "../components/cashier-dashboard/DashboardHeader";
import LiveOrders from "../components/cashier-dashboard/orders/LiveOrders";
import WaiterCallNotification from "../components/cashier-dashboard/orders/WaiterCallNotification";

// MUI COMPONENTS
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";

// HOOKS
import { useState } from "react";

function Dashboard() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const handleNotificationOpen = () => setIsNotificationOpen(true);
  const handleNotificationClose = () => setIsNotificationOpen(false);

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 2, sm: 3, md: 5 },
      }}
    >
      <Container maxWidth="xl" disableGutters>
        <Stack spacing={{ xs: 2.5, md: 3.5 }}>
          {/* كارت الهيدر */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              borderRadius: "20px",
              border: "1px solid",
              borderColor: "divider",
              backgroundColor: "#ffffff",
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.03)",
            }}
          >
            <DashboardHeader handleNotificationOpen={handleNotificationOpen} />
          </Paper>

          {/* منطقة الطلبات الحية */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              borderRadius: "20px",
              border: "1px solid",
              borderColor: "divider",
              backgroundColor: "#ffffff",
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.03)",
              minHeight: "calc(100vh - 180px)",
            }}
          >
            <LiveOrders />
          </Paper>

          {/* النافذة الجانبية لنداءات الويتر */}
          <WaiterCallNotification
            open={isNotificationOpen}
            close={handleNotificationClose}
          />
        </Stack>
      </Container>
    </Box>
  );
}

export default Dashboard;