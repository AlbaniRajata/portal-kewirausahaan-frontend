import { useState } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import loginBg from "../../assets/images/login-bg.jpg";

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
      }}
    >
      {/* LEFT IMAGE */}
      <Box
        sx={{
          flex: 1,
          position: "relative",
          display: { xs: "none", md: "block" },
          backgroundImage: `url(${loginBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(13, 89, 242, 0.65)",
          }}
        />

        {/* Logo + Text Top Left */}
        <Box
          sx={{
            position: "absolute",
            top: 30,
            left: 30,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 55,
              height: 55,
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,0.25)",
            }}
          />

          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 18,
              color: "white",
            }}
          >
            UPA PKK POLINEMA
          </Typography>
        </Box>
      </Box>

      {/* RIGHT FORM */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          px: 2,
          backgroundColor: "#fff",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 540,
            p: 4,
          }}
        >
          <Typography
            align="center"
            sx={{
              fontSize: "26px",
              fontWeight: 700,
              mb: 1,
            }}
          >
            Portal Kewirausahaan PMW & INBIS
          </Typography>

          <Typography
            align="center"
            sx={{
              fontSize: "14px",
              color: "#777",
              mb: 4,
            }}
          >
            Silahkan masuk untuk melanjutkan
          </Typography>

          {/* Email */}
          <Typography fontWeight={600} sx={{ mb: 1 }}>
            Email / Username
          </Typography>

          <TextField
            fullWidth
            placeholder="Masukkan email atau username Anda"
            sx={{
              mb: 2,
              "& fieldset": { borderRadius: 2 },
            }}
          />

          {/* Password */}
          <Typography fontWeight={600} sx={{ mb: 1 }}>
            Password *
          </Typography>

          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            placeholder="Masukkan Password Anda"
            sx={{
              "& fieldset": { borderRadius: 2 },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Forgot */}
          <Box sx={{ textAlign: "right", mt: 1, mb: 3 }}>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: "#0D59F2",
                cursor: "pointer",
              }}
            >
              Lupa Password ?
            </Typography>
          </Box>

          {/* Button Login */}
          <Button
            fullWidth
            variant="contained"
            sx={{
              py: 1.4,
              borderRadius: 2,
              fontWeight: 700,
              textTransform: "none",
              backgroundColor: "#0D59F2",
              "&:hover": {
                backgroundColor: "#0846c7",
              },
            }}
          >
            Masuk
          </Button>

          {/* Divider */}
          <Divider sx={{ my: 3 }}>Atau</Divider>

          {/* Register */}
          <Button
            fullWidth
            variant="outlined"
            sx={{
              py: 1.4,
              borderRadius: 2,
              fontWeight: 700,
              borderColor: "#ccc",
              color: "black",
              textTransform: "none",
            }}
            onClick={() => navigate("/daftar")}
          >
            Daftar
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
