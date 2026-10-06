import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useLanguage } from "../../../context/LanguageContext";

export default function AddonComplementDrawer({ open, onClose, items = [], onAdd, onDelete }) {
  const { language } = useLanguage();
  const isArabic = language !== "en";
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const text = isArabic
    ? {
      title: "مكتبة المكملات", subtitle: "أضف أسماء شائعة مثل الصوص والعسل والليمون مرة واحدة، ثم اخترها عند إعداد إضافات كل صنف.",
      name: "اسم المكمل", placeholder: "مثال: صوص الثوم", add: "إضافة المكمل", empty: "لا توجد مكملات محفوظة بعد.",
      note: "حذف الاسم من المكتبة لا يزيله من الأصناف التي سبق ربطها به.", close: "إغلاق", duplicate: "قد يكون هذا الاسم مضافًا من قبل.",
    }
    : {
      title: "Complements library", subtitle: "Save common add-on names such as sauce, honey, and lemon once, then reuse them when configuring each item.",
      name: "Complement name", placeholder: "Example: garlic sauce", add: "Add complement", empty: "No saved complements yet.",
      note: "Removing a name from this library does not remove it from items already configured with it.", close: "Close", duplicate: "This name may already exist.",
    };

  useEffect(() => {
    if (open) {
      setName("");
      setError("");
    }
  }, [open]);

  const handleAdd = async (event) => {
    event.preventDefault();
    const cleanName = name.trim().replace(/\s+/g, " ");
    if (!cleanName || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await onAdd?.(cleanName);
      if (result?.error) throw result.error;
      setName("");
    } catch (cause) {
      setError(cause?.message || text.duplicate);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (item) => {
    if (busyId) return;
    setBusyId(item.id);
    setError("");
    try {
      const result = await onDelete?.(item.id);
      if (result?.error) throw result.error;
    } catch (cause) {
      setError(cause?.message || (isArabic ? "تعذر حذف المكمل." : "Could not remove the complement."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Drawer
      anchor={isArabic ? "right" : "left"}
      open={open}
      onClose={onClose}
      sx={(theme) => ({ zIndex: theme.zIndex.drawer + 4, "& .MuiDrawer-paper": { zIndex: theme.zIndex.drawer + 4, width: { xs: "100%", sm: 440 }, boxSizing: "border-box" } })}
    >
      <Box dir={isArabic ? "rtl" : "ltr"} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ p: 2.25, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
          <Box>
            <Typography variant="h6" fontWeight={950}>{text.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{text.subtitle}</Typography>
          </Box>
          <IconButton onClick={onClose} aria-label={text.close}><CloseRoundedIcon /></IconButton>
        </Box>
        <Divider />
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 2.25 }}>
          <Box component="form" onSubmit={handleAdd} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
            <TextField fullWidth size="small" label={text.name} placeholder={text.placeholder} value={name} onChange={(event) => setName(event.target.value.slice(0, 100))} inputProps={{ maxLength: 100 }} />
            <Button type="submit" variant="contained" disabled={busy || !name.trim()} startIcon={busy ? <CircularProgress size={17} color="inherit" /> : <AddRoundedIcon />} sx={{ minHeight: 40, whiteSpace: "nowrap", fontWeight: 850 }}>
              {text.add}
            </Button>
          </Box>
          {error && <Alert severity="error" sx={{ mt: 1.25 }}>{error}</Alert>}
          <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2 }}>{text.note}</Alert>
          <Typography variant="subtitle2" fontWeight={900} sx={{ mt: 2.5, mb: 0.75 }}>
            {isArabic ? `المكملات المحفوظة (${items.length})` : `Saved complements (${items.length})`}
          </Typography>
          {items.length ? (
            <List disablePadding>
              {items.map((item) => (
                <ListItem key={item.id} disableGutters secondaryAction={(
                  <IconButton edge="end" color="error" aria-label={isArabic ? `حذف ${item.name}` : `Remove ${item.name}`} onClick={() => handleDelete(item)} disabled={Boolean(busyId)}>
                    {busyId === item.id ? <CircularProgress size={18} /> : <DeleteOutlineRoundedIcon />}
                  </IconButton>
                )} sx={{ borderBottom: "1px solid", borderColor: "divider", px: 0.25 }}>
                  <ListItemText primary={item.name} primaryTypographyProps={{ fontWeight: 800 }} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Stack alignItems="center" sx={{ py: 5 }}><Typography color="text.secondary">{text.empty}</Typography></Stack>
          )}
        </Box>
        <Divider />
        <Box sx={{ p: 2.25 }}><Button fullWidth variant="outlined" color="inherit" onClick={onClose}>{text.close}</Button></Box>
      </Box>
    </Drawer>
  );
}
