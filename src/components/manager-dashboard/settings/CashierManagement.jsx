import { useEffect, useState } from "react";
import { Alert, Avatar, Box, Button, Chip, IconButton, InputAdornment, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import supabase from "../../../supabase";
import { useStore } from "../../../context/StoreInfoContext";
import { useLanguage } from "../../../context/LanguageContext";

const emptyForm = { full_name: "", username: "", pin: "" };

function CashierManagement() {
  const { t } = useLanguage();
  const { storeInfo } = useStore();
  const [cashiers, setCashiers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showPin, setShowPin] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loginLink = storeInfo?.store_slug ? `${window.location.origin}/cashier/${storeInfo.store_slug}` : "";

  const loadCashiers = async () => {
    const { data, error: loadError } = await supabase.from("cashiers").select("id, full_name, username, created_at").order("created_at", { ascending: false });
    if (loadError) setError(loadError.message);
    else setCashiers(data || []);
  };
  useEffect(() => { loadCashiers(); }, []);

  const generatePin = () => setForm((prev) => ({ ...prev, pin: String(Math.floor(1000 + Math.random() * 9000)) }));

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(loginLink); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard unavailable */ }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(""); setError("");
    const username = form.username.trim().toLowerCase();
    if (!form.full_name.trim() || !username || !/^\d{4,6}$/.test(form.pin)) return setError(t("managerCashierValidation"));
    setLoading(true);
    const { error: createError } = await supabase.rpc("create_cashier", { p_full_name: form.full_name.trim(), p_username: username, p_pin: form.pin });
    if (createError) setError(createError.message.includes("duplicate") ? t("managerDuplicateUsername") : createError.message);
    else { setMessage(`${t("managerCashierCreated")}: ${username} — PIN: ${form.pin}`); setForm(emptyForm); await loadCashiers(); }
    setLoading(false);
  };

  return (
    <Box sx={{ maxWidth: 760, mx: "auto" }}>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>{t("managerCashierTitle")}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t("managerCashierHint")}</Typography>

      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loginLink && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">{t("managerCashierLink")}</Typography>
            <Typography variant="body2" sx={{ direction: "ltr", textAlign: "right", overflowWrap: "anywhere", fontWeight: 600 }}>{loginLink}</Typography>
          </Box>
          <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} onClick={copyLink}>{copied ? t("managerCopied") : t("managerCopy")}</Button>
        </Paper>
      )}

      <Paper component="form" onSubmit={handleSubmit} variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>{t("managerAddCashier")}</Typography>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
          <TextField size="small" fullWidth label={t("managerFullName")} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <TextField size="small" fullWidth label={t("managerUsername")} helperText={t("managerUsernameHint")} inputProps={{ dir: "ltr" }} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })} />
          <TextField
            size="small" fullWidth label={t("managerPin")} type={showPin ? "text" : "password"}
            inputProps={{ inputMode: "numeric", maxLength: 6, dir: "ltr" }} value={form.pin}
            onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })}
            InputProps={{ endAdornment: (
              <InputAdornment position="end">
                <Tooltip title={t("managerGeneratePin")}><IconButton size="small" onClick={generatePin} color="primary"><AutorenewIcon fontSize="small" /></IconButton></Tooltip>
                <IconButton size="small" onClick={() => setShowPin((v) => !v)}>{showPin ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton>
              </InputAdornment>
            ) }}
          />
          <Button type="submit" variant="contained" disabled={loading} startIcon={<PersonAddAltIcon />} sx={{ fontWeight: 700, py: 1 }}>{loading ? t("managerSaving") : t("managerAddCashier")}</Button>
        </Box>
      </Paper>

      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{t("managerRegisteredCashiers")} ({cashiers.length})</Typography>
      <Stack spacing={1}>
        {cashiers.map((cashier) => (
          <Paper key={cashier.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ bgcolor: "primary.main" }}>{(cashier.full_name || "?").trim().charAt(0)}</Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700 }} noWrap>{cashier.full_name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ direction: "ltr", textAlign: "right" }} noWrap>@{cashier.username}</Typography>
            </Box>
            <Chip size="small" label={t("managerEncryptedPin")} />
          </Paper>
        ))}
        {cashiers.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>{t("managerNoCashiers")}</Typography>}
      </Stack>
    </Box>
  );
}
export default CashierManagement;
