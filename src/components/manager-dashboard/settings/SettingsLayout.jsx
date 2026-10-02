import { useState } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PersonIcon from "@mui/icons-material/Person";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import StoreInfoSettings from "./StoreInfoSettings";
import UserProfileSettings from "./UserProfileSettings";
import CashierManagement from "./CashierManagement";

function CustomTabPanel({ children, value, index, ...other }) {
  return <div role="tabpanel" hidden={value !== index} id={`settings-tabpanel-${index}`} aria-labelledby={`settings-tab-${index}`} {...other}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>;
}
function SettingsLayout() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);
  return <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1000, mx: "auto" }}><Box sx={{ mb: 3 }}><Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 0.2, color: "text.primary", textAlign: "start" }}>{t("managerSettingsTitle")}</Typography><Typography variant="subtitle1" sx={{ color: "text.secondary", fontWeight: 600, textAlign: "start" }}>{t("managerSettingsHint")}</Typography></Box><Paper variant="outlined" sx={{ borderRadius: "16px", p: { xs: 2, sm: 3 }, borderColor: "divider" }}><Box sx={{ borderBottom: 1, borderColor: "divider" }}><Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} aria-label={t("managerSettingsTitle")} textColor="primary" indicatorColor="primary" variant="scrollable" scrollButtons="auto"><Tab icon={<StorefrontIcon />} iconPosition="start" label={t("managerStoreTab")} sx={{ fontWeight: 700, minHeight: 48 }} /><Tab icon={<PersonIcon />} iconPosition="start" label={t("managerProfileTab")} sx={{ fontWeight: 700, minHeight: 48 }} /><Tab icon={<PeopleAltIcon />} iconPosition="start" label={t("managerCashiersTab")} sx={{ fontWeight: 700, minHeight: 48 }} /></Tabs></Box><CustomTabPanel value={activeTab} index={0}><StoreInfoSettings /></CustomTabPanel><CustomTabPanel value={activeTab} index={1}><UserProfileSettings /></CustomTabPanel><CustomTabPanel value={activeTab} index={2}><CashierManagement /></CustomTabPanel></Paper></Box>;
}
export default SettingsLayout;
