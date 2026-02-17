import { Box, Avatar, Typography } from "@mui/material";
import { useState, useEffect } from "react";
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
  const [anchorEl, setAnchorEl] = useState(false);
  const [profile, setProfile] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getProfile();
        if (active && res.success) setProfile(res.data);
      } catch (error) {
        console.error("Gagal mengambil profil:", error);
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
  const displayRole = profile?.keterangan || "User";
  const photoUrl = profile?.foto ? `${baseUrl}/uploads/profil/${profile.foto}` : null;

  return (
    <Box
      sx={{
        height: 73,
        position: "fixed",
        top: 0,
        left: sidebarCollapsed ? 70 : 250,
        right: 0,
        zIndex: 100,
        px: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: scrolled ? "#ffffff" : "transparent",
        boxShadow: scrolled ? "0px 2px 8px -2px rgba(0,0,0,0.10)" : "none",
        borderBottom: scrolled ? "1px solid #e0e0e0" : "none",
        transition: "left 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          onClick={onToggleSidebar}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: scrolled ? "auto" : 46,
            px: scrolled ? 0 : 1.5,
            borderRadius: "50px",
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
            height: scrolled ? "auto" : 46,
            px: scrolled ? 0 : 2,
            borderRadius: "50px",
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
              letterSpacing: "-0.01em",
            }}
          >
            Program Mahasiswa Wirausaha
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
            cursor: "pointer",
            px: scrolled ? 0 : 1.5,
            py: scrolled ? 0 : 0.6,
            borderRadius: "50px",
            border: scrolled ? "1.5px solid transparent" : "1.5px solid rgba(0,0,0,0.12)",
            backgroundColor: scrolled ? "transparent" : "#ffffff",
            boxShadow: scrolled ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
            transition: "all 0.3s ease",
            "&:hover": { backgroundColor: scrolled ? "transparent" : "rgba(0,0,0,0.015)" },
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

          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", lineHeight: 1.3 }}>
              {displayName}
            </Typography>
            <Typography sx={{ fontSize: 11, color: "#888", lineHeight: 1.2 }}>
              {displayRole}
            </Typography>
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
            onClick={() => { logout(); navigate("/login"); }}
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