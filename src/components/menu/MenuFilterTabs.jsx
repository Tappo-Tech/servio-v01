// MUI COMPONENTS
import { ToggleButton, ToggleButtonGroup, Box } from "@mui/material";

// CONTEXTS
import { useMenu } from "../../context/MenuContext";

function MenuFilterTabs() {
  const { categoriesList = [], selectedCategories, handleAlignment } = useMenu();

  const filterTabs = categoriesList.map((category) => (
    <ToggleButton key={category.id} value={category.id}>
      {category.name}
    </ToggleButton>
  ));

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
      <ToggleButtonGroup
        value={selectedCategories}
        onChange={handleAlignment}
        aria-label="menu categories"
        sx={{
          display: "flex",
          gap: 1,
          width: "max-content",
          "& .MuiToggleButton-root": {
            borderRadius: "999px",
            border: "1px solid",
            borderColor: "divider",
            px: { xs: 2, sm: 2.5 },
            py: 0.7,
            fontSize: "0.875rem",
            textTransform: "none",
            fontWeight: 500,
            whiteSpace: "nowrap",
            color: "text.secondary",
            backgroundColor: "background.default",
            "&.Mui-selected": {
              backgroundColor: "primary.main",
              color: "primary.contrastText",
              borderColor: "primary.main",
              "&:hover": {
                backgroundColor: "primary.dark",
              },
            },
          },
        }}
      >
        <ToggleButton value="all">الكل</ToggleButton>
        {filterTabs}
      </ToggleButtonGroup>
    </Box>
  );
}

export default MenuFilterTabs;