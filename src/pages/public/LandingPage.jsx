import { Box, Button, Container, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 4,
          py: 2,
          borderBottom: "1px solid #ddd",
        }}
      >
        <Typography variant="h6">
          Portal Kewirausahaan Kampus
        </Typography>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button onClick={() => navigate("/login")}>
            Login
          </Button>

          <Button
            variant="contained"
            onClick={() => navigate("/register")}
          >
            Daftar
          </Button>
        </Box>
      </Box>

      <Container sx={{ mt: 5 }}>
        <Typography variant="h4" fontWeight="bold" mb={2}>
          Berita & Informasi Program Wirausaha
        </Typography>

        <Typography variant="body1" color="text.secondary">
          Selamat datang di Portal Kewirausahaan Kampus.  
          Di sini mahasiswa dapat mengikuti seleksi proposal usaha,
          tahap penilaian reviewer, hingga wawancara bersama juri eksternal.
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" mb={2}>
            Berita Terbaru
          </Typography>

          <Box
            sx={{
              p: 3,
              border: "1px solid #ddd",
              borderRadius: 2,
              mb: 2,
            }}
          >
            <Typography fontWeight="bold">
              Pendaftaran Program Wirausaha 2026 Dibuka
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mahasiswa dapat mengajukan proposal usaha mulai 1 Februari 2026.
            </Typography>
          </Box>

          <Box
            sx={{
              p: 3,
              border: "1px solid #ddd",
              borderRadius: 2,
            }}
          >
            <Typography fontWeight="bold">
              Tahap 2: Wawancara Final Bersama Juri Eksternal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Proposal terbaik akan lanjut ke sesi pitching dan wawancara.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;
