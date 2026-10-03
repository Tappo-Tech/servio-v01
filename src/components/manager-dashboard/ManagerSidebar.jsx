// COMPONENTS
import SidebarItem from "./SidebarItem";

// MUI COMPONENTS
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Typography from "@mui/material/Typography";

// MUI HOOKS
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useLanguage } from "../../context/LanguageContext";

// ICONS
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";

// عناصر القائمة المحدثة لتغطي كل مكونات النظام
const navItems = [
  {
    id: "manager",
    label: "لوحة النظرة العامة", translationKey: "manager",
    icon: <DashboardOutlinedIcon />,
  },
  { id: "menu", label: "التحكم في المنيو", translationKey: "menuControl", icon: <TuneOutlinedIcon /> },
  { id: "qrGen", label: "أكواد الطاولات (QR)", translationKey: "qrCodes", icon: <QrCode2OutlinedIcon /> },
  { id: "history", label: "سجل الطلبات", translationKey: "orderHistory", icon: <ReceiptLongOutlinedIcon /> },
  { id: "settings", label: "الإعدادات", translationKey: "settings", icon: <SettingsOutlinedIcon /> },
  { id: "feedbacks", label: "اراء العملاء", translationKey: "feedbacks", icon: <RateReviewOutlinedIcon /> },
];

function ManagerSidebar({
  mobileOpen,
  handleDrawerToggle,
  activeTab,
  onSelectTab,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { language, t } = useLanguage();

  const handleItemClick = (id) => {
    onSelectTab(id);
    if (isMobile) {
      handleDrawerToggle();
    }
  };

  const sidebarItems = navItems.map((item) => (
    <SidebarItem
      key={item.id}
      navItem={{ ...item, label: t(item.translationKey) }}
      isSelected={activeTab === item.id}
      onSelect={() => handleItemClick(item.id)}
    />
  ));

  return (
    <SwipeableDrawer
      anchor={language === "ar" ? "right" : "left"}
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? mobileOpen : true}
      onClose={handleDrawerToggle}
      onOpen={() => {}}
      ModalProps={{
        keepMounted: true, // تحسين الأداء على أجهزة الموبايل
      }}
      sx={{
        width: 273,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 273,
          boxSizing: "border-box",
          background:
            "linear-gradient(180deg, rgba(23,26,47,.99) 0%, rgba(28,32,56,.98) 100%)",
          color: "secondary.contrastText",
          borderLeft: "1px solid",
          borderColor: "rgba(255,255,255,.08)",
          boxShadow: "-12px 0 42px rgba(23,26,47,.12)",
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* الشعار واسم التطبيق */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: "10px",
            alignItems: "center",
            justifyContent: "flex-start",
            px: 1,
            pt: 2,
          }}
        >
          <Box
            component="img"
            src="/logo192.png"
            alt="SERVIO Logo"
            sx={{ width: 35, height: 35, borderRadius: 0.8 }}
          />
          <Typography
            sx={{ fontSize: "25px", fontWeight: "800", letterSpacing: "0.5px" }}
            variant="h4"
            component="h1"
          >
            SERVIO
          </Typography>
        </Box>

        {/* قائمة عناصر السايد بار */}
        <Box sx={{ pt: 4 }}>
          <List
            disablePadding
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              "& .MuiListItemButton-root, & .MuiButtonBase-root": {
                borderRadius: "8px",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                },
                "&.Mui-selected, &:focus-visible": {
                  backgroundColor: "rgba(255, 255, 255, 0.18)",
                  fontWeight: 700,
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.22)",
                  },
                },
              },
            }}
          >
            {sidebarItems}
          </List>
        </Box>
      </Box>
    </SwipeableDrawer>
  );
}

export default ManagerSidebar;
