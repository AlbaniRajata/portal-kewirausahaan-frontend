import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const roleHomeMap = {
  admin: "/admin/verifikasi",
  "super admin": "/admin/verifikasi",
  mahasiswa: "/mahasiswa/biodata",
  dosen: "/dosen/biodata",
  reviewer: "/reviewer/penugasan",
  juri: "/juri/penugasan",
};

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const homePath = roleHomeMap[user?.role] || "/login";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 2,
        textAlign: "center",
        px: 3,
      }}
    >
      <Typography variant="h1" fontWeight="bold" color="error">
        403
      </Typography>
      <Typography variant="h5" fontWeight="medium">
        Akses Ditolak
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Anda tidak memiliki izin untuk mengakses halaman ini.
      </Typography>
      <Button variant="contained" onClick={() => navigate(homePath)}>
        Kembali ke Halaman Saya
      </Button>
    </Box>
  );
}