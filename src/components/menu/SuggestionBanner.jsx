import { useSuggestions } from "../../context/SuggestionsContext";
import { useCart } from "../../context/CartContext";

// MUI COMPONENTS
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";

function SuggestionBanner() {
  const { suggestedItems, dismissSuggestion } = useSuggestions();
  const { addToCart, cartItems } = useCart();

  // عدم العرض إذا لم تكن هناك اقتراحات أو السلة فارغة
  if (!suggestedItems || suggestedItems.length === 0 || cartItems.length === 0) {
    return null;
  }

  const currentSuggestion = suggestedItems[0];

  return (
    <Paper
      elevation={2}
      sx={{
        position: "fixed",
        bottom: "120px", // ارتفاع متناسق فوق شريط السلة العائم
        left: "16px",
        right: "80px", // ترك مسافة مريحة لزر نداء الجرسون في اليمين
        height: "52px", // ارتفاع نحيف متوافق مع ارتفاع زر SpeedDial
        bgcolor: "background.paper",
        borderRadius: "26px", // حواف كبسولية مدورة بالكامل لتماثل الأزرار العائمة
        px: 1.2,
        py: 0.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        zIndex: 1030,
        border: "1.5px solid",
        borderColor: "primary.main", // إطار برتقالي مطابق للتصميم
        boxShadow: "0px 4px 14px rgba(255, 120, 0, 0.12)",
      }}
    >
      {/* جهة التفاصيل والصورة */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, overflow: "hidden" }}>
        <Box
          component="img"
          src={currentSuggestion.image || "/logo-icon.webp"}
          alt={currentSuggestion.name}
          sx={{
            width: 38,
            height: 38,
            borderRadius: "50%", // صورة دائريّة تتناسق مع حواف الكبسولة
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
        <Box
          sx={{
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
            <AutoAwesomeIcon sx={{ fontSize: "0.75rem", color: "primary.main" }} />
            <Typography
              variant="caption"
              color="primary.main"
              sx={{ fontWeight: 800, fontSize: "0.65rem", lineHeight: 1 }}
            >
              يناسب طلبك
            </Typography>
          </Box>

          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              fontSize: "0.8rem",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {currentSuggestion.name}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 700, fontSize: "0.7rem", lineHeight: 1 }}
          >
            +{Number(currentSuggestion.price).toFixed(2)} ر.س
          </Typography>
        </Box>
      </Box>

      {/* الأزرار: إضافة وإغلاق */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, flexShrink: 0 }}>
        <Button
          size="small"
          variant="contained"
          disableElevation
          onClick={() => addToCart(currentSuggestion)}
          sx={{
            borderRadius: "16px",
            fontWeight: 700,
            px: 1.5,
            py: 0.3,
            minWidth: "auto",
            fontSize: "0.72rem",
            bgcolor: "primary.main",
            "&:hover": { bgcolor: "primary.dark" },
          }}
        >
          + إضافة
        </Button>
        <IconButton
          size="small"
          onClick={() => dismissSuggestion(currentSuggestion.id)}
          sx={{ color: "text.disabled", p: 0.3 }}
        >
          <CloseIcon sx={{ fontSize: "0.95rem" }} />
        </IconButton>
      </Box>
    </Paper>
  );
}

export default SuggestionBanner;