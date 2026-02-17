import { Box, IconButton, Avatar, Typography, Menu, MenuItem } from "@mui/material";
import { useState, useEffect } from "react";
import NotificationsIcon from "@mui/icons-material/Notifications";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../../api/public";

export default function Navbar({ onToggleSidebar, sidebarCollapsed }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getProfile();
        if (active && res.success) {
          setProfile(res.data);
        }
      } catch (error) {
        console.error("Gagal mengambil profil:", error);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const baseUrl = import.meta.env.VITE_API_URL.replace("/api", "");

  const displayName = profile?.nama_lengkap || user?.nama_lengkap || "User";
  const displayRole = profile?.keterangan || "User";
  const photoUrl = profile?.foto ? `${baseUrl}/uploads/profil/${profile.foto}` : null;

  return (
    <Box
      sx={{
        height: 73,
        position: "fixed",
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
        top: 0,
        left: sidebarCollapsed ? 70 : 250,
        right: 0,
        zIndex: 100,
        px: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        borderBottom: "1px solid #e0e0e0",
        transition: "left 0.3s ease",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <IconButton onClick={onToggleSidebar}>
          <MenuIcon />
        </IconButton>
        <Typography sx={{ fontSize: 18, fontWeight: 600 }}>
          Program Mahasiswa Wirausaha
        </Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }}
        >
          <Avatar
            src={photoUrl || undefined}
            imgProps={{ crossOrigin: "anonymous" }}
            sx={{ width: 40, height: 40, bgcolor: "#0D59F2" }}
          >
            {!photoUrl && <AccountCircleIcon sx={{ fontSize: 40 }} />}
          </Avatar>

          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
              {displayName}
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#666" }}>
              {displayRole}
            </Typography>
          </Box>

          <KeyboardArrowDownIcon sx={{ color: "#666" }} />
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem
            onClick={() => {
              logout();
              navigate("/login");
            }}
            sx={{ gap: 1.5, py: 1.5 }}
          >
            <LogoutIcon sx={{ fontSize: 20 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
              Logout
            </Typography>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}