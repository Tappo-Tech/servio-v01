import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

// MUI Components
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  InputAdornment,
  IconButton,
  MenuItem,
  Alert,
  Divider,
  Link,
  Avatar,
} from "@mui/material";

// MUI Icons
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

const CURRENCIES = [
  { value: "SAR", label: "ر.س (ريال سعودي)" },
  { value: "AED", label: "د.إ (درهم إماراتي)" },
  { value: "USD", label: "$ (دولار أمريكي)" },
];

const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    // eslint-disable-next-line no-useless-escape
    .replace(/[^\w\-]+/g, "")
    // eslint-disable-next-line no-useless-escape
    .replace(/\-\-+/g, "-");
};

function AdminRegister() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    store_name: "",
    store_slug: "",
    currency: "SAR",
    tax_number: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSlugLocked, setIsSlugLocked] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "store_name" && isSlugLocked) {
        updated.store_slug = generateSlug(value);
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.store_name) {
      setErrorMsg("يرجى ملء كافة الحقول الإلزامية");
      return;
    }
    setErrorMsg("");
    console.log("Registering on TAPPO:", formData);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      {/* شعار الهوية البصرية */}
      <Box textAlign="center" mb={3}>
        <Avatar
          sx={{
            width: 56,
            height: 56,
            bgcolor: "primary.main",
            mx: "auto",
            mb: 1,
            boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <LocalCafeIcon fontSize="large" sx={{ color: "#fff" }} />
        </Avatar>
        <Typography variant="h4" fontWeight={800} color="primary" letterSpacing={1}>
          TAPPO
        </Typography>
        <Typography variant="body2" color="text.secondary">
          انضم لـ TAPPO وابدأ بإدارة كافيهك بذكاء
        </Typography>
      </Box>

      <Card
        elevation={4}
        sx={{
          maxWidth: 750,
          width: "100%",
          borderRadius: 3,
          p: { xs: 1, sm: 2 },
        }}
      >
        <CardContent>
          <Typography
            variant="h5"
            fontWeight={700}
            textAlign="center"
            mb={3}
          >
            إنشاء حساب نشاط جديد
          </Typography>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* قسم بيانات المتجر */}
              <Grid size={{ xs: 12 }}>
                <Typography
                  variant="subtitle2"
                  color="primary"
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <StorefrontIcon fontSize="small" /> بيانات المتجر / الكافيه
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="اسم الكافيه أو المتجر"
                  name="store_name"
                  value={formData.store_name}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="اسم الامتداد (Slug)"
                  name="store_slug"
                  value={formData.store_slug}
                  onChange={handleChange}
                  disabled={isSlugLocked}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setIsSlugLocked(!isSlugLocked)}
                        >
                          {isSlugLocked ? (
                            <LockIcon fontSize="small" />
                          ) : (
                            <LockOpenIcon fontSize="small" color="primary" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="العملة الأساسية"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                >
                  {CURRENCIES.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="الرقم الضريبي (اختياري)"
                  name="tax_number"
                  value={formData.tax_number}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ReceiptIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              {/* قسم بيانات مدير النظام */}
              <Grid size={{ xs: 12 }}>
                <Typography
                  variant="subtitle2"
                  color="primary"
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <PersonIcon fontSize="small" /> بيانات مالك الحساب (المدير)
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="الاسم بالكامل"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="رقم الهاتف"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="email"
                  label="البريد الإلكتروني"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type={showPassword ? "text" : "password"}
                  label="كلمة المرور"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{ py: 1.2, fontWeight: 700, borderRadius: 2 }}
                >
                  تسجيل الحساب وتفعيل المتجر
                </Button>
              </Grid>
            </Grid>

            {/* رابط تسجيل الدخول للمستخدمين المسجلين سابقاً */}
            <Box textAlign="center" mt={3}>
              <Typography variant="body2" color="text.secondary">
                لديك حساب بالفعل؟{" "}
                <Link
                  component={RouterLink}
                  to="/login"
                  underline="hover"
                  sx={{ fontWeight: 700, color: "primary.main" }}
                >
                  تسجيل الدخول
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default AdminRegister;