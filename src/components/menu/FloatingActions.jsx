import { useState } from "react";

// MUI COMPONENTS
import Box from "@mui/material/Box";
import Backdrop from "@mui/material/Backdrop";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import SpeedDialAction from "@mui/material/SpeedDialAction";

// MUI ICONS
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import RateReviewIcon from "@mui/icons-material/RateReview";
import RoomServiceIcon from "@mui/icons-material/RoomService";

// CONTEXT
import { useCart } from "../../context/CartContext";

function FloatingActions({ handleReview, handleCallWaiter }) {
  const [openDial, setOpenDial] = useState(false);
  const { cartItems } = useCart();

  // التبديل الديناميكي للموقع بناءً على وجود عناصر في السلة
  const hasItemsInCart = cartItems && cartItems.length > 0;
  const bottomPosition = hasItemsInCart ? 120 : 25;

  const handleDialOpen = () => setOpenDial(true);
  const handleDialClose = () => setOpenDial(false);

  const actions = [
    {
      icon: <NotificationsActiveIcon sx={{ color: "#ff9800" }} />,
      name: "طلب مساعدة الموظف",
      onClick: () => {
        handleDialClose();
        handleCallWaiter();
      },
    },
    {
      icon: <RateReviewIcon color="primary" />,
      name: "شاركنا رأيك",
      onClick: () => {
        handleDialClose();
        handleReview();
      },
    },
  ];

  return (
    <>
      {/* 1. تظليل الشاشة عند فتح الـ SpeedDial */}
      <Backdrop
        open={openDial}
        onClick={handleDialClose}
        sx={{ zIndex: 1040, backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      />

      {/* 2. حاوية الزر العائم بموقع ديناميكي وانتقال انسيابي */}
      <Box
        sx={{
          position: "fixed",
          bottom: bottomPosition, // 👈 موضع متغير
          right: 20,
          zIndex: 1050,
          transition: "bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)", // 👈 انيميشن الصعود والنزول
        }}
      >
        <SpeedDial
          ariaLabel="خيارات الخدمة"
          sx={{
            "& .MuiFab-primary": {
              backgroundColor: openDial
                ? "#ff9800"
                : "rgba(255, 152, 0, 0.75)",
              backdropFilter: "blur(8px)",
              color: "#fff",
              boxShadow: openDial
                ? "0 8px 25px rgba(255, 152, 0, 0.4)"
                : "0 4px 15px rgba(0,0,0,0.15)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: "#f57c00",
                boxShadow: "0 6px 20px rgba(255, 152, 0, 0.5)",
              },
            },
          }}
          icon={<SpeedDialIcon openIcon={<RoomServiceIcon />} />}
          onClose={handleDialClose}
          onOpen={handleDialOpen}
          open={openDial}
          direction="up"
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              tooltipOpen
              onClick={action.onClick}
              TooltipProps={{
                sx: {
                  "& .MuiTooltip-tooltip": {
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    bgcolor: "background.paper",
                    color: "text.primary",
                    boxShadow: 3,
                    borderRadius: "8px",
                    px: 1.5,
                    py: 0.5,
                    whiteSpace: "nowrap",
                  },
                },
              }}
              sx={{
                bgcolor: "background.paper",
                "&:hover": { bgcolor: "grey.100" },
              }}
            />
          ))}
        </SpeedDial>
      </Box>
    </>
  );
}

export default FloatingActions;
