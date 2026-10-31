import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
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
import { slugifyName } from "../utils/slug";

const CURRENCIES = [
  { value: "SAR", labelKey: "currencySar" },
  { value: "AED", labelKey: "currencyAed" },
  { value: "USD", labelKey: "currencyUsd" },
];
const fieldSx = {
  mb: 1.65,
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.2,
    bgcolor: "rgba(255,255,255,.72)",
  },
};

function BrandIntro({ t, arabic }) {
  return (
    <Box
      sx={{
        flex: 1,
        display: { xs: "none", md: "flex" },
        minHeight: "100vh",
        p: 6,
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(145deg,#171A2F 0%,#262A49 65%,#D96210 150%)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          width: 520,
          height: 520,
          borderRadius: "50%",
          top: -230,
          insetInlineEnd: -180,
          border: "1px solid rgba(255,255,255,.12)",
          boxShadow:
            "0 0 0 80px rgba(255,255,255,.025), 0 0 0 160px rgba(255,255,255,.02)",
        }}
      />
      <Stack

        sx={{ position: "relative", zIndex: 1, width: "100%" , justifyContent: "space-between"}}
      >
        <Box>
          <Stack direction="row"  spacing={1.2} sx={{ alignItems: "center" }}>
            <Box
              component="img"
              src="/logo-icon.webp"
              alt="SERVIO"
              sx={{ width: 54, height: 54, objectFit: "contain" }}
            />
            <Typography
              sx={{
                fontWeight: 1000,
                fontSize: "1.55rem",
                letterSpacing: "-.06em",
              }}
            >
              SERVIO
            </Typography>
          </Stack>
          <Typography
            sx={{
              mt: 6,
              color: "primary.light",
              fontWeight: 900,
              letterSpacing: ".08em",
              fontSize: ".78rem",
            }}
          >
            {arabic ? "ابدأ من هنا" : "START HERE"}
          </Typography>
          <Typography
            sx={{
              mt: 1.5,
              fontSize: { md: "3.4rem", lg: "4.2rem" },
              lineHeight: 1.02,
              fontWeight: 1000,
              letterSpacing: "-.07em",
              maxWidth: 560,
            }}
          >
            {arabic
              ? "مكانك يستحق تشغيلًا أوضح."
              : "Your venue deserves clearer operations."}
          </Typography>
          <Typography
            sx={{
              mt: 2.5,
              color: "rgba(255,255,255,.68)",
              lineHeight: 1.9,
              maxWidth: 500,
              fontSize: "1.08rem",
            }}
          >
            {t("registerIntro")}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,.5)" }}>
          {t("homeFooterText")}
        </Typography>
      </Stack>
    </Box>
  );
}

function AuthCard({ children }) {
  return (
    <Card
      elevation={0}
      sx={{
        width: "100%",
        maxWidth: 620,
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,.8)",
        bgcolor: "rgba(255,255,255,.88)",
        backdropFilter: "blur(22px)",
        boxShadow: "0 24px 80px rgba(23,26,47,.1)",
      }}
    >
      {children}
    </Card>
  );
}

