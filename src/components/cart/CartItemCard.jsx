import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ControlPointDuplicateRoundedIcon from "@mui/icons-material/ControlPointDuplicateRounded";
import RemoveIcon from "@mui/icons-material/Remove";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";
import { useMenu } from "../../context/MenuContext";
import { getCartLineKey } from "../../utils/cartItemUtils";
import {
  buildAddonChoices,
  normalizeAddonLimit,
  normalizeSelectedAddons,
} from "../../utils/menuItemOptions";

function CartItemCard({ cartItemDetails }) {
  const { updatedQuantity, toggleCartItemAddon, addSeparateCartItem } = useCart();
  const { language } = useLanguage();
  const { items = [] } = useMenu();
  const isArabic = language === "ar";
  const addonChoices = buildAddonChoices(cartItemDetails, items);
  const maxAddons = normalizeAddonLimit(cartItemDetails.max_addons, addonChoices.length);
  const selectedAddons = normalizeSelectedAddons(cartItemDetails.selected_addons, addonChoices, maxAddons);
  const selectedKeys = new Set(selectedAddons.map((addon) => addon.id ? `item:${addon.id}` : `text:${addon.name.toLocaleLowerCase()}`));
  const lineId = getCartLineKey(cartItemDetails);

  return (
    <Card
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: addonChoices.length ? "stretch" : "center",
        p: 1.5,
        mb: 2,
        gap: 1,
        borderRadius: "16px",
        boxShadow: "0px 2px 12px rgba(0,0,0,0.04)",
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, minWidth: 0, pl: 1.2 }}>
        <Box sx={{ textAlign: "start" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5, fontSize: "1rem" }}>
            {cartItemDetails.name}
          </Typography>
          {cartItemDetails.description && (
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontSize: "0.8rem",
                fontWeight: 500,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {cartItemDetails.description}
            </Typography>
          )}
        </Box>

        {maxAddons > 0 && addonChoices.length > 0 && (
          <Box sx={{ mt: 1.25, p: 1.1, border: "1px solid rgba(244,121,32,.18)", borderRadius: "15px", background: "linear-gradient(135deg, rgba(255,248,241,.98), rgba(255,255,255,.98))", overflow: "hidden" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 0.8 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ display: "block", fontWeight: 900, color: "text.primary" }}>
                  {isArabic ? "إضافات اختيارية" : "Optional add-ons"}
                </Typography>
                <Typography variant="caption" sx={{ display: "block", color: "text.secondary", fontSize: "0.66rem" }}>
                  {isArabic ? "مجانية — اختر حتى " : "Free — choose up to "}{maxAddons}
                </Typography>
              </Box>
              <Chip
                size="small"
                color={selectedAddons.length >= maxAddons ? "primary" : "default"}
                label={`${selectedAddons.length} / ${maxAddons}`}
                sx={{ height: 24, borderRadius: "9px", fontSize: "0.69rem", fontWeight: 900, bgcolor: selectedAddons.length >= maxAddons ? undefined : "rgba(255,255,255,.9)" }}
              />
            </Box>

            <Box
              role="group"
              aria-label={isArabic ? "خيارات الإضافات" : "Add-on choices"}
              sx={{ display: "flex", gap: 0.7, overflowX: "auto", py: 0.85, scrollbarWidth: "none", overscrollBehaviorX: "contain", "&::-webkit-scrollbar": { display: "none" } }}
            >
              {addonChoices.map((choice) => {
                const selected = selectedKeys.has(choice.key);
                const atLimit = selectedAddons.length >= maxAddons;
                return (
                  <Chip
                    key={choice.key}
                    size="medium"
                    variant={selected ? "filled" : "outlined"}
                    color={selected ? "primary" : "default"}
                    aria-pressed={selected}
                    disabled={!selected && atLimit}
                    onClick={() => toggleCartItemAddon(lineId, choice, addonChoices)}
                    icon={selected ? <CheckCircleRoundedIcon /> : <AddCircleOutlineRoundedIcon />}
                    label={choice.name}
                    sx={{ flex: "0 0 auto", whiteSpace: "nowrap", borderRadius: "11px", fontSize: "0.73rem", fontWeight: 800, borderColor: "rgba(244,121,32,.36)", bgcolor: selected ? undefined : "rgba(255,255,255,.82)", "& .MuiChip-icon": { fontSize: 17 } }}
                  />
                );
              })}
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.66rem", lineHeight: 1.4 }}>
              {isArabic
                ? "الاختيارات تنطبق على كامل كمية هذا السطر. اضغط الإضافة المحددة لإزالتها."
                : "Choices apply to the full quantity on this line. Tap a selected add-on to remove it."}
            </Typography>
          </Box>
        )}

        {maxAddons > 0 && addonChoices.length > 0 && (
          <Button
            size="small"
            variant="text"
            startIcon={<ControlPointDuplicateRoundedIcon fontSize="small" />}
            onClick={() => addSeparateCartItem(lineId)}
            aria-label={isArabic ? `فصل وحدة أو إضافة وحدة منفصلة من ${cartItemDetails.name} بإضافات مختلفة` : `Split or add a separate ${cartItemDetails.name} line with different add-ons`}
            sx={{ alignSelf: isArabic ? "flex-start" : "flex-end", mt: 0.35, borderRadius: "9px", fontSize: "0.7rem", fontWeight: 850, minHeight: 30 }}
          >
            {isArabic
              ? (Number(cartItemDetails.quantity) > 1 ? "فصل وحدة بإضافات مستقلة" : "إضافة وحدة بإضافات مستقلة")
              : (Number(cartItemDetails.quantity) > 1 ? "Split one unit for different add-ons" : "Add one unit with different add-ons")}
          </Button>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1.5, gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", fontSize: "0.95rem", whiteSpace: "nowrap" }}>
            {cartItemDetails.price} {isArabic ? "ر.س" : "SAR"}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.7, sm: 1.2 } }}>
            <IconButton aria-label={isArabic ? "تقليل الكمية" : "Decrease quantity"} onClick={() => updatedQuantity(lineId, cartItemDetails.quantity - 1)} size="small" sx={{ border: "1px solid", borderColor: "divider" }}>
              <RemoveIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700, minWidth: "20px", textAlign: "center" }}>{cartItemDetails.quantity}</Typography>
            <IconButton aria-label={isArabic ? "زيادة الكمية" : "Increase quantity"} onClick={() => updatedQuantity(lineId, cartItemDetails.quantity + 1)} size="small" sx={{ border: "1px solid", borderColor: "primary.main", color: "primary.main" }}>
              <AddIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <CardMedia
        component="img"
        image={cartItemDetails.image || "/logo-icon.webp"}
        alt={cartItemDetails.name}
        sx={{ width: { xs: 76, sm: 95 }, height: { xs: 76, sm: 95 }, flexShrink: 0, borderRadius: "12px", objectFit: "cover" }}
      />
    </Card>
  );
}

export default CartItemCard;
