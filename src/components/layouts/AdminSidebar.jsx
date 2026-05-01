import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Tooltip,
  Drawer,
  useMediaQuery,
  useTheme,
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

const SIDEBAR_WIDTH = 250;
const SIDEBAR_COLLAPSED_WIDTH = 70;

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard" },
  { text: "Biodata", icon: <PersonIcon />, path: "/admin/biodata" },
  {
    text: "Master Data",
    icon: <ApartmentIcon />,
    hasSubmenu: true,
    submenu: [
      { text: "Kampus", icon: <BusinessIcon sx={{ fontSize: 20 }} />, path: "/admin/kampus" },
      { text: "Jurusan", icon: <SchoolIcon sx={{ fontSize: 20 }} />, path: "/admin/jurusan" },
      { text: "Program Studi", icon: <AccountBalanceIcon sx={{ fontSize: 20 }} />, path: "/admin/prodi" },
    ],
  },
  { text: "Kelola Program", icon: <CalendarMonthIcon />, path: "/admin/program" },
  {
    text: "Peserta dan Pengguna",
    icon: <PeopleIcon />,
    hasSubmenu: true,
    submenu: [
      { text: "Verifikasi Pengguna", icon: <VerifiedUserIcon sx={{ fontSize: 20 }} />, path: "/admin/verifikasi" },
      { text: "Kelola Pengguna", icon: <ManageAccountsIcon sx={{ fontSize: 20 }} />, path: "/admin/pengguna" },
      { text: "Tim dan Peserta", icon: <GroupsIcon sx={{ fontSize: 20 }} />, path: "/admin/tim-peserta" },
    ],
  },
  {
    text: "Operasional",
    icon: <DescriptionIcon />,
    hasSubmenu: true,
    submenu: [
      { text: "Daftar Proposal", icon: <DescriptionIcon sx={{ fontSize: 20 }} />, path: "/admin/proposal" },
      { text: "Distribusi Penilai", icon: <AssignmentIcon sx={{ fontSize: 20 }} />, path: "/admin/distribusi-penilai" },
      { text: "Distribusi Pembimbing", icon: <PersonSearchIcon sx={{ fontSize: 20 }} />, path: "/admin/distribusi-pembimbing" },
      { text: "Rekap Penilaian", icon: <BarChartIcon sx={{ fontSize: 20 }} />, path: "/admin/rekap-penilaian" },
      { text: "Bimbingan", icon: <MenuBookIcon sx={{ fontSize: 20 }} />, path: "/admin/bimbingan" },
      { text: "Monev", icon: <AssignmentTurnedInIcon sx={{ fontSize: 20 }} />, path: "/admin/monev" },
    ],
  },
  { text: "Berita dan Informasi", icon: <InfoIcon />, path: "/admin/berita" },
];