export default function AdminRegister() {
  const { t, language } = useLanguage();
  const arabic = language !== "en";
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    store_name: "",
    store_slug: "",
    currency: "SAR",
  });
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
      if (name === "store_name" && isSlugLocked)
        next.store_slug = slugifyName(value);
      return next;
    });
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (
      !formData.email ||
      !formData.password ||
      !formData.store_name ||
      !formData.store_slug ||
      !formData.full_name
    ) {
      setErrorMsg(t("required"));
      return;
    }
    setLoading(true);
    setErrorMsg("");
    const { data, error } = await supabase.auth.signUp({
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: formData.full_name,
          store_name: formData.store_name,
          store_slug: formData.store_slug,
          phone: formData.phone,
          currency: formData.currency || "SAR",
          role: "admin",
        },
      },
    });
    if (error)
      setErrorMsg(
        error.message.includes("already registered")
          ? t("emailAlready")
          : error.message,
      );
    else if (data.session) {
      const { error: provisioningError } = await supabase.rpc("ensure_profile_for_current_user");
      if (provisioningError) setErrorMsg(provisioningError.message);
      else navigate("/manager");
    } else setEmailSent(true);
    setLoading(false);
  };
  const resendConfirmation = async () => {
    setLoading(true);
    setResendMessage("");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: formData.email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setResendMessage(error ? error.message : t("resendDone"));
    setLoading(false);
  };

  if (emailSent)
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          p: { xs: 2, md: 4 },
          bgcolor: "#F7F8FB",
          background:
            "radial-gradient(circle at 90% 0%, rgba(244,121,32,.13), transparent 28%)",
        }}
      >
        <AuthCard>
          <CardContent sx={{ p: { xs: 3, sm: 5 }, textAlign: "center" }}>
            <Box
              component="img"
              src="/logo-icon.webp"
              alt="SERVIO"
              sx={{ width: 76, height: 76, objectFit: "contain", mb: 1 }}
            />
            <Typography
              sx={{
                fontWeight: 1000,
                fontSize: "1.5rem",
                letterSpacing: "-.06em",
                mb: 3,
              }}
            >
              SERVIO
            </Typography>
            <Typography variant="h5" fontWeight={950} mb={1}>
              {t("verifyEmail")}
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.9 }}>
              {t("sentActivation")}
            </Typography>
            <Typography fontWeight={900} sx={{ direction: "ltr", my: 1 }}>
              {formData.email}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.8, mb: 3 }}
            >
              {t("activationHelp")}
            </Typography>
            {resendMessage && (
              <Alert
                severity={resendMessage.startsWith("تم") ? "success" : "error"}
                sx={{ mb: 2, textAlign: "right" }}
              >
                {resendMessage}
              </Alert>
            )}
            <Button
              fullWidth
              variant="contained"
              onClick={resendConfirmation}
              disabled={loading}
              sx={{ py: 1.35, borderRadius: 2.3 }}
            >
              {loading ? t("loading") : t("resend")}
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => navigate("/login")}
              sx={{ mt: 1 }}
            >
              {t("backToLogin")}
            </Button>
          </CardContent>
        </AuthCard>
      </Box>
    );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "#F7F8FB",
        background:
          "radial-gradient(circle at 90% 0%, rgba(244,121,32,.13), transparent 28%)",
      }}
    >
      <BrandIntro t={t} arabic={arabic} />
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 1.5, sm: 3, md: 5 },
          position: "relative",
        }}
      >
        <Box sx={{ position: "absolute", top: 18, insetInlineEnd: 18 }}>
          <LanguageToggle />
        </Box>
        <Stack

          spacing={0.6}
          sx={{ mb: 3, display: { xs: "flex", md: "none" } , alignItems: "center"}}
        >
          <Box
            component="img"
            src="/logo-icon.webp"
            alt="SERVIO"
            sx={{ width: 55, height: 55, objectFit: "contain" }}
          />
          <Typography
            sx={{
              fontWeight: 1000,
              fontSize: "1.5rem",
              letterSpacing: "-.06em",
            }}
          >
            SERVIO
          </Typography>
        </Stack>
        <AuthCard>
          <CardContent sx={{ p: { xs: 2.2, sm: 4 } }}>
            <Typography variant="h5" sx={{ fontWeight: 950, mb: 0.7 }}>
              {t("createBusiness")}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
              {arabic
                ? "أنشئ مساحة نشاطك خلال دقائق، ثم أضف المنيو والطاولات والكاشير."
                : "Create your workspace in minutes, then add your menu, tables, and cashiers."}
            </Typography>
            {errorMsg && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {errorMsg}
              </Alert>
            )}
            <Box component="form" onSubmit={handleSubmit}>
              <Typography
                variant="subtitle2"
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  color: "primary.main",
                  fontWeight: 950,
                  mb: 1.5,
                }}
              >
                <StorefrontRoundedIcon fontSize="small" />
                {t("storeData")}
              </Typography>
              <Grid container spacing={1.3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t("cafeName")}
                    name="store_name"
                    value={formData.store_name}
                    onChange={handleChange}
                    required
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t("slugName")}
                    name="store_slug"
                    value={formData.store_slug}
                    onChange={handleChange}
                    disabled={isSlugLocked}
                    required
                    sx={fieldSx}

                   slotProps={{ input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => setIsSlugLocked((value) => !value)}
                          >
                            {isSlugLocked ? (
                              <LockRoundedIcon fontSize="small" />
                            ) : (
                              <LockOpenRoundedIcon
                                fontSize="small"
                                color="primary"
                              />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    } }}/>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label={t("currency")}
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    sx={fieldSx}
                  >
                    {CURRENCIES.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
              <Divider sx={{ my: 0.5 }} />
              <Typography
                variant="subtitle2"
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  color: "primary.main",
                  fontWeight: 950,
                  mb: 1.5,
                }}
              >
                <PersonRoundedIcon fontSize="small" />
                {t("ownerData")}
              </Typography>
              <Grid container spacing={1.3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t("fullName")}
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t("phone")}
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    sx={fieldSx}

                   slotProps={{ input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneRoundedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    } }}/>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="email"
                    label={t("email")}
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    sx={fieldSx}

                   slotProps={{ input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailRoundedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    } }}/>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type={showPassword ? "text" : "password"}
                    label={t("password")}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    sx={fieldSx}

                   slotProps={{ input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockRoundedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((value) => !value)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    } }}/>
                </Grid>
              </Grid>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ py: 1.45, borderRadius: 2.5, fontWeight: 950 }}
              >
                {loading ? t("loading") : t("registerSubmit")}
              </Button>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              sx={{ mt: 3 }}
            >
              {t("haveAccount")}{" "}
              <Box
                component={RouterLink}
                to="/login"
                sx={{
                  color: "primary.main",
                  fontWeight: 900,
                  textDecoration: "none",
                }}
              >
                {t("homeLogin")}
              </Box>
            </Typography>
          </CardContent>
        </AuthCard>
      </Box>
    </Box>
  );
}
