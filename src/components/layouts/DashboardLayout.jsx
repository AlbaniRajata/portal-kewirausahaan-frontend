import { Box } from "@mui/material";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout({ children }) {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <Sidebar />
      
      <Box sx={{ flex: 1, marginLeft: "250px" }}>
        <Navbar />
        
        <Box
          sx={{
            marginTop: "70px",
            p: 4,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}