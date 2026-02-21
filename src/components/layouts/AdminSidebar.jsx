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
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PeopleIcon from "@mui/icons-material/People";
import DescriptionIcon from "@mui/icons-material/Description";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BarChartIcon from "@mui/icons-material/BarChart";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import InfoIcon from "@mui/icons-material/Info";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SchoolIcon from "@mui/icons-material/School";
import ApartmentIcon from "@mui/icons-material/Apartment";
import BusinessIcon from "@mui/icons-material/Business";
import GroupsIcon from "@mui/icons-material/Groups";

export default function AdminSidebar({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isInMasterData = useMemo(() => {
    return (
      location.pathname === "/admin/kampus" ||
      location.pathname === "/admin/jurusan" ||
      location.pathname === "/admin/prodi"
    );
  }, [location.pathname]);

  const isInPesertaPengguna = useMemo(() => {
    return (
      location.pathname === "/admin/verifikasi" ||
      location.pathname === "/admin/pengguna" ||
      location.pathname === "/admin/tim-peserta"
    );
  }, [location.pathname]);

  const isInOperasional = useMemo(() => {
    return (
      location.pathname === "/admin/proposal" ||
      location.pathname === "/admin/tim" ||
      location.pathname === "/admin/distribusi-penilai" ||
      location.pathname === "/admin/rekap-penilaian" ||
      location.pathname === "/admin/bimbingan"
    );
  }, [location.pathname]);

  const [openMasterData, setOpenMasterData] = useState(isInMasterData);
  const [openPesertaPengguna, setOpenPesertaPengguna] = useState(isInPesertaPengguna);
  const [openOperasional, setOpenOperasional] = useState(isInOperasional);

  const isActive = (path) => {
    if (location.pathname === path) return true;
    if (path === "/admin/proposal" && location.pathname.startsWith("/admin/proposal/")) return true;
    return false;
  };

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/admin/dashboard",
    },
    {
      text: "Master Data",
      icon: <ApartmentIcon />,
      hasSubmenu: true,
      open: openMasterData,
      setOpen: setOpenMasterData,
      isInSubmenu: isInMasterData,
      submenu: [
        {
          text: "Kampus",
          icon: <BusinessIcon sx={{ fontSize: 20 }} />,
          path: "/admin/kampus",
        },
        {
          text: "Jurusan",
          icon: <SchoolIcon sx={{ fontSize: 20 }} />,
          path: "/admin/jurusan",
        },
        {
          text: "Program Studi",
          icon: <AccountBalanceIcon sx={{ fontSize: 20 }} />,
          path: "/admin/prodi",
        },
      ],
    },
    {
      text: "Kelola Program",
      icon: <CalendarMonthIcon />,
      path: "/admin/program",
    },
    {
      text: "Peserta dan Pengguna",
      icon: <PeopleIcon />,
      hasSubmenu: true,
      open: openPesertaPengguna,
      setOpen: setOpenPesertaPengguna,
      isInSubmenu: isInPesertaPengguna,
      submenu: [
        {
          text: "Verifikasi Pengguna",
          icon: <VerifiedUserIcon sx={{ fontSize: 20 }} />,
          path: "/admin/verifikasi",
        },
        {
          text: "Kelola Pengguna",
          icon: <ManageAccountsIcon sx={{ fontSize: 20 }} />,
          path: "/admin/pengguna",
        },
        {
          text: "Tim dan Peserta",
          icon: <GroupsIcon sx={{ fontSize: 20 }} />,
          path: "/admin/tim-peserta",
        },
      ],
    },
    {
      text: "Operasional",
      icon: <DescriptionIcon />,
      hasSubmenu: true,
      open: openOperasional,
      setOpen: setOpenOperasional,
      isInSubmenu: isInOperasional,
      submenu: [
        {
          text: "Daftar Proposal",
          icon: <DescriptionIcon sx={{ fontSize: 20 }} />,
          path: "/admin/proposal",
        },
        {
          text: "Distribusi Penilai",
          icon: <AssignmentIcon sx={{ fontSize: 20 }} />,
          path: "/admin/distribusi-penilai",
        },
        {
          text: "Rekap Penilaian",
          icon: <BarChartIcon sx={{ fontSize: 20 }} />,
          path: "/admin/rekap-penilaian",
        },
        {
          text: "Bimbingan",
          icon: <MenuBookIcon sx={{ fontSize: 20 }} />,
          path: "/admin/bimbingan",
        },
      ],
    },
    {
      text: "Berita dan Informasi",
      icon: <InfoIcon />,
      path: "/admin/berita",
    },
  ];

  const handleMenuClick = (item) => {
    if (item.hasSubmenu) {
      item.setOpen(!item.open);
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

      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <List sx={{ px: collapsed ? 1 : 2, py: 2 }}>
          {menuItems.map((item, index) => (
            <Box key={index}>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <Tooltip title={collapsed ? item.text : ""} placement="right">
                  <ListItemButton
                    onClick={() => handleMenuClick(item)}
                    sx={{
                      borderRadius: 50,
                      backgroundColor:
                        isActive(item.path) || (item.hasSubmenu && item.isInSubmenu)
                          ? "#F0F4FF"
                          : "transparent",
                      "&:hover": {
                        backgroundColor:
                          isActive(item.path) || (item.hasSubmenu && item.isInSubmenu)
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
                          isActive(item.path) || (item.hasSubmenu && item.isInSubmenu)
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
                              isActive(item.path) || (item.hasSubmenu && item.isInSubmenu)
                                ? 600
                                : 500,
                            color:
                              isActive(item.path) || (item.hasSubmenu && item.isInSubmenu)
                                ? "#0D59F2"
                                : "#333",
                          }}
                        />
                        {item.hasSubmenu && (
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            {item.open ? <ExpandLess /> : <ExpandMore />}
                          </Box>
                        )}
                      </>
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>

              {item.hasSubmenu && !collapsed && (
                <Collapse in={item.open} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.submenu.map((subItem, subIndex) => (
                      <ListItem key={subIndex} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                          onClick={() => navigate(subItem.path)}
                          sx={{
                            pl: 4,
                            pr: 2,
                            borderRadius: 50,
                            backgroundColor: isActive(subItem.path) ? "#E8F0FE" : "transparent",
                            "&:hover": {
                              backgroundColor: isActive(subItem.path) ? "#E8F0FE" : "#f5f5f5",
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
    </Box>
  );
}