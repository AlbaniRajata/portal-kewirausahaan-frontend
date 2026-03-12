import { useState, useEffect } from "react";
import {
  Box, Divider, Paper, TextField, Typography,
  Autocomplete, CircularProgress, IconButton, InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import loginBg from "../../assets/images/login-bg.jpg";
import { registerDosen } from "../../api/auth";
import api from "../../api/axios";

const poppins = "'Poppins', sans-serif";

const roundedField = {
  mb: 2,
  "& .MuiOutlinedInput-root": { borderRadius: "15px" },
};

export default function RegisterDosenPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "", nip: "", email: "",
    id_prodi: null, password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingProdi, setLoadingProdi] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [prodiOptions, setProdiOptions] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const fetchProdi = async () => {
      try {
        const response = await api.get("/public/prodi");
        if (response.data.success) {
          setProdiOptions(response.data.data.map((prodi) => ({
            label: `${prodi.jenjang} ${prodi.nama_prodi} - ${prodi.nama_jurusan} (${prodi.nama_kampus})`,
            id: prodi.id_prodi,
            nama_prodi: prodi.nama_prodi,
            jenjang: prodi.jenjang,
            nama_jurusan: prodi.nama_jurusan,
            nama_kampus: prodi.nama_kampus,
          })));
        }
      } catch {
        await Swal.fire({
          icon: "error", title: "Gagal Memuat Data",
          text: "Gagal memuat data program studi. Silakan refresh halaman.",
          confirmButtonColor: "#0D59F2",
        });
      } finally {
        setLoadingProdi(false);
      }
    };
    fetchProdi();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.username) newErrors.username = "Username wajib diisi";
    if (!form.nip) newErrors.nip = "NIP wajib diisi";
    if (!form.email) newErrors.email = "Email wajib diisi";
    else if (!form.email.includes("@")) newErrors.email = "Format email tidak valid";
    if (!form.id_prodi) newErrors.id_prodi = "Program studi wajib dipilih";
    if (!form.password) newErrors.password = "Password wajib diisi";
    else if (form.password.length < 8) newErrors.password = "Password minimal 8 karakter";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerifyEmail = async (token) => {
    try {
      const response = await api.get(`/auth/verify-email?token=${token}`);
      await Swal.fire({
        icon: "success", title: "Email Berhasil Diverifikasi",
        text: response.data.message || "Email Anda telah berhasil diverifikasi. Silakan tunggu verifikasi dari admin.",
        timer: 3000, timerProgressBar: true,
        showConfirmButton: true, confirmButtonText: "Menuju Login", allowOutsideClick: false,
      });
      navigate("/login");
    } catch (err) {
      await Swal.fire({
        icon: "error", title: "Verifikasi Gagal",
        text: err.response?.data?.message || "Token tidak valid atau sudah kadaluarsa",
        confirmButtonColor: "#0D59F2", confirmButtonText: "OK",
      });
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        nip: form.nip,
        id_prodi: form.id_prodi.id,
      };

      const response = await registerDosen(payload);
      if (response.success) {
        let token = null;
        try {
          const verificationLink = response.data?.verification_link;
          if (verificationLink) {
            token = new URL(verificationLink).searchParams.get("token");
          }
        } catch {
          token = null;
        }

        if (token) {
          const result = await Swal.fire({
            icon: "success", title: "Registrasi Berhasil",
            html: `<p>Akun Anda telah berhasil didaftarkan.</p><p style="color:#666;font-size:14px;">Silakan verifikasi email Anda terlebih dahulu.</p>`,
            showCancelButton: false, confirmButtonText: "Verifikasi Email",
            confirmButtonColor: "#0D59F2", allowOutsideClick: false,
          });
          if (result.isConfirmed) await handleVerifyEmail(token);
        } else {
          await Swal.fire({
            icon: "success", title: "Registrasi Berhasil",
            html: `<p>Akun Anda telah berhasil didaftarkan.</p><p style="color:#666;font-size:14px;">Silakan cek email Anda untuk melakukan verifikasi.</p>`,
            confirmButtonText: "Menuju Login",
            confirmButtonColor: "#0D59F2", allowOutsideClick: false,
            timer: 5000, timerProgressBar: true,
          });
          navigate("/login");
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Registrasi gagal. Silakan coba lagi.";
      await Swal.fire({
        icon: "error", title: "Registrasi Gagal",
        text: errorMessage, confirmButtonColor: "#0D59F2", confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  const pillStyle = (delay) => ({
    display: "inline-flex", alignItems: "center", gap: 1,
    mt: 2, px: 2, py: 0.8,
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "50px", width: "fit-content",
    transform: mounted ? "translateX(0)" : "translateX(-20px)",
    opacity: mounted ? 1 : 0,
    transition: `transform 0.8s ease ${delay}, opacity 0.8s ease ${delay}`,
  });

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", overflow: "hidden" }}>

      <Box sx={{
        flex: 1, position: "sticky", top: 0, height: "100vh",
        display: { xs: "none", md: "flex" }, flexDirection: "column",
        backgroundImage: `url(${loginBg})`,
        backgroundSize: "cover", backgroundPosition: "center",
        transform: mounted ? "translateX(0)" : "translateX(-40px)",
        opacity: mounted ? 1 : 0,
        transition: "transform 0.7s cubic-bezier(0.22,1,0.36,1), opacity 0.7s ease",
      }}>
        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(2,13,36,0.85) 0%, rgba(13,89,242,0.7) 100%)" }} />

        <Box sx={{ position: "absolute", top: 32, left: 32, zIndex: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: "10px",
            background: "linear-gradient(135deg, #0D59F2, #1e40af)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 900, color: "#fff", fontFamily: poppins,
          }}>P</Box>
          <Typography sx={{ fontFamily: poppins, fontWeight: 700, fontSize: 16, color: "white" }}>
            UPA PKK POLINEMA
          </Typography>
        </Box>

        <Box sx={{
          position: "absolute", inset: 0, zIndex: 2,
          display: "flex", flexDirection: "column",
          justifyContent: "center", px: 6,
        }}>
          <Typography sx={{
            fontFamily: poppins, fontSize: 15,
            color: "rgba(255,255,255,0.65)", mb: 1,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            opacity: mounted ? 1 : 0,
            transition: "transform 0.8s ease 0.2s, opacity 0.8s ease 0.2s",
          }}>
            Selamat datang, Anda mendaftar sebagai
          </Typography>
          <Typography sx={{
            fontFamily: poppins, fontSize: 42, fontWeight: 700,
            color: "#fff", lineHeight: 1.15, mb: 2,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            opacity: mounted ? 1 : 0,
            transition: "transform 0.8s ease 0.3s, opacity 0.8s ease 0.3s",
          }}>
            Dosen
          </Typography>
          <Typography sx={{
            fontFamily: poppins, fontSize: 15,
            color: "rgba(255,255,255,0.65)", lineHeight: 1.8, maxWidth: 340,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            opacity: mounted ? 1 : 0,
            transition: "transform 0.8s ease 0.4s, opacity 0.8s ease 0.4s",
          }}>
            Daftarkan diri Anda sebagai pembimbing dan mendampingi mahasiswa dalam perjalanan wirausaha mereka.
          </Typography>

          {[
            { label: "Pembimbing Mahasiswa Wirausaha", delay: "0.55s" },
            { label: "Mentor Inkubator Bisnis", delay: "0.7s" },
          ].map((p) => (
            <Box key={p.label} sx={pillStyle(p.delay)}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#60a5fa" }} />
              <Typography sx={{ fontFamily: poppins, fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                {p.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{
        flex: 1, height: "100vh", overflowY: "auto",
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        px: 2, py: 5, backgroundColor: "#fff",
        transform: mounted ? "translateX(0)" : "translateX(40px)",
        opacity: mounted ? 1 : 0,
        transition: "transform 0.7s cubic-bezier(0.22,1,0.36,1), opacity 0.7s ease",
      }}>
        <Paper elevation={0} sx={{ width: "100%", maxWidth: 540, p: { xs: 3, md: 4 } }}>

          <Box sx={{
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            opacity: mounted ? 1 : 0,
            transition: "transform 0.6s ease 0.15s, opacity 0.6s ease 0.15s",
          }}>
            <Typography align="center" sx={{ fontFamily: poppins, fontSize: 26, fontWeight: 800, mb: 1, color: "#0a0a0a" }}>
              Registrasi Dosen
            </Typography>
            <Typography align="center" sx={{ fontFamily: poppins, fontSize: 14, color: "#999", mb: 4 }}>
              Lengkapi data berikut untuk membuat akun baru
            </Typography>
          </Box>

          <Box sx={{
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            opacity: mounted ? 1 : 0,
            transition: "transform 0.6s ease 0.25s, opacity 0.6s ease 0.25s",
          }}>
            {[
              { label: "Username", field: "username", placeholder: "Masukkan username" },
              { label: "NIP", field: "nip", placeholder: "Masukkan NIP" },
              { label: "Email", field: "email", placeholder: "Masukkan email" },
            ].map(({ label, field, placeholder }) => (
              <Box key={field}>
                <Typography fontWeight={600} sx={{ fontFamily: poppins, mb: 1, fontSize: 14 }}>{label}</Typography>
                <TextField
                  fullWidth placeholder={placeholder}
                  value={form[field]} onChange={(e) => handleChange(field, e.target.value)}
                  error={!!errors[field]} helperText={errors[field]}
                  disabled={loading} sx={roundedField}
                />
              </Box>
            ))}

            <Typography fontWeight={600} sx={{ fontFamily: poppins, mb: 1, fontSize: 14 }}>Program Studi</Typography>
            {loadingProdi ? (
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2, py: 2 }}>
                <CircularProgress size={24} sx={{ color: "#0D59F2" }} />
              </Box>
            ) : (
              <Autocomplete
                options={prodiOptions}
                value={form.id_prodi}
                onChange={(e, value) => handleChange("id_prodi", value)}
                getOptionLabel={(option) => option.label || ""}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                disabled={loading}
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) return options;
                  const s = inputValue.toLowerCase();
                  return options.filter((o) =>
                    o.nama_prodi.toLowerCase().includes(s) ||
                    o.jenjang.toLowerCase().includes(s) ||
                    o.nama_jurusan.toLowerCase().includes(s) ||
                    o.nama_kampus.toLowerCase().includes(s)
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params} placeholder="Ketik atau pilih prodi"
                    error={!!errors.id_prodi} helperText={errors.id_prodi}
                    sx={roundedField}
                  />
                )}
              />
            )}

            <Typography fontWeight={600} sx={{ fontFamily: poppins, mb: 1, fontSize: 14 }}>Password</Typography>
            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan password"
              value={form.password} onChange={(e) => handleChange("password", e.target.value)}
              error={!!errors.password} helperText={errors.password}
              disabled={loading} sx={roundedField}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box
              component="button"
              onClick={handleSubmit}
              disabled={loading}
              sx={{
                width: "100%", py: 1.6, mt: 1, borderRadius: "15px",
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
              {loading ? "Memproses..." : "Daftar"}
            </Box>

            <Divider sx={{ my: 3 }}>
              <Typography sx={{ fontFamily: poppins, fontSize: 13, color: "#bbb", px: 1 }}>Atau</Typography>
            </Divider>

            <Box
              component="button"
              onClick={() => navigate("/login")}
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
              Sudah punya akun? Masuk
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}