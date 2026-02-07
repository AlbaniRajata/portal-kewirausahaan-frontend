import { Box, IconButton, Avatar, Typography, Menu, MenuItem } from "@mui/material";
import { useState } from "react";
import NotificationsIcon from "@mui/icons-material/Notifications";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getRoleLabel = (roleId) => {
    const roles = {
      1: "Mahasiswa",
      2: "Administrator",
      3: "Dosen Pembimbing",
      4: "Reviewer Internal",
      5: "Juri Eksternal",
    };
    return roles[roleId] || "User";
  };

  const displayName = user?.nama_lengkap || user?.username || "User";
  const displayProgram = "Program Mahasiswa Wirausaha";
  const displayRole = getRoleLabel(user?.id_role);
  const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
  const photoUrl = user?.foto ? `${baseUrl}/uploads/profil/${user.foto}` : null;
  
  return (
    <Box
      sx={{
        height: 73,
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
        backgroundColor: "#fff",
        borderBottom: "1px solid #e0e0e0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 4,
        position: "fixed",
        top: 0,
        left: 250,
        right: 0,
        zIndex: 100,
      }}
    >
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#000" }}>
        {displayProgram}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <IconButton>
          <NotificationsIcon />
        </IconButton>

        <Box
          onClick={handleOpenMenu}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            cursor: "pointer",
            "&:hover": {
              opacity: 0.8,
            },
          }}
        >
          {photoUrl ? (
            <Avatar
              src={photoUrl}
              imgProps={{ crossOrigin: "anonymous" }}
              sx={{
                width: 40,
                height: 40,
                backgroundColor: "#0D59F2",
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: 40,
                height: 40,
                backgroundColor: "#0D59F2",
              }}
            >
              <AccountCircleIcon sx={{ fontSize: 40 }} />
            </Avatar>
          )}

          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#000", lineHeight: 1.2 }}>
              {displayName}
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#666", lineHeight: 1.2 }}>
              {displayRole}
            </Typography>
          </Box>

          <KeyboardArrowDownIcon sx={{ color: "#666" }} />
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 180,
              borderRadius: 2,
            },
          }}
        >
          <MenuItem
            onClick={handleLogout}
            sx={{
              gap: 1.5,
              py: 1.5,
              "&:hover": {
                backgroundColor: "#f5f5f5",
              },
            }}
          >
            <LogoutIcon sx={{ fontSize: 20, color: "#666" }} />
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
              Logout
            </Typography>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}