import { useMemo, useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";

import { resetPasswordConfirm } from "../../api/auth";
import { getErrorMessage } from "../../utils/getErrorMessage";

const roundedField = {
  mb: 2,
  "& .MuiOutlinedInput-root": { borderRadius: "15px" },
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const poppins = "'Poppins', sans-serif";

  const validate = () => {
    const nextErrors = {};

    if (!token) {
      nextErrors.token = "Token reset password tidak ditemukan";
    }

    if (!newPassword) {
      nextErrors.newPassword = "Password baru wajib diisi";
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = "Password minimal 8 karakter";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Konfirmasi password wajib diisi";
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Konfirmasi password tidak sama";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await resetPasswordConfirm({
        token,
        new_password: newPassword,
      });

      await Swal.fire({
        icon: "success",
        title: "Password berhasil diubah",
        text: res?.message || "Silahkan login dengan password baru Anda.",
        confirmButtonColor: "#0D59F2",
      });

      navigate("/login");
    } catch (err) {
      const message = getErrorMessage(err, "Gagal mengubah password.");
      await Swal.fire({
        icon: "error",
        title: "Reset Password Gagal",
        text: message,
        confirmButtonColor: "#0D59F2",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        backgroundColor: "#f7f9ff",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 500,
          p: { xs: 3, md: 4 },
          borderRadius: "20px",
          border: "1px solid rgba(13, 89, 242, 0.10)",
          boxShadow: "0 28px 90px rgba(15, 23, 42, 0.18)",
          background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
          bgcolor: "#fff",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Typography align="center" sx={{ fontFamily: poppins, fontSize: 26, fontWeight: 800, mb: 1, color: "#0a0a0a" }}>
          Reset Password
        </Typography>
        <Typography align="center" sx={{ fontFamily: poppins, fontSize: 14, color: "#888", mb: 3 }}>
          Buat password baru untuk akun Anda
        </Typography>

        {errors.token && (
          <Typography sx={{ fontFamily: poppins, color: "error.main", fontSize: 13, mb: 2, textAlign: "center" }}>
            {errors.token}
          </Typography>
        )}

        <Typography fontWeight={600} sx={{ fontFamily: poppins, mb: 1, fontSize: 14 }}>
          Password Baru
        </Typography>
        <TextField
          fullWidth
          type={showNewPassword ? "text" : "password"}
          placeholder="Masukkan password baru"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setErrors((prev) => ({ ...prev, newPassword: "" }));
          }}
          error={!!errors.newPassword}
          helperText={errors.newPassword}
          disabled={loading}
          sx={roundedField}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowNewPassword((prev) => !prev)} disabled={loading} edge="end">
                  {showNewPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Typography fontWeight={600} sx={{ fontFamily: poppins, mb: 1, fontSize: 14 }}>
          Konfirmasi Password
        </Typography>
        <TextField
          fullWidth
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Ulangi password baru"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setErrors((prev) => ({ ...prev, confirmPassword: "" }));
          }}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
          disabled={loading}
          sx={{ ...roundedField, mb: 3 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowConfirmPassword((prev) => !prev)} disabled={loading} edge="end">
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box
          component="button"
          onClick={handleSubmit}
          disabled={loading || !token}
          sx={{
            width: "100%",
            py: 1.6,
            borderRadius: "15px",
            fontWeight: 700,
            fontSize: 15,
            border: "none",
            fontFamily: poppins,
            backgroundColor: loading || !token ? "#93b8fa" : "#0D59F2",
            color: "#fff",
            cursor: loading || !token ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Memproses..." : "Simpan Password Baru"}
        </Box>

        <Box
          component="button"
          onClick={() => navigate("/login")}
          disabled={loading}
          sx={{
            mt: 2,
            width: "100%",
            py: 1.2,
            background: "transparent",
            border: "none",
            fontWeight: 600,
            fontSize: 14,
            color: "#666",
            fontFamily: poppins,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Kembali ke Login
        </Box>
      </Paper>
    </Box>
  );
}
