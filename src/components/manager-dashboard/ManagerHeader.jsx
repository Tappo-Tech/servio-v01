import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../context/StoreInfoContext";
import { useUser } from "../../context/UserContext";
import { logout } from "../../utils/logout";
import LanguageToggle from "../LanguageToggle";
import { useLanguage } from "../../context/LanguageContext";
function stringAvatar(name) { if (!name) return { children: "M" }; const parts = name.trim().split(" "); return { children: (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0]).toUpperCase() }; }
function ManagerHeader({ onDrawerToggle }) {
  const { storeInfo } = useStore(); const { user } = useUser(); const navigate = useNavigate(); const userName = user?.name || "Manager"; const { language, t } = useLanguage();
  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: "space-between",
        alignItems: "center",
        direction: language === "ar" ? "rtl" : "ltr",
        py: { xs: 1.1, md: 1.35 },
        px: { xs: 1, sm: 1.5 },
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
        <IconButton
          aria-label="فتح القائمة"
          edge="start"
          onClick={onDrawerToggle}
          sx={{
            display: { md: "none" },
            color: "text.primary",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2.5,
          }}
        >
          <MenuIcon />
        </IconButton>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="overline"
            sx={{ color: "primary.main", fontWeight: 900, letterSpacing: 1.3 }}
          >
            الإدارة
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              color: "text.primary",
              lineHeight: 1.15,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: { xs: 180, sm: 360, md: 520 },
            }}
          >
            {storeInfo?.store_name || "المتجر"}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1.1 } }}>
        <LanguageToggle compact />
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: "text.secondary",
            display: { xs: "none", sm: "block" },
          }}
        >
          {userName}
        </Typography>
        <Avatar
          {...stringAvatar(userName)}
          sx={{
            width: { xs: 38, sm: 42 },
            height: { xs: 38, sm: 42 },
            fontSize: "0.9rem",
            fontWeight: 800,
            bgcolor: "primary.main",
            color: "#fff",
            boxShadow: "0 8px 20px rgba(244,121,32,.16)",
          }}
        />
        <Tooltip title={t("logout")}>
          <IconButton
            aria-label={t("logout")}
            onClick={() => logout(navigate)}
            sx={{
              color: "text.secondary",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2.5,
              "&:hover": {
                color: "primary.main",
                borderColor: "primary.light",
                backgroundColor: "rgba(244,121,32,.06)",
              },
            }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Stack>
  );
}
export default ManagerHeader;
