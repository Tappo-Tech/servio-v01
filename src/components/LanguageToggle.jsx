import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useLanguage } from "../context/LanguageContext";

/** زر لغة موحّد يعمل على الخلفيات الفاتحة والداكنة. */
export default function LanguageToggle({ compact = false, dark = false }) {
  const { language, setLanguage, t } = useLanguage();
  const size = compact ? 27 : 38;
  return (
    <ToggleButtonGroup
      exclusive
      value={language}
      onChange={(_, value) => value && setLanguage(value)}
      size="small"
      aria-label={t("language")}
      sx={{
        direction: "ltr",
        border: `1px solid ${dark ? "rgba(255,255,255,.22)" : "rgba(23,26,47,.14)"}`,
        borderRadius: 99,
        p: "2px",
        backgroundColor: dark ? "rgba(255,255,255,.09)" : "rgba(255,255,255,.82)",
        backdropFilter: "blur(10px)",
        "& .MuiToggleButton-root": { transition: "all .18s ease" },
      }}
    >
      <ToggleButton value="ar" aria-label={t("arabicLanguage")} sx={{ border: 0, borderRadius: 99, minWidth: size, px: compact ? .7 : 1, py: .35, fontSize: ".7rem", fontWeight: 900, color: dark ? "rgba(255,255,255,.7)" : "text.secondary", "&.Mui-selected": { bgcolor: dark ? "primary.main" : "secondary.main", color: "#fff", boxShadow: dark ? "0 3px 10px rgba(244,121,32,.28)" : "none" } }}>ع</ToggleButton>
      <ToggleButton value="en" aria-label={t("englishLanguage")} sx={{ border: 0, borderRadius: 99, minWidth: size, px: compact ? .7 : 1, py: .35, fontSize: ".7rem", fontWeight: 900, color: dark ? "rgba(255,255,255,.7)" : "text.secondary", "&.Mui-selected": { bgcolor: dark ? "primary.main" : "secondary.main", color: "#fff", boxShadow: dark ? "0 3px 10px rgba(244,121,32,.28)" : "none" } }}>EN</ToggleButton>
    </ToggleButtonGroup>
  );
}
