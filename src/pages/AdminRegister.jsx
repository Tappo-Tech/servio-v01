import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Card, CardContent, Divider, Grid, IconButton, InputAdornment, MenuItem, Stack, TextField, Typography } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import LanguageToggle from "../components/LanguageToggle";
import { useLanguage } from "../context/LanguageContext";
import supabase from "../supabase";
import { slugifyName, withSlugSuffix } from "../utils/slug";

const CURRENCIES = [
  { value: "SAR", labelKey: "currencySar" },
  { value: "AED", labelKey: "currencyAed" },
  { value: "USD", labelKey: "currencyUsd" },
];

const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: 2.2, bgcolor: "rgba(248,249,250,.72)" } };

function RegisterFooter({ t }) {
  return <Stack alignItems="center" spacing={1.2} sx={{ mt: 3 }}>
    <Typography variant="body2" color="text.secondary">{t("haveAccount")} <Box component={RouterLink} to="/login" sx={{ color: "primary.main", fontWeight: 900, textDecoration: "none" }}>{t("homeLogin")}</Box></Typography>
  </Stack>;
}

function BrandPanel({ t, arabic }) {
  return <Box sx={{ display: { xs: "none", md: "flex" }, position: "relative", minHeight: 650, borderRadius: 4, overflow: "hidden", p: 5, color: "#fff", background: "linear-gradient(145deg,#171A2F 0%,#252A4B 64%,#D96210 150%)" }}>
    <Box sx={{ position: "absolute", width: 480, height: 480, borderRadius: "50%", top: -240, insetInlineEnd: -180, border: "1px solid rgba(255,255,255,.13)", boxShadow: "0 0 0 70px rgba(255,255,255,.025), 0 0 0 140px rgba(255,255,255,.02)" }} />
    <Stack justifyContent="space-between" sx={{ position: "relative", zIndex: 1, width: "100%" }}>
      <Box><Stack direction="row" alignItems="center" spacing={1.2}><Box component="img" src="/logo-icon.webp" alt="SERVIO" sx={{ width: 52, height: 52, objectFit: "contain" }} /><Typography sx={{ fontWeight: 1000, fontSize: "1.5rem", letterSpacing: "-.06em" }}>SERVIO</Typography></Stack><Typography sx={{ mt: 7, color: "primary.light", fontWeight: 900, letterSpacing: ".08em", fontSize: ".78rem" }}>{arabic ? "ابدأ من هنا" : "START HERE"}</Typography><Typography sx={{ mt: 1.5, fontSize: { md: "3rem", lg: "3.7rem" }, lineHeight: 1.02, fontWeight: 1000, letterSpacing: "-.07em", maxWidth: 470 }}>{arabic ? "مكانك يستحق تشغيلًا أوضح." : "Your venue deserves clearer operations."}</Typography><Typography sx={{ mt: 2.5, color: "rgba(255,255,255,.7)", lineHeight: 1.9, maxWidth: 430 }}>{t("registerIntro")}</Typography></Box>
      <Stack spacing={1.4}>{[t("homeBenefits1"), t("homeBenefits2"), t("homeBenefits3")].map((item) => <Stack direction="row" spacing={1} alignItems="center" key={item}><Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main" }} /><Typography variant="body2" sx={{ color: "rgba(255,255,255,.76)", fontWeight: 750 }}>{item}</Typography></Stack>)}</Stack>
    </Stack>
  </Box>;
}

export default function AdminRegister() {
  const { t, language } = useLanguage();
  const arabic = language !== "en";
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ full_name: "", email: "", password: "", phone: "", store_name: "", store_slug: "", currency: "SAR" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSlugLocked, setIsSlugLocked] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => {
      const next = { ...previous, [name]: value };
      if (name === "store_name" && isSlugLocked) next.store_slug = slugifyName(value);
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.email || !formData.password || !formData.store_name || !formData.store_slug || !formData.full_name) { setErrorMsg(t("required")); return; }
    setLoading(true); setErrorMsg("");
    let slug = formData.store_slug; let tenantId = null; let tenantError = null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const result = await supabase.rpc("create_tenant_for_registration", { p_name: formData.store_name, p_slug: slug, p_phone: formData.phone || null, p_email: formData.email.trim().toLowerCase(), p_currency: formData.currency || "SAR" });
      tenantId = result.data; tenantError = result.error;
      const duplicate = tenantError && (tenantError.code === "23505" || String(tenantError.message).includes("duplicate"));
      if (!duplicate || !isSlugLocked) break;
      slug = withSlugSuffix(formData.store_slug);
    }
    if (tenantError) { setLoading(false); setErrorMsg(String(tenantError.message).includes("duplicate") ? t("slugName") : tenantError.message); return; }
    const { data, error } = await supabase.auth.signUp({ email: formData.email.trim().toLowerCase(), password: formData.password, options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: { tenant_id: tenantId, full_name: formData.full_name, role: "admin" } } });
    if (error) setErrorMsg(error.message.includes("already registered") ? t("emailAlready") : error.message);
    else if (data.session) navigate("/manager");
    else setEmailSent(true);
    setLoading(false);
  };

  const resendConfirmation = async () => {
    setLoading(true); setResendMessage("");
    const { error } = await supabase.auth.resend({ type: "signup", email: formData.email.trim().toLowerCase(), options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    setResendMessage(error ? error.message : t("resendDone")); setLoading(false);
  };

  if (emailSent) return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: { xs: 2, md: 4 }, bgcolor: "#F8F7F4" }}><Card elevation={0} sx={{ maxWidth: 500, width: "100%", borderRadius: 4, border: "1px solid rgba(23,26,47,.08)", boxShadow: "0 24px 80px rgba(23,26,47,.1)" }}><CardContent sx={{ p: { xs: 3, sm: 5 }, textAlign: "center" }}><Box component="img" src="/logo-icon.webp" alt="SERVIO" sx={{ width: 76, height: 76, objectFit: "contain", mb: 1 }} /><Typography sx={{ fontWeight: 1000, fontSize: "1.5rem", letterSpacing: "-.06em", mb: 3 }}>SERVIO</Typography><Typography variant="h5" fontWeight={950} mb={1}>{t("verifyEmail")}</Typography><Typography color="text.secondary" sx={{ lineHeight: 1.9 }}>{t("sentActivation")}</Typography><Typography fontWeight={900} sx={{ direction: "ltr", my: 1 }}>{formData.email}</Typography><Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, mb: 3 }}>{t("activationHelp")}</Typography>{resendMessage && <Alert severity={resendMessage.startsWith("تم") ? "success" : "error"} sx={{ mb: 2, textAlign: "right" }}>{resendMessage}</Alert>}<Button fullWidth variant="contained" onClick={resendConfirmation} disabled={loading} sx={{ py: 1.35, borderRadius: 2.3 }}>{loading ? t("loading") : t("resend")}</Button><Button fullWidth variant="text" onClick={() => navigate("/login")} sx={{ mt: 1 }}>{t("backToLogin")}</Button><LanguageToggle /></CardContent></Card></Box>;

  return <Box sx={{ minHeight: "100vh", p: { xs: 1.5, md: 4 }, bgcolor: "#F8F7F4", background: "radial-gradient(circle at 85% 0%, rgba(244,121,32,.11), transparent 28%)" }}>
    <Box sx={{ maxWidth: 1120, mx: "auto" }}>
      <Box sx={{ position: "relative", mb: { xs: 3, md: 5 }, minHeight: 44 }}><Stack direction="row" justifyContent="space-between" alignItems="center"><Stack direction="row" alignItems="center" spacing={1}><Box component="img" src="/logo-icon.webp" alt="SERVIO" sx={{ width: 43, height: 43, objectFit: "contain" }} /><Typography sx={{ fontWeight: 1000, fontSize: "1.3rem", letterSpacing: "-.06em" }}>SERVIO</Typography></Stack><Button component={RouterLink} to="/login" variant="text" sx={{ fontWeight: 850, pr: { xs: arabic ? 5 : 0, sm: arabic ? 6 : 0 }, pl: { xs: arabic ? 0 : 5, sm: arabic ? 0 : 6 } }}>{t("homeLogin")}</Button></Stack><Box sx={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: arabic ? 0 : "auto", right: arabic ? "auto" : 0 }}><LanguageToggle /></Box></Box>
      <Grid container spacing={{ xs: 3, md: 6 }} alignItems="stretch"><Grid size={{ xs: 12, md: 5 }}><BrandPanel t={t} arabic={arabic} /></Grid><Grid size={{ xs: 12, md: 7 }}><Card elevation={0} sx={{ height: "100%", borderRadius: 4, border: "1px solid rgba(23,26,47,.08)", bgcolor: "rgba(255,255,255,.9)", boxShadow: "0 24px 80px rgba(23,26,47,.08)" }}><CardContent sx={{ p: { xs: 2, sm: 4, md: 5 } }}><Typography variant="h4" sx={{ fontWeight: 1000, letterSpacing: "-.055em" }}>{t("createBusiness")}</Typography><Typography color="text.secondary" sx={{ mt: .8, mb: 3, lineHeight: 1.8 }}>{arabic ? "أنشئ مساحة نشاطك خلال دقائق، ثم أضف المنيو والطاولات والكاشير." : "Create your workspace in minutes, then add your menu, tables, and cashiers."}</Typography>{errorMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{errorMsg}</Alert>}<Box component="form" onSubmit={handleSubmit}><Stack spacing={2.2}><Typography variant="subtitle2" sx={{ display: "flex", gap: 1, alignItems: "center", color: "primary.main", fontWeight: 950 }}><StorefrontRoundedIcon fontSize="small" />{t("storeData")}</Typography><Grid container spacing={1.7}><Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t("cafeName")} name="store_name" value={formData.store_name} onChange={handleChange} required sx={fieldSx} /></Grid><Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t("slugName")} name="store_slug" value={formData.store_slug} onChange={handleChange} disabled={isSlugLocked} required sx={fieldSx} InputProps={{ endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setIsSlugLocked((value) => !value)}>{isSlugLocked ? <LockRoundedIcon fontSize="small" /> : <LockOpenRoundedIcon fontSize="small" color="primary" />}</IconButton></InputAdornment> }} /></Grid><Grid size={{ xs: 12, sm: 6 }}><TextField select fullWidth label={t("currency")} name="currency" value={formData.currency} onChange={handleChange} sx={fieldSx}>{CURRENCIES.map((option) => <MenuItem key={option.value} value={option.value}>{t(option.labelKey)}</MenuItem>)}</TextField></Grid></Grid><Divider /><Typography variant="subtitle2" sx={{ display: "flex", gap: 1, alignItems: "center", color: "primary.main", fontWeight: 950 }}><PersonRoundedIcon fontSize="small" />{t("ownerData")}</Typography><Grid container spacing={1.7}><Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t("fullName")} name="full_name" value={formData.full_name} onChange={handleChange} required sx={fieldSx} /></Grid><Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t("phone")} name="phone" value={formData.phone} onChange={handleChange} sx={fieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><PhoneRoundedIcon fontSize="small" /></InputAdornment> }} /></Grid><Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth type="email" label={t("email")} name="email" value={formData.email} onChange={handleChange} required sx={fieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><EmailRoundedIcon fontSize="small" /></InputAdornment> }} /></Grid><Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth type={showPassword ? "text" : "password"} label={t("password")} name="password" value={formData.password} onChange={handleChange} required sx={fieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><LockRoundedIcon fontSize="small" /></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword((value) => !value)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} /></Grid></Grid><Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ py: 1.5, borderRadius: 2.4, fontWeight: 950 }}>{loading ? t("loading") : t("registerSubmit")}</Button></Stack></Box><RegisterFooter t={t} /></CardContent></Card></Grid></Grid>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 3 }}>{t("homeFooterText")}</Typography>
    </Box>
  </Box>;
}
