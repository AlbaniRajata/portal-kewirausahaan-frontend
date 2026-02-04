import { useState } from "react";
import {
  Box,
  Button,
  Divider,
  Paper,
  TextField,
  Typography,
  Autocomplete,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import loginBg from "../../assets/images/login-bg.jpg";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    nim: "",
    email: "",
    prodi: null,
    tahunMasuk: "",
    password: "",
    ktm: null,
  });

  const [errors, setErrors] = useState({});

  const prodiOptions = [
    { label: "Teknik Informatika" },
    { label: "Sistem Informasi" },
    { label: "Manajemen Bisnis" },
    { label: "Akuntansi" },
  ];

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.username) newErrors.username = "Wajib diisi";
    if (!form.nim) newErrors.nim = "Wajib diisi";
    if (!form.email) newErrors.email = "Wajib diisi";
    if (!form.prodi) newErrors.prodi = "Wajib diisi";
    if (!form.tahunMasuk) newErrors.tahunMasuk = "Wajib diisi";
    if (!form.password) newErrors.password = "Wajib diisi";
    if (!form.ktm) newErrors.ktm = "Wajib diisi";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    alert("Registrasi berhasil. Silakan cek email untuk verifikasi.");
    navigate("/login");
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      <Box
        sx={{
          flex: 1,
          position: "sticky",
          top: 0,
          height: "100vh",
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

          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 18,
              color: "white",
            }}
          >
            UPA PKK POLINEMA
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          height: "100vh",
          overflowY: "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          px: 2,
          py: 5,
          backgroundColor: "#fff",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 540,
            p: 4,
            borderRadius: 3,
          }}
        >
          <Typography
            align="center"
            sx={{
              fontSize: "26px",
              fontWeight: 700,
              mb: 1,
            }}
          >
            Registrasi Mahasiswa
          </Typography>

          <Typography
            align="center"
            sx={{
              fontSize: "14px",
              color: "#777",
              mb: 4,
            }}
          >
            Lengkapi data berikut untuk membuat akun baru
          </Typography>

          <Typography fontWeight={600} sx={{ mb: 1 }}>
            Username
          </Typography>
          <TextField
            fullWidth
            placeholder="Masukkan username"
            value={form.username}
            onChange={(e) => handleChange("username", e.target.value)}
            error={!!errors.username}
            helperText={errors.username}
            sx={{ mb: 2, "& fieldset": { borderRadius: 2 } }}
          />

          <Typography fontWeight={600} sx={{ mb: 1 }}>
            NIM
          </Typography>
          <TextField
            fullWidth
            placeholder="Masukkan NIM"
            value={form.nim}
            onChange={(e) => handleChange("nim", e.target.value)}
            error={!!errors.nim}
            helperText={errors.nim}
            sx={{ mb: 2, "& fieldset": { borderRadius: 2 } }}
          />

          <Typography fontWeight={600} sx={{ mb: 1 }}>
            Email
          </Typography>
          <TextField
            fullWidth
            placeholder="Masukkan email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            sx={{ mb: 2, "& fieldset": { borderRadius: 2 } }}
          />

          <Typography fontWeight={600} sx={{ mb: 1 }}>
            Program Studi
          </Typography>
          <Autocomplete
            options={prodiOptions}
            value={form.prodi}
            onChange={(e, value) => handleChange("prodi", value)}
            freeSolo
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Ketik atau pilih prodi"
                error={!!errors.prodi}
                helperText={errors.prodi}
                sx={{ mb: 2, "& fieldset": { borderRadius: 2 } }}
              />
            )}
          />

          <Typography fontWeight={600} sx={{ mb: 1 }}>
            Tahun Masuk
          </Typography>
          <TextField
            fullWidth
            placeholder="Contoh: 2023"
            value={form.tahunMasuk}
            onChange={(e) => handleChange("tahunMasuk", e.target.value)}
            error={!!errors.tahunMasuk}
            helperText={errors.tahunMasuk}
            sx={{ mb: 2, "& fieldset": { borderRadius: 2 } }}
          />

          <Typography fontWeight={600} sx={{ mb: 1 }}>
            Password
          </Typography>
          <TextField
            fullWidth
            type="password"
            placeholder="Masukkan password"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            error={!!errors.password}
            helperText={errors.password}
            sx={{ mb: 2, "& fieldset": { borderRadius: 2 } }}
          />

          <Typography fontWeight={600} sx={{ mb: 1 }}>
            Upload Foto KTM
          </Typography>
          <Button
            component="label"
            fullWidth
            variant="outlined"
            sx={{
              mb: 3,
              py: 1.2,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {form.ktm ? form.ktm.name : "Pilih File KTM"}
            <input
              type="file"
              hidden
              onChange={(e) => handleChange("ktm", e.target.files[0])}
            />
          </Button>

          <Button
            fullWidth
            variant="contained"
            sx={{
              py: 1.4,
              borderRadius: 2,
              fontWeight: 700,
              textTransform: "none",
              backgroundColor: "#0D59F2",
              "&:hover": { backgroundColor: "#0846c7" },
            }}
            onClick={handleSubmit}
          >
            Daftar
          </Button>

          <Divider sx={{ my: 3 }} />

          <Button
            fullWidth
            variant="outlined"
            sx={{
              py: 1.4,
              borderRadius: 2,
              fontWeight: 700,
              borderColor: "#ccc",
              color: "black",
              textTransform: "none",
            }}
            onClick={() => navigate("/login")}
          >
            Sudah punya akun? Masuk
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
