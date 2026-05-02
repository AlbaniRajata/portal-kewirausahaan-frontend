import { useState, useEffect } from "react";
import {
  Box, Divider, IconButton, InputAdornment,
  Paper, TextField, Typography, Modal,
} from "@mui/material";
import { Visibility, VisibilityOff, ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import loginBg from "../../assets/images/login-bg.jpg";
import { forgotPasswordRequest, loginUser } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import { setAccessToken } from "../../api/axios";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { validateFormSecurity } from "../../utils/inputSecurity";

const roundedField = {
  mb: 2,
  "& .MuiOutlinedInput-root": { borderRadius: "15px" },
};

  const roleRouteMap = {
    admin: "/admin/verifikasi",
    "super admin": "/admin/verifikasi",
    mahasiswa: "/mahasiswa/biodata",
    dosen: "/dosen/biodata",
    reviewer: "/reviewer/penugasan",
    juri: "/juri/penugasan",
  };
  
  const getRouteForRole = (role) => {
    const normalizedRole = role?.toLowerCase();
    return roleRouteMap[normalizedRole] || "/";
  };

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [showPassword, setShowPassword] = useState(false);
  const [openRegisterModal, setOpenRegisterModal] = useState(false);
  const [openForgotModal, setOpenForgotModal] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = "Email wajib diisi";
    else if (!form.email.includes("@")) newErrors.email = "Format email tidak valid";
    if (!form.password) newErrors.password = "Password wajib diisi";
    else if (form.password.length < 8) newErrors.password = "Password minimal 8 karakter";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    const securityCheck = validateFormSecurity(form);
    if (!securityCheck.isValid) {
      setErrors((prev) => ({ ...prev, [securityCheck.field]: securityCheck.message }));
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser({ email: form.email, password: form.password });
      setAccessToken(res.data.token);
      setAuth({ user: res.data.user, refreshToken: res.data.refresh_token });
      await Swal.fire({
        icon: "success",
        title: "Login berhasil",
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
      const route = getRouteForRole(res.data.user.role);
      navigate(route);
    } catch (err) {
      const message = getErrorMessage(err, "Login gagal. Coba lagi.");
      await Swal.fire({
        icon: "error",
        title: "Login Gagal",
        text: message,
        confirmButtonColor: "#0D59F2",
        confirmButtonText: "Coba Lagi",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  };

  const handleRegisterChoice = (type) => {
    setOpenRegisterModal(false);
    if (type === "mahasiswa") navigate("/daftar/mahasiswa");
    else if (type === "dosen") navigate("/daftar/dosen");
  };

  const handleOpenForgotModal = () => {
    setForgotEmail(form.email || "");
    setForgotError("");
    setOpenForgotModal(true);
  };

  const handleForgotPassword = async () => {
    const email = forgotEmail.trim();

    if (!email) {
      setForgotError("Email wajib diisi");
      return;
    }

    if (!email.includes("@")) {
      setForgotError("Format email tidak valid");
      return;
    }

    const securityCheck = validateFormSecurity({ email });
    if (!securityCheck.isValid) {
      setForgotError(securityCheck.message);
      return;
    }

    setForgotLoading(true);
    try {
      const res = await forgotPasswordRequest(email);
      setOpenForgotModal(false);
      setForgotError("");
      await new Promise((resolve) => setTimeout(resolve, 150));
      await Swal.fire({
        icon: "success",
        title: "Permintaan berhasil",
        text: res?.message || "Jika email terdaftar, link reset sudah dikirim.",
        confirmButtonColor: "#0D59F2",
      });
    } catch (err) {
      const message = getErrorMessage(err, "Gagal mengirim permintaan reset password.");
      setForgotError(message);
    } finally {
      setForgotLoading(false);
    }
  };

  const poppins = "'Poppins', sans-serif";

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", overflow: "hidden" }}>

      <Box sx={{
        flex: 1, position: "relative",
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        backgroundImage: `url(${loginBg})`,
        backgroundSize: "cover", backgroundPosition: "center",
        transform: mounted ? "translateX(0)" : "translateX(-40px)",
        opacity: mounted ? 1 : 0,
        transition: "transform 0.7s cubic-bezier(0.22,1,0.36,1), opacity 0.7s ease",
      }}>
        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(2,13,36,0.85) 0%, rgba(13,89,242,0.7) 100%)" }} />

        <Box sx={{ position: "absolute", top: 32, left: 32, zIndex: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            component="img"
            src="/logoupapkk.svg"
            alt="UPA PKK POLINEMA"
            sx={{ width: 40, height: 40, borderRadius: "10px", objectFit: "contain" }}
          />
          <Typography sx={{ fontFamily: poppins, fontWeight: 700, fontSize: 16, color: "white", letterSpacing: "0.3px" }}>
            UPA PKK POLINEMA
          </Typography>
        </Box>

        <Box sx={{
          position: "absolute", inset: 0, zIndex: 2,
          display: "flex", flexDirection: "column",
          justifyContent: "center", px: 6,
        }}>
          <Typography sx={{
            fontFamily: poppins, fontSize: 38, fontWeight: 700,
            color: "#fff", lineHeight: 1.2, mb: 2,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            opacity: mounted ? 1 : 0,
            transition: "transform 0.8s ease 0.2s, opacity 0.8s ease 0.2s",
          }}>
            Wujudkan Ide<br />
            <Box component="span" sx={{ color: "#60a5fa", fontStyle: "italic" }}>
              Wirausaha
            </Box>{" "}Anda
          </Typography>

          <Typography sx={{
            fontFamily: poppins, fontSize: 15,
            color: "rgba(255,255,255,0.65)", lineHeight: 1.8, maxWidth: 340,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            opacity: mounted ? 1 : 0,
            transition: "transform 0.8s ease 0.35s, opacity 0.8s ease 0.35s",
          }}>
            Portal resmi PMW & INBIS Politeknik Negeri Malang untuk pengajuan dan penilaian proposal wirausaha.
          </Typography>

          {[
            { label: "Program Mahasiswa Wirausaha", delay: "0.5s" },
            { label: "Inkubator Bisnis", delay: "0.65s" },
          ].map((p) => (
            <Box key={p.label} sx={{
              display: "inline-flex", alignItems: "center", gap: 1,
              mt: 2, px: 2, py: 0.8,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "50px", width: "fit-content",
              transform: mounted ? "translateX(0)" : "translateX(-20px)",
              opacity: mounted ? 1 : 0,
              transition: `transform 0.8s ease ${p.delay}, opacity 0.8s ease ${p.delay}`,
            }}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#60a5fa" }} />
              <Typography sx={{ fontFamily: poppins, fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                {p.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{
        flex: 1, display: "flex", justifyContent: "center", alignItems: "center",
        px: 2, backgroundColor: "#fff",
        transform: mounted ? "translateX(0)" : "translateX(40px)",
        opacity: mounted ? 1 : 0,
        transition: "transform 0.7s cubic-bezier(0.22,1,0.36,1), opacity 0.7s ease",
      }}>
        <Paper elevation={0} sx={{ width: "100%", maxWidth: 480, p: { xs: 3, md: 4 } }}>

          <Box sx={{
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            opacity: mounted ? 1 : 0,
            transition: "transform 0.6s ease 0.15s, opacity 0.6s ease 0.15s",
          }}>
            <Typography align="center" sx={{ fontFamily: poppins, fontSize: 26, fontWeight: 800, mb: 1, color: "#0a0a0a" }}>
              Selamat Datang
            </Typography>
            <Typography align="center" sx={{ fontFamily: poppins, fontSize: 14, color: "#999", mb: 3.5 }}>
              Masuk ke Portal Kewirausahaan PMW & INBIS
            </Typography>
          </Box>

          <Box
            component="div"
            onKeyDown={handleKeyDown}
            sx={{
              transform: mounted ? "translateY(0)" : "translateY(20px)",
              opacity: mounted ? 1 : 0,
              transition: "transform 0.6s ease 0.25s, opacity 0.6s ease 0.25s",
            }}
          >
            <Typography fontWeight={600} sx={{ fontFamily: poppins, mb: 1, fontSize: 14 }}>Email</Typography>
            <TextField
              fullWidth
              placeholder="Masukkan email Anda"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
              sx={roundedField}
            />

            <Typography fontWeight={600} sx={{ fontFamily: poppins, mb: 1, fontSize: 14 }}>Password</Typography>
            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan password Anda"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              disabled={loading}
              sx={{ ...roundedField, mb: 0 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} disabled={loading} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ textAlign: "right", mt: 1, mb: 3 }}>
              <Typography
                component="button"
                type="button"
                onClick={handleOpenForgotModal}
                disabled={loading || forgotLoading}
                sx={{
                  fontFamily: poppins,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#0D59F2",
                  cursor: loading || forgotLoading ? "not-allowed" : "pointer",
                  background: "transparent",
                  border: "none",
                  p: 0,
                  transition: "color 0.2s",
                  "&:hover": {
                    color: "#0846c7",
                  },
                }}
              >
                Lupa Password?
              </Typography>
            </Box>

            <Box
              component="button"
              onClick={handleLogin}
              disabled={loading}
              sx={{
                width: "100%", py: 1.6, borderRadius: "15px",
                fontWeight: 700, fontSize: 15, border: "none",
                fontFamily: poppins,
                backgroundColor: loading ? "#93b8fa" : "#0D59F2",
                color: "#fff", cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.25s ease",
                "&:hover": !loading ? {
                  backgroundColor: "#0846c7",
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 24px rgba(13,89,242,0.35)",
                } : {},
                "&:active": !loading ? { transform: "translateY(0)" } : {},
              }}
            >
              {loading ? "Memproses..." : "Masuk"}
            </Box>

            <Divider sx={{ my: 3 }}>
              <Typography sx={{ fontFamily: poppins, fontSize: 13, color: "#bbb", px: 1 }}>Atau</Typography>
            </Divider>

            <Box
              component="button"
              onClick={() => !loading && setOpenRegisterModal(true)}
              disabled={loading}
              sx={{
                width: "100%", py: 1.6, borderRadius: "15px",
                fontWeight: 700, fontSize: 15,
                fontFamily: poppins,
                border: "1.5px solid #e0e0e0",
                backgroundColor: "transparent", color: "#0a0a0a",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.25s ease",
                "&:hover": !loading ? {
                  borderColor: "#0D59F2", color: "#0D59F2",
                  backgroundColor: "rgba(13,89,242,0.04)",
                } : {},
              }}
            >
              Daftar
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mt: 3, gap: 0.5 }}>
              <Typography 
                component="button" 
                onClick={() => navigate("/")} 
                sx={{ 
                  fontFamily: poppins, 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: "#666", 
                  background: "transparent", 
                  border: "none", 
                  p: 0, 
                  cursor: "pointer",
                  "&:hover": { color: "#0D59F2" }
                }}
              >
                Kembali ke Beranda
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {openRegisterModal && (
        <div
          onClick={() => !loading && setOpenRegisterModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            animation: "mfade .2s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 400,
              background: "#fff",
              borderRadius: 24,
              padding: "clamp(24px,5vw,40px)",
              animation: "mslide .3s cubic-bezier(.16,1,.3,1)",
            }}
          >
            <style>{`
              @keyframes mfade {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes mslide {
                from { transform: translateY(18px) scale(0.98); opacity: 0; }
                to { transform: translateY(0) scale(1); opacity: 1; }
              }
            `}</style>

            <div style={{ marginBottom: 28, textAlign: "center" }}>
              <div
                style={{
                  fontFamily: poppins,
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#0a0a14",
                  letterSpacing: "-0.5px",
                  marginBottom: 6,
                }}
              >
                Daftar Sebagai
              </div>
              <div style={{ fontFamily: poppins, fontSize: 14, color: "#aaa" }}>
                Pilih jenis akun yang akan didaftarkan
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                {
                  key: "mahasiswa",
                  label: "Mahasiswa",
                  sub: "Ajukan proposal & ikuti program",
                  solid: true,
                },
                {
                  key: "dosen",
                  label: "Dosen",
                  sub: "Bimbing & evaluasi proposal",
                  solid: false,
                },
              ].map((o) => (
                <button
                  key={o.key}
                  onClick={() => handleRegisterChoice(o.key)}
                  style={{
                    padding: "16px 20px",
                    borderRadius: 14,
                    cursor: "pointer",
                    background: o.solid ? "#0D59F2" : "transparent",
                    border: o.solid ? "none" : "1.5px solid rgba(0,0,0,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all .22s",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 24px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: poppins,
                        fontSize: 15,
                        fontWeight: 700,
                        color: o.solid ? "#fff" : "#0a0a14",
                        marginBottom: 2,
                      }}
                    >
                      {o.label}
                    </div>
                    <div
                      style={{
                        fontFamily: poppins,
                        fontSize: 12,
                        color: o.solid ? "rgba(255,255,255,0.6)" : "#aaa",
                      }}
                    >
                      {o.sub}
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke={o.solid ? "#fff" : "#0D59F2"}
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ))}
            </div>

            <button
              onClick={() => setOpenRegisterModal(false)}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "10px",
                border: "none",
                background: "#DC2626",
                fontFamily: poppins,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
                borderRadius: 10,
                transition: "color .2s",
              }}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <Modal
        open={openForgotModal}
        onClose={() => !forgotLoading && setOpenForgotModal(false)}
        sx={{ zIndex: 1800 }}
      >
        <Box sx={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%", maxWidth: 460,
          bgcolor: "background.paper", borderRadius: "20px",
          boxShadow: "0 28px 90px rgba(0,0,0,0.22)", p: 4,
          outline: "none",
        }}>
          <Typography align="center" sx={{ fontFamily: poppins, fontSize: 22, fontWeight: 800, mb: 1 }}>
            Lupa Password
          </Typography>
          <Typography align="center" sx={{ fontFamily: poppins, fontSize: 14, color: "#999", mb: 3 }}>
            Masukkan email akun Anda untuk menerima link reset password.
          </Typography>

          <TextField
            fullWidth
            placeholder="Masukkan email Anda"
            value={forgotEmail}
            onChange={(e) => {
              setForgotEmail(e.target.value);
              setForgotError("");
            }}
            error={!!forgotError}
            helperText={forgotError}
            disabled={forgotLoading}
            sx={{ ...roundedField, mb: 2 }}
          />

          <Box
            component="button"
            onClick={handleForgotPassword}
            disabled={forgotLoading}
            sx={{
              width: "100%", py: 1.5, borderRadius: "14px",
              fontWeight: 700, fontSize: 15, border: "none",
              fontFamily: poppins,
              backgroundColor: forgotLoading ? "#93b8fa" : "#0D59F2",
              color: "#fff", cursor: forgotLoading ? "not-allowed" : "pointer",
            }}
          >
            {forgotLoading ? "Mengirim..." : "Kirim Link Reset"}
          </Box>

          <Box
            component="button"
            onClick={() => setOpenForgotModal(false)}
            disabled={forgotLoading}
            sx={{
              mt: 2, width: "100%", py: 1.2,
              background: "transparent", border: "none",
              fontWeight: 600, fontSize: 14, color: "#aaa",
              fontFamily: poppins,
              cursor: forgotLoading ? "not-allowed" : "pointer",
            }}
          >
            Batal
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}