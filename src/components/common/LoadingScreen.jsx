import { Box, CircularProgress, Typography } from "@mui/material";

export default function LoadingScreen({ message = "Memuat..." }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
        backgroundColor: "#f9fafb",
      }}
    >
      <CircularProgress size={55} />
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}
