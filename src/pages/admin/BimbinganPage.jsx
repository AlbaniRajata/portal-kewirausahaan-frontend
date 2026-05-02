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
        <Box sx={{ px: 1, py: 1 }}>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: { xs: 26, sm: 32, md: 36 }, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Bimbingan
            </Typography>
            <Typography sx={{ fontSize: { xs: 14, sm: 16 }, color: "#6B7280" }}>
              Kelola pengajuan pembimbing dan jadwal bimbingan mahasiswa
            </Typography>
          </Box>

          <Paper sx={{
            borderRadius: "20px",
            border: "1.5px solid #E5E7EB",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}>
            <Box sx={{ height: 4, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />

            <Box sx={{ borderBottom: "1px solid #F1F5F9", backgroundColor: "#fff" }}>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  px: { xs: 2, sm: 3 },
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontSize: { xs: 13, sm: 14 },
                    fontWeight: 600,
                    color: COLORS.slate,
                    minHeight: 60,
                    transition: "all 0.2s",
                    "&.Mui-selected": { color: COLORS.primary, fontWeight: 700 },
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

            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              {activeTab === 0 && <PengajuanPembimbingTab />}
              {activeTab === 1 && <JadwalBimbinganTab />}
            </Box>
          </Paper>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}