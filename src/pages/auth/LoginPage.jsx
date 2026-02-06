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

    if (!form.email) {
      newErrors.email = "Email wajib diisi";
    } else if (!form.email.includes("@")) {
      newErrors.email = "Format email tidak valid";
    }

    if (!form.password) {
      newErrors.password = "Password wajib diisi";
    } else if (form.password.length < 8) {
      newErrors.password = "Password minimal 8 karakter";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    setAlert("");

    try {
      const res = await loginUser({
        email: form.email,
        password: form.password,
      });

      setAuth({
        token: res.data.token,
        user: res.data.user,
      });

      await Swal.fire({
        icon: "success",
        title: "Login berhasil",
        text: "Sedang diarahkan ke biodata Anda...",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });

      const role = res.data.user.role;

      if (role === "mahasiswa") {
        navigate("/mahasiswa/biodata");
      } else if (role === "dosen") {
        navigate("/mahasiswa/biodata");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Login gagal. Coba lagi.";
      setAlert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  const handleRegisterChoice = (type) => {
    setOpenRegisterModal(false);
    if (type === "mahasiswa") {
      navigate("/daftar/mahasiswa");
    } else if (type === "dosen") {
      navigate("/daftar/dosen");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      <Box
        sx={{
          flex: 1,
          position: "relative",
          display: { xs: "none", md: "block" },
          backgroundImage: `url(${loginBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(13, 89, 242, 0.65)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            top: 30,
            left: 30,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 55,
              height: 55,
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,0.25)",
            }}
          />
          <Typography sx={{ fontWeight: 700, fontSize: 18, color: "white" }}>
            UPA PKK POLINEMA
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          px: 2,
          backgroundColor: "#fff",
        }}
      >
        <Paper elevation={0} sx={{ width: "100%", maxWidth: 540, p: 4 }}>
          <Typography
            align="center"
            sx={{ fontSize: 26, fontWeight: 700, mb: 1 }}
          >
            Portal Kewirausahaan PMW & INBIS
          </Typography>

          <Typography
            align="center"
            sx={{ fontSize: 14, color: "#777", mb: 3 }}
          >
            Silahkan masuk untuk melanjutkan
          </Typography>

          {alert && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {alert}
            </Alert>
          )}

          <Typography fontWeight={600} sx={{ mb: 1 }}>
            Email
          </Typography>
          <TextField
            fullWidth
            placeholder="Masukkan email Anda"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            onKeyPress={handleKeyPress}
            error={!!errors.email}
            helperText={errors.email}
            disabled={loading}
            sx={{ mb: 2, "& fieldset": { borderRadius: 2 } }}
          />

          <Typography fontWeight={600} sx={{ mb: 1 }}>
            Password
          </Typography>
          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            placeholder="Masukkan password Anda"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            onKeyPress={handleKeyPress}
            error={!!errors.password}
            helperText={errors.password}
            disabled={loading}
            sx={{ "& fieldset": { borderRadius: 2 } }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ textAlign: "right", mt: 1, mb: 3 }}>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: "#0D59F2",
                cursor: "pointer",
              }}
            >
              Lupa Password ?
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="contained"
            onClick={handleLogin}
            disabled={loading}
            sx={{
              py: 1.4,
              borderRadius: 2,
              fontWeight: 700,
              textTransform: "none",
              backgroundColor: "#0D59F2",
              "&:hover": { backgroundColor: "#0846c7" },
            }}
          >
            {loading ? "Memproses..." : "Masuk"}
          </Button>

          <Divider sx={{ my: 3 }}>Atau</Divider>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => setOpenRegisterModal(true)}
            disabled={loading}
            sx={{
              py: 1.4,
              borderRadius: 2,
              fontWeight: 700,
              borderColor: "#ccc",
              color: "black",
              textTransform: "none",
            }}
          >
            Daftar
          </Button>
        </Paper>
      </Box>

      <Modal
        open={openRegisterModal}
        onClose={() => !loading && setOpenRegisterModal(false)}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: 480,
            bgcolor: "background.paper",
            borderRadius: 3,
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography
            align="center"
            sx={{ fontSize: 24, fontWeight: 700, mb: 1 }}
          >
            Daftar Sebagai
          </Typography>

          <Typography
            align="center"
            sx={{ fontSize: 14, color: "#777", mb: 4 }}
          >
            Pilih jenis akun yang akan didaftarkan
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => handleRegisterChoice("mahasiswa")}
              disabled={loading}
              sx={{
                py: 2,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: 16,
                backgroundColor: "#0D59F2",
                "&:hover": { backgroundColor: "#0846c7" },
              }}
            >
              Mahasiswa
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleRegisterChoice("dosen")}
              disabled={loading}
              sx={{
                py: 2,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: 16,
                borderColor: "#0D59F2",
                color: "#0D59F2",
                "&:hover": {
                  borderColor: "#0846c7",
                  backgroundColor: "rgba(13, 89, 242, 0.04)",
                },
              }}
            >
              Dosen
            </Button>
          </Box>

          <Button
            fullWidth
            variant="text"
            onClick={() => setOpenRegisterModal(false)}
            disabled={loading}
            sx={{
              mt: 3,
              py: 1,
              textTransform: "none",
              fontWeight: 600,
              color: "#777",
            }}
          >
            Batal
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}
