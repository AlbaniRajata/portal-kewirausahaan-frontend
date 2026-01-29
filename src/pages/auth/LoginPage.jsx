import { Box, Typography, TextField, Button } from "@mui/material";

const LoginPage = () => {
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box sx={{ width: 350 }}>
        <Typography variant="h5" mb={3}>
          Login Sistem Penilaian
        </Typography>

        <TextField fullWidth label="Email" margin="normal" />

        <TextField
          fullWidth
          label="Password"
          type="password"
          margin="normal"
        />

        <Button fullWidth variant="contained" sx={{ mt: 2 }}>
          Login
        </Button>
      </Box>
    </Box>
  );
};

export default LoginPage;
