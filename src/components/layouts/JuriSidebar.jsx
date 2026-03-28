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
import PersonIcon from "@mui/icons-material/Person";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

export default function JuriSidebar({ collapsed }) {
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
      text: "Biodata",
      icon: <PersonIcon />,
      path: "/juri/biodata",
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
        width: collapsed ? 70 : 250,
        height: "calc(100vh - 24px)",
        background: "linear-gradient(135deg, #0D59F2 0%, #1e40af 100%)",
        border: "1px solid rgba(255,255,255,0.16)",
        borderLeft: "none",
        borderTopRightRadius: 24,
        borderBottomRightRadius: 24,
        boxShadow: "0 10px 30px rgba(13,89,242,0.22)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 12,
        transition: "width 0.3s ease",
        "&::before": {
          content: '""',
          position: "absolute",
          top: -42,
          right: -46,
          width: 210,
          height: 210,
          borderRadius: "50%",
          backgroundColor: "rgba(255,255,255,0.07)",
          pointerEvents: "none",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: -34,
          left: -76,
          width: 182,
          height: 182,
          borderRadius: "50%",
          backgroundColor: "rgba(255,255,255,0.055)",
          boxShadow: "94px -54px 0 18px rgba(255,255,255,0.04)",
          pointerEvents: "none",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          p: 2,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 1.5,
          minHeight: 73,
          justifyContent: "center",
        }}
      >
        <AccountBalanceIcon
          sx={{
            fontSize: 32,
            color: "#ffffff",
            transition: "font-size 0.3s ease",
          }}
        />
        {!collapsed && (
          <Box
            sx={{
              fontWeight: 700,
              fontSize: 13,
              color: "#ffffff",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}
          >
            UPA PKK POLINEMA
          </Box>
        )}
      </Box>

      <List sx={{ px: collapsed ? 1 : 2, py: 2, flex: 1, position: "relative", zIndex: 1 }}>
        {menuItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip title={collapsed ? item.text : ""} placement="right">
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 50,
                  backgroundColor: isActive(item.path) ? "rgba(255,255,255,0.18)" : "transparent",
                  "&:hover": {
                    backgroundColor: isActive(item.path) ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)",
                  },
                  justifyContent: collapsed ? "center" : "flex-start",
                  px: collapsed ? 1 : 2,
                  minHeight: 44,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? "auto" : 40,
                    color: isActive(item.path) ? "#ffffff" : "rgba(255,255,255,0.88)",
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
                      color: isActive(item.path) ? "#ffffff" : "rgba(255,255,255,0.92)",
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