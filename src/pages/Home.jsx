import {
  Box,
  Button,
  Card,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LocalCafeRoundedIcon from "@mui/icons-material/LocalCafeRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import TableRestaurantRoundedIcon from "@mui/icons-material/TableRestaurantRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { Link as RouterLink } from "react-router-dom";
import LanguageToggle from "../components/LanguageToggle";
import TrialNotice from "../components/TrialNotice";
import { useLanguage } from "../context/LanguageContext";

// محتوى الهوم محفوظ كمفاتيح ترجمة، لذلك تتغير النصوص مع اللغة بدل تغيير الاتجاه فقط.
const features = [
  {
    icon: <QrCode2RoundedIcon />,
    eyebrow: "01",
    title: "homeFeature1Title",
    text: "homeFeature1Text",
  },
  {
    icon: <ShoppingBagRoundedIcon />,
    eyebrow: "02",
    title: "homeFeature2Title",
    text: "homeFeature2Text",
  },
  {
    icon: <InsightsRoundedIcon />,
    eyebrow: "03",
    title: "homeFeature3Title",
    text: "homeFeature3Text",
  },
];

const steps = [
  {
    number: "1",
    icon: <TableRestaurantRoundedIcon />,
    title: "homeStep1Title",
    text: "homeStep1Text",
  },
  {
    number: "2",
    icon: <QrCode2RoundedIcon />,
    title: "homeStep2Title",
    text: "homeStep2Text",
  },
  {
    number: "3",
    icon: <ShoppingBagRoundedIcon />,
    title: "homeStep3Title",
    text: "homeStep3Text",
  },
  {
    number: "4",
    icon: <AutoGraphRoundedIcon />,
    title: "homeStep4Title",
    text: "homeStep4Text",
  },
];

const roles = [
  {
    icon: <StorefrontRoundedIcon />,
    title: "homeRole1Title",
    text: "homeRole1Text",
  },
  {
    icon: <BoltRoundedIcon />,
    title: "homeRole2Title",
    text: "homeRole2Text",
  },
  {
    icon: <LocalCafeRoundedIcon />,
    title: "homeRole3Title",
    text: "homeRole3Text",
  },
];

function GlassCard({ children, sx = {}, ...props }) {
  return (
    <Card
      elevation={0}
      {...props}
      sx={{
        border: "1px solid",
        borderColor: alpha("#FFFFFF", 0.58),
        background:
          "linear-gradient(145deg, " +
          alpha("#FFFFFF", 0.74) +
          ", " +
          alpha("#FFFFFF", 0.42) +
          ")",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        boxShadow: "0 18px 60px rgba(23, 26, 47, 0.08)",
        ...sx,
      }}
    >
      {children}
    </Card>
  );
}

export default function Home() {
  const { t } = useLanguage();
  return (
    <Box
      sx={{
        minHeight: "100vh",
        overflow: "hidden",
        bgcolor: "background.default",
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          width: 460,
          height: 460,
          borderRadius: "50%",
          top: -180,
          right: -130,
          background: (theme) =>
            "radial-gradient(circle, " +
            alpha(theme.palette.primary.main, 0.18) +
            " 0%, transparent 68%)",
          filter: "blur(12px)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: 360,
          height: 360,
          borderRadius: "50%",
          top: 520,
          left: -180,
          background: (theme) =>
            "radial-gradient(circle, " +
            alpha(theme.palette.primary.main, 0.1) +
            " 0%, transparent 68%)",
          filter: "blur(18px)",
          pointerEvents: "none",
        }}
      />

      <Container
        maxWidth="lg"
        sx={{ position: "relative", py: { xs: 2, md: 3.5 } }}
      >
        <Box
          sx={{
            position: "sticky",
            top: { xs: 10, md: 16 },
            zIndex: 20,
            mb: { xs: 6, md: 8 },
          }}
        >
          <GlassCard
            sx={{
              borderRadius: 4,
              px: { xs: 1.5, sm: 2, md: 2.5 },
              py: 1,
            }}
          >
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Stack direction="row" sx={{ alignItems: "center", gap: { xs: .7, sm: 1.1 }, minWidth: 0 }}>
                <Box
                  component="img"
                  src="/logo-icon.webp"
                  alt="SERVIO"
                  sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, objectFit: "contain", flex: "0 0 auto" }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{ fontWeight: 950, color: "secondary.main", lineHeight: 1 }}
                  >
                    SERVIO
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", fontWeight: 700, display: { xs: "none", sm: "block" } }}
                  >
                    {t("homeSubtitle")}
                  </Typography>
                </Box>
              </Stack>

              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  gap: { xs: 0.5, sm: 1 },
                  flex: "0 0 auto",
                }}
              >
                <LanguageToggle compact />
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="text"
                  sx={{ display: { xs: "none", sm: "inline-flex" }, fontWeight: 800, minWidth: "auto", px: { xs: 1, sm: 1.5 } }}
                >
                  {t("homeLogin")}
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  sx={{
                    fontWeight: 850,
                    borderRadius: 2.5,
                    minWidth: "auto",
                    fontSize: { xs: ".76rem", sm: "0.875rem" },
                    px: { xs: 1, sm: 2.2 },
                    boxShadow: "none",
                  }}
                >
                  {t("homeStart")}
                </Button>
              </Stack>
            </Stack>
          </GlassCard>
        </Box>

        <Grid
          container
          spacing={{ xs: 5, md: 8 }}
          sx={{ alignItems: "center", mb: { xs: 10, md: 15 } }}
        >
          <Grid size={{ xs: 12, md: 7 }}>
            <Chip
              icon={<BoltRoundedIcon />}
              label={t("homeTag")}
              sx={{
                mb: 2.5,
                px: 0.8,
                py: 2.3,
                borderRadius: 2.5,
                fontWeight: 850,
                color: "secondary.main",
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.09),
                border: "1px solid",
                borderColor: (theme) => alpha(theme.palette.primary.main, 0.16),
              }}
            />

            <Typography
              component="h1"
              sx={{
                maxWidth: 760,
                fontSize: { xs: "clamp(2.1rem, 9.5vw, 2.65rem)", sm: "3.8rem", md: "5.25rem" },
                lineHeight: { xs: 1.08, md: 1.02 },
                fontWeight: 950,
                letterSpacing: "-0.055em",
                color: "secondary.main",
              }}
            >
              {t("homeTitleA")}
              <br />
              <Box component="span" sx={{ color: "primary.main" }}>
                {t("homeTitleB")}
              </Box>
            </Typography>

            <Typography
              sx={{
                mt: 3,
                maxWidth: 670,
                color: "text.secondary",
                fontSize: { xs: "1.05rem", md: "1.2rem" },
                lineHeight: 1.95,
              }}
            >
              {t("homeDescription")}
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              sx={{
                alignItems: { xs: "stretch", sm: "center" },
                gap: 1.4,
                mt: 4,
              }}
            >
              <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                size="large"
                endIcon={<ArrowBackRoundedIcon />}
                sx={{
                  borderRadius: 2.8,
                  px: 3,
                  py: 1.45,
                  fontWeight: 900,
                  boxShadow: "0 16px 34px rgba(244,121,32,.18)",
                }}
              >
                {t("homeCreate")}
              </Button>

              <Button
                component={RouterLink}
                to="/login"
                variant="text"
                size="large"
                sx={{
                  fontWeight: 850,
                  color: "secondary.main",
                  justifyContent: { xs: "center", sm: "flex-start" },
                }}
              >
                {t("homeAlready")}
              </Button>
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              sx={{
                gap: { xs: 1.5, sm: 3 },
                mt: 4,
                pt: 2.5,
                borderTop: "1px solid",
                borderColor: "divider",
                maxWidth: 620,
              }}
            >
              {[t("homeFeatureBadge1"), t("homeFeatureBadge2"), t("homeFeatureBadge3")].map(
                (item) => (
                  <Stack
                    key={item}
                    direction="row"
                    sx={{ alignItems: "center", gap: 0.8 }}
                  >
                    <CheckCircleRoundedIcon
                      sx={{ fontSize: 18, color: "primary.main" }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 750, color: "text.secondary" }}
                    >
                      {item}
                    </Typography>
                  </Stack>
                )
              )}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ position: "relative", maxWidth: 520, mx: "auto" }}>
              <Box
                sx={{
                  position: "absolute",
                  inset: "8% 4% auto auto",
                  width: "74%",
                  height: 240,
                  borderRadius: "50%",
                  background: (theme) =>
                    "radial-gradient(circle, " +
                    alpha(theme.palette.primary.main, 0.22) +
                    ", transparent 70%)",
                  filter: "blur(28px)",
                  pointerEvents: "none",
                }}
              />

              <GlassCard
                sx={{
                  position: "relative",
                  p: { xs: 2, sm: 3 },
                  borderRadius: 5,
                  overflow: "hidden",
                }}
              >
                <Stack
                  direction="row"
                  sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}
                >
                  <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        color: "#fff",
                        bgcolor: "secondary.main",
                      }}
                    >
                      <LocalCafeRoundedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                        {t("homeDashboardTitle")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("homeDemoLabel")}
                      </Typography>
                    </Box>
                  </Stack>

                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                      boxShadow: (theme) =>
                        "0 0 0 7px " + alpha(theme.palette.primary.main, 0.12),
                    }}
                  />
                </Stack>

                <Box
                  sx={{
                    p: 2.2,
                    borderRadius: 3.5,
                    bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.96),
                    color: "#fff",
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.65, mb: 0.6 }}>
                        {t("homeOrderActivity")}
                      </Typography>
                      <Typography
                        sx={{ fontSize: { xs: "2.6rem", sm: "3.15rem" }, fontWeight: 950, lineHeight: 1 }}
                      >
                        12
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.62 }}>
                        {t("homeDashboardExample")}
                      </Typography>
                    </Box>
                    <Chip
                      label="LIVE"
                      size="small"
                      sx={{
                        color: "#fff",
                        bgcolor: alpha("#fff", 0.1),
                        border: "1px solid",
                        borderColor: alpha("#fff", 0.12),
                        fontWeight: 900,
                      }}
                    />
                  </Stack>

                  <Stack sx={{ gap: 1.1, mt: 3 }}>
                    {[
                      [t("homeMockNew"), t("table") + " 08", t("today")],
                      [t("homeMockReady"), "Order #1048", t("homeOneMinute")],
                      [t("homeMockCall"), t("table") + " 04", t("homeTwoMinutes")],
                    ].map(([title, detail, time], index) => (
                      <Box
                        key={title}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.2,
                          p: 1.25,
                          borderRadius: 2.4,
                          bgcolor: alpha("#fff", 0.075),
                        }}
                      >
                        <Box
                          sx={{
                            width: 9,
                            height: 9,
                            borderRadius: "50%",
                            bgcolor: index === 2 ? "primary.main" : "#65D6A6",
                            flexShrink: 0,
                          }}
                        />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            {title}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.56 }}>
                            {detail}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ opacity: 0.48 }}>
                          {time}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                <Grid container spacing={1.2} sx={{ mt: 1.2 }}>
                  {[
                    [QrCode2RoundedIcon, "QR"],
                    [ShoppingBagRoundedIcon, t("homeMockOrders")],
                    [NotificationsActiveRoundedIcon, t("homeMockService")],
                    [InsightsRoundedIcon, t("homeMockAnalytics")],
                  ].map(([Icon, label]) => (
                    <Grid size={{ xs: 6 }} key={label}>
                      <Box
                        sx={{
                          p: 1.3,
                          borderRadius: 2.5,
                          border: "1px solid",
                          borderColor: (theme) =>
                            alpha(theme.palette.secondary.main, 0.08),
                          bgcolor: (theme) =>
                            alpha(theme.palette.background.paper, 0.55),
                        }}
                      >
                        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                          <Icon sx={{ color: "primary.main", fontSize: 18 }} />
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            {label}
                          </Typography>
                        </Stack>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </GlassCard>

              <GlassCard
                sx={{
                  position: "absolute",
                  left: { xs: -4, sm: -26 },
                  bottom: { xs: -24, sm: -26 },
                  p: 1.5,
                  borderRadius: 3,
                  maxWidth: 210,
                  transform: "rotate(-3deg)",
                }}
              >
                <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 2,
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                    }}
                  >
                    <QrCode2RoundedIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t("homeTableLink")}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>
                      /menu/cafe/8
                    </Typography>
                  </Box>
                </Stack>
              </GlassCard>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mb: { xs: 10, md: 14 } }}>
          <Stack sx={{ alignItems: "center", textAlign: "center", mb: 5 }}>
            <Typography
              variant="overline"
              sx={{ color: "primary.main", fontWeight: 950, letterSpacing: 2 }}
            >
              {t("homeViewEyebrow")}
            </Typography>
            <Typography
              component="h2"
              sx={{
                mt: 0.7,
                fontSize: { xs: "2rem", md: "3rem" },
                fontWeight: 950,
                letterSpacing: "-0.04em",
                color: "secondary.main",
              }}
            >
              {t("homeViewTitle")}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ mt: 1.2, maxWidth: 650, lineHeight: 1.85 }}
            >
              {t("homeViewText")}
            </Typography>
          </Stack>

          <Grid container spacing={2.2}>
            {features.map((feature) => (
              <Grid size={{ xs: 12, md: 4 }} key={t(feature.title)}>
                <GlassCard
                  sx={{
                    height: "100%",
                    borderRadius: 4,
                    p: { xs: 2.4, md: 3 },
                    transition: "transform .25s ease, box-shadow .25s ease",
                    "&:hover": {
                      transform: "translateY(-6px)",
                      boxShadow: "0 24px 70px rgba(23, 26, 47, 0.12)",
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
                  >
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 2.6,
                        display: "grid",
                        placeItems: "center",
                        color: "primary.main",
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography
                      sx={{
                        fontSize: "0.82rem",
                        fontWeight: 950,
                        color: (theme) =>
                          alpha(theme.palette.secondary.main, 0.34),
                      }}
                    >
                      {feature.eyebrow}
                    </Typography>
                  </Stack>

                  <Typography
                    sx={{
                      mt: 2.5,
                      fontWeight: 900,
                      fontSize: "1.15rem",
                      color: "secondary.main",
                    }}
                  >
                    {t(feature.title)}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{ mt: 1, lineHeight: 1.9 }}
                  >
                    {t(feature.text)}
                  </Typography>
                </GlassCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Grid
          container
          spacing={{ xs: 3, md: 6 }}
          sx={{ alignItems: "center", mb: { xs: 10, md: 14 } }}
        >
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography
              variant="overline"
              sx={{ color: "primary.main", fontWeight: 950, letterSpacing: 2 }}
            >
              {t("homeFlowEyebrow")}
            </Typography>
            <Typography
              component="h2"
              sx={{
                mt: 0.8,
                fontSize: { xs: "2rem", md: "3rem" },
                fontWeight: 950,
                letterSpacing: "-0.045em",
                color: "secondary.main",
              }}
            >
              {t("homeFlowTitle")}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.9 }}>
              {t("homeFlowText")}
            </Typography>

            <Stack sx={{ gap: 1.1, mt: 3 }}>
              {[
                t("homeBenefits1"),
                t("homeQrBenefit"),
                t("homeBenefits2"),
                t("homeBenefits3"),
              ].map((item) => (
                <Stack
                  key={item}
                  direction="row"
                  sx={{ alignItems: "center", gap: 1 }}
                >
                  <CheckCircleRoundedIcon
                    sx={{ fontSize: 19, color: "primary.main" }}
                  />
                  <Typography sx={{ fontWeight: 750, color: "text.secondary" }}>
                    {item}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <GlassCard
              sx={{
                borderRadius: 4.5,
                p: { xs: 2, sm: 3 },
                bgcolor: alpha("#fff", 0.58),
              }}
            >
              <Grid container spacing={1.2}>
                {steps.map((step, index) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={step.number}>
                    <Box
                      sx={{
                        height: "100%",
                        p: { xs: 1.8, sm: 2.2 },
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: (theme) =>
                          alpha(theme.palette.secondary.main, 0.07),
                        bgcolor: (theme) =>
                          index === 0
                            ? alpha(theme.palette.primary.main, 0.07)
                            : alpha(theme.palette.background.paper, 0.5),
                      }}
                    >
                      <Stack direction="row" sx={{ alignItems: "center", gap: 1.2 }}>
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            display: "grid",
                            placeItems: "center",
                            borderRadius: 2.3,
                            flexShrink: 0,
                            bgcolor:
                              index === 0
                                ? "primary.main"
                                : (theme) =>
                                    alpha(theme.palette.secondary.main, 0.06),
                            color: index === 0 ? "#fff" : "secondary.main",
                          }}
                        >
                          {step.icon}
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 900, color: "text.secondary" }}
                          >
                            {t("homeStepLabel")} {step.number}
                          </Typography>
                          <Typography sx={{ fontWeight: 900 }}>
                            {t(step.title)}
                          </Typography>
                        </Box>
                      </Stack>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1.4, lineHeight: 1.8 }}
                      >
                        {t(step.text)}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </GlassCard>
          </Grid>
        </Grid>

        <Box sx={{ mb: { xs: 10, md: 14 } }}>
          <Stack sx={{ alignItems: "center", textAlign: "center", mb: 5 }}>
            <Typography
              variant="overline"
              sx={{ color: "primary.main", fontWeight: 950, letterSpacing: 2 }}
            >
              {t("homeRolesEyebrow")}
            </Typography>
            <Typography
              component="h2"
              sx={{
                mt: 0.7,
                fontSize: { xs: "2rem", md: "3rem" },
                fontWeight: 950,
                letterSpacing: "-0.045em",
                color: "secondary.main",
              }}
            >
              {t("homeRolesTitle")}
            </Typography>
          </Stack>

          <Grid container spacing={2.2}>
            {roles.map((role) => (
              <Grid size={{ xs: 12, md: 4 }} key={t(role.title)}>
                <GlassCard
                  sx={{
                    borderRadius: 4,
                    p: 2.8,
                    height: "100%",
                  }}
                >
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 2.5,
                      color: "secondary.main",
                      bgcolor: (theme) =>
                        alpha(theme.palette.secondary.main, 0.06),
                    }}
                  >
                    {role.icon}
                  </Box>
                  <Typography
                    sx={{ mt: 2.3, fontWeight: 900, fontSize: "1.15rem" }}
                  >
                    {t(role.title)}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{ mt: 1, lineHeight: 1.9 }}
                  >
                    {t(role.text)}
                  </Typography>
                </GlassCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        <GlassCard
          sx={{
            borderRadius: 5,
            p: { xs: 3, md: 5 },
            mb: 5,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              width: 300,
              height: 300,
              borderRadius: "50%",
              top: -180,
              left: -120,
              background: (theme) =>
                "radial-gradient(circle, " +
                alpha(theme.palette.primary.main, 0.14) +
                ", transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <Grid container spacing={3} sx={{ alignItems: "center", position: "relative" }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography
                sx={{
                  fontSize: { xs: "1.8rem", md: "2.55rem" },
                  fontWeight: 950,
                  letterSpacing: "-0.04em",
                  color: "secondary.main",
                }}
              >
                {t("homeCtaTitle")}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 1.2, maxWidth: 650, lineHeight: 1.9 }}
              >
                {t("homeCtaText")}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack
                direction={{ xs: "column", sm: "row", md: "column" }}
                sx={{ gap: 1.2, justifyContent: "center", alignItems: "stretch" }}
              >
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowBackRoundedIcon />}
                  sx={{
                    borderRadius: 2.7,
                    py: 1.35,
                    fontWeight: 900,
                  }}
                >
                  {t("homeCtaStart")}
                </Button>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  size="large"
                  sx={{
                    borderRadius: 2.7,
                    py: 1.35,
                    fontWeight: 850,
                  }}
                >
                  {t("homeLogin")}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </GlassCard>

        <Divider sx={{ mb: 2.5 }} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 1.5,
            pb: 2,
          }}
        >
          <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
            <Box
              component="img"
              src="/logo-icon.webp"
              alt="SERVIO"
              sx={{ width: 30, height: 30, objectFit: "contain" }}
            />
            <Typography sx={{ fontWeight: 900, color: "secondary.main" }}>
              SERVIO
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {t("homeFooterText")}
          </Typography>
        </Stack>
        <TrialNotice />
      </Container>
    </Box>
  );
}
