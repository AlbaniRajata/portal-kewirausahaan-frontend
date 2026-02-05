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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
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
  const [openRegisterDialog, setOpenRegisterDialog] = useState(false);

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
    if (!form.email) newErrors.email = "Wajib diisi";
    if (!form.password) newErrors.password = "Wajib diisi";
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
        text: "Anda akan diarahkan ke dashboard",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });

      const role = res.data.user.role;

      if (role === "mahasiswa") navigate("/dashboard/mahasiswa");
      else if (role === "dosen") navigate("/dashboard/dosen");
      else navigate("/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.message || "Login gagal. Coba lagi.";
      setAlert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      {/* LEFT IMAGE */}
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

      {/* RIGHT FORM */}
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
          <Typography align="center" sx={{ fontSize: 26, fontWeight: 700, mb: 1 }}>
            Portal Kewirausahaan PMW & INBIS
          </Typography>

          <Typography align="center" sx={{ fontSize: 14, color: "#777", mb: 3 }}>
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
            error={!!errors.email}
            helperText={errors.email}
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
            error={!!errors.password}
            helperText={errors.password}
            sx={{ "& fieldset": { borderRadius: 2 } }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
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
            onClick={() => setOpenRegisterDialog(true)}
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

      {/* REGISTER DIALOG */}
      <Dialog
        open={openRegisterDialog}
        onClose={() => setOpenRegisterDialog(false)}
      >
        <DialogTitle>Daftar sebagai</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#555" }}>
            Pilih jenis akun yang akan didaftarkan
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate("/daftar/mahasiswa")}
          >
            Mahasiswa
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate("/daftar/dosen")}
          >
            Dosen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
