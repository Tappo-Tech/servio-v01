// MUI COMPONENTS
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";

// ICONS
import MenuIcon from "@mui/icons-material/Menu";

// CONTEXTS
import { useStore } from "../../context/StoreInfoContext";
import { useUser } from "../../context/UserContext";

// دالة توليد أحرف الـ Avatar
function stringAvatar(name) {
  if (!name) return { children: "M" };

  const nameParts = name.trim().split(" ");
  const initials =
    nameParts.length > 1
      ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      : nameParts[0][0].toUpperCase();

  return { children: initials };
}

function ManagerHeader({ onDrawerToggle }) {
  const { storeInfo } = useStore();
  const { user } = useUser();
  const userName = user?.name || "Manager";

  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: "space-between",
        alignItems: "center",
        direction: "rtl",
        py: 1.5,
        px: { xs: 1, sm: 2 },
      }}
    >
      {/* جهة اليمين: زر الموبايل واسم المتجر */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <IconButton
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ display: { md: "none" }, color: "text.primary" }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          sx={{ fontWeight: "700", color: "text.primary" }}
        >
          {storeInfo?.store_name || "المتجر"}
        </Typography>
      </Box>

      {/* جهة اليسار: معلومات المدير والـ Avatar */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: "600", color: "text.primary", display: { xs: "none", sm: "block" } }}
        >
          {userName}
        </Typography>

        <Avatar
          {...stringAvatar(userName)}
          sx={{
            width: 38,
            height: 38,
            fontSize: "0.9rem",
            fontWeight: 700,
            bgcolor: "#ff602e",
            color: "#ffffff",
          }}
        />
      </Box>
    </Stack>
  );
}

export default ManagerHeader;