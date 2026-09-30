// MUI COMPONENTS
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

function SidebarItem({ navItem, isSelected, onSelect }) {
  return (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <ListItemButton
        selected={isSelected}
        onClick={onSelect}
        sx={{
          borderRadius: "14px",
          py: 1.25,
          px: 1.75,
          gap: 1.5,
          justifyContent: "flex-start",
          transition: "all 0.2s ease-in-out",
          // عند تحديد العنصر
          "&.Mui-selected": {
            bgcolor: "rgba(255, 96, 46, 0.12)",
            color: "#ff602e",
            "&:hover": {
              bgcolor: "rgba(255, 96, 46, 0.18)",
            },
            "& .MuiListItemIcon-root": {
              color: "#ff602e",
            },
          },
          // عند تمرير الماوس فوق العنصر غير المحدد
          "&:hover": {
            bgcolor: "rgba(255, 255, 255, 0.08)",
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: "auto",
            color: isSelected ? "#ff602e" : "rgba(255, 255, 255, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.2s ease-in-out",
          }}
        >
          {navItem.icon}
        </ListItemIcon>
        <ListItemText
          primary={navItem.label}
          primaryTypographyProps={{
            fontSize: "0.95rem",
            fontWeight: isSelected ? 700 : 500,
            sx: {
              textAlign: "right",
              color: isSelected ? "#ff602e" : "rgba(255, 255, 255, 0.87)",
            },
          }}
        />
      </ListItemButton>
    </ListItem>
  );
}

export default SidebarItem;