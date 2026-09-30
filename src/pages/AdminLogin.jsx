import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { Box, Card, CardContent, Typography, TextField, Button, Grid, Tabs, Tab, InputAdornment, IconButton, Paper, Alert, Link, Avatar } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import BackspaceIcon from "@mui/icons-material/Backspace";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import supabase from "../supabase";

const authErrorMessage = (message) => {
  const normalized = String(message || "").toLowerCase();
  if (normalized.includes("email not confirmed") || normalized.includes("email_not_confirmed")) return "يرجى تأكيد بريدك الإلكتروني من الرسالة المرسلة إليك قبل تسجيل الدخول.";
  if (normalized.includes("invalid login credentials")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  return message || "تعذر تسجيل الدخول.";
};

function AdminLogin({ cashierSlug: routeSlug }) {
  const { slug: paramSlug } = useParams();
  const cashierSlug = routeSlug || paramSlug || "";
  const savedCashier = (() => { try { return JSON.parse(localStorage.getItem("tappo_cashier") || "null"); } catch { return null; } })();
  const navigate = useNavigate();
  const [role, setRole] = useState(cashierSlug ? "cashier" : "admin");
  const [adminData, setAdminData] = useState({ email: "", password: "" });
  const [cashierData, setCashierData] = useState({ slug: cashierSlug || savedCashier?.slug || "", username: savedCashier?.username || "" });
  const [pin, setPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);

  const handleAdminSubmit = async (e) => {
    e.preventDefault(); setErrorMsg(""); setSuccessMsg(""); setCanResend(false);
    if (!adminData.email || !adminData.password) return setErrorMsg("يرجى إدخال البريد الإلكتروني وكلمة المرور");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: adminData.email.trim().toLowerCase(), password: adminData.password });
    if (error) { setErrorMsg(authErrorMessage(error.message)); setCanResend(String(error.message).toLowerCase().includes("confirm")); }
    else {
      const { error: profileError } = await supabase.rpc("ensure_profile_for_current_user");
      if (profileError) setErrorMsg("تم تسجيل الدخول، لكن ملف النشاط غير مكتمل. أعد التسجيل أو تواصل مع الدعم.");
      else if (data.session) navigate("/manager");
    }
    setLoading(false);
  };

  const resendConfirmation = async () => {
    setLoading(true); setErrorMsg("");
    const { error } = await supabase.auth.resend({ type: "signup", email: adminData.email.trim().toLowerCase(), options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    if (error) setErrorMsg(authErrorMessage(error.message)); else setSuccessMsg("تم إرسال رابط تفعيل جديد. افتحه ثم ارجع إلى تسجيل الدخول.");
    setLoading(false);
  };

  const handleCashierSubmit = async (e) => {
    e.preventDefault(); setErrorMsg("");
    if (!cashierData.slug || !cashierData.username || pin.length < 4) return setErrorMsg("أدخل اسم المستخدم ورمز PIN صحيح");
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("cashier-login", { body: { slug: cashierData.slug.trim().toLowerCase(), username: cashierData.username.trim().toLowerCase(), pin } });
    if (error || !data?.email || !data?.password) {
      let serverMessage = data?.error;
      if (!serverMessage && error?.context && typeof error.context.json === "function") serverMessage = (await error.context.json().catch(() => null))?.error;
      setErrorMsg(serverMessage || "بيانات الكاشير غير صحيحة");
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
      if (authError) setErrorMsg(authErrorMessage(authError.message));
      else { localStorage.setItem("tappo_cashier", JSON.stringify({ slug: cashierData.slug, username: cashierData.username })); navigate("/dashboard"); }
    }
    setLoading(false);
  };

  const keypad = (value) => pin.length < 6 && setPin((prev) => prev + value);
  return <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: "background.default", background: "radial-gradient(circle at 15% 15%, rgba(244,121,32,.11), transparent 28%), linear-gradient(180deg,#fafbfc,#f3f5f7)", p: { xs: 1.5, sm: 2 } }}><Box textAlign="center" mb={3}><Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main", mx: "auto", mb: 1 }}><LocalCafeIcon fontSize="large" sx={{ color: "#fff" }} /></Avatar><Typography variant="h4" fontWeight={800} color="primary" letterSpacing={1}>TAPPO</Typography><Typography variant="body2" color="text.secondary">منظومة إدارة الكافيهات والمطاعم الذكية</Typography></Box><Card elevation={4} sx={{ maxWidth: 420, width: "100%", borderRadius: 3, overflow: "hidden" }}><Tabs value={role} onChange={(_, value) => { setRole(value); setErrorMsg(""); setSuccessMsg(""); }} variant="fullWidth"><Tab value="admin" label="المدير" icon={<AdminPanelSettingsIcon />} iconPosition="start" sx={{ fontWeight: 700 }} /><Tab value="cashier" label="الكاشير" icon={<PointOfSaleIcon />} iconPosition="start" sx={{ fontWeight: 700 }} /></Tabs><CardContent sx={{ p: 3 }}>{errorMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{errorMsg}</Alert>}{successMsg && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{successMsg}</Alert>}{role === "admin" ? <Box component="form" onSubmit={handleAdminSubmit}><Typography variant="h6" fontWeight={700} textAlign="center" mb={2}>تسجيل دخول الإدارة</Typography><TextField fullWidth size="small" type="email" label="البريد الإلكتروني" value={adminData.email} onChange={(e) => setAdminData({ ...adminData, email: e.target.value })} sx={{ mb: 2 }} InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" /></InputAdornment> }} /><TextField fullWidth size="small" type={showPassword ? "text" : "password"} label="كلمة المرور" value={adminData.password} onChange={(e) => setAdminData({ ...adminData, password: e.target.value })} sx={{ mb: 2 }} InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" /></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} /><Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ py: 1.2, fontWeight: 700, borderRadius: 2 }}>{loading ? "جاري الدخول..." : "دخول النظام"}</Button>{canResend && <Button fullWidth variant="text" onClick={resendConfirmation} disabled={loading} sx={{ mt: 1 }}>إعادة إرسال رابط التفعيل</Button>}<Box textAlign="center" mt={2.5}><Typography variant="body2" color="text.secondary">ليس لديك حساب؟ <Link component={RouterLink} to="/register" underline="hover" sx={{ fontWeight: 700, color: "primary.main" }}>إنشاء حساب جديد</Link></Typography></Box></Box> : <Box component="form" onSubmit={handleCashierSubmit}><Typography variant="h6" fontWeight={700} textAlign="center" mb={2}>دخول نقطة البيع</Typography><TextField fullWidth size="small" label="Slug الكافيه" value={cashierData.slug} disabled={Boolean(cashierSlug)} onChange={(e) => setCashierData({ ...cashierData, slug: e.target.value.toLowerCase() })} helperText={cashierSlug ? "تم تحديد الكافيه من رابط صفحة الكاشير" : "يمكن حفظه في رابط خاص مثل /cashier/hanna-cafe"} sx={{ mb: 1.5 }} /><TextField fullWidth size="small" label="اسم المستخدم" value={cashierData.username} onChange={(e) => setCashierData({ ...cashierData, username: e.target.value.toLowerCase() })} sx={{ mb: 2 }} /><Paper variant="outlined" sx={{ py: 1.5, mb: 2.5, textAlign: "center", letterSpacing: 8, fontSize: "1.5rem", fontWeight: 700, minHeight: 56 }}>{pin ? pin.split("").map((_, index) => <span key={index}>●</span>) : <Typography variant="body2" color="text.disabled">رمز PIN</Typography>}</Paper><Grid container spacing={1} sx={{ maxWidth: 300, mx: "auto" }}>{["1","2","3","4","5","6","7","8","9"].map((num) => <Grid size={{ xs: 4 }} key={num}><Button fullWidth variant="outlined" size="large" onClick={() => keypad(num)} sx={{ fontSize: "1.25rem", fontWeight: 700, py: 1.5, borderRadius: 2 }}>{num}</Button></Grid>)}<Grid size={{ xs: 4 }}><Button fullWidth variant="outlined" color="error" size="large" onClick={() => setPin("")} sx={{ fontWeight: 700, py: 1.5 }}>C</Button></Grid><Grid size={{ xs: 4 }}><Button fullWidth variant="outlined" size="large" onClick={() => keypad("0")} sx={{ fontSize: "1.25rem", fontWeight: 700, py: 1.5 }}>0</Button></Grid><Grid size={{ xs: 4 }}><Button fullWidth variant="outlined" color="warning" size="large" onClick={() => setPin((prev) => prev.slice(0, -1))} sx={{ py: 1.5 }}><BackspaceIcon fontSize="small" /></Button></Grid><Grid size={{ xs: 12 }} sx={{ mt: 1 }}><Button type="submit" variant="contained" fullWidth size="large" disabled={loading || pin.length < 4} sx={{ py: 1.2, fontWeight: 700 }}>{loading ? "جاري التحقق..." : "تأكيد الدخول"}</Button></Grid></Grid></Box>}</CardContent></Card></Box>;
}
export default AdminLogin;
