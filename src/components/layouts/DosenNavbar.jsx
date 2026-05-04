import { Box, Avatar, Typography, useMediaQuery, Divider } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import EventNoteIcon from "@mui/icons-material/EventNote";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useAuthStore } from "../../store/authStore";
import { getProfile } from "../../api/public";
import { logoutUser } from "../../api/auth";
import { setAccessToken } from "../../api/axios";
import { getUploadUrl } from "../../utils/fileUrl";

export default function DosenNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, refreshToken } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [openBimbinganMenu, setOpenBimbinganMenu] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [openMobileBimbingan, setOpenMobileBimbingan] = useState(false);
  const isBimbinganActive = location.pathname.startsWith("/dosen/pembimbing") || location.pathname.startsWith("/dosen/bimbingan");
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
    if (path.startsWith("/dosen/dashboard")) return "Dashboard";
    if (path.startsWith("/dosen/biodata")) return "Biodata";
    if (path.startsWith("/dosen/pembimbing/pengajuan")) return "Pengajuan Pembimbing";
    if (path.startsWith("/dosen/bimbingan")) return "Log Bimbingan";
    if (path.startsWith("/dosen/monitoring")) return "Monitoring dan Evaluasi";
    return "";
  }, [location.pathname]);

  const displayName = user?.nama_lengkap || profile?.nama_lengkap || "User";
  const photoUrl = user?.foto ? getUploadUrl("profil", user.foto) : (profile?.foto ? getUploadUrl("profil", profile.foto) : null);
  const roleName = profile?.nama_role?.trim() || "";
  const displaySubtitle = profile?.keterangan?.trim() || roleName || "";
  const navbarTitle = profile?.current_program?.trim() || "Program Kewirausahaan";

  const menuItems = [
    { text: "Dashboard", path: "/dosen/dashboard", icon: <DashboardIcon sx={{ fontSize: 20 }} /> },
    { text: "Biodata", path: "/dosen/biodata", icon: <PersonIcon sx={{ fontSize: 20 }} /> },
  ];

  const bimbinganSubmenu = [
    { text: "Pengajuan Pembimbing", path: "/dosen/pembimbing/pengajuan", icon: <PersonSearchIcon sx={{ fontSize: 18, color: "inherit" }} /> },
    { text: "Log Bimbingan", path: "/dosen/bimbingan", icon: <EventNoteIcon sx={{ fontSize: 18, color: "inherit" }} /> },
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

          <Box sx={{ display: "flex", position: "relative", alignItems: "center" }}>
            <Box
              onClick={() => setOpenBimbinganMenu((prev) => !prev)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
                fontWeight: isBimbinganActive ? 700 : 500,
                color: isBimbinganActive ? "#ffb74d" : "rgba(255,255,255,0.92)",
                whiteSpace: "nowrap",
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
                  opacity: isBimbinganActive ? 1 : 0,
                  transform: isBimbinganActive ? "scaleX(1)" : "scaleX(0)",
                  transformOrigin: "left center",
                  transition: "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease",
                },
              }}
            >
              <SchoolIcon sx={{ fontSize: 22, color: "inherit" }} />
              <Typography sx={{ fontSize: 16, fontWeight: "inherit", color: "inherit" }}>
                Bimbingan
              </Typography>
              <KeyboardArrowDownIcon sx={{ fontSize: 20, color: "inherit" }} />
            </Box>

            {openBimbinganMenu && (
              <Box
                sx={{
                  position: "absolute",
                  top: "calc(100% + 20px)",
                  left: 0,
                  width: "max-content",
                  minWidth: 220,
                  borderRadius: "16px",
                  border: "1px solid rgba(255,255,255,0.22)",
                  backgroundColor: "#0D59F2",
                  boxShadow: "0 8px 24px rgba(13,89,242,0.35)",
                  overflow: "hidden",
                  zIndex: 120,
                }}
              >
                {bimbinganSubmenu.map((subItem) => {
                  const isSubmenuActive = location.pathname === subItem.path || location.pathname.startsWith(`${subItem.path}/`);
                  return (
                    <Box
                      key={subItem.text}
                      onClick={() => {
                        navigate(subItem.path);
                        setOpenBimbinganMenu(false);
                      }}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        px: 2,
                        py: 1.1,
                        cursor: "pointer",
                        fontSize: 15,
                        fontWeight: isSubmenuActive ? 700 : 500,
                        color: isSubmenuActive ? "#ffb74d" : "rgba(255,255,255,0.94)",
                        "&:hover": { color: "#ffb74d" },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", color: "inherit" }}>{subItem.icon}</Box>
                      <Typography sx={{ fontSize: 15, fontWeight: "inherit", color: "inherit" }}>
                        {subItem.text}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>

          <Box
            onClick={() => navigate("/dosen/monitoring")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontWeight: isActive("Monitoring dan Evaluasi") ? 700 : 500,
              color: isActive("Monitoring dan Evaluasi") ? "#ffb74d" : "rgba(255,255,255,0.92)",
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
                opacity: isActive("Monitoring dan Evaluasi") ? 1 : 0,
                transform: isActive("Monitoring dan Evaluasi") ? "scaleX(1)" : "scaleX(0)",
                transformOrigin: "left center",
                transition: "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease",
              },
            }}
          >
            <AssessmentIcon sx={{ fontSize: 22, color: "inherit" }} />
            <Typography sx={{ fontSize: 16, fontWeight: "inherit", color: "inherit" }}>
              Monitoring dan Evaluasi
            </Typography>
          </Box>
        </Box>

        <Box sx={{ position: "relative" }}>
          <Box
            onClick={(event) => {
              if (isCompactMenu) return;
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

            <Box
              onClick={() => setOpenMobileBimbingan((prev) => !prev)}
              sx={{
                mx: 0.6,
                my: 0.4,
                px: 1.6,
                py: 1.2,
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                color: isBimbinganActive ? "#ffb74d" : "rgba(255,255,255,0.92)",
                fontWeight: isBimbinganActive ? 700 : 500,
                "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <SchoolIcon sx={{ fontSize: 20, color: "inherit" }} />
                <Typography sx={{ fontSize: 15, fontWeight: "inherit", color: "inherit" }}>Bimbingan</Typography>
              </Box>
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: 18,
                  color: "inherit",
                  transform: openMobileBimbingan ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </Box>

            {openMobileBimbingan && (
              <Box sx={{ pl: 2.6, pr: 1, pb: 0.6 }}>
                {bimbinganSubmenu.map((subItem) => {
                  const isSubmenuActive = location.pathname === subItem.path || location.pathname.startsWith(`${subItem.path}/`);
                  return (
                    <Box
                      key={subItem.text}
                      onClick={() => {
                        navigate(subItem.path);
                        setOpenMobileMenu(false);
                      }}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        py: 0.9,
                        px: 1,
                        borderRadius: "10px",
                        cursor: "pointer",
                        color: isSubmenuActive ? "#ffb74d" : "rgba(255,255,255,0.9)",
                        fontWeight: isSubmenuActive ? 700 : 500,
                        "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", color: "inherit" }}>{subItem.icon}</Box>
                      <Typography sx={{ fontSize: 15, fontWeight: "inherit", color: "inherit" }}>
                        {subItem.text}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}

            <Box
              onClick={() => {
                navigate("/dosen/monitoring");
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
                color: isActive("Monitoring dan Evaluasi") ? "#ffb74d" : "rgba(255,255,255,0.92)",
                fontWeight: isActive("Monitoring dan Evaluasi") ? 700 : 500,
                "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
              }}
            >
              <AssessmentIcon sx={{ fontSize: 20, color: "inherit" }} />
              <Typography sx={{ fontSize: 15, fontWeight: "inherit", color: "inherit" }}>Monitoring dan Evaluasi</Typography>
            </Box>

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

DosenNavbar.hideInBodyLayout = true;
DosenNavbar.renderAsNavbar = true;