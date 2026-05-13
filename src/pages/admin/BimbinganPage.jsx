import { useState } from "react";
import { Box, Typography, Paper, Tabs, Tab } from "@mui/material";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import PengajuanPembimbingTab from "../../components/admin/PengajuanPembimbingTab";
import JadwalBimbinganTab from "../../components/admin/JadwalBimbinganTab";

const COLORS = {
  primary:      "#0D59F2",
  primaryLight: "#E0F2FE",
  primaryDark:  "#0369A1",
  primaryMuted: "#93C5FD",
  secondary:    "#2563EB",
  accent:       "#3B82F6",
  slate:        "#64748B",
  slateLight:   "#F1F5F9",
  warning:      "#D97706",
  warningLight: "#FFFBEB",
  error:        "#DC2626",
};

export default function BimbinganPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Bimbingan
            </Typography>
            <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
              Kelola pengajuan pembimbing dan jadwal bimbingan mahasiswa
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              borderRadius: "20px",
              border: "1.5px solid #E2E8F0",
              overflow: "hidden",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
              position: "relative",
            }}
          >
            <Box sx={{ height: "6px", background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />

            <Box sx={{ borderBottom: "1px solid #eef2f7", backgroundColor: "#fff" }}>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  px: { xs: 1, sm: 2 },
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontSize: { xs: 13, sm: 14 },
                    fontWeight: 700,
                    color: COLORS.slate,
                    minHeight: 56,
                    px: { xs: 2, sm: 3 },
                    "&.Mui-selected": { fontWeight: 800, color: COLORS.primary },
                  },
                  "& .MuiTabs-indicator": {
                    backgroundColor: COLORS.primary, height: 3, borderRadius: "3px 3px 0 0",
                  },
                }}
              >
                <Tab label="Pengajuan Pembimbing" />
                <Tab label="Jadwal Bimbingan" />
              </Tabs>
            </Box>

            <Box sx={{ p: { xs: 3, md: 4 }, minWidth: 0 }}>
              {activeTab === 0 && <PengajuanPembimbingTab />}
              {activeTab === 1 && <JadwalBimbinganTab />}
            </Box>
          </Paper>
      </PageTransition>
    </BodyLayout>
  );
}