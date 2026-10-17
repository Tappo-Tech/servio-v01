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
        position: "fixed",
        insetBlockStart: 10,
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

function withPaperFullscreen(slotProps, expanded, drawerSx) {
  const paper = slotProps?.paper || {};
  const existingSx = paper.sx;
  const paperSx = [
    ...(Array.isArray(existingSx) ? existingSx : existingSx ? [existingSx] : []),
    ...(expanded ? [{
      width: "100vw !important",
      maxWidth: "100vw !important",
      height: "100dvh !important",
      maxHeight: "100dvh !important",
      borderRadius: 0,
      boxSizing: "border-box",
      ...drawerSx,
    }] : []),
  ];
  return { ...slotProps, paper: { ...paper, sx: paperSx } };
}

function FullscreenDrawer({ children, slotProps, PaperProps, language = "ar", ...props }) {
  const [expanded, setExpanded] = useState(false);
  const nextSlotProps = withPaperFullscreen(slotProps, expanded);
  return (
    <Drawer {...props} slotProps={nextSlotProps} PaperProps={PaperProps}>
      <FullscreenButton expanded={expanded} onClick={() => setExpanded((value) => !value)} language={language} />
      {children}
    </Drawer>
  );
}

function FullscreenSwipeableDrawer({ children, slotProps, PaperProps, language = "ar", ...props }) {
  const [expanded, setExpanded] = useState(false);
  const nextSlotProps = withPaperFullscreen(slotProps, expanded, { inset: 0 });
  return (
    <SwipeableDrawer {...props} slotProps={nextSlotProps} PaperProps={PaperProps}>
      <FullscreenButton expanded={expanded} onClick={() => setExpanded((value) => !value)} language={language} />
      {children}
    </SwipeableDrawer>
  );
}

export { FullscreenDialog, FullscreenDrawer, FullscreenSwipeableDrawer };
