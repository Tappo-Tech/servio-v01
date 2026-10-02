import { Component } from "react";
import { useLanguage } from "../context/LanguageContext";
import { Box, Button, Typography } from "@mui/material";

function ErrorBoundaryView({ error }) {
  const { t, language } = useLanguage();
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center", p: 3 }} dir={language === "ar" ? "rtl" : "ltr"}>
      <Box>
        <Typography variant="h5" fontWeight={800} mb={1}>{t("unexpectedError")}</Typography>
        <Typography color="text.secondary" mb={2}>{String(error?.message || "")}</Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>{t("reloadPage")}</Button>
      </Box>
    </Box>
  );
}

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("TAPPO UI error:", error, info?.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    return <ErrorBoundaryView error={this.state.error} />;
  }
}
