import { useState, useEffect } from "react";

// MUI COMPONENTS
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";

// MUI ICONS
import SaveIcon from "@mui/icons-material/Save";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LockIcon from "@mui/icons-material/Lock";

// CONTEXT
import { useUser } from "../../../context/UserContext";
import { useLanguage } from "../../../context/LanguageContext";

function UserProfileSettings() {
  const { t } = useLanguage();
  const { user, updateUser } = useUser();

  // استخدام Snake Case لتوحيد الحقول مع Supabase Auth & DB
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
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  // مزامنة حالة النموذج عند تحميل بيانات المستخدم من الـ Context
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        full_name: user.full_name || user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  const isCashier = user?.role === "cashier";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // التحقق من تطابق كلمة المرور الجديدة
    if (formData.new_password && formData.new_password !== formData.confirm_password) {
      setToast({ open: true, message: t("managerPasswordMismatch"), severity: "error" });
      return;
    }

    if (formData.new_password && !formData.current_password) {
      setToast({ open: true, message: t("managerCurrentPasswordRequired"), severity: "error" });
      return;
    }

    // تحديث البيانات الأساسية (للمدير فقط)
    if (!isCashier) {
      updateUser({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
      });
    }

    setToast({ open: true, message: t("managerSaved"), severity: "success" });

    // إعادة إعداد حقول كلمات المرور
    setFormData((prev) => ({
      ...prev,
      current_password: "",
      new_password: "",
      confirm_password: "",
    }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, mx: "auto", p: 1 }}>
      <Grid container spacing={2.5}>
        {/* Full Name */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={t("managerFullName")}
            name="full_name"
            value={formData.full_name}
            onChange={handleInputChange}
            disabled={isCashier}
            required
            size="small"
            helperText={isCashier ? t("managerManagerOnly") : ""}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Email */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={t("email")}
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isCashier}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Phone */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={t("managerPhone")}
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            disabled={isCashier}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Current Password */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type={showCurrentPassword ? "text" : "password"}
            label={t("managerCurrentPassword")}
            name="current_password"
            value={formData.current_password}
            onChange={handleInputChange}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    edge="end"
                    size="small"
                  >
                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* New Password */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type={showNewPassword ? "text" : "password"}
            label={t("managerNewPassword")}
            name="new_password"
            value={formData.new_password}
            onChange={handleInputChange}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Confirm New Password */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type={showNewPassword ? "text" : "password"}
            label={t("managerConfirmPassword")}
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleInputChange}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    edge="end"
                    size="small"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Save Button */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            justifyContent: { xs: "stretch", sm: "flex-end" },
            mt: 1,
          }}
        >
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            fullWidth={{ xs: true, sm: false }}
            sx={{ px: 4, py: 1, borderRadius: "8px", fontWeight: 700 }}
          >
            {t("managerSave")}
          </Button>
        </Grid>
      </Grid>

      {/* Snackbar Alert */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={toast.severity} variant="filled" sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default UserProfileSettings;