function SidebarContent({ collapsed, onMenuClick, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMasterData, setOpenMasterData] = useState(
    ["/admin/kampus", "/admin/jurusan", "/admin/prodi"].includes(location.pathname)
  );
  const [openPesertaPengguna, setOpenPesertaPengguna] = useState(
    ["/admin/verifikasi", "/admin/pengguna", "/admin/tim-peserta"].includes(location.pathname)
  );
  const [openOperasional, setOpenOperasional] = useState(
    ["/admin/proposal", "/admin/distribusi-penilai", "/admin/distribusi-pembimbing",
     "/admin/rekap-penilaian", "/admin/bimbingan", "/admin/monev"].some(p => location.pathname.startsWith(p))
  );

  const isActive = (path) => {
    if (location.pathname === path) return true;
    if (path === "/admin/proposal" && location.pathname.startsWith("/admin/proposal/")) return true;
    if (path === "/admin/monev" && location.pathname.startsWith("/admin/monev/")) return true;
    return false;
  };

  const handleMenuClick = (item) => {
    if (item.hasSubmenu) {
      if (item.text === "Master Data") setOpenMasterData(!openMasterData);
      if (item.text === "Peserta dan Pengguna") setOpenPesertaPengguna(!openPesertaPengguna);
      if (item.text === "Operasional") setOpenOperasional(!openOperasional);
    } else {
      navigate(item.path);
      if (onClose) onClose();
    }
  };

  const isSubmenuOpen = (item) => {
    if (item.text === "Master Data") return openMasterData;
    if (item.text === "Peserta dan Pengguna") return openPesertaPengguna;
    if (item.text === "Operasional") return openOperasional;
    return false;
  };

  const isInSubmenu = (item) => {
    if (!item.submenu) return false;
    return item.submenu.some(sub => isActive(sub.path));
  };

  return (
    <Box
      sx={{
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        height: "100%",
        background: "linear-gradient(180deg, #0D59F2 0%, #1e40af 100%)",
        borderRight: "1px solid rgba(255,255,255,0.12)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
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
          p: { xs: 1.5, sm: 2 },
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          minHeight: { xs: 64, sm: 73 },
          justifyContent: collapsed ? "center" : "flex-start",
          px: collapsed ? 0 : 2,
        }}
      >
        <AccountBalanceIcon sx={{ fontSize: { xs: 28, sm: 32 }, color: "#ffffff", flexShrink: 0 }} />
        {!collapsed && (
          <Box sx={{ fontWeight: 700, fontSize: { xs: 12, sm: 13 }, color: "#ffffff", lineHeight: 1.2, whiteSpace: "nowrap" }}>
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
          "&::-webkit-scrollbar": { width: 0 },
        }}
      >
        <List sx={{ px: collapsed ? 0.5 : 1.5, py: 1 }}>
          {menuItems.map((item, index) => (
            <Box key={index}>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <Tooltip title={collapsed ? item.text : ""} placement="right" arrow>
                  <ListItemButton
                    onClick={() => handleMenuClick(item)}
                    selected={isActive(item.path) || isInSubmenu(item)}
                    sx={{
                      borderRadius: 50,
                      mx: 0.5,
                      minHeight: { xs: 40, sm: 44 },
                      justifyContent: collapsed ? "center" : "flex-start",
                      px: collapsed ? 1 : 2,
                      backgroundColor: (isActive(item.path) || isInSubmenu(item)) ? "rgba(255,255,255,0.18)" : "transparent",
                      "&:hover": { backgroundColor: (isActive(item.path) || isInSubmenu(item)) ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)" },
                      "&.Mui-selected": { backgroundColor: "rgba(255,255,255,0.18)" },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: collapsed ? "auto" : 40,
                        color: (isActive(item.path) || isInSubmenu(item)) ? "#ffffff" : "rgba(255,255,255,0.88)",
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
                            fontSize: { xs: 13, sm: 14 },
                            fontWeight: (isActive(item.path) || isInSubmenu(item)) ? 600 : 500,
                            color: (isActive(item.path) || isInSubmenu(item)) ? "#ffffff" : "rgba(255,255,255,0.92)",
                          }}
                        />
                        {item.hasSubmenu && (isSubmenuOpen(item) ? <ExpandLess sx={{ color: "rgba(255,255,255,0.92)" }} /> : <ExpandMore sx={{ color: "rgba(255,255,255,0.92)" }} />)}
                      </>
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>

              {item.hasSubmenu && !collapsed && (
                <Collapse in={isSubmenuOpen(item)} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.submenu.map((subItem, subIndex) => (
                      <ListItem key={subIndex} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                          onClick={() => { navigate(subItem.path); if (onClose) onClose(); }}
                          selected={isActive(subItem.path)}
                          sx={{
                            pl: 4,
                            pr: 2,
                            borderRadius: 50,
                            mx: 0.5,
                            minHeight: { xs: 36, sm: 40 },
                            backgroundColor: isActive(subItem.path) ? "rgba(255,255,255,0.18)" : "transparent",
                            "&:hover": { backgroundColor: isActive(subItem.path) ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)" },
                            "&.Mui-selected": { backgroundColor: "rgba(255,255,255,0.18)" },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36, color: isActive(subItem.path) ? "#ffffff" : "rgba(255,255,255,0.88)" }}>
                            {subItem.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={subItem.text}
                            primaryTypographyProps={{
                              fontSize: { xs: 13, sm: 14 },
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

export default function AdminSidebar({ collapsed, mobileOpen, onMobileClose, isMobile }) {
  const theme = useTheme();
  const isMobileView = isMobile !== undefined ? isMobile : useMediaQuery(theme.breakpoints.down("md"));

  if (isMobileView) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen || false}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            boxSizing: "border-box",
            border: "none",
            boxShadow: "0 10px 30px rgba(13,89,242,0.22)",
            borderTopRightRadius: 24,
            borderBottomRightRadius: 24,
            overflow: "hidden",
          },
        }}
      >
        <SidebarContent collapsed={false} onClose={onMobileClose} />
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: "none", md: "block" },
        "& .MuiDrawer-paper": {
          width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
          boxSizing: "border-box",
          border: "none",
          background: "linear-gradient(180deg, #0D59F2 0%, #1e40af 100%)",
          borderRight: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 10px 30px rgba(13,89,242,0.22)",
          borderTopRightRadius: 24,
          borderBottomRightRadius: 24,
          overflow: "hidden",
          position: "fixed",
          top: 12,
          left: 0,
          height: "calc(100vh - 24px)",
          transition: "width 0.3s ease",
        },
      }}
      open
    >
      <SidebarContent collapsed={collapsed} />
    </Drawer>
  );
}