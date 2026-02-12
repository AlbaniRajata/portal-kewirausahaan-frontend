import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

export default function JuriSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (location.pathname === path) return true;

    if (path === "/juri/penugasan" && location.pathname.startsWith("/juri/penugasan/")) return true;
    return false;
  };

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/juri/dashboard",
    },
    {
      text: "Penugasan Saya",
      icon: <AssignmentIcon />,
      path: "/juri/penugasan",
    },
  ];

  return (
    <Box
      sx={{
        width: 250,
        height: "100vh",
        backgroundColor: "#fff",
        borderRight: "1px solid #e0e0e0",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
      }}
    >
      <Box
        sx={{
          p: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <AccountBalanceIcon sx={{ fontSize: 30, color: "#0D59F2" }} />
        <Box sx={{ textAlign: "center" }}>
          <Box sx={{ fontWeight: 700, fontSize: 12, color: "#000" }}>
            UPA PKK POLINEMA
          </Box>
        </Box>
      </Box>

      <List sx={{ px: 2, py: 2, flex: 1 }}>
        {menuItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                backgroundColor: isActive(item.path) ? "#F0F4FF" : "transparent",
                "&:hover": {
                  backgroundColor: isActive(item.path) ? "#F0F4FF" : "#f5f5f5",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: isActive(item.path) ? "#0D59F2" : "#666",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: isActive(item.path) ? 600 : 500,
                  color: isActive(item.path) ? "#0D59F2" : "#333",
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}