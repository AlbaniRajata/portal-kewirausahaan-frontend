import { useState } from "react";
import { Box, Typography, Paper, Tabs, Tab } from "@mui/material";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import PengajuanPembimbingTab from "../../components/admin/PengajuanPembimbingTab";
import JadwalBimbinganTab from "../../components/admin/JadwalBimbinganTab";

export default function BimbinganPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Bimbingan</Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
            Kelola pengajuan pembimbing dan jadwal bimbingan mahasiswa
          </Typography>

          <Paper sx={{ borderRadius: "16px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
            <Box sx={{ borderBottom: "1px solid #f0f0f0" }}>
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                sx={{
                  px: 2,
                  "& .MuiTab-root": { textTransform: "none", fontSize: 14, fontWeight: 500, color: "#888", minHeight: 52, "&.Mui-selected": { fontWeight: 700, color: "#0D59F2" } },
                  "& .MuiTabs-indicator": { backgroundColor: "#0D59F2", height: 3, borderRadius: "3px 3px 0 0" },
                }}
              >
                <Tab label="Pengajuan Pembimbing" />
                <Tab label="Jadwal Bimbingan" />
              </Tabs>
            </Box>
            <Box sx={{ p: 3 }}>
              {activeTab === 0 && <PengajuanPembimbingTab />}
              {activeTab === 1 && <JadwalBimbinganTab />}
            </Box>
          </Paper>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}