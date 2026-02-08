import { Box } from "@mui/material";
import Navbar from "./Navbar";

export default function BodyLayout({ children, Sidebar }) {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {Sidebar && <Sidebar />}
      
      <Box sx={{ flex: 1, marginLeft: Sidebar ? "250px" : "0" }}>
        <Navbar />
        
        <Box
          sx={{
            marginTop: "73px",
            p: 4,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}