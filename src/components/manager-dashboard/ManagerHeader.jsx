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
function stringAvatar(name) { if (!name) return { children: "M" }; const parts = name.trim().split(" "); return { children: (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0]).toUpperCase() }; }
function ManagerHeader({ onDrawerToggle }) {
  const { storeInfo } = useStore(); const { user } = useUser(); const navigate = useNavigate(); const userName = user?.name || "Manager";
  return <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", direction: "rtl", py: 1.5, px: { xs: 1, sm: 2 } }}><Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}><IconButton aria-label="فتح القائمة" edge="start" onClick={onDrawerToggle} sx={{ display: { md: "none" }, color: "text.primary" }}><MenuIcon /></IconButton><Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>{storeInfo?.store_name || "المتجر"}</Typography></Box><Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}><Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", display: { xs: "none", sm: "block" } }}>{userName}</Typography><Avatar {...stringAvatar(userName)} sx={{ width: 38, height: 38, fontSize: "0.9rem", fontWeight: 700, bgcolor: "#ff602e", color: "#ffffff" }} /><Tooltip title="تسجيل الخروج"><IconButton aria-label="تسجيل الخروج" onClick={() => logout(navigate)} sx={{ color: "text.secondary", border: "1px solid", borderColor: "divider" }}><LogoutIcon fontSize="small" /></IconButton></Tooltip></Box></Stack>;
}
export default ManagerHeader;
