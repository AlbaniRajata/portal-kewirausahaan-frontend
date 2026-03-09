import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function ServerErrorPage() {
  const navigate = useNavigate();

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
        500
      </Typography>
      <Typography variant="h5" fontWeight="medium">
        Terjadi Kesalahan Server
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Maaf, terjadi kesalahan pada server. Silakan coba beberapa saat lagi.
      </Typography>
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          Muat Ulang
        </Button>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Kembali
        </Button>
      </Box>
    </Box>
  );
}