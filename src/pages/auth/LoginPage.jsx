import { useState } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  Alert,
  Modal,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import loginBg from "../../assets/images/login-bg.jpg";
import { loginUser } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";

const roundedField = {
  mb: 2,
  "& .MuiOutlinedInput-root": { borderRadius: "15px" },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [showPassword, setShowPassword] = useState(false);
  const [openRegisterModal, setOpenRegisterModal] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setAlert("");
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
    setLoading(true);
    setAlert("");
    try {
      const res = await loginUser({ email: form.email, password: form.password });
      setAuth({ token: res.data.token, user: res.data.user });
      await Swal.fire({
        icon: "success", title: "Login berhasil",
        timer: 1500, timerProgressBar: true,
        showConfirmButton: false, allowOutsideClick: false,
      });
      const roleId = res.data.user.id_role;
      if (roleId === 2) navigate("/admin/verifikasi");
      else if (roleId === 1) navigate("/mahasiswa/biodata");
      else if (roleId === 3) navigate("/dosen/biodata");
      else if (roleId === 4) navigate("/reviewer/penugasan");
      else if (roleId === 5) navigate("/juri/penugasan");
      else navigate("/");
    } catch (err) {
      setAlert(err.response?.data?.message || "Login gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  const handleRegisterChoice = (type) => {
    setOpenRegisterModal(false);
    if (type === "mahasiswa") navigate("/daftar/mahasiswa");
    else if (type === "dosen") navigate("/daftar/dosen");
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      {/* Left panel */}
      <Box sx={{
        flex: 1, position: "relative",
        display: { xs: "none", md: "block" },
        backgroundImage: `url(${loginBg})`, backgroundSize: "cover", backgroundPosition: "center",
      }}>
        <Box sx={{ position: "absolute", inset: 0, backgroundColor: "rgba(13, 89, 242, 0.65)" }} />
        <Box sx={{ position: "absolute", top: 30, left: 30, zIndex: 2, display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ width: 55, height: 55, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)" }} />
          <Typography sx={{ fontWeight: 700, fontSize: 18, color: "white" }}>UPA PKK POLINEMA</Typography>
        </Box>
      </Box>

      {/* Right panel — form */}
      <Box sx={{
        flex: 1, display: "flex", justifyContent: "center", alignItems: "center",
        px: 2, backgroundColor: "#fff",
      }}>
        <Paper elevation={0} sx={{ width: "100%", maxWidth: 540, p: 4 }}>
          <Typography align="center" sx={{ fontSize: 26, fontWeight: 700, mb: 1 }}>
            Portal Kewirausahaan PMW & INBIS
          </Typography>
          <Typography align="center" sx={{ fontSize: 14, color: "#777", mb: 3 }}>
            Silahkan masuk untuk melanjutkan
          </Typography>

          {alert && <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>{alert}</Alert>}

          <Typography fontWeight={600} sx={{ mb: 1 }}>Email</Typography>
          <TextField
            fullWidth placeholder="Masukkan email Anda"
            value={form.email} onChange={(e) => handleChange("email", e.target.value)}
            onKeyPress={handleKeyPress}
            error={!!errors.email} helperText={errors.email}
            disabled={loading} sx={roundedField}
          />

          <Typography fontWeight={600} sx={{ mb: 1 }}>Password</Typography>
          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            placeholder="Masukkan password Anda"
            value={form.password} onChange={(e) => handleChange("password", e.target.value)}
            onKeyPress={handleKeyPress}
            error={!!errors.password} helperText={errors.password}
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
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0D59F2", cursor: "pointer" }}>
              Lupa Password ?
            </Typography>
          </Box>

          <Button
            fullWidth variant="contained" onClick={handleLogin} disabled={loading}
            sx={{
              py: 1.4, borderRadius: "15px", fontWeight: 700,
              textTransform: "none",
              backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0846c7" },
            }}
          >
            {loading ? "Memproses..." : "Masuk"}
          </Button>

          <Divider sx={{ my: 3 }}>Atau</Divider>

          <Button
            fullWidth variant="outlined"
            onClick={() => setOpenRegisterModal(true)} disabled={loading}
            sx={{ py: 1.4, borderRadius: "15px", fontWeight: 700, borderColor: "#ccc", color: "black", textTransform: "none" }}
          >
            Daftar
          </Button>
        </Paper>
      </Box>

      {/* Register modal */}
      <Modal open={openRegisterModal} onClose={() => !loading && setOpenRegisterModal(false)}>
        <Box sx={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%", maxWidth: 480,
          bgcolor: "background.paper", borderRadius: "20px",
          boxShadow: 24, p: 4,
        }}>
          <Typography align="center" sx={{ fontSize: 24, fontWeight: 700, mb: 1 }}>Daftar Sebagai</Typography>
          <Typography align="center" sx={{ fontSize: 14, color: "#777", mb: 4 }}>
            Pilih jenis akun yang akan didaftarkan
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Button
              fullWidth variant="contained"
              onClick={() => handleRegisterChoice("mahasiswa")} disabled={loading}
              sx={{
                py: 2, borderRadius: "15px", textTransform: "none",
                fontWeight: 600, fontSize: 16,
                backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0846c7" },
              }}
            >
              Mahasiswa
            </Button>

            <Button
              fullWidth variant="outlined"
              onClick={() => handleRegisterChoice("dosen")} disabled={loading}
              sx={{
                py: 2, borderRadius: "15px", textTransform: "none",
                fontWeight: 600, fontSize: 16,
                borderColor: "#0D59F2", color: "#0D59F2",
                "&:hover": { borderColor: "#0846c7", backgroundColor: "rgba(13, 89, 242, 0.04)" },
              }}
            >
              Dosen
            </Button>
          </Box>

          <Button
            fullWidth variant="text"
            onClick={() => setOpenRegisterModal(false)} disabled={loading}
            sx={{ mt: 3, py: 1, textTransform: "none", fontWeight: 600, color: "#777" }}
          >
            Batal
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}