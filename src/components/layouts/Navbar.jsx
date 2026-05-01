import { Box, Avatar, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";
import { useAuthStore } from "../../store/authStore";
import { useNavigate, useLocation } from "react-router-dom";
import { getProfile } from "../../api/public";
import { logoutUser } from "../../api/auth";
import { setAccessToken } from "../../api/axios";

export default function Navbar({ onToggleSidebar, sidebarCollapsed, hasSidebar = true, isMobile = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, refreshToken } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getProfile();
        if (active && res.success) setProfile(res.data);
      } catch {
        // profil gagal dimuat, tampilkan data dari store saja
      }
    })();
    return () => {
      active = false;
    };
  }, [location.key, user]);

  const displayName = user?.nama_lengkap || profile?.nama_lengkap || "User";
  const photoUrl = user?.foto ? `/uploads/profil/${user.foto}` : (profile?.foto ? `/uploads/profil/${profile.foto}` : null);
  const currentProgram = profile?.current_program?.trim() || "";
  const roleName = profile?.nama_role?.trim() || "";
  const navbarTitle = currentProgram || "Program Kewirausahaan";
  const displaySubtitle = profile?.keterangan?.trim() || roleName || "";

  const handleLogout = async () => {
    try {
      await logoutUser(refreshToken);
    } catch {
      // tetap logout meski API gagal
    } finally {
      logout();
      setAccessToken(null);
      navigate("/login");
    }
  };

  return (
    <Box
      sx={{
        height: { xs: 56, sm: 64 },
        position: "fixed",
        top: { xs: 8, sm: 12 },
        left: isMobile ? 8 : (hasSidebar ? (sidebarCollapsed ? 82 : 262) : 12),
        right: { xs: 8, sm: 12 },
        zIndex: 100,
        px: { xs: 1.5, sm: 2 },
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#ffffff",
        boxShadow: "0px 4px 20px rgba(0,0,0,0.08)",
        borderRadius: "50px",
        transition: "left 0.3s ease",
        width: isMobile ? "auto" : undefined,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 }, minWidth: 0, flex: 1, pr: 1.5, overflow: "hidden" }}>
        {hasSidebar && (
          <Box
            onClick={onToggleSidebar}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              borderRadius: "50%",
              cursor: "pointer",
              transition: "all 0.2s ease",
              flexShrink: 0,
              "&:hover": {
                backgroundColor: "#e8e8e8",
              },
            }}
          >
            <MenuIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: "#555" }} />
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            minHeight: { xs: 36, sm: 40 },
            px: { xs: 1, sm: 2 },
            minWidth: 0,
            maxWidth: { xs: 140, sm: 300, md: 460 },
            overflow: "hidden",
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: 13, sm: 15 },
              fontWeight: 700,
              color: "#1a1a2e",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              letterSpacing: "-0.01em",
            }}
          >
            {navbarTitle}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ position: "relative", flexShrink: 0 }}>
        <Box
          onClick={() => setAnchorEl(!anchorEl)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.5, sm: 1.5 },
            minWidth: 0,
            maxWidth: { xs: 80, sm: 280, md: 360 },
            cursor: "pointer",
            px: { xs: 0.5, sm: 1.5 },
            py: 0.5,
            borderRadius: "50px",
            transition: "all 0.2s ease",
            "&:hover": { backgroundColor: "#e8e8e8" },
          }}
        >
          <Avatar
            src={photoUrl || undefined}
            imgProps={{ crossOrigin: "anonymous" }}
            sx={{ width: { xs: 32, sm: 36 }, height: { xs: 32, sm: 36 }, bgcolor: "#0D59F2", fontSize: { xs: 11, sm: 13 }, fontWeight: 700 }}
          >
            {!photoUrl &&
              (displayName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
                || <AccountCircleIcon sx={{ fontSize: { xs: 32, sm: 36 } }} />)}
          </Avatar>

          <Box sx={{ minWidth: 0, maxWidth: { xs: 40, sm: 150, md: 220 }, display: { xs: "none", sm: "block" } }}>
            <Typography
              sx={{
                fontSize: { sm: 13, md: 14 },
                fontWeight: 700,
                color: "#1a1a2e",
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {displayName}
            </Typography>
            {displaySubtitle && (
              <Typography
                sx={{
                  fontSize: 11,
                  color: "#888",
                  lineHeight: 1.2,
                  display: { sm: "block" },
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {displaySubtitle}
              </Typography>
            )}
          </Box>

          <KeyboardArrowDownIcon
            sx={{
              color: "#999",
              fontSize: { xs: 14, sm: 18 },
              transform: anchorEl ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.25s ease",
              ml: { xs: 0.5, sm: 0 },
            }}
          />
        </Box>

        <Box
          sx={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: 160,
            borderRadius: "12px",
            backgroundColor: "#ffffff",
            boxShadow: "0px 4px 20px rgba(0,0,0,0.12)",
            overflow: "hidden",
            opacity: anchorEl ? 1 : 0,
            transform: anchorEl ? "translateY(0)" : "translateY(-8px)",
            pointerEvents: anchorEl ? "auto" : "none",
            transition: "opacity 0.2s ease, transform 0.2s ease",
          }}
        >
          <Box
            onClick={handleLogout}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              py: 1.5,
              cursor: "pointer",
              "&:hover": { backgroundColor: "rgba(229,57,53,0.08)" },
            }}
          >
            <LogoutIcon sx={{ fontSize: 18, color: "#e53935" }} />
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#e53935" }}>
              Logout
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
