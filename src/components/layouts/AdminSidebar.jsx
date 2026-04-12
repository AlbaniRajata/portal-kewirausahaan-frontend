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
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import PersonIcon from "@mui/icons-material/Person";

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
      location.pathname.startsWith("/admin/proposal/") ||
      location.pathname === "/admin/tim" ||
      location.pathname === "/admin/distribusi-penilai" ||
      location.pathname === "/admin/distribusi-pembimbing" ||
      location.pathname.startsWith("/admin/program/") ||
      location.pathname === "/admin/rekap-penilaian" ||
      location.pathname === "/admin/bimbingan" ||
      location.pathname === "/admin/monev" ||
      location.pathname.startsWith("/admin/monev/")
    );
  }, [location.pathname]);

  const [openMasterData, setOpenMasterData] = useState(isInMasterData);
  const [openPesertaPengguna, setOpenPesertaPengguna] = useState(isInPesertaPengguna);
  const [openOperasional, setOpenOperasional] = useState(isInOperasional);

  const isActive = (path) => {
    if (location.pathname === path) return true;
    if (path === "/admin/proposal" && location.pathname.startsWith("/admin/proposal/")) return true;
    if (path === "/admin/distribusi-penilai" && location.pathname.startsWith("/admin/program/") && location.pathname.includes("/distribusi/reviewer/tahap/")) return true;
    if (path === "/admin/monev" && location.pathname.startsWith("/admin/monev/")) return true;
    return false;
  };

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/admin/dashboard",
    },
    {
      text: "Biodata",
      icon: <PersonIcon />,
      path: "/admin/biodata",
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
          text: "Distribusi Pembimbing",
          icon: <PersonSearchIcon sx={{ fontSize: 20 }} />,
          path: "/admin/distribusi-pembimbing",
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
        {
        text: "Monev",
        icon: <AssignmentTurnedInIcon sx={{ fontSize: 20 }} />,
        path: "/admin/monev",
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
                          ? "rgba(255,255,255,0.18)"
                          : "transparent",
                      "&:hover": {
                        backgroundColor:
                          isActive(item.path) || (item.hasSubmenu && item.isInSubmenu)
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
                          isActive(item.path) || (item.hasSubmenu && item.isInSubmenu)
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
                              isActive(item.path) || (item.hasSubmenu && item.isInSubmenu)
                                ? 600
                                : 500,
                            color:
                              isActive(item.path) || (item.hasSubmenu && item.isInSubmenu)
                                ? "#ffffff"
                                : "rgba(255,255,255,0.92)",
                          }}
                        />
                        {item.hasSubmenu && (
                          <Box sx={{ display: "flex", alignItems: "center", color: "rgba(255,255,255,0.92)" }}>
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
                            backgroundColor: isActive(subItem.path) ? "rgba(255,255,255,0.18)" : "transparent",
                            "&:hover": {
                              backgroundColor: isActive(subItem.path) ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)",
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
    </Box>
  );
}