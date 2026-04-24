import { Box } from "@mui/material";
import { useState } from "react";
import Navbar from "./Navbar";

export default function BodyLayout({ children, Sidebar, hideSidebar = false }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const isNavbarOnlyLayout = Boolean(Sidebar?.hideInBodyLayout);
  const hasCustomTopNavbar = Boolean(Sidebar?.renderAsNavbar);
  const shouldHideSidebar = hideSidebar || !Sidebar || isNavbarOnlyLayout;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {!shouldHideSidebar && Sidebar && <Sidebar collapsed={sidebarCollapsed} />}
      
      <Box 
        sx={{ 
          flex: 1, 
          marginLeft: shouldHideSidebar ? 0 : (sidebarCollapsed ? "70px" : "250px"),
          transition: "margin-left 0.3s ease",
          width: "100%",
        }}
      >
        {hasCustomTopNavbar ? (
          <Sidebar />
        ) : (
          <Navbar
            onToggleSidebar={toggleSidebar}
            sidebarCollapsed={sidebarCollapsed}
            hasSidebar={!shouldHideSidebar}
          />
        )}
        
        <Box
          sx={{
            marginTop: hasCustomTopNavbar ? { xs: "98px", sm: "102px" } : { xs: "60px", sm: "64px" },
            p: { xs: 2, sm: 3, md: 4 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}