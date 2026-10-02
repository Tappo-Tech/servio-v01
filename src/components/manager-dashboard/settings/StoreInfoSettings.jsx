import { useState, useEffect } from "react";

// MUI COMPONENTS
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";

// MUI ICONS
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SaveIcon from "@mui/icons-material/Save";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";

// CONTEXT
import { useStore } from "../../../context/StoreInfoContext";
import { useLanguage } from "../../../context/LanguageContext";
import { compressImage } from "../../../utils/compressImage";
import { slugifyName } from "../../../utils/slug";

const CURRENCIES = [
  { value: "SAR", labelKey: "currencySar" },
  { value: "AED", labelKey: "currencyAed" },
  { value: "USD", labelKey: "currencyUsd" },
];

function StoreInfoSettings() {
  const { t } = useLanguage();
  const { storeInfo, updateStoreInfo } = useStore();

  const [formData, setFormData] = useState({
    store_name: storeInfo?.store_name || "",
    store_slug: storeInfo?.store_slug || "",
    phone: storeInfo?.phone || "",
    email: storeInfo?.email || "",
    tax_number: storeInfo?.tax_number || "",
    currency: storeInfo?.currency || "SAR",
    address: storeInfo?.address || "",
    receipt_footer: storeInfo?.receipt_footer || "",
    logo_url: storeInfo?.logo_url || "",
  });

  const [isSlugLocked, setIsSlugLocked] = useState(true);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (storeInfo) {
      setFormData((prev) => ({ ...prev, ...storeInfo }));
    }
  }, [storeInfo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value };
      if (name === "store_name" && isSlugLocked) {
        updatedData.store_slug = slugifyName(value);
      }
      return updatedData;
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const logo_url = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.8 });
      setFormData((prev) => ({ ...prev, logo_url }));
    } catch (error) {
      console.error(t("managerLogoError"), error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await updateStoreInfo(formData);
    if (result?.error) {
      setToast({
        open: true,
        message: result.error.message?.includes("duplicate") ? t("slugName") : result.error.message || t("genericLoginError"),
        severity: "error",
      });
      return;
    }
    setToast({
      open: true,
      message: t("managerSaved"),
      severity: "success",
    });
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ pt: 1, maxWidth: 900, mx: "auto" }}
    >
      <Grid container spacing={{ xs: 2, sm: 2.5 }}>
        {/* Logo Upload Section */}
        <Grid size={{ xs: 12 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              gap: 2,
              borderRadius: "12px",
              backgroundColor: "background.default",
            }}
          >
            <Avatar
              src={formData.logo_url || "/logo-icon.webp"}
              alt={formData.store_name}
              variant="rounded"
              sx={{
                width: 100,
                height: 100,
                border: "1px solid",
                borderColor: "divider",
              }}
            />
            <Box
              sx={{
                textAlign: { xs: "center", sm: "right" },
                width: { xs: "100%", sm: "auto" },
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "18px" }}>
                شعار الكافيه / النشاط
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mb: 1.5, fontSize: "14px" }}
              >
                {t("managerLogoHint")}
              </Typography>
              <Button
                variant="outlined"
                component="label"
                size="small"
                startIcon={<CloudUploadIcon />}
                sx={{ borderRadius: "8px", alignSelf: { sm: "flex-start" } }}
              >
                تغيير الشعار
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Store Name */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label={t("managerStoreName")}
            name="store_name"
            value={formData.store_name || ""}
            onChange={handleInputChange}
            required
            size="small"
          />
        </Grid>

        {/* Store Slug with Lock/Unlock Toggle */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label={t("managerSlug")}
            name="store_slug"
            value={formData.store_slug || ""}
            onChange={handleInputChange}
            disabled={isSlugLocked}
            required
            size="small"
            helperText={
              isSlugLocked ? t("managerAutoSlug") : t("managerEditSlug")
            }
            InputProps={{
              endAdornment: (
                <IconButton
                  size="small"
                  onClick={() => setIsSlugLocked(!isSlugLocked)}
                  title={
                    isSlugLocked ? t("managerUnlockSlug") : t("managerLockSlug")
                  }
                >
                  {isSlugLocked ? (
                    <LockIcon fontSize="small" />
                  ) : (
                    <LockOpenIcon fontSize="small" color="primary" />
                  )}
                </IconButton>
              ),
            }}
          />
        </Grid>

        {/* Phone Number */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label={t("phone")}
            name="phone"
            value={formData.phone || ""}
            onChange={handleInputChange}
            size="small"
          />
        </Grid>

        {/* Email */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label={t("email")}
            name="email"
            type="email"
            value={formData.email || ""}
            onChange={handleInputChange}
            size="small"
          />
        </Grid>

        {/* Tax Number */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label={t("managerTax")}
            name="tax_number"
            value={formData.tax_number || ""}
            onChange={handleInputChange}
            size="small"
            placeholder={t("taxExample")}
          />
        </Grid>

        {/* Currency Select */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            select
            fullWidth
            label={t("managerCurrency")}
            name="currency"
            value={formData.currency || "SAR"}
            onChange={handleInputChange}
            size="small"
          >
            {CURRENCIES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {t(option.labelKey)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Address */}
        <Grid size={{ xs: 12, sm: 6, md: 8 }}>
          <TextField
            fullWidth
            label={t("managerAddress")}
            name="address"
            value={formData.address || ""}
            onChange={handleInputChange}
            size="small"
            placeholder={t("addressExample")}
          />
        </Grid>

        {/* Receipt Footer Note */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label={t("managerReceiptFooter")}
            name="receipt_footer"
            value={formData.receipt_footer || ""}
            onChange={handleInputChange}
            multiline
            rows={2}
            size="small"
            placeholder={t("receiptExample")}
          />
        </Grid>

        {/* Save Button */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            justifyContent: { xs: "stretch", sm: "flex-end" },
            mt: 1,
          }}
        >
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            fullWidth={{ xs: true, sm: false }}
            sx={{
              px: 4,
              py: 1,
              borderRadius: "8px",
              fontWeight: 700,
            }}
          >
            حفظ التغييرات
          </Button>
        </Grid>
      </Grid>

      {/* Snackbar Alert */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default StoreInfoSettings;