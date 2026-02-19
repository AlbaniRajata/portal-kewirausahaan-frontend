import { useState } from "react";
import {
  Box, Typography, Paper, Tabs, Tab,
} from "@mui/material";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PengajuanPembimbingTab from "../../components/admin/PengajuanPembimbingTab";
import JadwalBimbinganTab from "../../components/admin/JadwalBimbinganTab";

export default function BimbinganPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <Box>
        <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
          Bimbingan
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
          Kelola pengajuan pembimbing dan jadwal bimbingan mahasiswa
        </Typography>

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              px: 2,
            }}
          >
            <Tab label="Pengajuan Pembimbing" sx={{ textTransform: "none" }} />
            <Tab label="Jadwal Bimbingan" sx={{ textTransform: "none" }} />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && <PengajuanPembimbingTab />}
            {activeTab === 1 && <JadwalBimbinganTab />}
          </Box>
        </Paper>
      </Box>
    </BodyLayout>
  );
}