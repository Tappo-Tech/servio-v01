import { useState } from "react";
import { useMenu } from "../../../context/MenuContext";
import { useLanguage } from "../../../context/LanguageContext";

// COMPONENTS
import AddItemDrawer from "./AddItemDrawer";

// MUI COMPONENTS
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
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
import CloseIcon from "@mui/icons-material/Close";

// OTHERS
import { v4 as uuidV4 } from "uuid";

function MenuControl() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  // حالات إدارة التصنيفات/الفلاتر
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [categorySaving, setCategorySaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const {
    filteredMenu = [],
    categoriesList = [],
    searchQuery,
    setSearchQuery,
    deleteItem,
    toggleAvailable,
    addCategory,      // دالة إضافة تصنيف في Context
    updateCategory,   // دالة تعديل تصنيف في Context
    deleteCategory,   // دالة حذف تصنيف في Context
  } = useMenu();

  const handleOpenAdd = () => {
    setItemToEdit(null);
    setIsOpen(true);
  };

  const handleOpenEdit = (product) => {
    setItemToEdit(product);
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
      result = addCategory ? await addCategory({ id: uuidV4(), name: newCategoryTitle.trim() }) : null;
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

      {/* CARDS GRID */}
      <Grid container spacing={2}>
        {filteredMenu.map((product) => (
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
                opacity: product.available ? 1 : 0.6,
                transition: "opacity 0.2s ease-in-out",
              }}
            >
              <CardMedia
                component="img"
                loading="lazy"
                decoding="async"
                height="140"
                image={product.image || "/logo-icon.webp"}
                alt={product.name}
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
                      {product.available ? t("menuAvailable") : t("menuUnavailable")}
                    </Typography>
                  }
                />
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
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  mb: 1,
                  py: 0.5,
                }}
                secondaryAction={
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleStartEditCategory(cat)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={async () => { if (busyId) return; setBusyId(cat.id); await (deleteCategory && deleteCategory(cat.id)); setBusyId(null); }}
                      disabled={busyId === cat.id}
                    >
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText primary={cat.name} />
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