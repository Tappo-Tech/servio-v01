import { useState, useEffect } from "react";
import { useMenu } from "../../../context/MenuContext";

// MUI COMPONENTS
import { styled } from "@mui/material/styles";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

// OTHERS
import { v4 as uuidV4 } from "uuid";

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

// وسوم الاقتراحات والتوافق المحددة مسبقاً
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
  categoryId: "",
  description: "",
  image: "",
  allergens: [],
  tags: [], // إضافة مصفوفة الوسوم
  available: true,
};

function AddItemDrawer({ open, onClose, itemToEdit = null }) {
  const { addNewItem, updateItem, categoriesList = [] } = useMenu();
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        name: itemToEdit.name || "",
        price: itemToEdit.price || "",
        categoryId: itemToEdit.categoryId || "",
        description: itemToEdit.description || "",
        image: itemToEdit.image || "",
        allergens: itemToEdit.allergens || [],
        tags: itemToEdit.tags || [], // تحميل الوسوم المسجلة
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

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    const payload = {
      name: formData.name,
      price: parseFloat(formData.price),
      category_id: formData.category_id || (categoriesList[0]?.id ?? "all"),
      description: formData.description,
      image: formData.image || "/logo-icon.png",
      allergens: formData.allergens,
      tags: formData.tags,
      available: formData.available,
    };

    if (itemToEdit) {
      updateItem({
        ...itemToEdit,
        ...payload,
      });
    } else {
      addNewItem({
        id: uuidV4(),
        ...payload,
        quantity: 1,
      });
    }

    onClose();
  };

  return (
    <SwipeableDrawer
      anchor="right"
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
          {itemToEdit ? "تعديل الصنف" : "إضافة صنف جديد"}
        </Typography>
        <IconButton onClick={onClose} aria-label="إغلاق">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <TextField
          label="اسم الصنف"
          name="name"
          value={formData.name}
          onChange={handleChange}
          size="small"
          fullWidth
          required
        />

        <TextField
          label="السعر (ر.س)"
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
          label="القسم / التصنيف"
          name="categoryId"
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
            {formData.image ? "تغيير الصورة" : "اختر صورة من جهازك"}
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
              alt="معاينة الصورة"
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

        {/* وسوم الاقتراحات والتوافق */}
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
              label="وسوم الاقتراحات والتوافق"
              placeholder="اختر أو اكتب وسم..."
            />
          )}
          fullWidth
        />

        {/* المواد المسببة للحساسية */}
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
              label="المواد المسببة للحساسية"
              placeholder="اختر المسببات..."
            />
          )}
          fullWidth
        />

        <TextField
          label="الوصف"
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
            fullWidth
            sx={{ bgcolor: "primary.main", fontWeight: 700 }}
          >
            {itemToEdit ? "حفظ التعديلات" : "حفظ الصنف"}
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            fullWidth
            onClick={onClose}
          >
            إلغاء
          </Button>
        </Box>
      </Box>
    </SwipeableDrawer>
  );
}

export default AddItemDrawer;