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
import { useState, useMemo } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import DescriptionIcon from "@mui/icons-material/Description";
import SchoolIcon from "@mui/icons-material/School";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BookIcon from "@mui/icons-material/Book";

export default function SidebarMahasiswa({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isInBimbinganSubmenu = useMemo(() => {
    return (
      location.pathname === "/mahasiswa/pembimbing/dosen" ||
      location.pathname === "/mahasiswa/bimbingan" ||
      location.pathname.startsWith("/mahasiswa/bimbingan/")
    );
  }, [location.pathname]);

  const [openBimbingan, setOpenBimbingan] = useState(isInBimbinganSubmenu);

  const isActive = (path) => {
    if (path === "/mahasiswa/proposal" && location.pathname === "/mahasiswa/proposal/form") return true;
    if (path === "/mahasiswa/bimbingan" && location.pathname.startsWith("/mahasiswa/bimbingan/")) return true;
    if (path === "/mahasiswa/anggota-tim" && location.pathname === "/mahasiswa/undangan-anggota") return true;
    return location.pathname === path;
  };

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/mahasiswa/dashboard",
    },
    {
      text: "Biodata",
      icon: <PersonIcon />,
      path: "/mahasiswa/biodata",
    },
    {
      text: "Anggota Tim",
      icon: <GroupIcon />,
      path: "/mahasiswa/anggota-tim",
    },
    {
      text: "Daftar Proposal",
      icon: <DescriptionIcon />,
      path: "/mahasiswa/proposal",
    },
    {
      text: "Bimbingan",
      icon: <SchoolIcon />,
      hasSubmenu: true,
      submenu: [
        {
          text: "Pengajuan Pembimbing",
          icon: <AssignmentIcon sx={{ fontSize: 20 }} />,
          path: "/mahasiswa/pembimbing/dosen",
        },
        {
          text: "Log Bimbingan",
          icon: <BookIcon sx={{ fontSize: 20 }} />,
          path: "/mahasiswa/bimbingan",
        },
      ],
    },
    {
      text: "Monitoring dan Evaluasi",
      icon: <AssessmentIcon />,
      path: "/mahasiswa/monev",
    },
  ];

  const handleMenuClick = (item) => {
    if (item.hasSubmenu) {
      setOpenBimbingan(!openBimbingan);
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
          flexDirection: "row",
          alignItems: "center",
          gap: 1.5,
          minHeight: 73,
          justifyContent: collapsed ? "center" : "center",
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
          <Box key={index}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={collapsed ? item.text : ""} placement="right">
                <ListItemButton
                  onClick={() => handleMenuClick(item)}
                  sx={{
                    borderRadius: 50,
                    backgroundColor:
                      isActive(item.path) ||
                      (item.hasSubmenu && isInBimbinganSubmenu)
                        ? "rgba(255,255,255,0.18)"
                        : "transparent",
                    "&:hover": {
                      backgroundColor:
                        isActive(item.path) ||
                        (item.hasSubmenu && isInBimbinganSubmenu)
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
                        isActive(item.path) ||
                        (item.hasSubmenu && isInBimbinganSubmenu)
                          ? "#ffffff"
                          : "rgba(255,255,255,0.88)",
                      justifyContent: "center",
                      display: "flex",
                      alignItems: "center",
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
                            isActive(item.path) ||
                            (item.hasSubmenu && isInBimbinganSubmenu)
                              ? 600
                              : 500,
                          color:
                            isActive(item.path) ||
                            (item.hasSubmenu && isInBimbinganSubmenu)
                              ? "#ffffff"
                              : "rgba(255,255,255,0.92)",
                        }}
                      />
                      {item.hasSubmenu && (
                        <Box sx={{ display: "flex", alignItems: "center", color: "rgba(255,255,255,0.92)" }}>
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
                <List component="div" disablePadding>
                  {item.submenu.map((subItem, subIndex) => (
                    <ListItem key={subIndex} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        onClick={() => navigate(subItem.path)}
                        sx={{
                          pl: 4,
                          pr: 2,
                          borderRadius: 5,
                          backgroundColor: isActive(subItem.path)
                            ? "rgba(255,255,255,0.18)"
                            : "transparent",
                          "&:hover": {
                            backgroundColor: isActive(subItem.path)
                              ? "rgba(255,255,255,0.22)"
                              : "rgba(255,255,255,0.12)",
                          },
                          minHeight: 40,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 36,
                            color: isActive(subItem.path) ? "#ffffff" : "rgba(255,255,255,0.88)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {subItem.icon}
                        </ListItemIcon>

                        <ListItemText
                          primary={subItem.text}
                          primaryTypographyProps={{
                            fontSize: 14,
                            fontWeight: isActive(subItem.path) ? 600 : 500,
                            color: isActive(subItem.path) ? "#ffffff" : "rgba(255,255,255,0.92)",
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </Box>
        ))}
      </List>
    </Box>
  );
}
