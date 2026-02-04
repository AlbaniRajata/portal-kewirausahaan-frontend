import { Box, Button, Typography, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          gap: 2,
        }}
      >
        <Typography variant="h3" fontWeight={700}>
          404
        </Typography>

        <Typography variant="h6" color="text.secondary">
          Halaman tidak ditemukan
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={() => navigate("/")}
          sx={{ mt: 2, borderRadius: 2 }}
        >
          Kembali ke Landing Page
        </Button>
      </Box>
    </Container>
  );
}
