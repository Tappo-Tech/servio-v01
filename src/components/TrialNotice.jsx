import { Box, Typography } from "@mui/material";
import { useLanguage } from "../context/LanguageContext";

// إفصاح ثابت وهادئ للزوار: SERVIO حاليًا منتج تجريبي وليس كيانًا تجاريًا مسجلًا.
export default function TrialNotice() {
  const { language } = useLanguage();
  const message = language === "en"
    ? "SERVIO is currently in a product trial and proof-of-concept phase. It is not a registered company at this time; features may change during the trial."
    : "SERVIO خدمة في فترة تجربة المنتج وإثبات المفهوم حاليًا، وليست شركة مسجّلة حتى الآن. قد تتغير الميزات خلال فترة التجربة.";

  return (
    <Box
      component="footer"
      role="note"
      aria-label={language === "en" ? "Service trial notice" : "تنويه فترة التجربة"}
      sx={{
        mt: { xs: 4, md: 6 },
        pt: 2,
        pb: 1,
        px: 1.5,
        borderTop: "1px solid rgba(23,26,47,.1)",
        color: "text.secondary",
      }}
    >
      <Typography
        variant="caption"
        component="p"
        align="center"
        sx={{ maxWidth: 900, mx: "auto", lineHeight: 1.9, fontWeight: 600 }}
      >
        {message}
      </Typography>
    </Box>
  );
}
