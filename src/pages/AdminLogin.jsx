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
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
  Paper,
  Alert,
  Link,
  Avatar,
} from "@mui/material";

// MUI Icons
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import BackspaceIcon from "@mui/icons-material/Backspace";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LocalCafeIcon from "@mui/icons-material/LocalCafe"; // شعار مؤقت أو يمكنك استبداله بـ img

function AdminLogin() {
  const [role, setRole] = useState("admin"); // 'admin' | 'cashier'

  // Admin State
  const [adminData, setAdminData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  // Cashier PIN State
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleKeypadPress = (val) => {
    if (pin.length < 6) {
      setPin((prev) => prev + val);
    }
  };

  const handleKeypadDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setPin("");
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    if (!adminData.email || !adminData.password) {
      setErrorMsg("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    setErrorMsg("");
    console.log("Admin Login:", adminData);
  };

  const handleCashierSubmit = (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      setErrorMsg("رمز PIN يتكون من 4 أرقام على الأقل");
      return;
    }
    setErrorMsg("");
    console.log("Cashier PIN Login:", pin);
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
      {/* قسم الشعار والاسم الهوية البصرية */}
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
          منظومة إدارة الكافيهات والمطاعم الذكية
        </Typography>
      </Box>

      <Card
        elevation={4}
        sx={{
          maxWidth: 420,
          width: "100%",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Tabs
          value={role}
          onChange={(_, newValue) => {
            setRole(newValue);
            setErrorMsg("");
          }}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            value="admin"
            label="المدير"
            icon={<AdminPanelSettingsIcon />}
            iconPosition="start"
            sx={{ fontWeight: 700 }}
          />
          <Tab
            value="cashier"
            label="الكاشير"
            icon={<PointOfSaleIcon />}
            iconPosition="start"
            sx={{ fontWeight: 700 }}
          />
        </Tabs>

        <CardContent sx={{ p: 3 }}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          {role === "admin" ? (
            /* نموذج دخول المدير */
            <Box component="form" onSubmit={handleAdminSubmit}>
              <Typography variant="h6" fontWeight={700} textAlign="center" mb={2}>
                تسجيل دخول الإدارة
              </Typography>

              <TextField
                fullWidth
                size="small"
                type="email"
                label="البريد الإلكتروني"
                value={adminData.email}
                onChange={(e) =>
                  setAdminData({ ...adminData, email: e.target.value })
                }
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                size="small"
                type={showPassword ? "text" : "password"}
                label="كلمة المرور"
                value={adminData.password}
                onChange={(e) =>
                  setAdminData({ ...adminData, password: e.target.value })
                }
                sx={{ mb: 3 }}
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

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{ py: 1.2, fontWeight: 700, borderRadius: 2 }}
              >
                دخول النظام
              </Button>

              {/* رابط إنشاء حساب جديد */}
              <Box textAlign="center" mt={2.5}>
                <Typography variant="body2" color="text.secondary">
                  ليس لديك حساب؟{" "}
                  <Link
                    component={RouterLink}
                    to="/register"
                    underline="hover"
                    sx={{ fontWeight: 700, color: "primary.main" }}
                  >
                    إنشاء حساب جديد
                  </Link>
                </Typography>
              </Box>
            </Box>
          ) : (
            /* نموذج دخول الكاشير عبر Numpad */
            <Box component="form" onSubmit={handleCashierSubmit}>
              <Typography variant="h6" fontWeight={700} textAlign="center" mb={0.5}>
                دخول نقطة البيع
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                textAlign="center"
                mb={2}
              >
                أدخل رمز PIN الخاص بفرعك
              </Typography>

              {/* شاشة عرض الـ PIN */}
              <Paper
                variant="outlined"
                sx={{
                  py: 1.5,
                  px: 2,
                  mb: 2.5,
                  textAlign: "center",
                  borderRadius: 2,
                  backgroundColor: "action.hover",
                  letterSpacing: 8,
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  minHeight: 56,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {pin.split("").map(() => "●").join("") || (
                  <Typography variant="body2" color="text.disabled">
                    رمز PIN
                  </Typography>
                )}
              </Paper>

              {/* لوحة المفاتيح التفاعلية */}
              <Grid container spacing={1} sx={{ maxWidth: 300, mx: "auto" }}>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                  <Grid size={{ xs: 4 }} key={num}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="large"
                      onClick={() => handleKeypadPress(num)}
                      sx={{
                        fontSize: "1.25rem",
                        fontWeight: 700,
                        py: 1.5,
                        borderRadius: 2,
                        color: "text.primary",
                      }}
                    >
                      {num}
                    </Button>
                  </Grid>
                ))}

                <Grid size={{ xs: 4 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    size="large"
                    onClick={handleKeypadClear}
                    sx={{ fontWeight: 700, py: 1.5, borderRadius: 2 }}
                  >
                    C
                  </Button>
                </Grid>

                <Grid size={{ xs: 4 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={() => handleKeypadPress("0")}
                    sx={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      py: 1.5,
                      borderRadius: 2,
                      color: "text.primary",
                    }}
                  >
                    0
                  </Button>
                </Grid>

                <Grid size={{ xs: 4 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="warning"
                    size="large"
                    onClick={handleKeypadDelete}
                    sx={{ py: 1.5, borderRadius: 2 }}
                  >
                    <BackspaceIcon fontSize="small" />
                  </Button>
                </Grid>

                <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={pin.length < 4}
                    sx={{ py: 1.2, fontWeight: 700, borderRadius: 2 }}
                  >
                    تأكيد الدخول
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default AdminLogin;