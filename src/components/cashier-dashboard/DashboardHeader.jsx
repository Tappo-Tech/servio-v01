import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import LanguageToggle from "../LanguageToggle";
import { useLanguage } from "../../context/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useWaiterCalls } from "../../context/WaiterCallsContext";
import { logout } from "../../utils/logout";

function stringAvatar(name) { if (!name) return { children: "C" }; const parts = name.trim().split(" "); return { children: (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0]).toUpperCase() }; }
function DashboardHeader({ handleNotificationOpen }) {
  const { user } = useUser(); const { calls } = useWaiterCalls(); const navigate = useNavigate(); const userName = user?.name || "Cashier"; const { language, t } = useLanguage();
  const currentDate = new Date().toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  return (
    <Box sx={{ width: "100%" }}>
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          gap: 2,
        }}
      >
        <Box sx={{ textAlign: "start", minWidth: 0 }}>
          <Typography
            variant="overline"
            sx={{ color: "primary.main", fontWeight: 900, letterSpacing: 1.2 }}
          >
            {t("liveOperations")}
          </Typography>
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontSize: { xs: "1.2rem", sm: "1.45rem", md: "1.7rem" },
              fontWeight: 900,
              color: "text.primary",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
            }}
          >
            {t("currentOrders")}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: "0.74rem", sm: "0.84rem" },
              fontWeight: 600,
              color: "text.secondary",
              mt: 0.45,
            }}
          >
            {currentDate} · {t("cashierKitchen")}
          </Typography>
        </Box>
        <Stack direction="row" sx={{ alignItems: "center", gap: { xs: 0.65, sm: 0.9 } }}>
          <LanguageToggle compact />
          <IconButton
            onClick={handleNotificationOpen}
            sx={{
              color: "text.secondary",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2.5,
              p: { xs: 1, sm: 1.15 },
              "&:hover": {
                color: "primary.main",
                backgroundColor: "rgba(244,121,32,.06)",
              },
            }}
          >
            <Badge badgeContent={calls.length} color="error">
              <NotificationsIcon sx={{ fontSize: { xs: 19, md: 21 } }} />
            </Badge>
          </IconButton>
          <Avatar
            {...stringAvatar(userName)}
            sx={{
              width: { xs: 38, md: 42 },
              height: { xs: 38, md: 42 },
              fontSize: { xs: "0.875rem", md: "0.95rem" },
              fontWeight: 800,
              backgroundColor: "primary.main",
              color: "primary.contrastText",
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
                },
              }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  );
}
export default DashboardHeader;
