import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PeopleIcon from "@mui/icons-material/People";
import DescriptionIcon from "@mui/icons-material/Description";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BarChartIcon from "@mui/icons-material/BarChart";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import InfoIcon from "@mui/icons-material/Info";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openPengguna, setOpenPengguna] = useState(false);

  const isActive = (path) => {
    if (location.pathname === path) return true;
    
    if (path === "/admin/proposal" && location.pathname.startsWith("/admin/proposal/")) return true;
    if (path === "/admin/distribusi-penilai" && location.pathname.includes("/distribusi/reviewer/")) return true;
    
    return false;
  };

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/admin/dashboard",
    },
    {
      text: "Kelola Program",
      icon: <CalendarMonthIcon />,
      path: "/admin/program",
    },
    {
      text: "Verifikasi Pengguna",
      icon: <VerifiedUserIcon />,
      path: "/admin/verifikasi",
    },
    {
      text: "Pengguna",
      icon: <PeopleIcon />,
      hasSubmenu: true,
      submenu: [
        {
          text: "Data Peserta",
          path: "/admin/pengguna/peserta",
        },
        {
          text: "Kelola Pengguna",
          path: "/admin/pengguna/kelola",
        },
      ],
    },
    {
      text: "Daftar Proposal",
      icon: <DescriptionIcon />,
      path: "/admin/proposal",
    },
    {
      text: "Distribusi Penilai",
      icon: <AssignmentIcon />,
      path: "/admin/distribusi-penilai",
    },
    {
      text: "Rekap Penilaian",
      icon: <BarChartIcon />,
      path: "/admin/rekap-penilaian",
    },
    {
      text: "Bimbingan",
      icon: <MenuBookIcon />,
      path: "/admin/bimbingan",
    },
    {
      text: "Monitoring dan Evaluasi",
      icon: <TrendingUpIcon />,
      path: "/admin/monitoring-evaluasi",
    },
    {
      text: "Berita dan Informasi",
      icon: <InfoIcon />,
      path: "/admin/berita",
    },
  ];

  const handleMenuClick = (item) => {
    if (item.hasSubmenu) {
      setOpenPengguna(!openPengguna);
    } else {
      navigate(item.path);
    }
  };

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
        <AccountBalanceIcon
          sx={{
            fontSize: 30,
            color: "#0D59F2",
          }}
        />
        <Box sx={{ textAlign: "center" }}>
          <Box sx={{ fontWeight: 700, fontSize: 12, color: "#000" }}>
            UPA PKK POLINEMA
          </Box>
        </Box>
      </Box>

      <List sx={{ px: 2, py: 2, flex: 1 }}>
        {menuItems.map((item, index) => (
          <Box key={index}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleMenuClick(item)}
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
                {item.hasSubmenu && (
                  openPengguna ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>
            </ListItem>

            {item.hasSubmenu && (
              <Collapse in={openPengguna} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.submenu.map((subItem, subIndex) => (
                    <ListItem key={subIndex} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        onClick={() => navigate(subItem.path)}
                        sx={{
                          pl: 7,
                          borderRadius: 2,
                          backgroundColor: isActive(subItem.path) ? "#F0F4FF" : "transparent",
                          "&:hover": {
                            backgroundColor: isActive(subItem.path) ? "#F0F4FF" : "#f5f5f5",
                          },
                        }}
                      >
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