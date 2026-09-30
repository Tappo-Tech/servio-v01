// HOOKS
import { useState } from "react";

// COMPONENTS
import ItemDetailsDrawer from "./ItemDetailsDrawer";

// MUI COMPONENTS
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";

// ICONS
import AddIcon from "@mui/icons-material/Add";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

// CONTEXTS
import { useCart } from "../../context/CartContext";

function MenuItemCard({ itemDetails }) {
  const { addToCart } = useCart();

  const hasAllergy = itemDetails.allergens && itemDetails.allergens.length > 0;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <Card
        sx={{
          display: "flex",
          justifyContent: "space-between",
          p: 1.5,
          mb: 1.6,
          borderRadius: "20px",
          boxShadow: "0 12px 32px rgba(23,26,47,.055)",
          border: "1px solid",
          borderColor: "rgba(255,255,255,.78)",
          background: "rgba(255,255,255,.9)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          transition: "transform .2s ease, box-shadow .2s ease",
        }}
      >
        <Box
          onClick={() => setIsDrawerOpen(true)}
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            pl: 1.5,
          }}
        >
          <Box sx={{ textAlign: "start" }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                mb: 0.5,
                fontSize: "1rem",
                color: "text.primary",
              }}
            >
              {itemDetails.name}
            </Typography>
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
              {itemDetails.description}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 1.5,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                color: "primary.main",
                fontSize: "0.95rem",
              }}
            >
              {itemDetails.price} ر.س
            </Typography>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(itemDetails);
              }}
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ ml: 0.5, mr: -0.5 }} />}
              sx={{
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                borderRadius: "8px",
                px: 1.5,
                py: 0.5,
                fontWeight: 700,
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: "primary.dark",
                  boxShadow: "none",
                },
              }}
            >
              إضافة
            </Button>
          </Box>
        </Box>

        <Box
          onClick={() => setIsDrawerOpen(true)}
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "flex-start",
          }}
        >
          <CardMedia
            component="img"
            image={itemDetails.image}
            alt={itemDetails.name}
            sx={{
              width: 95,
              height: 95,
              borderRadius: "12px",
              objectFit: "cover",
            }}
          />

          {hasAllergy && (
            <Tooltip title="انقر لمعرفة التفاصيل" arrow>
              <Box
                sx={{
                  position: "absolute",
                  top: 6,
                  left: 6,
                  backgroundColor: "error.main",
                  color: "white",
                  borderRadius: "50%",
                  width: 26,
                  height: 26,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "0px 2px 6px rgba(0,0,0,0.4)",
                  cursor: "pointer",
                }}
              >
                <WarningAmberIcon sx={{ fontSize: "1.1rem" }} />
              </Box>
            </Tooltip>
          )}
        </Box>
      </Card>

      <ItemDetailsDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        itemDetails={itemDetails}
      />
    </>
  );
}

export default MenuItemCard;
