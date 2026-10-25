import { Box, Button, Card, Chip, Container, Divider, Grid, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import { Link as RouterLink } from "react-router-dom";
import LanguageToggle from "../components/LanguageToggle";
import TrialNotice from "../components/TrialNotice";
import { useLanguage } from "../context/LanguageContext";

const features = [
  { icon: <QrCode2RoundedIcon />, title: "homeFeature1Title", text: "homeFeature1Text", color: "#F47920", number: "01" },
  { icon: <PointOfSaleRoundedIcon />, title: "homeFeature2Title", text: "homeFeature2Text", color: "#F47920", number: "02" },
  { icon: <InsightsRoundedIcon />, title: "homeFeature3Title", text: "homeFeature3Text", color: "#F47920", number: "03" },
];

const roles = [
  { icon: <StorefrontRoundedIcon />, title: "homeRole1Title", text: "homeRole1Text" },
  { icon: <PointOfSaleRoundedIcon />, title: "homeRole2Title", text: "homeRole2Text" },
  { icon: <SupportAgentRoundedIcon />, title: "homeRole3Title", text: "homeRole3Text" },
];

const steps = [
  { icon: <StorefrontRoundedIcon />, title: "homeStep1Title", text: "homeStep1Text" },
  { icon: <QrCode2RoundedIcon />, title: "homeStep2Title", text: "homeStep2Text" },
  { icon: <PointOfSaleRoundedIcon />, title: "homeStep3Title", text: "homeStep3Text" },
  { icon: <InsightsRoundedIcon />, title: "homeStep4Title", text: "homeStep4Text" },
];

function Logo({ compact = false, arabic = true }) {
  return <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
    <Box component="img" src="/logo-icon.webp" alt="SERVIO" sx={{ width: compact ? 34 : 44, height: compact ? 34 : 44, objectFit: "contain" }} />
    <Box>
      <Typography sx={{ fontWeight: 1000, letterSpacing: "-.045em", color: "secondary.main", fontSize: compact ? "1.05rem" : "1.22rem", lineHeight: 1 }}>SERVIO</Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", display: { xs: compact ? "none" : "block", sm: "block" }, fontWeight: 700 }}>{arabic ? "تشغيل أوضح. خدمة أسرع." : "Clearer cafe operations."}</Typography>
    </Box>
  </Stack>;
}

function Surface({ children, sx = {}, ...props }) {
  return <Card elevation={0} {...props} sx={{ border: "1px solid", borderColor: "rgba(23,26,47,.07)", bgcolor: "rgba(255,255,255,.84)", boxShadow: "0 20px 55px rgba(23,26,47,.055)", ...sx }}>{children}</Card>;
}

function SectionIntro({ eyebrow, title, text, align = "start" }) {
  return <Stack spacing={1.1} sx={{ mb: 4, textAlign: align, maxWidth: 730, mx: align === "center" ? "auto" : 0 }}>
    <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 950, letterSpacing: ".16em" }}>{eyebrow}</Typography>
    <Typography component="h2" sx={{ fontSize: { xs: "2rem", md: "3.1rem" }, fontWeight: 1000, letterSpacing: "-.065em", lineHeight: 1.05 }}>{title}</Typography>
    <Typography color="text.secondary" sx={{ fontSize: { xs: ".98rem", md: "1.05rem" }, lineHeight: 1.85 }}>{text}</Typography>
  </Stack>;
}

