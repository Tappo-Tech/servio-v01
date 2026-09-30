import { useEffect, useState } from "react";
import { Alert, Box, Button, Divider, List, ListItem, ListItemText, Paper, Stack, TextField, Typography } from "@mui/material";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import supabase from "../../../supabase";

function CashierManagement() {
  const [cashiers, setCashiers] = useState([]);
  const [form, setForm] = useState({ full_name: "", username: "", pin: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadCashiers = async () => {
    const { data, error: loadError } = await supabase.from("cashiers").select("id, full_name, username, created_at").order("created_at", { ascending: false });
    if (loadError) setError(loadError.message);
    else setCashiers(data || []);
  };
  useEffect(() => { loadCashiers(); }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(""); setError("");
    if (!form.full_name || !form.username || !/^\d{4,6}$/.test(form.pin)) return setError("أدخل الاسم واسم المستخدم وPIN من 4 إلى 6 أرقام");
    setLoading(true);
    const { data, error: createError } = await supabase.rpc("create_cashier", { p_full_name: form.full_name, p_username: form.username, p_pin: form.pin });
    if (createError) setError(createError.message.includes("duplicate") ? "اسم المستخدم مستخدم بالفعل داخل هذا الكافيه" : createError.message);
    else { setMessage("تم إنشاء الكاشير بنجاح"); setForm({ full_name: "", username: "", pin: "" }); if (data) await loadCashiers(); }
    setLoading(false);
  };

  return <Box sx={{ maxWidth: 760, mx: "auto" }}><Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>إدارة الكاشير</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>أنشئ حسابات كاشير مستقلة لكل فرع مع PIN مشفّر ومستخدم داخل نطاق الكافيه فقط.</Typography>{message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<Paper component="form" onSubmit={handleSubmit} variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}><Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}><TextField size="small" fullWidth label="الاسم بالكامل" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /><TextField size="small" fullWidth label="اسم المستخدم" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} /><TextField size="small" fullWidth label="PIN" type="password" inputProps={{ inputMode: "numeric", maxLength: 6 }} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })} /><Button type="submit" variant="contained" disabled={loading} startIcon={<PersonAddAltIcon />} sx={{ minWidth: 140, fontWeight: 700 }}>{loading ? "جاري الحفظ" : "إضافة كاشير"}</Button></Stack></Paper><Divider sx={{ mb: 1 }} /><List disablePadding>{cashiers.map((cashier) => <ListItem key={cashier.id} sx={{ px: 1, borderBottom: "1px solid", borderColor: "divider" }}><ListItemText primary={cashier.full_name} secondary={`@${cashier.username}`} /><Typography variant="caption" color="text.secondary">PIN مشفّر</Typography></ListItem>)}{cashiers.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>لا يوجد كاشير مسجل حتى الآن.</Typography>}</List></Box>;
}
export default CashierManagement;
