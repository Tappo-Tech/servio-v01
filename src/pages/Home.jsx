import { Box, Button, Card, Chip, Container, Divider, Grid, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LocalCafeRoundedIcon from "@mui/icons-material/LocalCafeRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import { Link as RouterLink } from "react-router-dom";
import LanguageToggle from "../components/LanguageToggle";
import TrialNotice from "../components/TrialNotice";
import { useLanguage } from "../context/LanguageContext";

const features = [
  { icon: <QrCode2RoundedIcon />, title: "homeFeature1Title", text: "homeFeature1Text", color: "#F47920" },
  { icon: <PointOfSaleRoundedIcon />, title: "homeFeature2Title", text: "homeFeature2Text", color: "#2878C8" },
  { icon: <InsightsRoundedIcon />, title: "homeFeature3Title", text: "homeFeature3Text", color: "#159A68" },
];
const steps = [
  { icon: <StorefrontRoundedIcon />, title: "homeStep1Title", text: "homeStep1Text" },
  { icon: <QrCode2RoundedIcon />, title: "homeStep2Title", text: "homeStep2Text" },
  { icon: <PointOfSaleRoundedIcon />, title: "homeStep3Title", text: "homeStep3Text" },
  { icon: <InsightsRoundedIcon />, title: "homeStep4Title", text: "homeStep4Text" },
];

function Logo({ compact = false, arabic = true }) {
  return <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
    <Box component="img" src="/logo-icon.webp" alt="SERVIO" sx={{ width: compact ? 36 : 46, height: compact ? 36 : 46, objectFit: "contain" }} />
    <Box><Typography sx={{ fontWeight: 1000, letterSpacing: "-.04em", color: "secondary.main", fontSize: compact ? "1.1rem" : "1.3rem", lineHeight: 1 }}>SERVIO</Typography><Typography variant="caption" sx={{ color: "text.secondary", display: { xs: compact ? "none" : "block", sm: "block" }, fontWeight: 700 }}>{arabic ? "كل الطلبات في مسار واضح." : "Order flow, made clear."}</Typography></Box>
  </Stack>;
}
function SoftCard({ children, sx = {} }) { return <Card elevation={0} sx={{ border: "1px solid", borderColor: "rgba(255,255,255,.8)", bgcolor: "rgba(255,255,255,.72)", backdropFilter: "blur(20px)", boxShadow: "0 24px 70px rgba(23,26,47,.08)", ...sx }}>{children}</Card>; }

export default function Home() {
  const { t, language } = useLanguage();
  const isArabic = language !== "en";
  const DirectionIcon = isArabic ? ArrowBackRoundedIcon : ArrowForwardRoundedIcon;
  return <Box sx={{ minHeight: "100vh", overflow: "hidden", bgcolor: "#F7F8FB", color: "secondary.main", position: "relative" }}>
    <Box sx={{ position: "absolute", width: 620, height: 620, borderRadius: "50%", top: -300, insetInlineEnd: -220, background: "radial-gradient(circle, rgba(244,121,32,.22), transparent 68%)", filter: "blur(10px)", pointerEvents: "none" }} />
    <Box sx={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", top: 680, insetInlineStart: -300, background: "radial-gradient(circle, rgba(40,120,200,.10), transparent 68%)", filter: "blur(18px)", pointerEvents: "none" }} />
    <Container maxWidth="lg" sx={{ position: "relative", py: { xs: 1.5, md: 2.5 } }}>
      <SoftCard sx={{ borderRadius: 4, px: { xs: 1.5, sm: 2.5 }, py: 1.1, position: "sticky", top: 12, zIndex: 10 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}><Logo compact arabic={isArabic} /><Stack direction="row" alignItems="center" spacing={{ xs: .5, sm: 1.2 }}><LanguageToggle compact /><Button component={RouterLink} to="/login" variant="text" sx={{ display: { xs: "none", sm: "inline-flex" }, fontWeight: 850 }}>{t("homeLogin")}</Button><Button component={RouterLink} to="/register" variant="contained" sx={{ borderRadius: 2.5, px: { xs: 1.4, sm: 2.4 }, fontWeight: 900 }}>{t("homeStart")}</Button></Stack></Stack>
      </SoftCard>

      <Grid container spacing={{ xs: 5, md: 8 }} alignItems="center" sx={{ pt: { xs: 7, md: 11 }, pb: { xs: 9, md: 14 } }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Chip icon={<BoltRoundedIcon />} label={t("homeTag")} sx={{ mb: 2.5, borderRadius: 2, fontWeight: 900, bgcolor: alpha("#F47920", .1), color: "primary.dark", border: "1px solid", borderColor: alpha("#F47920", .2) }} />
          <Typography component="h1" sx={{ fontSize: { xs: "clamp(2.65rem, 11vw, 4rem)", md: "5.8rem" }, fontWeight: 1000, letterSpacing: "-.075em", lineHeight: .98, maxWidth: 760 }}>{t("homeTitleA")}<br /><Box component="span" sx={{ color: "primary.main" }}>{t("homeTitleB")}</Box></Typography>
          <Typography sx={{ mt: 3, maxWidth: 650, fontSize: { xs: "1.08rem", md: "1.28rem" }, lineHeight: 1.9, color: "text.secondary", fontWeight: 600 }}>{t("homeDescription")}</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.3} sx={{ mt: 4, alignItems: { xs: "stretch", sm: "center" } }}><Button component={RouterLink} to="/register" variant="contained" size="large" endIcon={<DirectionIcon />} sx={{ borderRadius: 2.8, py: 1.45, px: 3.2, fontWeight: 950, boxShadow: "0 18px 36px rgba(244,121,32,.22)" }}>{t("homeCreate")}</Button><Button component={RouterLink} to="/login" variant="text" size="large" sx={{ fontWeight: 900, color: "secondary.main" }}>{t("homeAlready")}</Button></Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 2.5 }} sx={{ mt: 4, pt: 2.5, borderTop: "1px solid", borderColor: "divider", maxWidth: 650 }}>{["homeFeatureBadge1", "homeFeatureBadge2", "homeFeatureBadge3"].map((key) => <Stack key={key} direction="row" alignItems="center" spacing={.7}><CheckCircleRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} /><Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 800 }}>{t(key)}</Typography></Stack>)}</Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <SoftCard sx={{ borderRadius: 5, p: { xs: 2, sm: 2.8 }, transform: { md: "rotate(2deg)" } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Stack direction="row" alignItems="center" spacing={1}><Box sx={{ width: 42, height: 42, borderRadius: 2.2, display: "grid", placeItems: "center", bgcolor: "secondary.main", color: "#fff" }}><LocalCafeRoundedIcon /></Box><Box><Typography fontWeight={950}>{t("homeDashboardTitle")}</Typography><Typography variant="caption" color="text.secondary">{t("homeDemoLabel")}</Typography></Box></Stack><Box sx={{ width: 11, height: 11, borderRadius: "50%", bgcolor: "#159A68", boxShadow: "0 0 0 7px rgba(21,154,104,.12)" }} /></Stack>
            <Box sx={{ p: 2.2, borderRadius: 3.5, bgcolor: "secondary.main", color: "#fff" }}><Typography variant="body2" sx={{ opacity: .65 }}>{t("homeOrderActivity")}</Typography><Stack direction="row" justifyContent="space-between" alignItems="end"><Typography sx={{ fontSize: "3.4rem", fontWeight: 1000, lineHeight: 1.1 }}>24</Typography><Chip label={t("homeMockReady")} size="small" sx={{ bgcolor: "rgba(255,255,255,.12)", color: "#fff", fontWeight: 800 }} /></Stack><Box sx={{ mt: 2, height: 8, borderRadius: 10, bgcolor: "rgba(255,255,255,.13)", overflow: "hidden" }}><Box sx={{ width: "72%", height: "100%", bgcolor: "primary.main", borderRadius: 10 }} /></Box></Box>
            <Stack spacing={1.1} sx={{ mt: 2 }}>{[t("homeMockNew"), t("homeMockCall"), t("homeMockAnalytics")].map((label, index) => <Box key={label} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.2, borderRadius: 2.5, bgcolor: index === 0 ? alpha("#F47920", .08) : "rgba(248,249,250,.8)" }}><Typography variant="body2" fontWeight={850}>{label}</Typography><Typography variant="caption" color="text.secondary">{index === 0 ? t("homeOneMinute") : t("homeTwoMinutes")}</Typography></Box>)}</Stack>
          </SoftCard>
        </Grid>
      </Grid>

      <Box sx={{ pb: { xs: 9, md: 14 } }}><Stack spacing={1} sx={{ mb: 4 }}><Typography variant="overline" sx={{ color: "primary.main", fontWeight: 950, letterSpacing: ".12em" }}>{t("homeViewEyebrow")}</Typography><Typography variant="h2" sx={{ fontSize: { xs: "2.2rem", md: "3.5rem" }, maxWidth: 700 }}>{t("homeViewTitle")}</Typography><Typography color="text.secondary" sx={{ maxWidth: 690, fontSize: "1.08rem", lineHeight: 1.85 }}>{t("homeViewText")}</Typography></Stack><Grid container spacing={2}>{features.map((feature) => <Grid size={{ xs: 12, md: 4 }} key={feature.title}><SoftCard sx={{ height: "100%", borderRadius: 3.5, p: 2.5 }}><Box sx={{ width: 48, height: 48, display: "grid", placeItems: "center", borderRadius: 2.5, color: feature.color, bgcolor: alpha(feature.color, .11), mb: 2 }}>{feature.icon}</Box><Typography variant="h6" sx={{ mb: 1 }}>{t(feature.title)}</Typography><Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>{t(feature.text)}</Typography></SoftCard></Grid>)}</Grid></Box>

      <Box sx={{ pb: { xs: 9, md: 14 } }}><Grid container spacing={{ xs: 4, md: 8 }} alignItems="start"><Grid size={{ xs: 12, md: 5 }}><Typography variant="overline" sx={{ color: "primary.main", fontWeight: 950, letterSpacing: ".12em" }}>{t("homeFlowEyebrow")}</Typography><Typography variant="h2" sx={{ mt: 1, fontSize: { xs: "2.2rem", md: "3.4rem" } }}>{t("homeFlowTitle")}</Typography><Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.9 }}>{t("homeFlowText")}</Typography></Grid><Grid size={{ xs: 12, md: 7 }}><Stack spacing={1.2}>{steps.map((step, index) => <Box key={step.title} sx={{ display: "flex", gap: 2, alignItems: "flex-start", p: { xs: 1.8, sm: 2.2 }, borderRadius: 3, bgcolor: "rgba(255,255,255,.68)", border: "1px solid", borderColor: "rgba(23,26,47,.06)" }}><Box sx={{ minWidth: 42, height: 42, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: index === 0 ? "primary.main" : alpha("#171A2F", .07), color: index === 0 ? "#fff" : "secondary.main" }}>{step.icon}</Box><Box><Typography fontWeight={950}>{step.title}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .35, lineHeight: 1.7 }}>{step.text}</Typography></Box></Box>)}</Stack></Grid></Grid></Box>

      <SoftCard sx={{ borderRadius: 4, p: { xs: 2.5, md: 5 }, mb: 5, bgcolor: "secondary.main", color: "#fff", borderColor: "rgba(255,255,255,.08)" }}><Grid container spacing={3} alignItems="center"><Grid size={{ xs: 12, md: 8 }}><Typography variant="h3" sx={{ color: "#fff", fontSize: { xs: "2rem", md: "3rem" } }}>{t("homeCtaTitle")}</Typography><Typography sx={{ mt: 1.5, color: "rgba(255,255,255,.7)", lineHeight: 1.8, maxWidth: 650 }}>{t("homeCtaText")}</Typography></Grid><Grid size={{ xs: 12, md: 4 }}><Button component={RouterLink} to="/register" fullWidth variant="contained" size="large" endIcon={<DirectionIcon />} sx={{ py: 1.5, borderRadius: 2.5, fontWeight: 950 }}>{t("homeCtaStart")}</Button></Grid></Grid></SoftCard>
      <Divider sx={{ mb: 2 }} /><Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" spacing={1} sx={{ pb: 2 }}><Logo compact arabic={isArabic} /><Typography variant="body2" color="text.secondary">{t("homeFooterText")}</Typography></Stack>
    </Container><TrialNotice />
  </Box>;
}
