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
        <Stack spacing={{ xs: 1.5, md: 2.25 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2, md: 2.5 },
              borderRadius: { xs: 3, md: 4 },
              border: "1px solid",
              borderColor: "rgba(255,255,255,.72)",
              background: "rgba(255,255,255,.78)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              boxShadow: "0 14px 42px rgba(23,26,47,.06)",
            }}
          >
            <DashboardHeader handleNotificationOpen={handleNotificationOpen} />
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.25, sm: 2, md: 2.5 },
              borderRadius: { xs: 3, md: 4 },
              border: "1px solid",
              borderColor: "rgba(255,255,255,.68)",
              background: "rgba(255,255,255,.72)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              boxShadow: "0 16px 48px rgba(23,26,47,.06)",
              minHeight: "calc(100vh - 168px)",
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