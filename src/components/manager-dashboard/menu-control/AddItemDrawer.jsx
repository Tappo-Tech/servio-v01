import { useState, useEffect } from "react";
import { useMenu } from "../../../context/MenuContext";
import { useLanguage } from "../../../context/LanguageContext";

// MUI COMPONENTS
import { styled } from "@mui/material/styles";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AddIcon from "@mui/icons-material/Add";

// OTHERS
import { v4 as uuidV4 } from "uuid";
import { compressImage } from "../../../utils/compressImage";
import FreeAddonItemsDrawer from "./FreeAddonItemsDrawer";
import { normalizeAddonItemIds, normalizeAddonLimit, normalizeAddonOptions } from "../../../utils/menuItemOptions";

const COMMON_ALLERGENS = [
  "حليب / ألبان",
  "مكسرات",
  "فول سوداني",
  "قمح / جلوتين",
  "بيض",
  "صويا",
  "سمك",
  "سمسم",
];

const SUGGESTION_TAGS = [
  "يناسب المشروبات الساخنة",
  "يناسب المشروبات الباردة",
  "حلويات خفيفة",
  "وجبات سريعة",
  "الأكثر مبيعاً",
  "مقترحات الشيف",
  "بديل صحي",
];

const VisuallyHiddenInput = styled("input")({
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const INITIAL_FORM_STATE = {
  name: "",
  price: "",
  category_id: "",
  description: "",
  image: "",
  allergens: [],
  tags: [],
  recommendation_item_ids: [],
  addon_options: [],
  free_addon_item_ids: [],
  max_addons: 0,
  available: true,
};

function AddItemDrawer({ open, onClose, itemToEdit = null }) {
  const { addNewItem, updateItem, categoriesList = [], items = [], addonComplements = [] } = useMenu();
  const { language, t } = useLanguage();
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [freeAddonDrawerOpen, setFreeAddonDrawerOpen] = useState(false);

  useEffect(() => {
    if (!open) setFreeAddonDrawerOpen(false);
  }, [open]);

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        name: itemToEdit.name || "",
        price: itemToEdit.price || "",
        category_id: itemToEdit.category_id || "",
        description: itemToEdit.description || "",
        image: itemToEdit.image || "",
        allergens: itemToEdit.allergens || [],
        tags: itemToEdit.tags || [],
        recommendation_item_ids: itemToEdit.recommendation_item_ids || [],
        addon_options: normalizeAddonOptions(itemToEdit.addon_options),
        free_addon_item_ids: normalizeAddonItemIds(itemToEdit.free_addon_item_ids),
        max_addons: normalizeAddonLimit(itemToEdit.max_addons, normalizeAddonOptions(itemToEdit.addon_options).length + normalizeAddonItemIds(itemToEdit.free_addon_item_ids).length),
        available: itemToEdit.available ?? true,
      });
    } else {
      setFormData(INITIAL_FORM_STATE);
    }
  }, [itemToEdit, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateAddonOptions = (values) => {
    const addonOptions = normalizeAddonOptions(values);
    setFormData((prev) => {
      const currentCount = prev.addon_options.length + prev.free_addon_item_ids.length;
      const nextCount = addonOptions.length + prev.free_addon_item_ids.length;
      const currentLimit = normalizeAddonLimit(prev.max_addons, currentCount);
      return {
        ...prev,
        addon_options: addonOptions,
        max_addons: currentCount === 0 && nextCount > 0 ? 1 : Math.min(currentLimit, nextCount),
      };
    });
  };

  const updateFreeAddonItems = (ids) => {
    const freeAddonItemIds = normalizeAddonItemIds(ids).filter((id) => id !== itemToEdit?.id);
    setFormData((prev) => {
      const currentCount = prev.addon_options.length + prev.free_addon_item_ids.length;
      const nextCount = prev.addon_options.length + freeAddonItemIds.length;
      const currentLimit = normalizeAddonLimit(prev.max_addons, currentCount);
      return {
        ...prev,
        free_addon_item_ids: freeAddonItemIds,
        max_addons: currentCount === 0 && nextCount > 0 ? 1 : Math.min(currentLimit, nextCount),
      };
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const image = await compressImage(file);
      setFormData((prev) => ({ ...prev, image }));
    } catch (error) {
      console.error("تعذر ضغط الصورة:", error);
    }
  };

  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;
    if (saving) return;
    setSubmitError("");
    setSaving(true);

    const payload = {
      name: formData.name,
      price: parseFloat(formData.price),
      category_id: formData.category_id || (categoriesList[0]?.id ?? "all"),
      description: formData.description,
      image: formData.image || "/logo-icon.webp",
      allergens: formData.allergens,
      tags: formData.tags,
      recommendation_item_ids: formData.recommendation_item_ids,
      addon_options: normalizeAddonOptions(formData.addon_options),
      free_addon_item_ids: normalizeAddonItemIds(formData.free_addon_item_ids).filter((id) => id !== itemToEdit?.id),
      max_addons: normalizeAddonLimit(
        formData.max_addons,
        normalizeAddonOptions(formData.addon_options).length + normalizeAddonItemIds(formData.free_addon_item_ids).filter((id) => id !== itemToEdit?.id).length,
      ),
      available: formData.available,
    };

    const result = itemToEdit
      ? await updateItem({ ...itemToEdit, ...payload })
      : await addNewItem({ id: uuidV4(), ...payload });
    if (result?.error) {
      setSubmitError(result.error.message || "تعذر حفظ الصنف");
      setSaving(false);
      return;
    }
    setSaving(false);
    onClose();
  };

  const addonChoiceCount = formData.addon_options.length + formData.free_addon_item_ids.length;
  const addonLimitOptions = Math.min(addonChoiceCount, 20);

  return (
    <>
    <SwipeableDrawer
      anchor={language === "ar" ? "right" : "left"}
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "100%", sm: 400 },
          p: 3,
          boxSizing: "border-box",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {itemToEdit ? t("menuEditItem") : t("menuAddItem")}
        </Typography>
        <IconButton onClick={onClose} aria-label={t("menuCloseDrawer")}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        {submitError && <Alert severity="error">{submitError}</Alert>}
        <TextField
          label={t("menuItemName")}
          name="name"
          value={formData.name}
          onChange={handleChange}
          size="small"
          fullWidth
          required
        />

        <TextField
          label={t("menuPriceField")}
          name="price"
          type="number"
          inputProps={{ min: 0, step: "0.01" }}
          value={formData.price}
          onChange={handleChange}
          size="small"
          fullWidth
          required
        />

        <TextField
          select
          label={t("menuCategory")}
          name="category_id"
          value={formData.category_id}
          onChange={handleChange}
          size="small"
          fullWidth
          required
        >
          {categoriesList.map((cat) => (
            <MenuItem key={cat.id} value={cat.id}>
              {cat.name}
            </MenuItem>
          ))}
        </TextField>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Button
            component="label"
            variant={formData.image ? "outlined" : "contained"}
            color={formData.image ? "success" : "primary"}
            startIcon={<CloudUploadIcon />}
            fullWidth
          >
            {formData.image ? t("menuChangeImage") : t("menuChooseImage")}
            <VisuallyHiddenInput
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </Button>

          {formData.image && (
            <Box
              component="img"
              src={formData.image}
              alt={t("menuImagePreview")}
              sx={{
                width: "100%",
                height: 120,
                objectFit: "cover",
                borderRadius: 1.5,
                mt: 0.5,
              }}
            />
          )}
        </Box>

        <Autocomplete
          multiple
          freeSolo
          options={SUGGESTION_TAGS}
          value={formData.tags}
          onChange={(_, newValue) => {
            setFormData((prev) => ({ ...prev, tags: newValue }));
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  label={option}
                  size="small"
                  color="primary"
                  variant="outlined"
                  {...tagProps}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label={t("menuTags")}
              placeholder={t("menuTagsPlaceholder")}
            />
          )}
          fullWidth
        />

        <Autocomplete
          multiple
          options={items.filter((item) => item.id !== itemToEdit?.id && item.available)}
          getOptionLabel={(option) => option?.name || ""}
          value={items.filter((item) => formData.recommendation_item_ids.includes(item.id))}
          onChange={(_, newValue) => {
            setFormData((prev) => ({
              ...prev,
              recommendation_item_ids: newValue.map((item) => item.id),
            }));
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  label={option.name}
                  size="small"
                  color="primary"
                  variant="outlined"
                  {...tagProps}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label={t("menuRecommendations")}
              placeholder={t("menuRecommendationsPlaceholder")}
              helperText={t("menuRecommendationsHint")}
            />
          )}
          fullWidth
        />

        <Box sx={{ p: 1.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", bgcolor: "rgba(244,121,32,.035)", display: "flex", flexDirection: "column", gap: 1.25 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
              {language === "ar" ? "إضافات اختيارية ضمن السعر" : "Optional add-ons included in price"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {language === "ar" ? "لا تزيد الإضافات المحددة سعر هذا الصنف." : "Selected add-ons do not increase this item’s price."}
            </Typography>
          </Box>

          <Autocomplete
            multiple
            freeSolo
            options={addonComplements.map((complement) => complement.name)}
            value={formData.addon_options}
            onChange={(_, newValue) => updateAddonOptions(newValue)}
            renderTags={(value, getTagProps) => value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return <Chip key={key} label={option} size="small" color="primary" variant="outlined" {...tagProps} />;
            })}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label={language === "ar" ? "إضافات مكتوبة" : "Named add-ons"}
                placeholder={language === "ar" ? "اكتب اسم الإضافة واضغط Enter" : "Type an add-on and press Enter"}
                helperText={language === "ar" ? "اختر مكملًا محفوظًا أو اكتب اسمًا جديدًا؛ الاسم المكتوب يُحفظ ضمن خيارات هذا الصنف." : "Choose a saved complement or type a new name; typed names stay on this item."}
              />
            )}
            fullWidth
          />

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setFreeAddonDrawerOpen(true)}
            sx={{ alignSelf: "flex-start", borderRadius: 2, fontWeight: 800, textAlign: "start" }}
          >
            {language === "ar"
              ? `اختيار أصناف مجانية من المنيو (${formData.free_addon_item_ids.length})`
              : `Choose free menu add-ons (${formData.free_addon_item_ids.length})`}
          </Button>

          <TextField
            select
            size="small"
            fullWidth
            disabled={addonChoiceCount === 0}
            label={language === "ar" ? "الحد الأعلى للإضافات لكل وحدة" : "Maximum add-ons per item"}
            value={String(normalizeAddonLimit(formData.max_addons, addonChoiceCount))}
            onChange={(event) => setFormData((previous) => ({ ...previous, max_addons: event.target.value }))}
            helperText={language === "ar" ? "يُطبّق الاختيار نفسه على كل كمية هذا الصنف في السلة." : "The same selection applies to the full quantity of this item in the cart."}
          >
            {Array.from({ length: addonLimitOptions + 1 }, (_, limit) => (
              <MenuItem key={limit} value={String(limit)}>
                {language === "ar" ? `${limit} إضافات` : `${limit} add-ons`}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Autocomplete
          multiple
          options={COMMON_ALLERGENS}
          value={formData.allergens}
          onChange={(_, newValue) => {
            setFormData((prev) => ({ ...prev, allergens: newValue }));
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip key={key} label={option} size="small" {...tagProps} />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label={t("menuAllergens")}
              placeholder={t("menuAllergensPlaceholder")}
            />
          )}
          fullWidth
        />

        <TextField
          label={t("menuDescription")}
          name="description"
          value={formData.description}
          onChange={handleChange}
          multiline
          rows={3}
          size="small"
          fullWidth
        />

        <Box sx={{ display: "flex", gap: 1.5, mt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            fullWidth
            sx={{ bgcolor: "primary.main", fontWeight: 700 }}
          >
{saving ? "جاري الإرسال..." : (itemToEdit ? t("menuSaveChanges") : t("menuSaveItem"))}
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            fullWidth
            onClick={onClose}
          >{t("menuCancel")}</Button>
        </Box>
      </Box>
    </SwipeableDrawer>
    <FreeAddonItemsDrawer
      open={freeAddonDrawerOpen}
      onClose={() => setFreeAddonDrawerOpen(false)}
      items={items}
      selectedIds={formData.free_addon_item_ids}
      excludeId={itemToEdit?.id}
      language={language}
      onSave={updateFreeAddonItems}
    />
    </>
  );
}

export default AddItemDrawer;
