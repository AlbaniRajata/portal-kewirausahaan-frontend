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
import { registerMahasiswa } from "../../api/auth";
import api from "../../api/axios";

const roundedField = {
  mb: 2,
  "& .MuiOutlinedInput-root": { borderRadius: "15px" },
};

export default function RegisterMahasiswaPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    nim: "",
    email: "",
    id_prodi: null,
    tahun_masuk: "",
    password: "",
    foto_ktm: null,
  });

  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProdi, setLoadingProdi] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [prodiOptions, setProdiOptions] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

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
        console.error("Error fetching prodi options:", err);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedFormats = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedFormats.includes(file.type)) {
      setErrors((prev) => ({ ...prev, foto_ktm: "Format file harus JPG, JPEG, PNG, atau PDF" }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, foto_ktm: "Ukuran file maksimal 10MB" }));
      return;
    }

    handleChange("foto_ktm", file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.username) newErrors.username = "Username wajib diisi";
    if (!form.nim) newErrors.nim = "NIM wajib diisi";
    if (!form.email) newErrors.email = "Email wajib diisi";
    else if (!form.email.includes("@")) newErrors.email = "Format email tidak valid";
    if (!form.id_prodi) newErrors.id_prodi = "Program studi wajib dipilih";
    if (!form.tahun_masuk) newErrors.tahun_masuk = "Tahun masuk wajib diisi";
    else if (!/^\d{4}$/.test(form.tahun_masuk)) newErrors.tahun_masuk = "Format tahun tidak valid (contoh: 2023)";
    if (!form.password) newErrors.password = "Password wajib diisi";
    else if (form.password.length < 8) newErrors.password = "Password minimal 8 karakter";
    if (!form.foto_ktm) newErrors.foto_ktm = "Foto KTM wajib diupload";
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
      await Swal.fire({ icon: "error", title: "Verifikasi Gagal", text: err.response?.data?.message || "Token tidak valid atau sudah kadaluarsa", confirmButtonText: "OK" });
    }
  };

  const handleSubmit = async () => {
    if (!validate()) { setAlert("Mohon lengkapi semua field yang wajib diisi"); return; }
    setLoading(true); setAlert("");
    try {
      const formData = new FormData();
      formData.append("username", form.username);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("nim", form.nim);
      formData.append("id_prodi", form.id_prodi.id);
      formData.append("tahun_masuk", form.tahun_masuk);
      formData.append("foto_ktm", form.foto_ktm);

      const response = await registerMahasiswa(formData);
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
          <Typography sx={{ color: "white", fontSize: 40, fontWeight: 700 }}>Mahasiswa</Typography>
        </Box>
      </Box>

      <Box sx={{
        flex: 1, height: "100vh", overflowY: "auto",
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        px: 2, py: 5, backgroundColor: "#fff",
      }}>
        <Paper elevation={0} sx={{ width: "100%", maxWidth: 540, p: 4 }}>
          <Typography align="center" sx={{ fontSize: 26, fontWeight: 700, mb: 1 }}>Registrasi Mahasiswa</Typography>
          <Typography align="center" sx={{ fontSize: 14, color: "#777", mb: 4 }}>Lengkapi data berikut untuk membuat akun baru</Typography>

          {alert && <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>{alert}</Alert>}

          <Typography fontWeight={600} sx={{ mb: 1 }}>Username</Typography>
          <TextField
            fullWidth placeholder="Masukkan username"
            value={form.username} onChange={(e) => handleChange("username", e.target.value)}
            error={!!errors.username} helperText={errors.username}
            disabled={loading} sx={roundedField}
          />

          <Typography fontWeight={600} sx={{ mb: 1 }}>NIM</Typography>
          <TextField
            fullWidth placeholder="Masukkan NIM"
            value={form.nim} onChange={(e) => handleChange("nim", e.target.value)}
            error={!!errors.nim} helperText={errors.nim}
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

          <Typography fontWeight={600} sx={{ mb: 1 }}>Tahun Masuk</Typography>
          <TextField
            fullWidth placeholder="Contoh: 2023"
            value={form.tahun_masuk} onChange={(e) => handleChange("tahun_masuk", e.target.value)}
            error={!!errors.tahun_masuk} helperText={errors.tahun_masuk}
            disabled={loading} sx={roundedField}
          />

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

          <Typography fontWeight={600} sx={{ mb: 1 }}>Upload Foto KTM</Typography>
          <Button
            component="label" fullWidth variant="outlined" disabled={loading}
            sx={{
              mb: 1, py: 1.2, borderRadius: "15px",
              textTransform: "none", fontWeight: 600,
              borderColor: errors.foto_ktm ? "#d32f2f" : undefined,
              color: errors.foto_ktm ? "#d32f2f" : undefined,
            }}
          >
            {form.foto_ktm ? form.foto_ktm.name : "Pilih File KTM"}
            <input type="file" hidden accept="image/jpeg,image/jpg,image/png,application/pdf" onChange={handleFileChange} />
          </Button>

          {errors.foto_ktm && (
            <Typography sx={{ color: "#d32f2f", fontSize: 12, mb: 1, ml: 1.5 }}>{errors.foto_ktm}</Typography>
          )}

          {imagePreview && (
            <Box sx={{ mb: 2, mt: 1, border: "1px solid #ddd", borderRadius: "15px", p: 1.5, textAlign: "center" }}>
              <Typography sx={{ fontSize: 12, color: "#666", mb: 1 }}>Preview:</Typography>
              <img src={imagePreview} alt="Preview KTM" style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain", borderRadius: 10 }} />
            </Box>
          )}

          {form.foto_ktm && form.foto_ktm.type === "application/pdf" && (
            <Typography sx={{ fontSize: 12, color: "#666", mb: 2, ml: 1.5 }}>File PDF terpilih: {form.foto_ktm.name}</Typography>
          )}

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