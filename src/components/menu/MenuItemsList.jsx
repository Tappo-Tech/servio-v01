// COMPONENTS
import MenuItemCard from "./MenuItemCard";

// MUI COMPONENTS
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography"; // اختياري لمعالجة القائمة الفارغة
import Skeleton from "@mui/material/Skeleton";
import CircularProgress from "@mui/material/CircularProgress";

// DATA
import { useMenu } from "../../context/MenuContext";
import { useCart } from "../../context/CartContext";

function MenuItemsList() {
  // 1. التغيير هنا: استدعاء customerMenu المجهزة بالأصناف المتوفرة فقط
  const { customerMenu, menuLoading } = useMenu();
  const { cartItems } = useCart();

  if (menuLoading && (!customerMenu || customerMenu.length === 0)) {
    return (
      <Box role="status" aria-label="جارٍ تحميل الأصناف" sx={{ display: "flex", flexDirection: "column", gap: 2, pb: cartItems.length > 0 ? "90px" : 0 }}>
        {[0, 1, 2].map((placeholder) => (
          <Box key={placeholder} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, minHeight: 120, borderRadius: 2.5, bgcolor: "background.paper" }}>
            <Box sx={{ flex: 1 }}>
              <Skeleton width="55%" height={28} />
              <Skeleton width="90%" />
              <Skeleton width="75%" />
              <Skeleton width="35%" height={28} />
            </Box>
            <Box sx={{ width: 95, height: 95, display: "grid", placeItems: "center", borderRadius: 1.5, bgcolor: "action.hover" }}>
              <CircularProgress size={22} />
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  // 2. تحسين اختياري: رسالة بسيطة في حال عدم وجود أصناف متوفرة بالقسم المحدد
  if (!customerMenu || customerMenu.length === 0) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        align="center"
        sx={{ py: 6, fontWeight: 500 }}
      >
        لا توجد أصناف متاحة في هذا القسم حاليًا. جرّب اختيار قسم آخر.
      </Typography>
    );
  }

  const ItemList = customerMenu.map((item, index) => (
    <MenuItemCard key={item.id} itemDetails={item} priority={index < 2} />
  ));

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        pb: cartItems.length > 0 ? "90px" : "0",
      }}
    >
      {ItemList}
    </Box>
  );
}

export default MenuItemsList;
