import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useLanguage } from "../context/LanguageContext";

/** زر لغة بسيط؛ الإعداد العام للهوم مستقل عن إعداد الكاشير والمدير. */
export default function LanguageToggle({ compact = false }) {
  const { language, setLanguage, t } = useLanguage();
  return (
    <ToggleButtonGroup
      exclusive
      value={language}
      onChange={(_, value) => value && setLanguage(value)}
      size="small"
      aria-label={t("language")}
      sx={{ direction: "ltr", border: "1px solid rgba(23,26,47,.14)", borderRadius: 99, p: "2px", backgroundColor: "rgba(255,255,255,.82)" }}
    >
      <ToggleButton value="ar" aria-label={t("arabicLanguage")} sx={{ border: 0, borderRadius: 99, minWidth: compact ? 27 : 38, px: compact ? .7 : 1, py: .35, fontSize: ".7rem", fontWeight: 800, color: "text.secondary", "&.Mui-selected": { bgcolor: "secondary.main", color: "#fff" } }}>ع</ToggleButton>
      <ToggleButton value="en" aria-label={t("englishLanguage")} sx={{ border: 0, borderRadius: 99, minWidth: compact ? 27 : 38, px: compact ? .7 : 1, py: .35, fontSize: ".7rem", fontWeight: 800, color: "text.secondary", "&.Mui-selected": { bgcolor: "secondary.main", color: "#fff" } }}>EN</ToggleButton>
    </ToggleButtonGroup>
  );
}
