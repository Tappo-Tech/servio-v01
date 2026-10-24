import { useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Tab, Tabs, TextField } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useBranch } from "../../context/BranchContext";
import { useLanguage } from "../../context/LanguageContext";

export default function BranchTabs() {
  const { branches, selectedBranchId, selectBranch, createBranch } = useBranch();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const ar = language !== "en";
  const submit = async () => {
    const result = await createBranch(name);
    if (result.error) { setError(result.error.message); return; }
    setName(""); setError(""); setOpen(false);
  };
  return <>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, p: .75, borderRadius: 3, bgcolor: "rgba(255,255,255,.72)", border: "1px solid", borderColor: "divider", overflowX: "auto" }}>
      <Tabs value={selectedBranchId || false} onChange={(_, value) => selectBranch(value)} variant="scrollable" scrollButtons="auto" sx={{ minHeight: 44, flex: 1, "& .MuiTab-root": { minHeight: 44, fontWeight: 850, whiteSpace: "nowrap" } }} aria-label={ar ? "فروع النشاط" : "Business branches"}>
        {branches.map((branch) => <Tab key={branch.id} value={branch.id} label={branch.name} />)}
      </Tabs>
      <Button size="small" variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)} sx={{ flexShrink: 0, borderRadius: 2, fontWeight: 850, whiteSpace: "nowrap" }}>{ar ? "إضافة فرع" : "Add branch"}</Button>
    </Box>
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
      <DialogTitle>{ar ? "إضافة فرع" : "Add branch"}</DialogTitle>
      <DialogContent><TextField autoFocus fullWidth margin="dense" label={ar ? "اسم الفرع" : "Branch name"} value={name} onChange={(e) => setName(e.target.value)} error={Boolean(error)} helperText={error} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} /></DialogContent>
      <DialogActions><Button onClick={() => setOpen(false)}>{ar ? "إلغاء" : "Cancel"}</Button><Button variant="contained" onClick={submit}>{ar ? "حفظ" : "Save"}</Button></DialogActions>
    </Dialog>
  </>;
}
