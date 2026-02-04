import { Box, Button, Typography, Container } from "@mui/material";

export default function ServerErrorPage() {
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
          500
        </Typography>

        <Typography variant="h6" color="text.secondary">
          Server sedang bermasalah
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={() => window.location.reload()}
          sx={{ mt: 2, borderRadius: 2 }}
        >
          Refresh Halaman
        </Button>
      </Box>
    </Container>
  );
}
