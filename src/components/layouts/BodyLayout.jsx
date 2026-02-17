import { Box } from "@mui/material";
import { useState } from "react";
import Navbar from "./Navbar";

export default function BodyLayout({ children, Sidebar }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {Sidebar && <Sidebar collapsed={sidebarCollapsed} />}
      
      <Box 
        sx={{ 
          flex: 1, 
          marginLeft: Sidebar ? (sidebarCollapsed ? "70px" : "250px") : "0",
          transition: "margin-left 0.3s ease",
        }}
      >
        <Navbar onToggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />
        
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