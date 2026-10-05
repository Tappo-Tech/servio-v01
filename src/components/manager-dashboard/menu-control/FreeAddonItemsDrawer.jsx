import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { normalizeAddonItemIds } from "../../../utils/menuItemOptions";

function FreeAddonItemsDrawer({
  open,
  onClose,
  items = [],
  selectedIds = [],
  excludeId,
  language = "ar",
  onSave,
}) {
  const [draftIds, setDraftIds] = useState(() => normalizeAddonItemIds(selectedIds));
  const selectedSet = useMemo(() => new Set(draftIds), [draftIds]);
  const eligibleItems = useMemo(() => (items || [])
    .filter((item) => item?.id && item.id !== excludeId && (item.available !== false || selectedSet.has(String(item.id))))
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), language === "ar" ? "ar" : "en")),
  [items, excludeId, language, selectedSet]);

  useEffect(() => {
    if (open) setDraftIds(normalizeAddonItemIds(selectedIds));
  }, [open, selectedIds]);

  const toggleItem = (id) => {
    setDraftIds((current) => current.includes(id)
      ? current.filter((entry) => entry !== id)
      : normalizeAddonItemIds([...current, id]));
  };

  const handleSave = () => {
    onSave?.(draftIds);
    onClose?.();
  };

  return (
    <Drawer
      anchor={language === "ar" ? "right" : "left"}
      open={open}
      onClose={onClose}
      sx={(theme) => ({
        zIndex: theme.zIndex.drawer + 2,
        "& .MuiDrawer-paper": {
          zIndex: theme.zIndex.drawer + 2,
          width: { xs: "100%", sm: 420 },
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        },
      })}
    >
      <Box dir={language === "ar" ? "rtl" : "ltr"} sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ p: 2.25, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              {language === "ar" ? "أصناف مجانية كإضافات" : "Free add-on items"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {language === "ar"
                ? "اختر أصنافًا من المنيو لتظهر كإضافات مجانية مع الصنف المرتبط فقط. تبقى أسعارها الأصلية عند طلبها منفردة."
                : "Choose menu items to offer free only with the linked item. Their regular prices remain when ordered separately."}
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label={language === "ar" ? "إغلاق" : "Close"}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />
        <Box sx={{ px: 2.25, py: 1 }}>
          <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 800 }}>
            {language === "ar" ? `المحدد: ${draftIds.length}` : `Selected: ${draftIds.length}`}
          </Typography>
        </Box>

        {eligibleItems.length ? (
          <List sx={{ px: 1.25, pt: 0, flex: 1, overflowY: "auto" }}>
            {eligibleItems.map((item) => {
              const selected = selectedSet.has(String(item.id));
              return (
                <ListItemButton
                  key={item.id}
                  component="label"
                  sx={{ borderRadius: 2, mb: 0.6, alignItems: "flex-start", border: "1px solid", borderColor: selected ? "primary.main" : "divider", bgcolor: selected ? "rgba(244,121,32,.07)" : "background.paper" }}
                >
                  <Checkbox checked={selected} onChange={() => toggleItem(String(item.id))} tabIndex={-1} disableRipple sx={{ pt: 0, color: "primary.main" }} />
                  <Box sx={{ minWidth: 0, pt: 0.25 }}>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{item.name}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {language === "ar" ? "السعر عند الطلب منفردًا" : "Regular standalone price"}: {Number(item.price || 0).toFixed(2)} {language === "ar" ? "ر.س" : "SAR"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "success.dark", fontWeight: 700 }}>
                      {item.available === false
                        ? (language === "ar" ? "غير متاح حاليًا؛ أزله أو أعد إتاحته" : "Unavailable; remove it or make it available again")
                        : (language === "ar" ? "يُقدّم مجانًا كإضافة للصنف المرتبط" : "Free only as an add-on to the linked item")}
                    </Typography>
                  </Box>
                </ListItemButton>
              );
            })}
          </List>
        ) : (
          <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: 3 }}>
            <Typography color="text.secondary" textAlign="center">
              {language === "ar" ? "لا توجد أصناف متاحة للاختيار حاليًا." : "There are no available menu items to choose from."}
            </Typography>
          </Box>
        )}

        <Divider />
        <Stack direction="row" spacing={1} sx={{ p: 2.25 }}>
          <Button fullWidth variant="contained" onClick={handleSave} sx={{ borderRadius: 2, fontWeight: 800 }}>
            {language === "ar" ? "حفظ الاختيارات" : "Save selection"}
          </Button>
          <Button fullWidth variant="outlined" color="inherit" onClick={onClose} sx={{ borderRadius: 2, fontWeight: 700 }}>
            {language === "ar" ? "إلغاء" : "Cancel"}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}

export default FreeAddonItemsDrawer;
