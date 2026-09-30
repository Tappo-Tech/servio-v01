import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useWaiterCalls } from "../../context/WaiterCallsContext";
import { logout } from "../../utils/logout";

const currentDate = new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
function stringAvatar(name) { if (!name) return { children: "C" }; const parts = name.trim().split(" "); return { children: (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0]).toUpperCase() }; }
function DashboardHeader({ handleNotificationOpen }) {
  const { user } = useUser(); const { calls } = useWaiterCalls(); const navigate = useNavigate(); const userName = user?.name || "Cashier";
  return <Box sx={{ width: "100%" }}><Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", width: "100%" }}><Box sx={{ textAlign: "start" }}><Typography variant="h5" component="h2" sx={{ fontSize: { xs: "1.2rem", sm: "1.4rem", md: "1.6rem" }, fontWeight: 800, color: "text.primary", letterSpacing: "-0.02em" }}>الطلبات الحالية</Typography><Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.85rem" }, fontWeight: 500, color: "text.secondary", mt: 0.3 }}>{currentDate} | شاشة الكاشير والمطبخ</Typography></Box><Stack direction="row" sx={{ alignItems: "center", gap: 1 }}><IconButton onClick={handleNotificationOpen} sx={{ color: "text.secondary", border: "1px solid", borderColor: "divider", p: { xs: 1, sm: 1.2 } }}><Badge badgeContent={calls.length} color="error"><NotificationsIcon sx={{ fontSize: { xs: 20, md: 22 } }} /></Badge></IconButton><Avatar {...stringAvatar(userName)} sx={{ width: { xs: 38, md: 42 }, height: { xs: 38, md: 42 }, fontSize: { xs: "0.875rem", md: "0.95rem" }, fontWeight: 700, backgroundColor: "primary.main", color: "primary.contrastText", boxShadow: "0px 2px 6px rgba(0,0,0,0.08)" }} /><Tooltip title="تسجيل الخروج"><IconButton aria-label="تسجيل الخروج" onClick={() => logout(navigate)} sx={{ color: "text.secondary", border: "1px solid", borderColor: "divider" }}><LogoutIcon fontSize="small" /></IconButton></Tooltip></Stack></Stack></Box>;
}
export default DashboardHeader;
