import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";
import { useMenu } from "../../context/MenuContext";
import {
  buildAddonChoices,
  normalizeAddonLimit,
  normalizeSelectedAddons,
} from "../../utils/menuItemOptions";

function CartItemCard({ cartItemDetails }) {
  const { updatedQuantity, toggleCartItemAddon } = useCart();
  const { language } = useLanguage();
  const { items = [] } = useMenu();
  const isArabic = language === "ar";
  const addonChoices = buildAddonChoices(cartItemDetails, items);
  const maxAddons = normalizeAddonLimit(cartItemDetails.max_addons, addonChoices.length);
  const selectedAddons = normalizeSelectedAddons(cartItemDetails.selected_addons, addonChoices, maxAddons);
  const selectedKeys = new Set(selectedAddons.map((addon) => addon.id ? `item:${addon.id}` : `text:${addon.name.toLocaleLowerCase()}`));

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
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
          minWidth: 0,
          pl: 1.2,
        }}
      >
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

        {addonChoices.length > 0 && (
          <Box
            sx={{
              mt: 1.25,
              p: 1,
              border: "1px solid rgba(244,121,32,.2)",
              borderRadius: "13px",
              bgcolor: "rgba(244,121,32,.045)",
              overflow: "hidden",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 0.7 }}>
              <Typography variant="caption" sx={{ fontWeight: 900, color: "text.primary" }}>
                {isArabic ? "إضافات مجانية" : "Free add-ons"}
              </Typography>
              <Chip
                size="small"
                color={selectedAddons.length >= maxAddons && maxAddons > 0 ? "primary" : "default"}
                label={`${selectedAddons.length}/${maxAddons}`}
                sx={{ height: 21, fontSize: "0.68rem", fontWeight: 800 }}
              />
            </Box>
            <Box
              role="group"
              aria-label={isArabic ? "خيارات الإضافات" : "Add-on choices"}
              sx={{ display: "flex", gap: 0.65, overflowX: "auto", py: 0.7, scrollbarWidth: "thin" }}
            >
              {addonChoices.map((choice) => {
                const selected = selectedKeys.has(choice.key);
                const atLimit = maxAddons === 0 || selectedAddons.length >= maxAddons;
                return (
                  <Button
                    key={choice.key}
                    size="small"
                    variant={selected ? "contained" : "outlined"}
                    aria-pressed={selected}
                    disabled={!selected && atLimit}
                    onClick={() => toggleCartItemAddon(cartItemDetails.id, choice, addonChoices)}
                    sx={{
                      minWidth: "max-content",
                      whiteSpace: "nowrap",
                      borderRadius: "20px",
                      px: 1.25,
                      py: 0.35,
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      borderColor: "rgba(244,121,32,.45)",
                      ...(selected ? { bgcolor: "primary.main", color: "common.white" } : {}),
                    }}
                  >
                    {choice.name}
                  </Button>
                );
              })}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.66rem", lineHeight: 1.35 }}>
              {maxAddons === 0
                ? (isArabic ? "لا يمكن اختيار إضافات لهذا الصنف." : "No add-ons can be selected for this item.")
                : (isArabic
                  ? "لا زيادة على السعر؛ الاختيارات نفسها تُطبّق على كامل الكمية. اضغط المختار لإزالته."
                  : "No extra charge; the same choices apply to the full quantity. Tap a selected choice to remove it.")}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1.5, gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", fontSize: "0.95rem", whiteSpace: "nowrap" }}>
            {cartItemDetails.price} {isArabic ? "ر.س" : "SAR"}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.7, sm: 1.2 } }}>
            <IconButton
              aria-label={isArabic ? "تقليل الكمية" : "Decrease quantity"}
              onClick={() => updatedQuantity(cartItemDetails.id, cartItemDetails.quantity - 1)}
              size="small"
              sx={{ border: "1px solid", borderColor: "divider" }}
            >
              <RemoveIcon />
            </IconButton>

            <Typography variant="h6" sx={{ fontWeight: 700, minWidth: "20px", textAlign: "center" }}>
              {cartItemDetails.quantity}
            </Typography>

            <IconButton
              aria-label={isArabic ? "زيادة الكمية" : "Increase quantity"}
              onClick={() => updatedQuantity(cartItemDetails.id, cartItemDetails.quantity + 1)}
              size="small"
              sx={{ border: "1px solid", borderColor: "primary.main", color: "primary.main" }}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <CardMedia
        component="img"
        image={cartItemDetails.image || "/logo-icon.webp"}
        alt={cartItemDetails.name}
        sx={{
          width: { xs: 76, sm: 95 },
          height: { xs: 76, sm: 95 },
          flexShrink: 0,
          borderRadius: "12px",
          objectFit: "cover",
        }}
      />
    </Card>
  );
}

export default CartItemCard;
