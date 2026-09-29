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
import InputAdornment from "@mui/material/InputAdornment";
import Tooltip from "@mui/material/Tooltip";

// MUI ICONS
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SaveIcon from "@mui/icons-material/Save";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import KeyIcon from "@mui/icons-material/Key";
import AutoRenewIcon from "@mui/icons-material/Autorenew";

// CONTEXT
import { useStore } from "../../../context/StoreInfoContext";

const CURRENCIES = [
  { value: "SAR", label: "ر.س (ريال سعودي)" },
  { value: "AED", label: "د.إ (درهم إماراتي)" },
  { value: "USD", label: "$ (دولار أمريكي)" },
];

const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    // eslint-disable-next-line no-useless-escape
    .replace(/[^\w\-]+/g, "")
    // eslint-disable-next-line no-useless-escape
    .replace(/\-\-+/g, "-");
};

function StoreInfoSettings() {
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
    cashier_pin: storeInfo?.cashier_pin || "1234",
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
        updatedData.store_slug = generateSlug(value);
      }
      return updatedData;
    });
  };

  // دالة عشوائية لتوليد رمز PIN للكاشير
  const handleGeneratePin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setFormData((prev) => ({ ...prev, cashier_pin: randomPin }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          logo_url: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateStoreInfo(formData);
    setToast({
      open: true,
      message: "تم حفظ إعدادات الكافيه بنجاح!",
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
              src={formData.logo_url || "/logo-icon.png"}
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
                يظهر الشعار في أعلى الفواتير المطبوعة وعلى تطبيق المنيو الرقمي
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
            label="اسم الكافيه / الفرع"
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
            label="اسم امتداد الكافيه (Slug)"
            name="store_slug"
            value={formData.store_slug || ""}
            onChange={handleInputChange}
            disabled={isSlugLocked}
            required
            size="small"
            helperText={
              isSlugLocked ? "يتم توليده تلقائياً من الاسم" : "تمكين التعديل اليدوي"
            }
            InputProps={{
              endAdornment: (
                <IconButton
                  size="small"
                  onClick={() => setIsSlugLocked(!isSlugLocked)}
                  title={
                    isSlugLocked ? "فك القفل لتعديل الرابط يدوياً" : "قفل الرابط"
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
            label="رقم الهاتف"
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
            label="البريد الإلكتروني"
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
            label="الرقم الضريبي (VAT)"
            name="tax_number"
            value={formData.tax_number || ""}
            onChange={handleInputChange}
            size="small"
            placeholder="مثال: 300000000000003"
          />
        </Grid>

        {/* Currency Select */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            select
            fullWidth
            label="العملة"
            name="currency"
            value={formData.currency || "SAR"}
            onChange={handleInputChange}
            size="small"
          >
            {CURRENCIES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Cashier PIN Management Section */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label="رمز دخول الكاشير (PIN)"
            name="cashier_pin"
            value={formData.cashier_pin || ""}
            onChange={handleInputChange}
            size="small"
            required
            helperText="الرمز المستخدم لدخول لوحة الكاشير"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <KeyIcon fontSize="small" color="primary" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="توليد رمز تلقائي">
                    <IconButton
                      size="small"
                      onClick={handleGeneratePin}
                      color="primary"
                    >
                      <AutoRenewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Address */}
        <Grid size={{ xs: 12, sm: 6, md: 8 }}>
          <TextField
            fullWidth
            label="العنوان"
            name="address"
            value={formData.address || ""}
            onChange={handleInputChange}
            size="small"
            placeholder="مثال: الرياض - حي الملقا - طريق الملك فهد"
          />
        </Grid>

        {/* Receipt Footer Note */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="تذييل الفاتورة (رسالة الترحيب)"
            name="receipt_footer"
            value={formData.receipt_footer || ""}
            onChange={handleInputChange}
            multiline
            rows={2}
            size="small"
            placeholder="مثال: شكراً لزيارتكم! نتمنى لكم يوماً سعيداً."
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