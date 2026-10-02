import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
import { useLanguage } from "../context/LanguageContext";

/** زر لغة موحد؛ اتجاهه ثابت حتى لا ينقلب مع RTL/LTR. */
export default function LanguageToggle({ compact = false }) {
  const { language, setLanguage } = useLanguage();

  return (
    <ToggleButtonGroup
      exclusive
      value={language}
      onChange={(_, value) => value && setLanguage(value)}
      size="small"
      aria-label="Language"
      sx={{
        direction: "ltr",
        borderRadius: 99,
        overflow: "hidden",
        border: "1px solid rgba(23,26,47,.10)",
        background: "linear-gradient(135deg, rgba(255,255,255,.96), rgba(247,249,252,.82))",
        boxShadow: "0 8px 22px rgba(23,26,47,.08)",
        backdropFilter: "blur(12px)",
        p: 0.35,
      }}
    >
      <Box sx={{ display: "grid", placeItems: "center", width: compact ? 25 : 29, color: "primary.main" }}>
        <TranslateRoundedIcon sx={{ fontSize: compact ? 16 : 18 }} />
      </Box>
      <ToggleButton
        value="ar"
        aria-label="العربية"
        sx={{
          px: compact ? 0.8 : 1.05,
          py: 0.5,
          border: 0,
          borderRadius: 99,
          fontWeight: 900,
          fontSize: ".73rem",
          minWidth: compact ? 26 : 42,
          color: "text.secondary",
          "&.Mui-selected": { bgcolor: "primary.main", color: "primary.contrastText", boxShadow: "0 4px 12px rgba(244,121,32,.28)" },
        }}
      >
        {compact ? "ع" : "عربي"}
      </ToggleButton>
      <ToggleButton
        value="en"
        aria-label="English"
        sx={{
          px: compact ? 0.8 : 1.05,
          py: 0.5,
          border: 0,
          borderRadius: 99,
          fontWeight: 900,
          fontSize: ".73rem",
          minWidth: compact ? 26 : 42,
          color: "text.secondary",
          "&.Mui-selected": { bgcolor: "primary.main", color: "primary.contrastText", boxShadow: "0 4px 12px rgba(244,121,32,.28)" },
        }}
      >
        {compact ? "E" : "EN"}
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
