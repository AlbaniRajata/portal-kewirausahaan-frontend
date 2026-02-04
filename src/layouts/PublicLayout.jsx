import { Container, Box, Typography } from "@mui/material";
import NavbarPublic from "../components/public/NavbarPublic";

export default function PublicLayout({ children }) {
  return (
    <>
      <NavbarPublic />

      <Container maxWidth="lg">{children}</Container>

      {/* Footer */}
      <Box
        sx={{
          mt: 8,
          py: 4,
          textAlign: "center",
          bgcolor: "#0d2b3e",
          color: "white",
        }}
      >
        <Typography variant="body2">
          © UPA PKK Politeknik Negeri Malang
        </Typography>
      </Box>
    </>
  );
}
