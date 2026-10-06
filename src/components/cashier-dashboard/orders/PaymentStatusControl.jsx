import {
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useId } from "react";
import { normalizePaymentMethod, normalizePaymentStatus } from "../../../utils/paymentStatus";

const METHOD_LABELS = {
  ar: {
    cash: "نقدًا",
    card: "بطاقة / شبكة (مدى)",
    wallet: "محفظة رقمية",
    transfer: "تحويل بنكي",
    other: "أخرى",
  },
  en: {
    cash: "Cash",
    card: "Card / network (mada)",
    wallet: "Digital wallet",
    transfer: "Bank transfer",
    other: "Other",
  },
};

export default function PaymentStatusControl({
  value,
  method = null,
  onChange,
  onMethodChange,
  disabled = false,
  language = "ar",
}) {
  const isArabic = language !== "en";
  const methodFieldId = useId();
  const text = isArabic
    ? { label: "حالة الدفع", paid: "مدفوع", unpaid: "غير مدفوع", unknown: "غير محدد", method: "طريقة الدفع", methodUnknown: "غير محددة" }
    : { label: "Payment status", paid: "Paid", unpaid: "Unpaid", unknown: "Not set", method: "Payment method", methodUnknown: "Not specified" };
  const status = normalizePaymentStatus(value);
  const paymentMethod = normalizePaymentMethod(method) || "__unset";
  const methodLabels = METHOD_LABELS[isArabic ? "ar" : "en"];

  return (
    <Stack
      direction="column"
      alignItems="stretch"
      spacing={0.85}
      useFlexGap
      sx={{ minWidth: 0, width: "100%" }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} spacing={0.8} flexWrap="wrap" useFlexGap sx={{ minWidth: 0, width: "100%" }}>
        <Typography variant="caption" color="text.secondary" fontWeight={800}>
          {text.label}
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={status}
          disabled={disabled}
          onChange={(_, nextStatus) => {
            if (nextStatus) onChange?.(nextStatus);
          }}
          aria-label={text.label}
          sx={{
            maxWidth: "100%",
            "& .MuiToggleButton-root": { px: 1, py: 0.5, minWidth: 0, whiteSpace: "nowrap", textTransform: "none", fontWeight: 800, borderRadius: "9px !important" },
            gap: 0.55,
            "& .MuiToggleButtonGroup-grouped:not(:first-of-type)": { borderLeft: "1px solid", borderColor: "divider" },
          }}
        >
          <ToggleButton value="paid" aria-pressed={status === "paid"} color="success">{text.paid}</ToggleButton>
          <ToggleButton value="unpaid" aria-pressed={status === "unpaid"} color="warning">{text.unpaid}</ToggleButton>
        </ToggleButtonGroup>
        {!status && <Chip size="small" variant="outlined" label={text.unknown} />}
      </Stack>
      <FormControl size="small" disabled={disabled} sx={{ minWidth: 0, width: "100%", maxWidth: "100%", flex: "none" }}>
        <InputLabel id={`${methodFieldId}-label`}>{text.method}</InputLabel>
        <Select
          labelId={`${methodFieldId}-label`}
          value={paymentMethod}
          label={text.method}
          aria-label={text.method}
          onChange={(event) => onMethodChange?.(event.target.value === "__unset" ? null : event.target.value)}
        >
          <MenuItem value="__unset"><em>{text.methodUnknown}</em></MenuItem>
          {Object.entries(methodLabels).map(([methodValue, label]) => (
            <MenuItem key={methodValue} value={methodValue}>{label}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}
