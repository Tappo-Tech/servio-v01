import { useState } from "react";

// MUI COMPONENTS
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

// ICONS
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

// CONTEXTS
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTenant } from "../../context/TenantContext";

function ItemDetailsDrawer({ open, onClose, itemDetails }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { language } = useLanguage();
  const { slug } = useTenant();

  const handleIncrease = () => setQuantity((prev) => prev + 1);
  const handleDecrease = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const hasAllergy = itemDetails?.allergens && itemDetails.allergens.length > 0;
  const hasDraftAllergenData =
    slug === "mzaj-ryfy" && itemDetails?.tags?.includes("وصفة مبدئية");

  const bottomBarHeight = "80px";

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen={true}
      slotProps={{
        paper: {
          sx: {
            borderTopLeftRadius: "24px",
            borderTopRightRadius: "24px",
            maxHeight: "90dvh",
            backgroundColor: "background.paper",
            overflow: "hidden",
          },
        },
      }}
    >
      <Box
        sx={{
          maxHeight: `calc(90dvh - ${bottomBarHeight})`,
          overflowY: "auto",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            width: "40px",
            height: "4px",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            borderRadius: "2px",
            zIndex: 11,
          }}
        />

        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(4px)",
            "&:hover": { backgroundColor: "rgba(255, 255, 255, 1)" },
            zIndex: 10,
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box
          component="img"
          src={itemDetails?.image}
          loading="lazy"
          decoding="async"
          alt={itemDetails?.name}
          sx={{
            width: "100%",
            height: 250,
            objectFit: "cover",
          }}
        />

        <Box sx={{ p: 2.5, pb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1.5,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {itemDetails?.name}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: "primary.main",
                whiteSpace: "nowrap",
                ml: 2,
              }}
            >
              {itemDetails?.price} ر.س
            </Typography>
          </Box>

          <Typography
            variant="body1"
            sx={{ color: "text.secondary", lineHeight: 1.6, mb: 3 }}
          >
            {itemDetails?.description}
          </Typography>

          {hasDraftAllergenData ? (
            <Alert
              severity="warning"
              icon={<WarningAmberIcon />}
              sx={{ borderRadius: "12px", mb: 3, fontWeight: 600 }}
            >
              {hasAllergy ? (
                <>
                  {language === "ar" ? "مسببات حساسية محتملة وفق الوصفة المقترحة:" : "Potential allergens based on the suggested recipe:"}{" "}
                  {itemDetails.allergens.join(language === "ar" ? "، " : ", ")}.{" "}
                  {language === "ar" ? "هذه القائمة تقديرية وغير مؤكدة بمكونات المطبخ؛ اسأل الموظف عن المكونات والتلامس العرضي." : "This estimate is not verified against the kitchen’s ingredients; ask staff about ingredients and cross-contact."}
                </>
              ) : (
                language === "ar"
                  ? "لم يُحدَّد مسبب شائع في الوصفة المقترحة، لكن مكونات التحضير والتلامس العرضي غير مؤكدة. اسأل الموظف قبل الطلب."
                  : "No common allergen is listed for the suggested recipe, but actual ingredients and cross-contact are unverified. Please ask staff before ordering."
              )}
            </Alert>
          ) : (
            hasAllergy && (
              <Alert
                severity="error"
                icon={<WarningAmberIcon />}
                sx={{ borderRadius: "12px", mb: 3, fontWeight: 600 }}
              >
                يحتوي هذا الصنف على مسببات الحساسية:{" "}
                {itemDetails.allergens.join("، ")}
              </Alert>
            )
          )}
        </Box>
      </Box>

      <Box
        sx={{
          minHeight: bottomBarHeight,
          p: 2,
          backgroundColor: "background.paper",
          borderTop: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          boxShadow: "0px -4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton
            onClick={handleDecrease}
            size="small"
            sx={{ border: "1px solid", borderColor: "divider" }}
          >
            <RemoveIcon />
          </IconButton>

          <Typography
            variant="h6"
            sx={{ fontWeight: 700, minWidth: "20px", textAlign: "center" }}
          >
            {quantity}
          </Typography>

          <IconButton
            onClick={handleIncrease}
            size="small"
            sx={{
              border: "1px solid",
              borderColor: "primary.main",
              color: "primary.main",
            }}
          >
            <AddIcon />
          </IconButton>
        </Box>

        <Button
          variant="contained"
          size="large"
          onClick={() => {
            addToCart(itemDetails, quantity);
            onClose();
            setQuantity(1);
          }}
          sx={{
            flex: 1,
            mr: 2,
            borderRadius: "12px",
            fontWeight: 800,
            py: 1.2,
          }}
        >
          إضافة ({itemDetails?.price * quantity} ر.س)
        </Button>
      </Box>
    </SwipeableDrawer>
  );
}

export default ItemDetailsDrawer;
