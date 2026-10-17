import { useMemo, useState } from "react";
import { useMenu } from "../../context/MenuContext";
import { useLanguage } from "../../context/LanguageContext";
import { FullscreenDialog as Dialog } from "../common/FullscreenOverlays";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

function IngredientInventory({ canManage = false }) {
  const { ingredients = [], items = [], addIngredient, updateIngredient, setIngredientAvailability, menuLoading, menuError, refreshMenu } = useMenu();
  const { language } = useLanguage();
  const isArabic = language !== "en";
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const relatedItemsByIngredient = useMemo(() => {
    const result = new Map();
    items.forEach((item) => {
      (item.ingredient_ids || []).forEach((ingredientId) => {
        const key = String(ingredientId);
        const linked = result.get(key) || [];
        linked.push(item);
        result.set(key, linked);
      });
    });
    return result;
  }, [items]);

  const filteredIngredients = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(isArabic ? "ar" : "en");
    return [...ingredients]
      .filter((ingredient) => {
        if (!query) return true;
        const linkedNames = (relatedItemsByIngredient.get(String(ingredient.id)) || []).map((item) => item.name).join(" ");
        return `${ingredient.name || ""} ${linkedNames}`.toLocaleLowerCase(isArabic ? "ar" : "en").includes(query);
      })
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), isArabic ? "ar" : "en"));
  }, [ingredients, relatedItemsByIngredient, search, isArabic]);

  const unavailableCount = ingredients.filter((ingredient) => ingredient.available !== true).length;
  const affectedItemCount = items.filter((item) => (item.unavailableIngredients || []).length > 0).length;

  const openAdd = () => {
    setEditingIngredient(null);
    setDraftName("");
    setError("");
    setDialogOpen(true);
  };

  const openEdit = (ingredient) => {
    setEditingIngredient(ingredient);
    setDraftName(ingredient.name || "");
    setError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setEditingIngredient(null);
    setDraftName("");
    setError("");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const normalizedName = draftName.trim().replace(/\s+/g, " ");
    if (!normalizedName || saving) return;
    setSaving(true);
    setError("");
    const result = editingIngredient
      ? await updateIngredient({ ...editingIngredient, name: normalizedName })
      : await addIngredient(normalizedName);
    setSaving(false);
    if (result?.error) {
      setError(result.error.message || (isArabic ? "تعذر حفظ المادة." : "Could not save the ingredient."));
      return;
    }
    setDialogOpen(false);
    setEditingIngredient(null);
    setDraftName("");
  };

  const handleAvailabilityChange = async (ingredient, available) => {
    if (busyId) return;
    setBusyId(ingredient.id);
    setError("");
    const result = await setIngredientAvailability(ingredient.id, available);
    setBusyId(null);
    if (result?.error) setError(result.error.message || (isArabic ? "تعذر تحديث حالة المادة." : "Could not update ingredient status."));
  };

  return (
    <Box sx={{ p: { xs: 0, md: 0.5 }, minWidth: 0 }}>
      <Stack spacing={2.25}>
        <Card elevation={0} sx={{ p: { xs: 2, sm: 2.75 }, borderRadius: { xs: 3, md: 4 }, border: "1px solid rgba(255,255,255,.78)", background: "linear-gradient(125deg, rgba(255,255,255,.92) 0%, rgba(255,249,242,.92) 100%)", boxShadow: "0 16px 42px rgba(23,26,47,.055)" }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: "rgba(244,121,32,.12)", color: "primary.main" }}>
                <Inventory2OutlinedIcon />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: "-.02em" }}>
                  {isArabic ? "إدارة المخزون" : "Inventory management"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, maxWidth: 760 }}>
                  {canManage
                    ? (isArabic ? "أضف المواد التي تدخل في الأصناف واربطها بها. عند تسجيل نفاد مادة، تتوقف كل الأصناف المرتبطة عن الظهور للطلب والبيع." : "Add ingredients and link them to menu items. Marking an ingredient unavailable stops every linked item from being ordered or sold.")
                    : (isArabic ? "حدّث توفر المواد عند نفادها أو إعادة توفيرها؛ ستتحدث الأصناف المرتبطة تلقائيًا." : "Update ingredient availability when stock runs out or is replenished; linked menu items update automatically.")}
                </Typography>
              </Box>
            </Stack>
            {canManage && (
              <Button onClick={openAdd} variant="contained" startIcon={<AddRoundedIcon />} sx={{ borderRadius: 2.5, fontWeight: 900, whiteSpace: "nowrap", minHeight: 44 }}>
                {isArabic ? "إضافة مادة" : "Add ingredient"}
              </Button>
            )}
          </Stack>
        </Card>

        {error && <Alert severity="error" onClose={() => setError("")} sx={{ borderRadius: 2.5 }}>{error}</Alert>}

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card elevation={0} sx={{ p: 2, borderRadius: 3, height: "100%", border: "1px solid", borderColor: "divider", background: "rgba(255,255,255,.82)" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={800}>{isArabic ? "المواد المسجلة" : "Ingredients"}</Typography>
              <Typography variant="h4" fontWeight={950} sx={{ mt: 0.5 }}>{ingredients.length}</Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card elevation={0} sx={{ p: 2, borderRadius: 3, height: "100%", border: "1px solid", borderColor: "divider", background: "rgba(255,255,255,.82)" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={800}>{isArabic ? "مواد مسجلة كنافدة" : "Unavailable ingredients"}</Typography>
              <Typography variant="h4" fontWeight={950} color={unavailableCount ? "warning.dark" : "text.primary"} sx={{ mt: 0.5 }}>{unavailableCount}</Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card elevation={0} sx={{ p: 2, borderRadius: 3, height: "100%", border: "1px solid", borderColor: "divider", background: "rgba(255,255,255,.82)" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={800}>{isArabic ? "أصناف متأثرة بنفاد مادة" : "Menu items affected"}</Typography>
              <Typography variant="h4" fontWeight={950} color={affectedItemCount ? "error.main" : "text.primary"} sx={{ mt: 0.5 }}>{affectedItemCount}</Typography>
            </Card>
          </Grid>
        </Grid>

        <TextField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          size="small"
          placeholder={isArabic ? "ابحث عن مادة أو صنف مرتبط بها" : "Search ingredients or linked items"}
          InputProps={{ startAdornment: <SearchRoundedIcon sx={{ mr: 1, color: "text.secondary" }} /> }}
          sx={{ maxWidth: { xs: "100%", md: 480 }, "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(255,255,255,.86)" } }}
        />

        {menuError && (
          <Alert
            severity="error"
            action={<Button color="inherit" size="small" onClick={refreshMenu}>{isArabic ? "إعادة المحاولة" : "Retry"}</Button>}
            sx={{ borderRadius: 2.5 }}
          >
            {isArabic ? "تعذر تحميل المواد والأصناف المرتبطة. تحقق من الاتصال ثم أعد المحاولة." : "Could not load ingredients and linked items. Check the connection and retry."}
          </Alert>
        )}

        {menuLoading && ingredients.length === 0 ? (
          <Card elevation={0} sx={{ p: 4, border: "1px solid", borderColor: "divider", borderRadius: 3, background: "rgba(255,255,255,.7)" }}>
            <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center">
              <CircularProgress size={22} />
              <Typography color="text.secondary">{isArabic ? "جارٍ تحميل المواد…" : "Loading ingredients…"}</Typography>
            </Stack>
          </Card>
        ) : filteredIngredients.length ? (
          <Stack spacing={1.25}>
            {filteredIngredients.map((ingredient) => {
              const linkedItems = relatedItemsByIngredient.get(String(ingredient.id)) || [];
              const isAvailable = ingredient.available === true;
              return (
                <Card key={ingredient.id} elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, border: "1px solid", borderColor: isAvailable ? "divider" : "rgba(211,47,47,.26)", background: isAvailable ? "rgba(255,255,255,.86)" : "linear-gradient(120deg, rgba(255,255,255,.95), rgba(255,243,242,.95))" }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between">
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                      <Avatar sx={{ width: 42, height: 42, bgcolor: isAvailable ? "rgba(21,154,104,.1)" : "rgba(211,47,47,.1)", color: isAvailable ? "success.main" : "error.main" }}>
                        <Inventory2OutlinedIcon fontSize="small" />
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, overflowWrap: "anywhere" }}>{ingredient.name}</Typography>
                        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 0.45 }}>
                          <Chip size="small" color={isAvailable ? "success" : "error"} variant={isAvailable ? "outlined" : "filled"} label={isAvailable ? (isArabic ? "متوفرة" : "Available") : (isArabic ? "نافدة" : "Out of stock")} />
                          <Chip size="small" variant="outlined" label={isArabic ? `${linkedItems.length} أصناف مرتبطة` : `${linkedItems.length} linked items`} />
                        </Stack>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                      <FormControlLabel
                        sx={{ m: 0, "& .MuiFormControlLabel-label": { fontSize: ".82rem", fontWeight: 800 } }}
                        control={<Switch checked={isAvailable} onChange={(event) => handleAvailabilityChange(ingredient, event.target.checked)} disabled={busyId === ingredient.id || Boolean(busyId)} color={isAvailable ? "success" : "error"} />}
                        label={isAvailable ? (isArabic ? "تسجيل نفاد المادة" : "Mark out of stock") : (isArabic ? "تسجيل إعادة التوفر" : "Mark available")}
                      />
                      {canManage && (
                        <IconButton aria-label={isArabic ? `تعديل ${ingredient.name}` : `Edit ${ingredient.name}`} onClick={() => openEdit(ingredient)} color="primary">
                          <EditOutlinedIcon />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>
                  <Divider sx={{ my: 1.35 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 800, mb: 0.75 }}>
                    {isArabic ? (isAvailable ? "الأصناف التي تستخدم هذه المادة" : "الأصناف المتأثرة وغير المتاحة للطلب") : (isAvailable ? "Items using this ingredient" : "Affected items unavailable for ordering")}
                  </Typography>
                  {linkedItems.length ? (
                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                      {linkedItems.map((item) => (
                        <Chip key={item.id} size="small" label={item.name} color={!isAvailable ? "error" : "default"} variant={!isAvailable ? "outlined" : "filled"} sx={{ maxWidth: "100%" }} />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {isArabic ? "لم تُربط هذه المادة بأي صنف بعد." : "This ingredient is not linked to a menu item yet."}
                    </Typography>
                  )}
                </Card>
              );
            })}
          </Stack>
        ) : (
          <Card elevation={0} sx={{ py: { xs: 5, md: 7 }, px: 2, textAlign: "center", border: "1px dashed", borderColor: "divider", borderRadius: 3, background: "rgba(255,255,255,.55)" }}>
            <Avatar sx={{ mx: "auto", mb: 1.5, width: 52, height: 52, bgcolor: "rgba(244,121,32,.1)", color: "primary.main" }}><Inventory2OutlinedIcon /></Avatar>
            <Typography variant="h6" fontWeight={900}>{isArabic ? (search ? "لا توجد مواد تطابق البحث" : "لا توجد مواد مسجلة بعد") : (search ? "No matching ingredients" : "No ingredients yet")}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 560, mx: "auto" }}>
              {canManage
                ? (isArabic ? "أضف المواد المشتركة أولًا، ثم اربط كل صنف بما يستهلكه من نموذج تعديل الصنف." : "Add shared ingredients first, then link each menu item to the ingredients it uses.")
                : (isArabic ? "اطلب من المدير إضافة المواد وربطها بالأصناف لتفعيل متابعة النفاد." : "Ask a manager to add ingredients and link them to menu items.")}
            </Typography>
            {canManage && !search && <Button onClick={openAdd} startIcon={<AddRoundedIcon />} variant="contained" sx={{ mt: 2, borderRadius: 2.5, fontWeight: 900 }}>{isArabic ? "إضافة أول مادة" : "Add first ingredient"}</Button>}
          </Card>
        )}
      </Stack>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, fontWeight: 900 }}>
          {editingIngredient ? (isArabic ? "تعديل اسم المادة" : "Edit ingredient") : (isArabic ? "إضافة مادة جديدة" : "Add an ingredient")}
          <IconButton onClick={closeDialog} disabled={saving} aria-label={isArabic ? "إغلاق" : "Close"}><CloseRoundedIcon /></IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              autoFocus
              fullWidth
              required
              inputProps={{ maxLength: 120 }}
              label={isArabic ? "اسم المادة" : "Ingredient name"}
              placeholder={isArabic ? "مثال: حليب، قهوة، دجاج" : "e.g. milk, coffee, chicken"}
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              helperText={isArabic ? "استخدم اسمًا واحدًا واضحًا؛ سيظهر في قائمة المواد والأصناف المرتبطة." : "Use one clear name; it appears in inventory and linked menu items."}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={closeDialog} disabled={saving} color="inherit">{isArabic ? "إلغاء" : "Cancel"}</Button>
            <Button type="submit" variant="contained" disabled={saving || !draftName.trim()} sx={{ borderRadius: 2, fontWeight: 900 }}>
              {saving ? (isArabic ? "جارٍ الحفظ…" : "Saving…") : (isArabic ? "حفظ" : "Save")}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

export default IngredientInventory;
