import { Box, Avatar, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../../api/public";
import { logoutUser } from "../../api/auth";
import { setAccessToken } from "../../api/axios";

export default function Navbar({ onToggleSidebar, sidebarCollapsed }) {
  const navigate = useNavigate();
  const { user, logout, refreshToken } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState(false);
  const [profile, setProfile] = useState(null);
  const [scrolled, setScrolled] = useState(false);

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
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const baseUrl = import.meta.env.VITE_API_URL.replace("/api", "");
  const displayName = profile?.nama_lengkap || user?.nama_lengkap || "User";
  const photoUrl = profile?.foto ? `/uploads/profil/${profile.foto}` : null;
  const currentProgram = profile?.current_program?.trim() || "";
  const roleName = profile?.nama_role?.trim() || "";
  const navbarTitle = currentProgram;
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
        height: 73,
        position: "fixed",
        top: scrolled ? 12 : 0,
        left: scrolled ? (sidebarCollapsed ? 94 : 274) : (sidebarCollapsed ? 70 : 250),
        right: scrolled ? 24 : 0,
        zIndex: 100,
        px: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: scrolled ? "#ffffff" : "transparent",
        boxShadow: scrolled ? "0px 4px 16px -4px rgba(0,0,0,0.12)" : "none",
        border: scrolled ? "1.5px solid rgba(0,0,0,0.10)" : "1.5px solid transparent",
        borderRadius: scrolled ? "24px" : 0,
        paddingLeft: scrolled ? 3 : 3,
        paddingRight: scrolled ? 3 : 3,
        transition: "left 0.3s ease, right 0.3s ease, top 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease, border-radius 0.3s ease, border-color 0.3s ease",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: 1, pr: 1.5 }}>
        <Box
          onClick={onToggleSidebar}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: scrolled ? 46 : 46,
            px: scrolled ? 0 : 1.5,
            borderRadius: scrolled ? "50px" : "18px",
            border: scrolled ? "1.5px solid transparent" : "1.5px solid rgba(0,0,0,0.12)",
            backgroundColor: scrolled ? "transparent" : "#ffffff",
            boxShadow: scrolled ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
            cursor: "pointer",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: scrolled ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.02)",
            },
          }}
        >
          <MenuIcon sx={{ fontSize: 20, color: "#555" }} />
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            minHeight: 46,
            px: scrolled ? 0 : 2,
            minWidth: 0,
            maxWidth: { xs: 190, sm: 300, md: 460 },
            borderRadius: scrolled ? "50px" : "18px",
            border: scrolled ? "1.5px solid transparent" : "1.5px solid rgba(0,0,0,0.12)",
            backgroundColor: scrolled ? "transparent" : "#ffffff",
            boxShadow: scrolled ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
            transition: "all 0.3s ease",
          }}
        >
          <Typography
            sx={{
              fontSize: 15,
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

      <Box sx={{ position: "relative" }}>
        <Box
          onClick={() => setAnchorEl(!anchorEl)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            minWidth: 0,
            maxWidth: { xs: 190, sm: 280, md: 360 },
            cursor: "pointer",
            px: scrolled ? 0 : 1.5,
            py: scrolled ? 0 : 0.6,
            borderRadius: scrolled ? "50px" : "18px",
            border: scrolled ? "1.5px solid transparent" : "1.5px solid rgba(0,0,0,0.12)",
            backgroundColor: scrolled ? "transparent" : "#ffffff",
            boxShadow: scrolled ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
            transition: "all 0.3s ease",
            "&:hover": { backgroundColor: scrolled ? "rgba(0,0,0,0.015)" : "rgba(0,0,0,0.015)" },
          }}
        >
          <Avatar
            src={photoUrl || undefined}
            imgProps={{ crossOrigin: "anonymous" }}
            sx={{ width: 36, height: 36, bgcolor: "#0D59F2", fontSize: 13, fontWeight: 700 }}
          >
            {!photoUrl &&
              (displayName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
                || <AccountCircleIcon sx={{ fontSize: 36 }} />)}
          </Avatar>

          <Box sx={{ minWidth: 0, maxWidth: { xs: 96, sm: 150, md: 220 } }}>
            <Typography
              sx={{
                fontSize: 13,
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
                  display: { xs: "none", sm: "block" },
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
              fontSize: 18,
              transform: anchorEl ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.25s ease",
            }}
          />
        </Box>

        <Box
          sx={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: "100%",
            borderRadius: "16px",
            border: "1.5px solid rgba(0,0,0,0.10)",
            backgroundColor: "#ffffff",
            boxShadow: "0px 4px 16px -4px rgba(0,0,0,0.12)",
            overflow: "hidden",
            maxHeight: anchorEl ? "60px" : "0px",
            opacity: anchorEl ? 1 : 0,
            pointerEvents: anchorEl ? "auto" : "none",
            transition: "max-height 0.25s ease, opacity 0.2s ease",
          }}
        >
          <Box
            onClick={handleLogout}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 1.5,
              py: 1.2,
              cursor: "pointer",
              "&:hover": { backgroundColor: "rgba(229,57,53,0.05)" },
            }}
          >
            <LogoutIcon sx={{ fontSize: 17, color: "#e53935" }} />
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#e53935" }}>
              Logout
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}