import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
import { useLanguage } from "../context/LanguageContext";

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
        borderRadius: 2.5,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "rgba(255,255,255,.72)",
        backdropFilter: "blur(10px)",
      }}
    >
      <ToggleButton
        value="ar"
        aria-label="العربية"
        sx={{ px: compact ? 0.9 : 1.2, py: 0.55, border: 0, fontWeight: 900, fontSize: ".73rem" }}
      >
        {compact ? "ع" : "عربي"}
      </ToggleButton>
      <ToggleButton
        value="en"
        aria-label="English"
        sx={{ px: compact ? 0.9 : 1.2, py: 0.55, border: 0, fontWeight: 900, fontSize: ".73rem" }}
      >
        {compact ? "E" : "EN"}
      </ToggleButton>
      <TranslateRoundedIcon
        sx={{ alignSelf: "center", mx: 0.65, color: "text.secondary", fontSize: 16, pointerEvents: "none" }}
      />
    </ToggleButtonGroup>
  );
}
