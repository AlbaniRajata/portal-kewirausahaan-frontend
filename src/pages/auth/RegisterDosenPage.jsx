import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Divider,
  Paper,
  TextField,
  Typography,
  Autocomplete,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import loginBg from "../../assets/images/login-bg.jpg";
import { registerDosen } from "../../api/auth";
import api from "../../api/axios";

const roundedField = {
  mb: 2,
  "& .MuiOutlinedInput-root": { borderRadius: "15px" },
};

export default function RegisterDosenPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    nip: "",
    email: "",
    id_prodi: null,
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProdi, setLoadingProdi] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [prodiOptions, setProdiOptions] = useState([]);

  useEffect(() => {
    const fetchProdi = async () => {
      try {
        setLoadingProdi(true);
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
      } catch (err) {
        console.error("Error fetching prodi:", err);
        setAlert("Gagal memuat data program studi. Silakan refresh halaman.");
      } finally {
        setLoadingProdi(false);
      }
    };
    fetchProdi();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setAlert("");
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
        icon: "success",
        title: "Email Berhasil Diverifikasi",
        text: response.data.message || "Email Anda telah berhasil diverifikasi. Silakan tunggu verifikasi dari admin.",
        timer: 3000, timerProgressBar: true,
        showConfirmButton: true, confirmButtonText: "Menuju Login", allowOutsideClick: false,
      });
      navigate("/login");
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Verifikasi Gagal",
        text: err.response?.data?.message || "Token tidak valid atau sudah kadaluarsa",
        confirmButtonText: "OK",
      });
    }
  };

  const handleSubmit = async () => {
    if (!validate()) { setAlert("Mohon lengkapi semua field yang wajib diisi"); return; }
    setLoading(true); setAlert("");
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
        const verificationLink = response.data.verification_link;
        const token = verificationLink ? new URL(verificationLink).searchParams.get("token") : null;
        const result = await Swal.fire({
          icon: "success", title: "Registrasi Berhasil",
          html: `<p>Akun Anda telah berhasil didaftarkan.</p><p style="color:#666;font-size:14px;">Silakan verifikasi email Anda terlebih dahulu.</p>`,
          showCancelButton: false, confirmButtonText: "Verifikasi Email", allowOutsideClick: false,
        });
        if (result.isConfirmed && token) await handleVerifyEmail(token);
      }
    } catch (err) {
      console.error("Error registrasi:", err);
      const errorMessage = err.response?.data?.message || "Registrasi gagal. Silakan coba lagi.";
      setAlert(errorMessage);
      await Swal.fire({ icon: "error", title: "Registrasi Gagal", text: errorMessage, confirmButtonText: "OK" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      <Box sx={{
        flex: 1, position: "sticky", top: 0, height: "100vh",
        display: { xs: "none", md: "block" },
        backgroundImage: `url(${loginBg})`, backgroundSize: "cover", backgroundPosition: "center",
      }}>
        <Box sx={{ position: "absolute", inset: 0, backgroundColor: "rgba(13, 89, 242, 0.65)" }} />
        <Box sx={{ position: "absolute", top: 30, left: 30, zIndex: 2, display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ width: 55, height: 55, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)" }} />
          <Typography sx={{ fontWeight: 700, fontSize: 18, color: "white" }}>UPA PKK POLINEMA</Typography>
        </Box>
        <Box sx={{ position: "absolute", bottom: 40, left: 30, zIndex: 2 }}>
          <Typography sx={{ color: "white", fontSize: 18, mb: 0.5 }}>Selamat datang, anda daftar sebagai</Typography>
          <Typography sx={{ color: "white", fontSize: 40, fontWeight: 700 }}>Dosen</Typography>
        </Box>
      </Box>

      <Box sx={{
        flex: 1, height: "100vh", overflowY: "auto",
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        px: 2, py: 5, backgroundColor: "#fff",
      }}>
        <Paper elevation={0} sx={{ width: "100%", maxWidth: 540, p: 4 }}>
          <Typography align="center" sx={{ fontSize: 26, fontWeight: 700, mb: 1 }}>Registrasi Dosen</Typography>
          <Typography align="center" sx={{ fontSize: 14, color: "#777", mb: 4 }}>Lengkapi data berikut untuk membuat akun baru</Typography>

          {alert && <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>{alert}</Alert>}

          <Typography fontWeight={600} sx={{ mb: 1 }}>Username</Typography>
          <TextField
            fullWidth placeholder="Masukkan username"
            value={form.username} onChange={(e) => handleChange("username", e.target.value)}
            error={!!errors.username} helperText={errors.username}
            disabled={loading} sx={roundedField}
          />

          <Typography fontWeight={600} sx={{ mb: 1 }}>NIP</Typography>
          <TextField
            fullWidth placeholder="Masukkan NIP"
            value={form.nip} onChange={(e) => handleChange("nip", e.target.value)}
            error={!!errors.nip} helperText={errors.nip}
            disabled={loading} sx={roundedField}
          />

          <Typography fontWeight={600} sx={{ mb: 1 }}>Email</Typography>
          <TextField
            fullWidth placeholder="Masukkan email"
            value={form.email} onChange={(e) => handleChange("email", e.target.value)}
            error={!!errors.email} helperText={errors.email}
            disabled={loading} sx={roundedField}
          />

          <Typography fontWeight={600} sx={{ mb: 1 }}>Program Studi</Typography>
          {loadingProdi ? (
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2, py: 2 }}><CircularProgress size={24} /></Box>
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
                  o.nama_kampus.toLowerCase().includes(s) ||
                  o.label.toLowerCase().includes(s)
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

          <Typography fontWeight={600} sx={{ mb: 1 }}>Password</Typography>
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

          <Button
            fullWidth variant="contained" onClick={handleSubmit} disabled={loading}
            sx={{
              py: 1.4, borderRadius: "15px", fontWeight: 700,
              textTransform: "none", mt: 1,
              backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0846c7" },
            }}
          >
            {loading ? "Memproses..." : "Daftar"}
          </Button>

          <Divider sx={{ my: 3 }}>Atau</Divider>

          <Button
            fullWidth variant="outlined" disabled={loading}
            onClick={() => navigate("/login")}
            sx={{ py: 1.4, borderRadius: "15px", fontWeight: 700, borderColor: "#ccc", color: "black", textTransform: "none" }}
          >
            Sudah punya akun? Masuk
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}