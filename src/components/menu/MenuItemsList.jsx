// COMPONENTS
import MenuItemCard from "./MenuItemCard";

// MUI COMPONENTS
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography"; // اختياري لمعالجة القائمة الفارغة

// DATA
import { useMenu } from "../../context/MenuContext";
import { useCart } from "../../context/CartContext";

function MenuItemsList() {
  // 1. التغيير هنا: استدعاء customerMenu المجهزة بالأصناف المتوفرة فقط
  const { customerMenu } = useMenu();
  const { cartItems } = useCart();

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

  const ItemList = customerMenu.map((item) => (
    <MenuItemCard key={item.id} itemDetails={item} />
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
