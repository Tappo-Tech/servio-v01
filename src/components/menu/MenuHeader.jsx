// COMPONENTS
import MenuSearchBar from "./MenuSearchBar";

// MUI COMPONENTS
import { Box, Stack, Chip, Typography } from "@mui/material";

// ICONS
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";

// CONTEXTS
import { useStore } from "../../context/StoreInfoContext";

function MenuHeader({ table }) {
  // Context: استخراج بيانات المحل (الاسم والوصف) لعرضها في الهيدر الرئيسي للمنيو
  const { storeInfo } = useStore();

  return (
    <Box sx={{ pb: 0.7 }}>
      {/* TITLE & TABLE NUMBER */}
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2.5,
        }}
      >
        {/* STORE NAME AND TAGLINE */}
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 900, letterSpacing: "-0.7px", mb: 0.5, fontSize: { xs: "1.65rem", sm: "2rem" } }}
          >
            {storeInfo?.store_name || "اسم المتجر"}
          </Typography>
        </Box>

        {/* TABLE NUMBER BADGE */}
        <Chip
          icon={
            <PlaceOutlinedIcon
              sx={{ fontSize: "1.1rem !important", ml: "4px !important" }}
            />
          }
          label={`طاولة ${table}`}
          sx={{
            px: 1.5,
            py: 2.2,
            borderRadius: "12px",
            fontWeight: 700,
            fontSize: "0.875rem",
            color: "secondary.contrastText",
            backgroundColor: "secondary.main",
            "& .MuiChip-icon": {
              marginLeft: "4px",
              marginRight: "-2px",
            },
          }}
        />
      </Stack>

      {/* MENU SEARCH BAR COMPONENT */}
      <MenuSearchBar />
    </Box>
  );
}

export default MenuHeader;