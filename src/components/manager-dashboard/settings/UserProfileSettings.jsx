// إعدادات الملف الشخصي للمدير مع حفظ فعلي في Supabase Auth والملف المرتبط.
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import SaveIcon from "@mui/icons-material/Save";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LockIcon from "@mui/icons-material/Lock";
import { useUser } from "../../../context/UserContext";
import { useLanguage } from "../../../context/LanguageContext";

function UserProfileSettings() {
  const { t } = useLanguage();
  const { user, updateUser } = useUser();
  const isCashier = user?.role === "cashier";
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (!user) return;
    setFormData((previous) => ({
      ...previous,
      full_name: user.full_name || user.name || "",
      email: user.email || "",
      phone: user.phone || "",
    }));
  }, [user]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving || isCashier) return;
    if (formData.new_password && formData.new_password !== formData.confirm_password) {
      setToast({ open: true, message: t("managerPasswordMismatch"), severity: "error" });
      return;
    }
    if (formData.new_password && formData.new_password.length < 6) {
      setToast({ open: true, message: t("managerPasswordTooShort"), severity: "error" });
      return;
    }
    if ((formData.new_password || formData.email.trim().toLowerCase() !== user?.email?.toLowerCase()) && !formData.current_password) {
      setToast({ open: true, message: t("managerCurrentPasswordRequired"), severity: "error" });
      return;
    }

    setSaving(true);
    try {
      const result = await updateUser({ ...formData, email: formData.email.trim() });
      if (result?.error) {
        setToast({ open: true, message: result.error.message || t("genericLoginError"), severity: "error" });
        return;
      }
      setToast({
        open: true,
        message: result?.needsEmailConfirmation ? t("managerEmailConfirmation") : t("managerSaved"),
        severity: "success",
      });
      setFormData((previous) => ({ ...previous, current_password: "", new_password: "", confirm_password: "" }));
    } catch (error) {
      setToast({ open: true, message: error?.message || t("genericLoginError"), severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const passwordAdornment = (visible, toggle) => (
    <InputAdornment position="end">
      <IconButton onClick={toggle} edge="end" size="small" aria-label={visible ? t("hidePassword") : t("showPassword")}>
        {visible ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, mx: "auto", p: 1 }}>
      {isCashier && <Alert severity="info" sx={{ mb: 2 }}>{t("managerCashierProfileHint")}</Alert>}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label={t("managerFullName")} name="full_name" value={formData.full_name} onChange={handleInputChange} disabled={isCashier || saving} required size="small" helperText={isCashier ? t("managerManagerOnly") : ""} InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" /></InputAdornment> }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label={t("email")} name="email" type="email" value={formData.email} onChange={handleInputChange} disabled={isCashier || saving} required size="small" InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" /></InputAdornment> }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label={t("managerPhone")} name="phone" value={formData.phone} onChange={handleInputChange} disabled={isCashier || saving} size="small" InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment> }} />
        </Grid>

        {!isCashier && <>
          <Grid size={{ xs: 12 }}><Alert severity="info">{t("managerSensitiveChangeHint")}</Alert></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth type={showCurrentPassword ? "text" : "password"} label={t("managerCurrentPassword")} name="current_password" value={formData.current_password} onChange={handleInputChange} disabled={saving} size="small" InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" /></InputAdornment>, endAdornment: passwordAdornment(showCurrentPassword, () => setShowCurrentPassword((value) => !value)) }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth type={showNewPassword ? "text" : "password"} label={t("managerNewPassword")} name="new_password" value={formData.new_password} onChange={handleInputChange} disabled={saving} size="small" inputProps={{ minLength: 6, autoComplete: "new-password" }} InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" /></InputAdornment>, endAdornment: passwordAdornment(showNewPassword, () => setShowNewPassword((value) => !value)) }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth type={showNewPassword ? "text" : "password"} label={t("managerConfirmPassword")} name="confirm_password" value={formData.confirm_password} onChange={handleInputChange} disabled={saving} size="small" inputProps={{ autoComplete: "new-password" }} InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" /></InputAdornment> }} />
          </Grid>
        </>}

        {!isCashier && <Grid size={{ xs: 12 }} sx={{ display: "flex", justifyContent: { xs: "stretch", sm: "flex-end" }, mt: 1 }}>
          <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving} fullWidth={{ xs: true, sm: false }} sx={{ px: 4, py: 1, borderRadius: "8px", fontWeight: 700 }}>
            {saving ? t("managerSaving") : t("managerSave")}
          </Button>
        </Grid>}
      </Grid>
      <Snackbar open={toast.open} autoHideDuration={5000} onClose={() => setToast((previous) => ({ ...previous, open: false }))}>
        <Alert severity={toast.severity} variant="filled" sx={{ width: "100%" }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default UserProfileSettings;
