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
    if (
      path === "/mahasiswa/proposal" &&
      location.pathname === "/mahasiswa/proposal/form"
    ) {
      return true;
    }
    if (
      path === "/mahasiswa/bimbingan" &&
      location.pathname.startsWith("/mahasiswa/bimbingan/")
    ) {
      return true;
    }
    return location.pathname === path;
  };

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/dashboard/mahasiswa",
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
      path: "/mahasiswa/monitoring",
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
          justifyContent: collapsed ? "center" : "center",
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
          <Box key={index}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={collapsed ? item.text : ""} placement="right">
                <ListItemButton
                  onClick={() => handleMenuClick(item)}
                  sx={{
                    borderRadius: 2,
                    backgroundColor:
                      isActive(item.path) ||
                      (item.hasSubmenu && isInBimbinganSubmenu)
                        ? "#F0F4FF"
                        : "transparent",
                    "&:hover": {
                      backgroundColor:
                        isActive(item.path) ||
                        (item.hasSubmenu && isInBimbinganSubmenu)
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
                        isActive(item.path) ||
                        (item.hasSubmenu && isInBimbinganSubmenu)
                          ? "#0D59F2"
                          : "#666",
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
                              ? "#0D59F2"
                              : "#333",
                        }}
                      />
                      {item.hasSubmenu && (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
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
                          borderRadius: 2,
                          backgroundColor: isActive(subItem.path)
                            ? "#E8F0FE"
                            : "transparent",
                          "&:hover": {
                            backgroundColor: isActive(subItem.path)
                              ? "#E8F0FE"
                              : "#f5f5f5",
                          },
                          minHeight: 40,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 36,
                            color: isActive(subItem.path) ? "#0D59F2" : "#666",
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
                            color: isActive(subItem.path) ? "#0D59F2" : "#333",
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