import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import Drawer from "@mui/material/Drawer";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import IconButton from "@mui/material/IconButton";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import CloseFullscreenRoundedIcon from "@mui/icons-material/CloseFullscreenRounded";

function FullscreenButton({ expanded, onClick, language }) {
  const isArabic = language ? language !== "en" : document.documentElement?.dir !== "ltr";
  const label = expanded
    ? (isArabic ? "استعادة حجم النافذة" : "Restore dialog size")
    : (isArabic ? "ملء الشاشة" : "Enter full screen");

  return (
    <IconButton
      aria-label={label}
      title={label}
      onClick={onClick}
      size="small"
      sx={{
        position: "absolute",
        insetBlockStart: 8,
        insetInlineEnd: 56,
        zIndex: 1400,
        width: 36,
        height: 36,
        color: "text.secondary",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 2px 8px rgba(23,26,47,.12)",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      {expanded ? <CloseFullscreenRoundedIcon fontSize="small" /> : <OpenInFullRoundedIcon fontSize="small" />}
    </IconButton>
  );
}

function FullscreenDialog({ children, fullScreen = false, language = "ar", ...props }) {
  const [expanded, setExpanded] = useState(Boolean(fullScreen));
  return (
    <Dialog {...props} fullScreen={expanded}>
      <FullscreenButton expanded={expanded} onClick={() => setExpanded((value) => !value)} language={language} />
      {children}
    </Dialog>
  );
}

// Keep the historic wrapper exports to avoid churn at call sites; only centered Dialogs expand.
function FullscreenDrawer({ language: _language, ...props }) {
  return <Drawer {...props} />;
}

function FullscreenSwipeableDrawer({ language: _language, ...props }) {
  return <SwipeableDrawer {...props} />;
}

export { FullscreenDialog, FullscreenDrawer, FullscreenSwipeableDrawer };
