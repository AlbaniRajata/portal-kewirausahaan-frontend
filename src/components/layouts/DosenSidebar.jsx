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
      path: "/dashboard/dosen",
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
      {/* HEADER */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderBottom: "1px solid #e0e0e0",
          minHeight: 73,
          justifyContent: "center",
        }}
      >
        <AccountBalanceIcon sx={{ fontSize: 32, color: "#0D59F2" }} />
        {!collapsed && (
          <Box sx={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>
            UPA PKK POLINEMA
          </Box>
        )}
      </Box>

      {/* MENU */}
      <List sx={{ px: collapsed ? 1 : 2, py: 2, flex: 1 }}>
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
                      borderRadius: 2,
                      backgroundColor:
                        isActive(item.path) || isParentActive
                          ? "#F0F4FF"
                          : "transparent",
                      "&:hover": {
                        backgroundColor:
                          isActive(item.path) || isParentActive
                            ? "#F0F4FF"
                            : "#f5f5f5",
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
                            ? "#0D59F2"
                            : "#666",
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
                                ? "#0D59F2"
                                : "#333",
                          }}
                        />
                        {item.hasSubmenu &&
                          (openBimbingan ? <ExpandLess /> : <ExpandMore />)}
                      </>
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>

              {/* SUBMENU */}
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
                              borderRadius: 2,
                              backgroundColor: subActive
                                ? "#E8F0FE"
                                : "transparent",
                              "&:hover": {
                                backgroundColor: subActive
                                  ? "#E8F0FE"
                                  : "#f5f5f5",
                              },
                            }}
                          >
                            <ListItemIcon
                              sx={{
                                minWidth: 36,
                                color: subActive ? "#0D59F2" : "#666",
                              }}
                            >
                              {sub.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={sub.text}
                              primaryTypographyProps={{
                                fontSize: 14,
                                fontWeight: subActive ? 600 : 500,
                                color: subActive ? "#0D59F2" : "#333",
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
  );
}