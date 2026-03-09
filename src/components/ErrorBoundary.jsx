import { Component } from "react";
import { Box, Typography, Button } from "@mui/material";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
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
            Terjadi Kesalahan
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Maaf, terjadi kesalahan yang tidak terduga. Silakan muat ulang halaman.
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Muat Ulang
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}