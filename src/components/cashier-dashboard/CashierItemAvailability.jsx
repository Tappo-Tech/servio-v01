import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { useMenu } from "../../context/MenuContext";
import { useLanguage } from "../../context/LanguageContext";

export default function CashierItemAvailability() {
  const { items = [], categoriesList = [], menuLoading, toggleAvailable } = useMenu();
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState(null);
  const categoryNames = useMemo(() => new Map(categoriesList.map((category) => [String(category.id), category.name])), [categoriesList]);
  const filteredItems = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return items.filter((item) => !needle || `${item.name} ${item.description || ""}`.toLocaleLowerCase().includes(needle));
  }, [items, query]);

  const changeAvailability = async (item) => {
    if (savingId) return;
    setSavingId(item.id);
    await toggleAvailable(item.id);
    setSavingId(null);
  };

  return (
    <Box sx={{ maxWidth: 1180, mx: "auto", py: { xs: 0.5, md: 1 } }}>
      <Box sx={{ display: "flex", alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between", gap: 1.5, mb: 2, flexDirection: { xs: "column", sm: "row" } }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 950 }}>
            {language === "ar" ? "توفر الأصناف" : "Item availability"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {language === "ar" ? "أخفِ الصنف عند نفاده دون تعديل السعر أو بيانات المنيو." : "Hide an item when it is unavailable without changing its menu details."}
          </Typography>
        </Box>
        <TextField
          size="small"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={language === "ar" ? "ابحث عن صنف" : "Search items"}
          sx={{ minWidth: { sm: 250 } }}
        />
      </Box>

      {menuLoading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 8 }}><CircularProgress /></Box>
      ) : filteredItems.length === 0 ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 8, color: "text.secondary" }}>
          <Inventory2OutlinedIcon sx={{ fontSize: 42, mb: 1 }} />
          <Typography>{language === "ar" ? "لا توجد أصناف مطابقة." : "No matching items."}</Typography>
        </Box>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))", lg: "repeat(3,minmax(0,1fr))" }, gap: 1.5 }}>
          {filteredItems.map((item) => {
            const available = item.isAvailableForSale ?? item.available;
            return (
              <Card key={item.id} elevation={0} sx={{ display: "grid", gridTemplateColumns: "96px minmax(0,1fr)", overflow: "hidden", border: "1px solid", borderColor: available ? "divider" : "warning.light", borderRadius: 3, opacity: available ? 1 : 0.78 }}>
                {item.image ? <CardMedia component="img" image={item.image} alt={item.name} sx={{ width: 96, height: "100%", minHeight: 132, objectFit: "cover" }} /> : <Box sx={{ width: 96, minHeight: 132, display: "grid", placeItems: "center", bgcolor: "grey.100" }}><Inventory2OutlinedIcon color="disabled" /></Box>}
                <CardContent sx={{ p: 1.35, minWidth: 0, "&:last-child": { pb: 1.35 } }}>
                  <Typography sx={{ fontWeight: 900, overflowWrap: "anywhere" }}>{item.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{Number(item.price || 0).toFixed(2)}</Typography>
                  <Chip size="small" label={categoryNames.get(String(item.category_id)) || (language === "ar" ? "بدون تصنيف" : "Uncategorized")} sx={{ mt: 0.8, maxWidth: "100%" }} />
                  <FormControlLabel
                    sx={{ display: "flex", justifyContent: "space-between", mx: 0, mt: 1, gap: 0.5 }}
                    label={available ? (language === "ar" ? "متوفر" : "Available") : (language === "ar" ? "مخفي / غير متوفر" : "Hidden / unavailable")}
                    labelPlacement="start"
                    control={<Switch checked={Boolean(available)} onChange={() => changeAvailability(item)} disabled={savingId === item.id} color="success" />}
                  />
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
