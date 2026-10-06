import { useCallback, useEffect, useState } from "react";
import { Button, Chip, CircularProgress, Stack } from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { reconnectSavedPrinters } from "../../utils/qzPrinting";

const INITIAL_STATE = {
  status: "connecting",
  discoveredCount: 0,
  savedCount: 0,
  readyCount: 0,
  missingCount: 0,
  missingPrinterNames: [],
};

export default function PrinterBridgeStatus({ language = "ar", categoryPrinterNames = [] }) {
  const [state, setState] = useState(INITIAL_STATE);
  const isArabic = language !== "en";
  const categoryPrinterNamesKey = JSON.stringify([...new Set((Array.isArray(categoryPrinterNames) ? categoryPrinterNames : [])
    .filter((name) => typeof name === "string" && name.trim())
    .map((name) => name.trim()))]);

  const reconnect = useCallback(async () => {
    setState((current) => ({ ...current, status: "connecting" }));
    try {
      const result = await reconnectSavedPrinters(JSON.parse(categoryPrinterNamesKey));
      setState({
        status: "connected",
        discoveredCount: result.availablePrinters.length,
        savedCount: result.savedPrinterNames.length,
        readyCount: result.matchedPrinters.length,
        missingCount: result.missingPrinters.length,
        missingPrinterNames: result.missingPrinters,
      });
    } catch {
      setState({ ...INITIAL_STATE, status: "error" });
    }
  }, [categoryPrinterNamesKey]);

  useEffect(() => {
    void reconnect();
  }, [reconnect]);

  const label = state.status === "connecting"
    ? (isArabic ? "جارٍ الاتصال بـ QZ Tray…" : "Connecting to QZ Tray…")
    : state.status === "error"
      ? (isArabic ? "QZ Tray غير متصل" : "QZ Tray disconnected")
      : state.missingCount > 0
        ? (isArabic
          ? `QZ متصل · ${state.missingCount} من الطابعات المحفوظة غير متاحة`
          : `QZ connected · ${state.missingCount} saved printer(s) unavailable`)
        : state.savedCount > 0
          ? (isArabic
            ? `QZ متصل · استُعيدت ${state.readyCount} من ${state.savedCount} طابعة محفوظة`
            : `QZ connected · restored ${state.readyCount} of ${state.savedCount} saved printer(s)`)
          : state.discoveredCount > 0
            ? (isArabic
              ? `QZ متصل · اكتُشفت ${state.discoveredCount} طابعة؛ اخترها مرة واحدة`
              : `QZ connected · ${state.discoveredCount} printer(s) found; select once to save`)
            : (isArabic ? "QZ متصل · لا توجد طابعات مكتشفة" : "QZ connected · no printers found");

  const missingSummary = state.missingPrinterNames.slice(0, 3).join(isArabic ? "، " : ", ");
  const additionalMissingCount = Math.max(0, state.missingPrinterNames.length - 3);
  const statusLabel = state.missingCount > 0
    ? `${label}${missingSummary ? ` · ${missingSummary}` : ""}${additionalMissingCount ? ` +${additionalMissingCount}` : ""}`
    : label;

  const color = state.status === "error"
    ? "error"
    : state.status === "connected" && state.savedCount > 0 && state.missingCount === 0
      ? "success"
      : state.status === "connected"
        ? "warning"
        : "default";

  return (
    <Stack
      role="status"
      aria-live="polite"
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ xs: "stretch", sm: "center" }}
      spacing={0.75}
      sx={{ minWidth: 0, width: { xs: "100%", sm: "auto" } }}
    >
      <Chip
        size="small"
        color={color}
        icon={state.status === "connecting" ? <CircularProgress size={13} color="inherit" /> : undefined}
        label={statusLabel}
        sx={{
          maxWidth: "100%",
          height: "auto",
          minHeight: 30,
          justifyContent: "flex-start",
          "& .MuiChip-label": { display: "block", whiteSpace: "normal", py: 0.45 },
        }}
      />
      <Button
        size="small"
        variant="text"
        startIcon={state.status === "connecting" ? <CircularProgress size={15} /> : <RefreshRoundedIcon />}
        onClick={reconnect}
        disabled={state.status === "connecting"}
        sx={{ minHeight: 40, whiteSpace: "nowrap", alignSelf: { xs: "flex-start", sm: "center" }, fontWeight: 800 }}
      >
        {isArabic ? "إعادة الاتصال" : "Reconnect"}
      </Button>
    </Stack>
  );
}