export default function Home() {
  const { t, language } = useLanguage();
  const isArabic = language !== "en";
  const DirectionIcon = isArabic ? ArrowBackRoundedIcon : ArrowForwardRoundedIcon;
  const mockItems = [
    { label: t("homeMockNew"), detail: isArabic ? "طاولة 08" : "Table 08", color: "#F47920", time: isArabic ? "اليوم" : "Today" },
    { label: t("homeMockReady"), detail: isArabic ? "طلب #1048" : "Order #1048", color: "#26A879", time: isArabic ? "منذ دقيقة" : "1 min ago" },
    { label: t("homeMockCall"), detail: isArabic ? "طاولة 04" : "Table 04", color: "#F0A23A", time: isArabic ? "منذ دقيقتين" : "2 min ago" },
  ];

  return <Box sx={{ minHeight: "100vh", overflow: "hidden", bgcolor: "#F8F9FA", color: "secondary.main" }}>
    <Box sx={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", top: -420, insetInlineEnd: -260, background: "radial-gradient(circle, rgba(244,121,32,.13), transparent 67%)", pointerEvents: "none" }} />
    <Box sx={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", top: 1150, insetInlineStart: -390, background: "radial-gradient(circle, rgba(40,120,200,.08), transparent 68%)", pointerEvents: "none" }} />

    <Container maxWidth="lg" sx={{ position: "relative", py: { xs: 1.5, md: 2.5 } }}>
      <Surface sx={{ borderRadius: 4, px: { xs: 1.5, sm: 2.5 }, py: 1.05, position: "sticky", top: 12, zIndex: 10, bgcolor: "rgba(255,255,255,.88)", backdropFilter: "blur(18px)" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
          <Logo compact arabic={isArabic} />
          <Stack direction="row" alignItems="center" spacing={{ xs: .5, sm: 1.1 }}>
            <Box sx={{ order: isArabic ? 0 : 3 }}><LanguageToggle compact /></Box>
            <Button component={RouterLink} to="/login" size="small" sx={{ color: "primary.dark", fontWeight: 900, display: { xs: "none", sm: "inline-flex" } }}>{t("homeLogin")}</Button>
            <Button component={RouterLink} to="/register" size="small" variant="contained" sx={{ borderRadius: 2, px: { xs: 1.1, sm: 2 }, fontWeight: 950 }}>{t("homeCreate")}</Button>
          </Stack>
        </Stack>
      </Surface>

      <Box component="section" sx={{ pt: { xs: 7, md: 10 }, pb: { xs: 9, md: 13 } }}>
        <Grid container spacing={{ xs: 5, md: 8 }} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <Chip icon={<BoltRoundedIcon />} label={t("homeTag")} sx={{ mb: 2.5, borderRadius: 2, fontWeight: 900, bgcolor: alpha("#F47920", .1), color: "primary.dark", border: "1px solid", borderColor: alpha("#F47920", .22) }} />
            <Typography component="h1" sx={{ fontSize: { xs: "clamp(2.75rem, 13vw, 4.35rem)", md: "5.55rem" }, fontWeight: 1000, letterSpacing: "-.085em", lineHeight: .96, maxWidth: 760 }}>{t("homeTitleA")}<br /><Box component="span" sx={{ color: "primary.main" }}>{t("homeTitleB")}</Box></Typography>
            <Typography sx={{ mt: 3, maxWidth: 650, fontSize: { xs: "1rem", md: "1.13rem" }, lineHeight: 1.9, color: "text.secondary", fontWeight: 550 }}>{t("homeDescription")}</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mt: 4, alignItems: { xs: "stretch", sm: "center" } }}>
              <Button component={RouterLink} to="/register" variant="contained" size="large" endIcon={<DirectionIcon />} sx={{ borderRadius: 2.5, py: 1.4, px: 3, fontWeight: 950, boxShadow: "0 14px 30px rgba(244,121,32,.2)" }}>{t("homeCreate")}</Button>
              <Button component={RouterLink} to="/login" variant="text" size="large" sx={{ fontWeight: 900, color: "secondary.main" }}>{t("homeAlready")}</Button>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 2.2 }} sx={{ mt: 4, pt: 2.5, borderTop: "1px solid", borderColor: "rgba(23,26,47,.1)", maxWidth: 680 }}>
              {["homeFeatureBadge1", "homeFeatureBadge2", "homeFeatureBadge3"].map((key) => <Stack key={key} direction="row" alignItems="center" spacing={.7}><CheckCircleRoundedIcon sx={{ fontSize: 17, color: "primary.main" }} /><Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 800 }}>{t(key)}</Typography></Stack>)}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Surface sx={{ borderRadius: 5, p: { xs: 1.4, sm: 2 }, transform: { md: "rotate(1.3deg)" }, bgcolor: "#fff", overflow: "hidden" }}>
              <Stack direction="row" spacing={1.2} sx={{ minHeight: { xs: 330, sm: 365 } }}>
                <Box sx={{ width: { xs: 41, sm: 54 }, flexShrink: 0, borderRadius: 2.5, bgcolor: "secondary.main", p: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}><Box sx={{ width: 27, height: 27, borderRadius: 1.2, bgcolor: "primary.main" }} /><Box sx={{ width: 23, height: 6, borderRadius: 3, bgcolor: "rgba(255,255,255,.3)" }} /><Box sx={{ width: 23, height: 6, borderRadius: 3, bgcolor: "rgba(255,255,255,.18)" }} /><Box sx={{ width: 23, height: 6, borderRadius: 3, bgcolor: "rgba(255,255,255,.18)" }} /><Box sx={{ width: 23, height: 6, borderRadius: 3, bgcolor: "rgba(255,255,255,.18)" }} /></Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.3 }}><Box><Typography fontWeight={950}>{t("homeDashboardTitle")}</Typography><Typography variant="caption" color="text.secondary">{t("homeDashboardExample")}</Typography></Box><Chip size="small" label={isArabic ? "مباشر" : "LIVE"} sx={{ bgcolor: alpha("#159A68", .1), color: "#128052", fontWeight: 900 }} /></Stack>
                  <Grid container spacing={.8} sx={{ mb: 1.2 }}><Grid size={4}><Box sx={{ p: 1, borderRadius: 1.8, bgcolor: "#F7F8FA" }}><Typography variant="caption" color="text.secondary">{isArabic ? "الطلبات" : "Orders"}</Typography><Typography fontWeight={950}>12</Typography></Box></Grid><Grid size={4}><Box sx={{ p: 1, borderRadius: 1.8, bgcolor: "#F7F8FA" }}><Typography variant="caption" color="text.secondary">{isArabic ? "المبيعات" : "Sales"}</Typography><Typography fontWeight={950}>1.8k</Typography></Box></Grid><Grid size={4}><Box sx={{ p: 1, borderRadius: 1.8, bgcolor: "#F7F8FA" }}><Typography variant="caption" color="text.secondary">{isArabic ? "اليوم" : "Today"}</Typography><Typography fontWeight={950}>24</Typography></Box></Grid></Grid>
                  <Typography variant="caption" sx={{ fontWeight: 900 }}>{t("homeOrderActivity")}</Typography><Stack spacing={.7} sx={{ mt: .8 }}>{mockItems.map((item) => <Box key={item.label} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: .9, borderRadius: 1.8, bgcolor: "#F7F8FA" }}><Stack direction="row" alignItems="center" spacing={.7}><Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: item.color }} /><Box><Typography variant="caption" fontWeight={900} display="block">{item.label}</Typography><Typography variant="caption" color="text.secondary">{item.detail}</Typography></Box></Stack><Typography variant="caption" color="text.secondary">{item.time}</Typography></Box>)}</Stack>
                  <Grid container spacing={.8} sx={{ mt: 1.3 }}><Grid size={4}><Stack direction="row" spacing={.4} alignItems="center"><QrCode2RoundedIcon sx={{ fontSize: 15, color: "primary.main" }} /><Typography variant="caption" fontWeight={800}>{isArabic ? "QR" : "QR"}</Typography></Stack></Grid><Grid size={4}><Stack direction="row" spacing={.4} alignItems="center"><MenuBookRoundedIcon sx={{ fontSize: 15, color: "primary.main" }} /><Typography variant="caption" fontWeight={800}>{isArabic ? "منيو" : "Menu"}</Typography></Stack></Grid><Grid size={4}><Stack direction="row" spacing={.4} alignItems="center"><InsightsRoundedIcon sx={{ fontSize: 15, color: "primary.main" }} /><Typography variant="caption" fontWeight={800}>{isArabic ? "تحليلات" : "Analytics"}</Typography></Stack></Grid></Grid>
                </Box>
              </Stack>
            </Surface>
          </Grid>
        </Grid>
      </Box>

      <Box component="section" sx={{ pb: { xs: 9, md: 13 } }}>
        <SectionIntro align="center" eyebrow={t("homeViewEyebrow")} title={t("homeViewTitle")} text={t("homeViewText")} />
        <Grid container spacing={2}>{features.map((feature) => <Grid size={{ xs: 12, md: 4 }} key={feature.title}><Surface sx={{ height: "100%", borderRadius: 3.2, p: { xs: 2.3, md: 2.7 }, position: "relative" }}><Typography variant="caption" sx={{ position: "absolute", top: 20, insetInlineEnd: 22, color: "text.disabled", fontWeight: 900 }}>{feature.number}</Typography><Box sx={{ width: 47, height: 47, display: "grid", placeItems: "center", borderRadius: 2.2, color: feature.color, bgcolor: alpha(feature.color, .11), mb: 2 }}>{feature.icon}</Box><Typography variant="h6" sx={{ mb: 1 }}>{t(feature.title)}</Typography><Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>{t(feature.text)}</Typography></Surface></Grid>)}</Grid>
      </Box>

      <Box component="section" sx={{ pb: { xs: 9, md: 13 } }}>
        <Grid container spacing={{ xs: 4, md: 9 }} alignItems="center"><Grid size={{ xs: 12, md: 5 }}><SectionIntro eyebrow={t("homeFlowEyebrow")} title={t("homeFlowTitle")} text={t("homeFlowText")} /><Stack spacing={1}>{["homeBenefits1", "homeBenefits2", "homeBenefits3"].map((key) => <Stack key={key} direction="row" spacing={.8} alignItems="center"><CheckCircleRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} /><Typography variant="body2" color="text.secondary" fontWeight={750}>{t(key)}</Typography></Stack>)}</Stack><Button component={RouterLink} to="/register" variant="outlined" endIcon={<DirectionIcon />} sx={{ mt: 3, borderRadius: 2.2, fontWeight: 900 }}>{t("homeStart")}</Button></Grid><Grid size={{ xs: 12, md: 7 }}><Surface sx={{ p: { xs: 1.5, sm: 2.2 }, borderRadius: 3.5, bgcolor: "rgba(255,255,255,.72)" }}><Grid container spacing={1.3}>{steps.map((step, index) => <Grid size={{ xs: 12, sm: 6 }} key={step.title}><Box sx={{ height: "100%", p: 2, borderRadius: 2.5, bgcolor: index === 0 ? "#FFF1E8" : "#F8F9FA", border: "1px solid", borderColor: index === 0 ? alpha("#F47920", .18) : "rgba(23,26,47,.05)" }}><Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}><Box sx={{ width: 32, height: 32, borderRadius: 1.6, display: "grid", placeItems: "center", bgcolor: index === 0 ? "primary.main" : alpha("#171A2F", .07), color: index === 0 ? "#fff" : "secondary.main" }}>{step.icon}</Box><Typography variant="caption" color="text.secondary" fontWeight={900}>{t("homeStepLabel")} {index + 1}</Typography></Stack><Typography fontWeight={950}>{t(step.title)}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .45, lineHeight: 1.7 }}>{t(step.text)}</Typography></Box></Grid>)}</Grid></Surface></Grid></Grid>
      </Box>

      <Box component="section" sx={{ pb: { xs: 9, md: 13 } }}>
        <SectionIntro align="center" eyebrow={t("homeRolesEyebrow")} title={t("homeRolesTitle")} text={isArabic ? "صاحب النشاط، الفريق، والعميل يشوفون التجربة المناسبة لهم." : "Owners, teams, and guests each get the experience they need."} />
        <Grid container spacing={2}>{roles.map((role, index) => <Grid size={{ xs: 12, md: 4 }} key={role.title}><Surface sx={{ height: "100%", borderRadius: 3.2, p: 2.5, bgcolor: "rgba(255,255,255,.72)" }}><Box sx={{ width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: 2, color: "primary.main", bgcolor: alpha("#F47920", .1), mb: 2 }}>{role.icon}</Box><Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 900 }}>{`0${index + 1}`}</Typography><Typography variant="h6" sx={{ mt: .5, mb: 1 }}>{t(role.title)}</Typography><Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>{t(role.text)}</Typography></Surface></Grid>)}</Grid>
      </Box>

      <Surface component="section" sx={{ borderRadius: 3.5, p: { xs: 2.5, md: 5 }, mb: 5, bgcolor: "#FFF1E8", color: "secondary.main", borderColor: alpha("#F47920", .22) }}><Grid container spacing={3} alignItems="center"><Grid size={{ xs: 12, md: 7 }}><Typography variant="h3" sx={{ color: "secondary.main", fontSize: { xs: "2rem", md: "3rem" }, letterSpacing: "-.055em" }}>{t("homeCtaTitle")}</Typography><Typography sx={{ mt: 1.5, color: "text.secondary", lineHeight: 1.8, maxWidth: 650 }}>{t("homeCtaText")}</Typography></Grid><Grid size={{ xs: 12, md: 5 }}><Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}><Button component={RouterLink} to="/register" fullWidth variant="contained" size="large" endIcon={<DirectionIcon />} sx={{ py: 1.5, borderRadius: 2.3, fontWeight: 950 }}>{t("homeCtaStart")}</Button><Button component={RouterLink} to="/login" fullWidth variant="outlined" size="large" sx={{ py: 1.5, borderRadius: 2.3, fontWeight: 900, borderColor: "secondary.main", color: "secondary.main" }}>{t("homeAlready")}</Button></Stack></Grid></Grid></Surface>
      <Divider sx={{ mb: 2 }} /><Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" spacing={1} sx={{ pb: 2 }}><Logo compact arabic={isArabic} /><Typography variant="body2" color="text.secondary">{t("homeFooterText")}</Typography></Stack>
    </Container>
    <TrialNotice />
  </Box>;
}
