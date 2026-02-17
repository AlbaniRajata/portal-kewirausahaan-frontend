import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

export default function ReviewerSidebar({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (location.pathname === path) return true;
    if (path === "/reviewer/penugasan" && location.pathname.startsWith("/reviewer/penugasan/")) return true;
    return false;
  };

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/reviewer/dashboard",
    },
    {
      text: "Penugasan Saya",
      icon: <AssignmentIcon />,
      path: "/reviewer/penugasan",
    },
  ];

  return (
    <Box
      sx={{
        width: collapsed ? 70 : 250,
        height: "100vh",
        backgroundColor: "#fff",
        borderRight: "1px solid #e0e0e0",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        transition: "width 0.3s ease",
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 1.5,
          borderBottom: "1px solid #e0e0e0",
          minHeight: 73,
          justifyContent: "center",
        }}
      >
        <AccountBalanceIcon
          sx={{
            fontSize: 32,
            color: "#0D59F2",
            transition: "font-size 0.3s ease",
          }}
        />
        {!collapsed && (
          <Box
            sx={{
              fontWeight: 700,
              fontSize: 13,
              color: "#000",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}
          >
            UPA PKK POLINEMA
          </Box>
        )}
      </Box>

      <List sx={{ px: collapsed ? 1 : 2, py: 2, flex: 1 }}>
        {menuItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip title={collapsed ? item.text : ""} placement="right">
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 50,
                  backgroundColor: isActive(item.path) ? "#F0F4FF" : "transparent",
                  "&:hover": {
                    backgroundColor: isActive(item.path) ? "#F0F4FF" : "#f5f5f5",
                  },
                  justifyContent: collapsed ? "center" : "flex-start",
                  px: collapsed ? 1 : 2,
                  minHeight: 44,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? "auto" : 40,
                    color: isActive(item.path) ? "#0D59F2" : "#666",
                    justifyContent: "center",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                {!collapsed && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: isActive(item.path) ? 600 : 500,
                      color: isActive(item.path) ? "#0D59F2" : "#333",
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
