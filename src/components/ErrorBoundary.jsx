import { Component } from "react";
import { Box, Button, Typography } from "@mui/material";

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("TAPPO UI error:", error, info?.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center", p: 3 }} dir="rtl">
        <Box>
          <Typography variant="h5" fontWeight={800} mb={1}>حدث خطأ غير متوقع</Typography>
          <Typography color="text.secondary" mb={2}>{String(this.state.error?.message || "")}</Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>إعادة تحميل الصفحة</Button>
        </Box>
      </Box>
    );
  }
}
