import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";
import Navbar from "./Navbar";

export default function BodyLayout({ children, Sidebar, hideSidebar = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
      return;
    }

    setSidebarCollapsed((prev) => !prev);
  };

  const isNavbarOnlyLayout = Boolean(Sidebar?.hideInBodyLayout);
  const hasCustomTopNavbar = Boolean(Sidebar?.renderAsNavbar);
  const shouldHideSidebar = hideSidebar || !Sidebar || isNavbarOnlyLayout;
  const sidebarWidth = sidebarCollapsed ? 70 : 250;
  const effectiveMobileOpen = isMobile ? mobileOpen : false;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#f5f5f5", position: "relative" }}>
      {!shouldHideSidebar && Sidebar && (
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={effectiveMobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          isMobile={isMobile}
        />
      )}

      <Box 
        sx={{ 
          flex: 1, 
          marginLeft: shouldHideSidebar || isMobile ? 0 : `${sidebarWidth}px`,
          transition: "margin-left 0.3s ease",
          width: "100%",
          minWidth: 0,
        }}
      >
        {hasCustomTopNavbar ? (
          <Sidebar />
        ) : (
          <Navbar
            onToggleSidebar={toggleSidebar}
            sidebarCollapsed={sidebarCollapsed}
            hasSidebar={!shouldHideSidebar}
            isMobile={isMobile}
          />
        )}
        
        <Box
          sx={{
            marginTop: hasCustomTopNavbar ? { xs: "98px", sm: "102px" } : { xs: "72px", sm: "76px", md: "84px" },
            p: { xs: 1.5, sm: 2.5, md: 4 },
            minWidth: 0,
            width: "100%",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}