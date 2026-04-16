import { useState, useEffect, useRef } from "react";
import {
  Box, Divider, Paper, TextField, Typography,
  Autocomplete, CircularProgress, IconButton, InputAdornment,
  Dialog, DialogContent,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import loginBg from "../../assets/images/login-bg.jpg";
import { registerDosen, verifyEmailKode, resendVerificationKode, cancelRegistrasi } from "../../api/auth";
import api from "../../api/axios";
import { getErrorMessage } from "../../utils/getErrorMessage";

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

  const [openVerifikasi, setOpenVerifikasi] = useState(false);
  const [verifikasiData, setVerifikasiData] = useState({ id_user: null, email: "" });
  const [kode, setKode] = useState(["", "", "", "", "", ""]);
  const [verifyError, setVerifyError] = useState("");
  const [loadingVerifikasi, setLoadingVerifikasi] = useState(false);
  const [resendEmailError, setResendEmailError] = useState("");
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

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
          text: "Tidak ada koneksi internet. Periksa jaringan Anda lalu coba lagi.",
        });
      } finally {
        setLoadingProdi(false);
      }
    };
    fetchProdi();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

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
        setVerifikasiData({
          id_user: response.data.user.id_user,
          email: response.data.user.email,
        });
        setKode(["", "", "", "", "", ""]);
        setVerifyError("");
        setCountdown(60);
        setOpenVerifikasi(true);
        setTimeout(() => inputRefs.current[0]?.focus(), 300);
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err, "Registrasi gagal. Silahkan coba lagi.");
      await Swal.fire({
        icon: "error", title: "Registrasi Gagal",
        text: errorMessage, confirmButtonText: "OK",
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

  const handleKodeChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    setVerifyError("");
    const updated = [...kode];
    updated[index] = value;
    setKode(updated);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKodeKeyDown = (index, e) => {
    if (e.key === "Backspace" && !kode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") handleVerifikasi();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    setVerifyError("");
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const updated = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) updated[i] = pasted[i];
    setKode(updated);
    const nextEmpty = pasted.length < 6 ? pasted.length : 5;
    inputRefs.current[nextEmpty]?.focus();
  };

  const handleVerifikasi = async () => {
    const kodeStr = kode.join("");
    if (kodeStr.length !== 6) {
      setVerifyError("Masukkan 6 digit kode verifikasi.");
      return;
    }

    setVerifyError("");
    setLoadingVerifikasi(true);
    try {
      await verifyEmailKode({ id_user: verifikasiData.id_user, kode: kodeStr });
      setOpenVerifikasi(false);
      await Swal.fire({
        icon: "success",
        title: "Email Terverifikasi",
        text: "Email Anda berhasil diverifikasi. Akun dosen Anda sudah aktif dan dapat langsung login.",
        confirmButtonText: "Menuju Login",
        confirmButtonFontWeight: "500",
        allowOutsideClick: false,
      });
      navigate("/login");
    } catch (err) {
      const message = err.response?.data?.message || "Kode tidak valid atau sudah kadaluarsa.";
      setVerifyError(message);
    } finally {
      setLoadingVerifikasi(false);
    }
  };

  const handleTulisUlangEmail = async () => {
    setLoadingVerifikasi(true);
    try {
      await cancelRegistrasi({ id_user: verifikasiData.id_user });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Gagal Membatalkan Registrasi",
        text: getErrorMessage(err, "Terjadi kesalahan. Silahkan coba lagi."),
      });
    } finally {
      setLoadingVerifikasi(false);
      setOpenVerifikasi(false);
      setKode(["", "", "", "", "", ""]);
      setVerifikasiData({ id_user: null, email: "" });
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    setResending(true);
    setResendEmailError("");
    try {
      const targetEmail = verifikasiData.email;
      if (!targetEmail || !targetEmail.includes("@")) {
        setResendEmailError("Email verifikasi tidak valid");
        return;
      }

      await resendVerificationKode(targetEmail);

      setCountdown(60);
      setKode(["", "", "", "", "", ""]);
      setResendEmailError("");
      setTimeout(() => inputRefs.current[0]?.focus(), 200);
    } catch (err) {
      const message = getErrorMessage(err, "Gagal mengirim ulang kode.");
      const cooldownMatch = message.match(/(\d+)\s*detik/i);
      if (cooldownMatch) {
        setCountdown(Number(cooldownMatch[1]));
        setResendEmailError("");
      } else {
        setResendEmailError(message);
      }
    } finally {
      setResending(false);
    }
  };

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

      <Dialog
        open={openVerifikasi}
        onClose={() => {}}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "20px", p: 1 } }}
      >
        <DialogContent sx={{ px: 3, py: 4 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box sx={{
              width: 60, height: 60, borderRadius: "16px",
              background: "linear-gradient(135deg, #0D59F2, #1e40af)",
              display: "flex", alignItems: "center", justifyContent: "center",
              mx: "auto", mb: 2, fontSize: 26,
            }}>
              ✉️
            </Box>
            <Typography sx={{ fontFamily: poppins, fontSize: 20, fontWeight: 800, color: "#0a0a0a", mb: 1 }}>
              Verifikasi Email
            </Typography>
            <Typography sx={{ fontFamily: poppins, fontSize: 13, color: "#888", lineHeight: 1.7 }}>
              Kode verifikasi telah dikirim ke
            </Typography>
            <Typography sx={{ fontFamily: poppins, fontSize: 13, fontWeight: 700, color: "#0D59F2" }}>
              {verifikasiData.email}
            </Typography>
            <Typography sx={{ fontFamily: poppins, fontSize: 12, color: "#aaa", mt: 0.5 }}>
              Kode berlaku selama 15 menit
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1, justifyContent: "center", mb: 3 }}>
            {kode.map((digit, index) => (
              <TextField
                key={index}
                inputRef={(el) => (inputRefs.current[index] = el)}
                value={digit}
                onChange={(e) => handleKodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKodeKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={loadingVerifikasi}
                inputProps={{
                  maxLength: 1,
                  style: {
                    textAlign: "center", fontSize: 22,
                    fontWeight: 700, fontFamily: poppins, padding: "10px 0",
                  },
                }}
                sx={{
                  width: 46,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    backgroundColor: digit ? "#f0f4ff" : "#fafafa",
                    "& fieldset": {
                      borderColor: digit ? "#0D59F2" : "#e0e0e0",
                      borderWidth: digit ? 2 : 1,
                    },
                    "&:hover fieldset": { borderColor: "#0D59F2" },
                    "&.Mui-focused fieldset": { borderColor: "#0D59F2", borderWidth: 2 },
                  },
                }}
              />
            ))}
          </Box>

          {!!verifyError && (
            <Typography sx={{ fontFamily: poppins, fontSize: 12, color: "#e53935", textAlign: "center", mb: 2 }}>
              {verifyError}
            </Typography>
          )}

          <Box
            component="button"
            onClick={handleVerifikasi}
            disabled={loadingVerifikasi}
            sx={{
              width: "100%", py: 1.5, borderRadius: "14px",
              fontWeight: 700, fontSize: 15, border: "none", fontFamily: poppins,
              backgroundColor: loadingVerifikasi ? "#93b8fa" : "#0D59F2",
              color: "#fff", cursor: loadingVerifikasi ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
              transition: "all 0.25s ease", mb: 2,
              "&:hover": !loadingVerifikasi ? {
                backgroundColor: "#0846c7",
                transform: "translateY(-1px)",
                boxShadow: "0 6px 20px rgba(13,89,242,0.3)",
              } : {},
            }}
          >
            {loadingVerifikasi ? (
              <><CircularProgress size={16} sx={{ color: "#fff" }} />Memverifikasi...</>
            ) : "Verifikasi"}
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Box
              component="button"
              onClick={handleResend}
              disabled={countdown > 0 || loadingVerifikasi || resending}
              sx={{
                background: "transparent", border: "none",
                fontFamily: poppins, fontSize: 13, fontWeight: 600,
                color: countdown > 0 || loadingVerifikasi || resending ? "#bbb" : "#0D59F2",
                cursor: countdown > 0 || loadingVerifikasi || resending ? "not-allowed" : "pointer",
                transition: "color 0.2s",
                "&:hover": countdown === 0 && !loadingVerifikasi && !resending ? { color: "#0846c7" } : {},
              }}
            >
              {resending ? "Mengirim ulang..." : `Kirim ulang kode${countdown > 0 ? ` dalam ${countdown} detik` : ""}`}
            </Box>

            {!!resendEmailError && (
              <Typography sx={{ fontFamily: poppins, fontSize: 12, color: "#e53935", textAlign: "center" }}>
                {resendEmailError}
              </Typography>
            )}

            <Box
              component="button"
              onClick={handleTulisUlangEmail}
              disabled={loadingVerifikasi}
              sx={{
                background: "transparent", border: "none",
                fontFamily: poppins, fontSize: 13, fontWeight: 600,
                color: loadingVerifikasi ? "#bbb" : "#e53935",
                cursor: loadingVerifikasi ? "not-allowed" : "pointer",
                transition: "color 0.2s",
                "&:hover": !loadingVerifikasi ? { color: "#c62828" } : {},
              }}
            >
              Salah email? Batalkan registrasi & isi ulang email
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}