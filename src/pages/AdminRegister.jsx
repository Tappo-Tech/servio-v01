import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Box, Card, CardContent, Typography, TextField, Button, Grid, InputAdornment, IconButton, MenuItem, Alert, Divider, Link, Avatar } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import ReceiptIcon from "@mui/icons-material/Receipt";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import supabase from "../supabase";
import { slugifyName, withSlugSuffix } from "../utils/slug";

const CURRENCIES = [{ value: "SAR", label: "ر.س (ريال سعودي)" }, { value: "AED", label: "د.إ (درهم إماراتي)" }, { value: "USD", label: "$ (دولار أمريكي)" }];

function AdminRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ full_name: "", email: "", password: "", phone: "", store_name: "", store_slug: "", currency: "SAR", tax_number: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSlugLocked, setIsSlugLocked] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleChange = (e) => { const { name, value } = e.target; setFormData((prev) => { const next = { ...prev, [name]: value }; if (name === "store_name" && isSlugLocked) next.store_slug = slugifyName(value); return next; }); };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.store_name || !formData.store_slug || !formData.full_name) return setErrorMsg("يرجى ملء كافة الحقول الإلزامية");
    setLoading(true); setErrorMsg("");
    let slug = formData.store_slug; let tenantId = null; let tenantError = null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const result = await supabase.rpc("create_tenant_for_registration", { p_name: formData.store_name, p_slug: slug, p_phone: formData.phone || null, p_email: formData.email.trim().toLowerCase(), p_tax_number: formData.tax_number || null, p_currency: formData.currency || "SAR" });
      tenantId = result.data; tenantError = result.error;
      const duplicate = tenantError && (tenantError.code === "23505" || String(tenantError.message).includes("duplicate"));
      if (!duplicate || !isSlugLocked) break;
      slug = withSlugSuffix(formData.store_slug); // auto-generated slug already taken: try a variant
    }
    if (tenantError) { setLoading(false); return setErrorMsg(String(tenantError.message).includes("duplicate") ? "الـ slug مستخدم بالفعل" : tenantError.message); }
    const { data, error } = await supabase.auth.signUp({ email: formData.email.trim().toLowerCase(), password: formData.password, options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: { tenant_id: tenantId, full_name: formData.full_name, role: "admin" } } });
    if (error) setErrorMsg(error.message.includes("already registered") ? "هذا البريد مسجل بالفعل" : error.message);
    else if (data.session) navigate("/manager");
    else setEmailSent(true);
    setLoading(false);
  };
  const resendConfirmation = async () => {
    setLoading(true); setResendMessage("");
    const { error } = await supabase.auth.resend({ type: "signup", email: formData.email.trim().toLowerCase(), options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    setResendMessage(error ? error.message : "تمت إعادة إرسال رابط التفعيل إلى بريدك الإلكتروني.");
    setLoading(false);
  };
  if (emailSent) return <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default", p: 2 }}><Card elevation={4} sx={{ maxWidth: 480, width: "100%", borderRadius: 3 }}><CardContent sx={{ p: { xs: 3, sm: 5 }, textAlign: "center" }}><Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", mx: "auto", mb: 2 }}><EmailIcon fontSize="large" /></Avatar><Typography variant="h5" fontWeight={800} mb={1}>تحقق من بريدك الإلكتروني</Typography><Typography color="text.secondary" sx={{ lineHeight: 1.9 }}>أرسلنا رابط تفعيل إلى:</Typography><Typography fontWeight={800} sx={{ direction: "ltr", my: 1 }}>{formData.email}</Typography><Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, mb: 3 }}>افتح الرسالة واضغط رابط التفعيل، ثم عد إلى صفحة تسجيل الدخول. افحص مجلد الرسائل غير المرغوبة إذا لم تجد الرسالة.</Typography>{resendMessage && <Alert severity={resendMessage.startsWith("تم") ? "success" : "error"} sx={{ mb: 2, textAlign: "right" }}>{resendMessage}</Alert>}<Button fullWidth variant="contained" onClick={resendConfirmation} disabled={loading} sx={{ mb: 1.5 }}>{loading ? "جاري الإرسال..." : "إعادة إرسال رابط التفعيل"}</Button><Button fullWidth variant="text" onClick={() => navigate("/login")}>العودة إلى تسجيل الدخول</Button></CardContent></Card></Box>;
  return <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: "background.default", p: 2 }}><Box textAlign="center" mb={3}><Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main", mx: "auto", mb: 1 }}><LocalCafeIcon fontSize="large" sx={{ color: "#fff" }} /></Avatar><Typography variant="h4" fontWeight={800} color="primary" letterSpacing={1}>TAPPO</Typography><Typography variant="body2" color="text.secondary">انضم لـ TAPPO وابدأ بإدارة كافيهك بذكاء</Typography></Box><Card elevation={4} sx={{ maxWidth: 750, width: "100%", borderRadius: 3, p: { xs: 1, sm: 2 } }}><CardContent><Typography variant="h5" fontWeight={700} textAlign="center" mb={3}>إنشاء حساب نشاط جديد</Typography>{errorMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{errorMsg}</Alert>}<Box component="form" onSubmit={handleSubmit}><Grid container spacing={2}><Grid size={{ xs: 12 }}><Typography variant="subtitle2" color="primary" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}><StorefrontIcon fontSize="small" /> بيانات المتجر / الكافيه</Typography></Grid><Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth size="small" label="اسم الكافيه أو المتجر" name="store_name" value={formData.store_name} onChange={handleChange} required /></Grid><Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth size="small" label="اسم الامتداد (Slug)" name="store_slug" value={formData.store_slug} onChange={handleChange} disabled={isSlugLocked} required InputProps={{ endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setIsSlugLocked(!isSlugLocked)}>{isSlugLocked ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" color="primary" />}</IconButton></InputAdornment> }} /></Grid><Grid size={{ xs: 12, sm: 6 }}><TextField select fullWidth size="small" label="العملة الأساسية" name="currency" value={formData.currency} onChange={handleChange}>{CURRENCIES.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</TextField></Grid><Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth size="small" label="الرقم الضريبي (اختياري)" name="tax_number" value={formData.tax_number} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start"><ReceiptIcon fontSize="small" /></InputAdornment> }} /></Grid><Grid size={{ xs: 12 }}><Divider sx={{ my: 1 }} /></Grid><Grid size={{ xs: 12 }}><Typography variant="subtitle2" color="primary" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}><PersonIcon fontSize="small" /> بيانات مالك الحساب (المدير)</Typography></Grid><Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth size="small" label="الاسم بالكامل" name="full_name" value={formData.full_name} onChange={handleChange} required InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" /></InputAdornment> }} /></Grid><Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth size="small" label="رقم الهاتف" name="phone" value={formData.phone} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment> }} /></Grid><Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth size="small" type="email" label="البريد الإلكتروني" name="email" value={formData.email} onChange={handleChange} required InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" /></InputAdornment> }} /></Grid><Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth size="small" type={showPassword ? "text" : "password"} label="كلمة المرور" name="password" value={formData.password} onChange={handleChange} required InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" /></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} /></Grid><Grid size={{ xs: 12 }}><Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ py: 1.2, fontWeight: 700, borderRadius: 2 }}>{loading ? "جاري إنشاء الحساب..." : "تسجيل الحساب وتفعيل المتجر"}</Button></Grid></Grid><Box textAlign="center" mt={3}><Typography variant="body2" color="text.secondary">لديك حساب بالفعل؟ <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 700, color: "primary.main" }}>تسجيل الدخول</Link></Typography></Box></Box></CardContent></Card></Box>;
}
export default AdminRegister;
