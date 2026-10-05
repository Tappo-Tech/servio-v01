import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

import { useMenu } from "../../context/MenuContext";
import { useLanguage } from "../../context/LanguageContext";

function MenuFilterTabs() {
  const { categoriesList = [], selectedCategory = "all", handleAlignment } = useMenu();
  const { language } = useLanguage();
  const isEnglish = language === "en";
  const filters = [
    { id: "all", label: isEnglish ? "All" : "الكل" },
    ...categoriesList.map((category) => ({
      id: category.id,
      label: isEnglish ? (category.name_en || category.name) : category.name,
    })),
  ];

  return (
    <Box
      sx={{
        width: "100%",
        overflowX: "auto",
        py: 1,
        mb: 2,
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
      }}
    >
      <Stack
        direction="row"
        spacing={0.8}
        role="group"
        aria-label={isEnglish ? "Menu categories" : "تصنيفات المنيو"}
        sx={{ width: "max-content", minWidth: "100%", pb: 0.5 }}
      >
        {filters.map((filter) => {
          const selected = selectedCategory === filter.id;
          return (
            <Chip
              key={filter.id}
              label={filter.label}
              clickable
              color={selected ? "primary" : "default"}
              variant={selected ? "filled" : "outlined"}
              aria-pressed={selected}
              onClick={() => handleAlignment(null, filter.id)}
              sx={{
                flexShrink: 0,
                fontWeight: selected ? 700 : 500,
                transition: "background-color 160ms ease, border-color 160ms ease, color 160ms ease",
              }}
            />
          );
        })}
      </Stack>
    </Box>
  );
}

export default MenuFilterTabs;
