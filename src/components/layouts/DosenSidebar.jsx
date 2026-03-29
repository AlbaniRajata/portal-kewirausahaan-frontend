import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Tooltip,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BookIcon from "@mui/icons-material/Book";

export default function DosenSidebar({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isInBimbinganSubmenu = useMemo(() => {
    return (
      location.pathname.startsWith("/dosen/bimbingan") ||
      location.pathname.startsWith("/dosen/pembimbing/pengajuan")
    );
  }, [location.pathname]);

  const [openBimbingan, setOpenBimbingan] = useState(isInBimbinganSubmenu);

  useEffect(() => {
    setOpenBimbingan(isInBimbinganSubmenu);
  }, [isInBimbinganSubmenu]);

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/dosen/dashboard",
    },
    {
      text: "Biodata",
      icon: <PersonIcon />,
      path: "/dosen/biodata",
    },
    {
      text: "Bimbingan",
      icon: <SchoolIcon />,
      hasSubmenu: true,
      submenu: [
        {
          text: "Pengajuan Pembimbing",
          icon: <AssignmentIcon sx={{ fontSize: 20 }} />,
          path: "/dosen/pembimbing/pengajuan",
        },
        {
          text: "Log Bimbingan",
          icon: <BookIcon sx={{ fontSize: 20 }} />,
          path: "/dosen/bimbingan",
        },
      ],
    },
    {
      text: "Monitoring dan Evaluasi",
      icon: <AssessmentIcon />,
      path: "/dosen/monitoring",
    },
  ];

  const handleMenuClick = (item) => {
    if (item.hasSubmenu) {
      setOpenBimbingan((prev) => !prev);
    } else {
      navigate(item.path);
    }
  };

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
          alignItems: "center",
          gap: 1.5,
          minHeight: 73,
          justifyContent: "center",
        }}
      >
        <AccountBalanceIcon sx={{ fontSize: 32, color: "#ffffff" }} />
        {!collapsed && (
          <Box sx={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", color: "#ffffff" }}>
            UPA PKK POLINEMA
          </Box>
        )}
      </Box>
      
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          position: "relative",
          zIndex: 1,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": {
            width: 0,
            height: 0,
          },
        }}
      >
        <List sx={{ px: collapsed ? 1 : 2, py: 2 }}>
          {menuItems.map((item, index) => {
            const isParentActive =
              item.hasSubmenu && isInBimbinganSubmenu;

            return (
              <Box key={index}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <Tooltip title={collapsed ? item.text : ""} placement="right">
                    <ListItemButton
                      onClick={() => handleMenuClick(item)}
                      sx={{
                        borderRadius: 50,
                        backgroundColor:
                          isActive(item.path) || isParentActive
                            ? "rgba(255,255,255,0.18)"
                            : "transparent",
                        "&:hover": {
                          backgroundColor:
                            isActive(item.path) || isParentActive
                              ? "rgba(255,255,255,0.22)"
                              : "rgba(255,255,255,0.12)",
                        },
                        justifyContent: collapsed ? "center" : "flex-start",
                        px: collapsed ? 1 : 2,
                        minHeight: 44,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: collapsed ? "auto" : 40,
                          color:
                            isActive(item.path) || isParentActive
                              ? "#ffffff"
                              : "rgba(255,255,255,0.88)",
                          justifyContent: "center",
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>

                      {!collapsed && (
                        <>
                          <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                              fontSize: 14,
                              fontWeight:
                                isActive(item.path) || isParentActive
                                  ? 600
                                  : 500,
                              color:
                                isActive(item.path) || isParentActive
                                  ? "#ffffff"
                                  : "rgba(255,255,255,0.92)",
                            }}
                          />
                          {item.hasSubmenu && (
                            <Box sx={{ color: "rgba(255,255,255,0.92)", display: "flex", alignItems: "center" }}>
                              {openBimbingan ? <ExpandLess /> : <ExpandMore />}
                            </Box>
                          )}
                        </>
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>

                {item.hasSubmenu && !collapsed && (
                  <Collapse in={openBimbingan} timeout="auto" unmountOnExit>
                    <List disablePadding>
                      {item.submenu.map((sub, i) => {
                        const subActive =
                          location.pathname === sub.path ||
                          location.pathname.startsWith(sub.path + "/");

                        return (
                          <ListItem key={i} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                              onClick={() => navigate(sub.path)}
                              sx={{
                                pl: 4,
                                borderRadius: 50,
                                backgroundColor: subActive
                                  ? "rgba(255,255,255,0.18)"
                                  : "transparent",
                                "&:hover": {
                                  backgroundColor: subActive
                                    ? "rgba(255,255,255,0.22)"
                                    : "rgba(255,255,255,0.12)",
                                },
                              }}
                            >
                              <ListItemIcon
                                sx={{
                                  minWidth: 36,
                                  color: subActive ? "#ffffff" : "rgba(255,255,255,0.88)",
                                }}
                              >
                                {sub.icon}
                              </ListItemIcon>
                              <ListItemText
                                primary={sub.text}
                                primaryTypographyProps={{
                                  fontSize: 14,
                                  fontWeight: subActive ? 600 : 500,
                                  color: subActive ? "#ffffff" : "rgba(255,255,255,0.92)",
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                )}
              </Box>
            );
          })}
        </List>
      </Box>
    </Box>
  );
}