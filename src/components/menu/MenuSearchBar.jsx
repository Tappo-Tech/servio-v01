// MUI COMPONENTS
import { TextField } from "@mui/material";

// CONTEXTS
import { useMenu } from "../../context/MenuContext";

function MenuSearchBar() {
  const { searchQuery, setSearchQuery } = useMenu();

  return (
    <TextField
      fullWidth
      size="small"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="ابحث عن قهوتك أو حلاك المفضل..."
      variant="outlined"
      sx={{
        background: "rgba(248,249,250,.72)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            borderColor: "divider",
          },
          "&.Mui-focused fieldset": {
            borderColor: "secondary.light",
          },
        },
      }}
    />
  );
}

export default MenuSearchBar;
