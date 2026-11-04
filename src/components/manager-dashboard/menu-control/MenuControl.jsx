import { FullscreenDialog as Dialog } from "../../common/FullscreenOverlays";
import { useEffect, useState } from "react";
import { useMenu } from "../../../context/MenuContext";
import { useLanguage } from "../../../context/LanguageContext";

// COMPONENTS
import AddItemDrawer from "./AddItemDrawer";
import CategoryPrintRoutingDrawer from "./CategoryPrintRoutingDrawer";
import AddonComplementDrawer from "./AddonComplementDrawer";
import MenuItemImage from "../../menu/MenuItemImage";

// MUI COMPONENTS
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";

import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import CategoryIcon from "@mui/icons-material/Category";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import SpaRoundedIcon from "@mui/icons-material/SpaRounded";
import CloseIcon from "@mui/icons-material/Close";

// OTHERS
import { v4 as uuidV4 } from "uuid";
import { normalizeAddonItemIds, normalizeAddonLimit, normalizeAddonOptions } from "../../../utils/menuItemOptions";

function MenuControl() {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [imageEditError, setImageEditError] = useState("");

  // حالات إدارة التصنيفات/الفلاتر
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isPrinterRoutingOpen, setPrinterRoutingOpen] = useState(false);
  const [isComplementDrawerOpen, setComplementDrawerOpen] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [categorySaving, setCategorySaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [sortMode, setSortMode] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [sortSaving, setSortSaving] = useState(false);
  const [sortError, setSortError] = useState("");

  const {
    filteredMenu = [],
    items = [],
    reorderMenuItems,
    categoriesList = [],
    addonComplements = [],
    searchQuery,
    setSearchQuery,
    deleteItem,
    toggleAvailable,
    addCategory,      // دالة إضافة تصنيف في Context
    updateCategory,   // دالة تعديل تصنيف في Context
    updateCategoryPrintRoutes,
    deleteCategory,   // دالة حذف تصنيف في Context
    addAddonComplement,
    deleteAddonComplement,
    menuLoading,
    menuRefreshing,
    menuError,
    refreshMenu,
    loadItemImage,
  } = useMenu();

  // يرجع MenuProvider بيانات قديمة بعد إعادة فتح التبويب؛ أعد المزامنة عند دخول الإدارة.
  useEffect(() => {
    refreshMenu();
  }, [refreshMenu]);

  const handleOpenAdd = () => {
    setItemToEdit(null);
    setIsOpen(true);
  };

  const handleOpenEdit = async (product) => {
    setImageEditError("");
    let editProduct = product;
    if (product.imageLoading || product.imageError) {
      const imageResult = await loadItemImage(product.id);
      if (!imageResult || imageResult.error) {
        setImageEditError(language === "ar"
          ? "تعذر تحميل صورة الصنف. أعد المحاولة قبل تعديل بياناته حتى لا تُستبدل الصورة الحالية."
          : "Could not load the current item image. Retry before editing so the existing photo is not replaced.");
        return;
      }
      editProduct = { ...product, image: imageResult.image, imageLoading: false, imageError: false };
    }
    setItemToEdit(editProduct);
    setIsOpen(true);
  };

  const handleDrawerClose = () => {
    setIsOpen(false);
    setItemToEdit(null);
  };

  // معالجة حفظ تصنيف جديد أو تعديله
  const handleSaveCategory = async () => {
    if (!newCategoryTitle.trim()) return;
    if (categorySaving) return;
    setCategoryError("");
    setCategorySaving(true);

    let result;
    if (editingCategory) {
      result = updateCategory ? await updateCategory({ ...editingCategory, name: newCategoryTitle.trim() }) : null;
    } else {
      result = addCategory ? await addCategory({ id: uuidV4(), name: newCategoryTitle.trim(), separate_print: false }) : null;
    }
    if (result?.error) {
      setCategoryError(result.error.message || "تعذر حفظ التصنيف");
      setCategorySaving(false);
      return;
    }
    setCategorySaving(false);
    setEditingCategory(null);
    setNewCategoryTitle("");
  };

  const handleStartEditCategory = (cat) => {
    setEditingCategory(cat);
    setNewCategoryTitle(cat.name);
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategory(null);
    setNewCategoryTitle("");
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <TextField
          placeholder={t("menuSearch")}
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: { xs: "100%", sm: 300 } }}
        />

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            onClick={() => setCategoryModalOpen(true)}
            variant="outlined"
            startIcon={<CategoryIcon />}
            sx={{
              fontWeight: 700,
              borderRadius: "8px",
              px: 2,
            }}
          >
            {t("menuCategories")}
          </Button>

          <Button onClick={() => { setSortError(""); setSortMode((value) => !value); }} variant={sortMode ? "contained" : "outlined"} sx={{ fontWeight: 700, borderRadius: "8px", px: 2 }}>
            {language === "ar" ? (sortMode ? "إنهاء الترتيب" : "ترتيب الأصناف") : (sortMode ? "Done sorting" : "Reorder items")}
          </Button>
          <Button
            onClick={() => setPrinterRoutingOpen(true)}
            variant="outlined"
            startIcon={<PrintRoundedIcon />}
            sx={{ fontWeight: 700, borderRadius: "8px", px: 2 }}
          >
            {language === "ar" ? "طابعات التصنيفات" : "Category printers"}
          </Button>

          <Button
            onClick={() => setComplementDrawerOpen(true)}
            variant="outlined"
            startIcon={<SpaRoundedIcon />}
            sx={{ fontWeight: 700, borderRadius: "8px", px: 2 }}
          >
            {language === "ar" ? `المكملات (${addonComplements.length})` : `Complements (${addonComplements.length})`}
          </Button>

          <Button
            onClick={handleOpenAdd}
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: "primary.main",
              fontWeight: 700,
              borderRadius: "8px",
              px: 2.5,
            }}
          >
            {t("menuAddItem")}
          </Button>
        </Box>
      </Box>

      {sortMode && <Box sx={{ mb: 2 }}>
        <Alert severity="info" sx={{ mb: 1 }}>{language === "ar" ? "اسحب الأصناف لتغيير ترتيب ظهورها في المنيو العامة. الترتيب خاص بالفرع الحالي." : "Drag items to change their order on the public menu. This order is saved for the selected branch."}</Alert>
        {sortError && <Alert severity="error" sx={{ mb: 1 }}>{sortError}</Alert>}
        <List aria-label={language === "ar" ? "ترتيب أصناف المنيو" : "Menu item order"}>
          {[...items].sort((a, b) => (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER) || String(a.created_at).localeCompare(String(b.created_at))).map((item) => <ListItem key={item.id} draggable={!sortSaving} onDragStart={() => setDraggedId(item.id)} onDragOver={(event) => event.preventDefault()} onDrop={async (event) => { event.preventDefault(); if (!draggedId || draggedId === item.id || sortSaving) return; const ordered = [...items].sort((a, b) => (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER) || String(a.created_at).localeCompare(String(b.created_at))); const from = ordered.findIndex((entry) => entry.id === draggedId); const to = ordered.findIndex((entry) => entry.id === item.id); const [moved] = ordered.splice(from, 1); ordered.splice(to, 0, moved); setSortSaving(true); const result = await reorderMenuItems(ordered.map((entry) => entry.id)); setSortError(result?.error?.message || ""); setSortSaving(false); setDraggedId(null); }} sx={{ mb: .5, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper", cursor: "grab" }}><ListItemText primary={item.name} secondary={language === "ar" ? "اسحب لإعادة الترتيب" : "Drag to reorder"} /><Typography aria-hidden sx={{ color: "text.secondary" }}>⠿</Typography></ListItem>)}
        </List>
      </Box>}

      {menuError && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          action={(
            <Button color="inherit" size="small" onClick={refreshMenu}>
              {language === "ar" ? "إعادة المحاولة" : "Retry"}
            </Button>
          )}
        >
          {language === "ar" ? "تعذر تحميل المنيو أو مزامنته. تحقق من الاتصال ثم أعد المحاولة." : "The menu could not be loaded or synced. Check the connection and retry."}
        </Alert>
      )}

      {imageEditError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{imageEditError}</Alert>}

      {menuRefreshing && <CircularProgress size={18} aria-label={language === "ar" ? "جارٍ تحديث المنيو" : "Refreshing menu"} sx={{ mb: 1 }} />}

      {menuLoading && filteredMenu.length === 0 ? (
        <Box role="status" sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 4, justifyContent: "center" }}>
          <CircularProgress size={22} />
          <Typography color="text.secondary">{language === "ar" ? "جارٍ تحميل أصناف المنيو…" : "Loading menu items…"}</Typography>
        </Box>
      ) : !menuLoading && !menuError && filteredMenu.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {language === "ar" ? "لا توجد أصناف مطابقة حاليًا. أضف صنفًا أو غيّر البحث." : "No matching menu items. Add an item or change your search."}
        </Alert>
      ) : null}

      {/* CARDS GRID */}
      <Grid container spacing={2}>
        {filteredMenu.map((product, index) => (
          <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "none",
                opacity: product.isAvailableForSale === false ? 0.62 : 1,
                transition: "opacity 0.2s ease-in-out",
              }}
            >
              <MenuItemImage
                src={product.image}
                alt={product.name}
                imageLoading={product.imageLoading}
                imageError={product.imageError}
                loadImage={() => loadItemImage(product.id)}
                priority={index < 2}
                height={140}
              />

              <CardContent sx={{ p: 2, flexGrow: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, fontSize: "1rem" }}
                  >
                    {product.name}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      color: "primary.main",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("menuPrice")} {Number(product.price || 0).toFixed(2)}
                  </Typography>
                </Box>

                {/* عرض وسوم التوافق إن وجدت */}
                {product.tags && product.tags.length > 0 && (
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1 }}>
                    {product.tags.map((tag, idx) => (
                      <Chip
                        key={idx}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.65rem", height: 20 }}
                      />
                    ))}
                  </Box>
                )}

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 1.5,
                    minHeight: 40,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {product.description}
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(product.available)}
                      onChange={async () => { if (busyId) return; setBusyId(product.id); await toggleAvailable(product.id); setBusyId(null); }}
                      disabled={busyId === product.id}
                      color="success"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {!product.available
                        ? t("menuUnavailable")
                        : product.unavailableIngredients?.length
                          ? (language === "ar" ? "مفعّل، لكن متوقف بسبب المكونات" : "Enabled, but paused by ingredients")
                          : t("menuAvailable")}
                    </Typography>
                  }
                />
                {product.unavailableIngredients?.length > 0 && (
                  <Alert severity="warning" sx={{ mt: 0.5, py: 0, borderRadius: 1.5, "& .MuiAlert-message": { fontSize: ".76rem", fontWeight: 700 } }}>
                    {language === "ar"
                      ? `متوقف للطلب بسبب نفاد: ${product.unavailableIngredients.map((ingredient) => ingredient.name).join("، ")}`
                      : `Unavailable due to: ${product.unavailableIngredients.map((ingredient) => ingredient.name).join(", ")}`}
                  </Alert>
                )}
                {product.hasUnknownIngredient && (
                  <Alert severity="error" sx={{ mt: 0.5, py: 0, borderRadius: 1.5, "& .MuiAlert-message": { fontSize: ".76rem", fontWeight: 700 } }}>
                    {language === "ar" ? "الصنف متوقف مؤقتًا؛ تعذر التحقق من أحد مكوناته." : "Item paused; one of its ingredients could not be verified."}
                  </Alert>
                )}
                <Box sx={{ mt: 1.25, p: 1, borderRadius: 1.8, bgcolor: "rgba(244,121,32,.06)", border: "1px solid rgba(244,121,32,.18)" }}>
                  <Typography variant="caption" sx={{ display: "block", fontWeight: 900, color: "text.primary" }}>
                    {language === "ar" ? "مكملات الصنف" : "Item complements"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: .25 }}>
                    {language === "ar"
                      ? `${normalizeAddonOptions(product.addon_options).length + normalizeAddonItemIds(product.free_addon_item_ids).length} مكملات · الحد الأقصى ${normalizeAddonLimit(product.max_addons, normalizeAddonOptions(product.addon_options).length + normalizeAddonItemIds(product.free_addon_item_ids).length)}`
                      : `${normalizeAddonOptions(product.addon_options).length + normalizeAddonItemIds(product.free_addon_item_ids).length} complements · maximum ${normalizeAddonLimit(product.max_addons, normalizeAddonOptions(product.addon_options).length + normalizeAddonItemIds(product.free_addon_item_ids).length)}`}
                  </Typography>
                  <Button size="small" variant="text" onClick={() => handleOpenEdit(product)} sx={{ mt: .35, px: 0, minWidth: 0, fontWeight: 850 }}>
                    {language === "ar" ? "إدارة مكملات الصنف" : "Manage item complements"}
                  </Button>
                </Box>
              </CardContent>

              <CardActions
                sx={{
                  justifyContent: "flex-end",
                  borderTop: "1px solid",
                  borderColor: "divider",
                  px: 1.5,
                  py: 1,
                }}
              >
                <IconButton
                  size="small"
                  color="primary"
                  aria-label={t("menuEdit")}
                  onClick={() => handleOpenEdit(product)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>

                <IconButton
                  size="small"
                  color="error"
                  aria-label={t("menuDelete")}
                  onClick={async () => { if (busyId) return; setBusyId(product.id); await deleteItem(product.id); setBusyId(null); }}
                  disabled={busyId === product.id}
                >
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* DRAWER COMPONENT */}
      <AddItemDrawer
        open={isOpen}
        onClose={handleDrawerClose}
        itemToEdit={itemToEdit}
      />
      <CategoryPrintRoutingDrawer
        open={isPrinterRoutingOpen}
        onClose={() => setPrinterRoutingOpen(false)}
        categories={categoriesList}
        onUpdateCategories={updateCategoryPrintRoutes}
      />
      <AddonComplementDrawer
        open={isComplementDrawerOpen}
        onClose={() => setComplementDrawerOpen(false)}
        items={addonComplements}
        onAdd={addAddonComplement}
        onDelete={deleteAddonComplement}
      />

      {/* DIALOG إدﺍﺭﺓ التصنيفات والفلاتر */}
      <Dialog
        open={isCategoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 700,
          }}
        >
          {t("menuDialogTitle")}
          <IconButton size="small" onClick={() => setCategoryModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {categoryError && <Alert severity="error" sx={{ mb: 2 }}>{categoryError}</Alert>}
          {/* حقل إضافة / تعديل تصنيف */}
          <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
            <TextField
              size="small"
              fullWidth
              label={editingCategory ? t("menuEditCategory") : t("menuAddCategory")}
              placeholder={t("menuCategoryExample")}
              value={newCategoryTitle}
              onChange={(e) => setNewCategoryTitle(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={handleSaveCategory}
              disabled={categorySaving}
              sx={{ whiteSpace: "nowrap", fontWeight: 700 }}
            >
              {categorySaving ? "جاري الإرسال..." : (editingCategory ? t("menuSave") : t("menuAdd"))}
            </Button>
            {editingCategory && (
              <Button color="inherit" onClick={handleCancelCategoryEdit}>{t("menuCancel")}</Button>
            )}
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            {t("menuCurrentCategories")} ({categoriesList.length}):
          </Typography>

          <List disablePadding sx={{ maxHeight: 240, overflowY: "auto" }}>
            {categoriesList.map((cat) => (
              <ListItem
                key={cat.id || cat.name}
                disableGutters
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  mb: 1,
                  py: 0.75,
                  px: 1,
                }}
              >
                <ListItemText primary={cat.name} sx={{ minWidth: 0, my: 0 }} />
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexShrink: 0 }}>
                  <IconButton
                    size="small"
                    aria-label={language === "en" ? `Edit ${cat.name}` : `تعديل ${cat.name}`}
                    onClick={() => handleStartEditCategory(cat)}
                    disabled={Boolean(busyId)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label={language === "en" ? `Delete ${cat.name}` : `حذف ${cat.name}`}
                    onClick={async () => { if (busyId) return; setBusyId(cat.id); await (deleteCategory && deleteCategory(cat.id)); setBusyId(null); }}
                    disabled={Boolean(busyId)}
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setCategoryModalOpen(false)}>{t("menuClose")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MenuControl;
