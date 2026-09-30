import { useState } from "react";

// COMPONENTS
import ManagerSidebar from "../components/manager-dashboard/ManagerSidebar";
import ManagerHeader from "../components/manager-dashboard/ManagerHeader";
import Analytics from "../components/manager-dashboard/Analytics";
import MenuControl from "../components/manager-dashboard/menu-control/MenuControl";
import QRCodeGenerate from "../components/manager-dashboard/settings/QRCodesGenerate";
import OrdersHistory from "../components/manager-dashboard/orders/OrdersHistory";
import SettingsLayout from "../components/manager-dashboard/settings/SettingsLayout";
import Feedbacks from "../components/manager-dashboard/Feedbacks";

// MUI COMPONENTS
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";

function ManagerDashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("manager");

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* الشريط الجانبي */}
      <ManagerSidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* منطقة المحتوى الرئيسي */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          backgroundColor: "background.default",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* الهيدر الثابت مع الفاصل البصري */}
        <Box
          sx={{
            position: "sticky",
            top: { xs: 8, md: 12 },
            zIndex: (theme) => theme.zIndex.appBar,
            px: { xs: 1.25, sm: 2.5, lg: 3 },
            pt: { xs: 1, md: 1.5 },
          }}
        >
          <Box
            sx={{
              border: "1px solid",
              borderColor: "rgba(255,255,255,.65)",
              background: "rgba(255,255,255,.74)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              borderRadius: { xs: 3, md: 4 },
              boxShadow: "0 12px 40px rgba(23,26,47,.06)",
            }}
          >
            <ManagerHeader onDrawerToggle={handleDrawerToggle} />
          </Box>
        </Box>

        {/* عرض الصفحة بناءً على التبويب المحدد */}
        <Box sx={{ flexGrow: 1, p: { xs: 1.25, sm: 2.5, lg: 3 }, pt: { xs: 2, md: 2.5 } }}>
          {activeTab === "manager" && <Analytics />}
          {activeTab === "history" && <OrdersHistory />}
          {activeTab === "menu" && <MenuControl />}
          {activeTab === "settings" && <SettingsLayout />}
          {activeTab === "qrGen" && <QRCodeGenerate />}
          {activeTab === "feedbacks" && <Feedbacks />}
        </Box>
      </Box>
    </Box>
  );
}

export default ManagerDashboard;