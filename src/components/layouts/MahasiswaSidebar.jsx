import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import DescriptionIcon from "@mui/icons-material/Description";
import SchoolIcon from "@mui/icons-material/School";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

export default function SidebarMahasiswa() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openBimbingan, setOpenBimbingan] = useState(false);

  const isActive = (path) => location.pathname === path;

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
          path: "/mahasiswa/bimbingan/pengajuan",
        },
        {
          text: "Jadwal Bimbingan",
          path: "/mahasiswa/bimbingan/jadwal",
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
                  openBimbingan ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>
            </ListItem>

            {item.hasSubmenu && (
              <Collapse in={openBimbingan} timeout="auto" unmountOnExit>
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