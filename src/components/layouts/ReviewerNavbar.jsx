import { Box, Avatar, Typography, useMediaQuery, Divider } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import AssignmentIcon from "@mui/icons-material/Assignment";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useAuthStore } from "../../store/authStore";
import { getProfile } from "../../api/public";
import { logoutUser } from "../../api/auth";
import { setAccessToken } from "../../api/axios";
import { getUploadUrl } from "../../utils/fileUrl";

export default function ReviewerNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, refreshToken } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const isCompactMenu = useMediaQuery("(max-width:1520px)");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getProfile();
        if (active && res.success) setProfile(res.data);
      } catch {}
    })();
    return () => { active = false; };
  }, [location.key, user]);

  const activeMenu = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/reviewer/dashboard")) return "Dashboard";
    if (path.startsWith("/reviewer/biodata")) return "Biodata";
    if (path.startsWith("/reviewer/penugasan")) return "Penugasan Saya";
    return "";
  }, [location.pathname]);

  const displayName = user?.nama_lengkap || profile?.nama_lengkap || "User";
  const photoUrl = user?.foto ? getUploadUrl("profil", user.foto) : (profile?.foto ? getUploadUrl("profil", profile.foto) : null);
  const roleName = profile?.nama_role?.trim() || "";
  const displaySubtitle = profile?.keterangan?.trim() || roleName || "";
  const navbarTitle = profile?.current_program?.trim() || "Program Kewirausahaan";

  const menuItems = [
    { text: "Dashboard", path: "/reviewer/dashboard", icon: <DashboardIcon sx={{ fontSize: 20 }} /> },
    { text: "Biodata", path: "/reviewer/biodata", icon: <PersonIcon sx={{ fontSize: 20 }} /> },
    { text: "Penugasan Saya", path: "/reviewer/penugasan", icon: <AssignmentIcon sx={{ fontSize: 20 }} /> },
  ];

  const handleLogout = async () => {
    try {
      await logoutUser(refreshToken);
    } catch {}
    finally {
      logout();
      setAccessToken(null);
      navigate("/login");
    }
  };

  const isActive = (text) => activeMenu === text;

  return (
    <>
      <Box
        onClick={isCompactMenu ? () => setOpenMobileMenu((prev) => !prev) : undefined}
        sx={{
          height: { xs: 78, sm: 90 },
          position: "fixed",
          top: 12,
          left: { xs: 12, sm: 24 },
          right: { xs: 12, sm: 24 },
          zIndex: 100,
          px: { xs: 2, sm: 4 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#0D59F2",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "999px",
          boxShadow: "0 10px 30px rgba(13,89,242,0.25)",
          cursor: isCompactMenu ? "pointer" : "default",
        }}
      >
        <Box sx={{ minWidth: 0, maxWidth: { xs: 180, sm: 340, md: 460 }, pr: { xs: 2, sm: 5 } }}>
          <Typography
            sx={{
              fontSize: { xs: 14, sm: 17 },
              fontWeight: 700,
              color: "#ffffff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {navbarTitle}
          </Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            display: isCompactMenu ? "none" : "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: { md: 3, lg: 4 },
            pl: { md: 1, lg: 2 },
          }}
        >
          {menuItems.map((item) => (
            <Box
              key={item.text}
              onClick={() => navigate(item.path)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontWeight: isActive(item.text) ? 700 : 500,
                color: isActive(item.text) ? "#ffb74d" : "rgba(255,255,255,0.92)",
                position: "relative",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: -15,
                  height: 2,
                  borderRadius: 999,
                  backgroundColor: "#ffb74d",
                  opacity: isActive(item.text) ? 1 : 0,
                  transform: isActive(item.text) ? "scaleX(1)" : "scaleX(0)",
                  transformOrigin: "left center",
                  transition: "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", color: "inherit" }}>{item.icon}</Box>
              <Typography sx={{ fontSize: 16, fontWeight: "inherit", color: "inherit" }}>
                {item.text}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ position: "relative" }}>
          <Box
            onClick={(event) => {
              if (isCompactMenu) return; // ← guard: desktop only
              event.stopPropagation();
              setOpenProfileMenu((prev) => !prev);
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.8, sm: 1.4 },
              minWidth: 0,
              maxWidth: { xs: 200, sm: 280, md: 340 },
              cursor: isCompactMenu ? "default" : "pointer",
            }}
          >
            <Avatar
              src={photoUrl || undefined}
              imgProps={{ crossOrigin: "anonymous" }}
              sx={{ width: 42, height: 42, bgcolor: "#ffffff", color: "#0D59F2", fontSize: 15, fontWeight: 700 }}
            >
              {!photoUrl &&
                (displayName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
                  || <AccountCircleIcon sx={{ fontSize: 36 }} />)}
            </Avatar>

            {/* ← wrapper Box dengan display xs:none sm:block, sama seperti JuriNavbar */}
            <Box sx={{ minWidth: 0, maxWidth: { xs: 90, sm: 130, md: 180 }, display: { xs: "none", sm: "block" } }}>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#ffffff", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {displayName}
              </Typography>
              {displaySubtitle && (
                <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {displaySubtitle}
                </Typography>
              )}
            </Box>

            {/* ← arrow rotate saat mobile menu open */}
            <KeyboardArrowDownIcon
              sx={{
                color: "#ffffff",
                fontSize: 21,
                transform: isCompactMenu && openMobileMenu ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </Box>

          {!isCompactMenu && openProfileMenu && (
            <Box
              sx={{
                position: "absolute",
                top: "calc(100% + 10px)",
                right: 0,
                minWidth: "100%",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.22)",
                backgroundColor: "#0D59F2",
                boxShadow: "0 8px 24px rgba(13,89,242,0.35)",
                overflow: "hidden",
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
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
                }}
              >
                <LogoutIcon sx={{ fontSize: 18, color: "#ffffff" }} />
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#ffffff" }}>
                  Logout
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {isCompactMenu && openMobileMenu && (
        <Box
          sx={{
            position: "fixed",
            top: { xs: 96, sm: 108 },
            left: { xs: 12, sm: 24 },
            right: { xs: 12, sm: 24 },
            zIndex: 99,
            backgroundColor: "#0D59F2",
            border: "1px solid rgba(255,255,255,0.22)",
            borderRadius: "28px",
            boxShadow: "0 12px 30px rgba(13,89,242,0.35)",
            overflow: "hidden",
            maxHeight: "calc(100vh - 136px)",
            overflowY: "auto",
          }}
        >
          <Box sx={{ px: 1.5, py: 1 }}>
            {menuItems.map((item) => (
              <Box
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  setOpenMobileMenu(false);
                }}
                sx={{
                  mx: 0.6,
                  my: 0.4,
                  px: 1.6,
                  py: 1.2,
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                  color: isActive(item.text) ? "#ffb74d" : "rgba(255,255,255,0.92)",
                  fontWeight: isActive(item.text) ? 700 : 500,
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", color: "inherit" }}>{item.icon}</Box>
                <Typography sx={{ fontSize: 15, fontWeight: "inherit", color: "inherit" }}>{item.text}</Typography>
              </Box>
            ))}

            {/* ← Divider + Logout di mobile menu, sama seperti JuriNavbar */}
            <Divider sx={{ borderColor: "rgba(255,255,255,0.18)", mx: 0.6, my: 1 }} />

            <Box
              onClick={handleLogout}
              sx={{
                mx: 0.6,
                mb: 1,
                px: 1.6,
                py: 1.2,
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
              }}
            >
              <LogoutIcon sx={{ fontSize: 20, color: "#fff" }} />
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>Logout</Typography>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
}

ReviewerNavbar.hideInBodyLayout = true;
ReviewerNavbar.renderAsNavbar = true;