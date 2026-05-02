import { useState, useEffect, useCallback } from "react";
import { Box, Paper, Typography, Tabs, Tab, useMediaQuery, useTheme } from "@mui/material";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import ProposalPembimbingTab from "../../components/admin/ProposalPembimbingTab";
import DosenPembimbingTab from "../../components/admin/DosenPembimbingTab";
import { getMyProgram } from "../../api/admin";
import Swal from "sweetalert2";

export default function DistribusiPembimbingPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [activeTab, setActiveTab] = useState(0);
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProgram = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyProgram();
      setProgram(res?.data || null);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal memuat data program",
        confirmButtonColor: "#0D59F2",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgram();
  }, [fetchProgram]);

  if (loading) {
    return (
      <BodyLayout Sidebar={AdminSidebar}>
        <Box sx={{ position: "relative", minHeight: "60vh" }}>
          <LoadingScreen message="Menyiapkan distribusi pembimbing..." overlay minHeight="60vh" />
        </Box>
      </BodyLayout>
    );
  }

  if (!program) {
    return (
      <BodyLayout Sidebar={AdminSidebar}>
        <Box sx={{ p: 2, backgroundColor: "#fce4ec", borderRadius: "12px", border: "1px solid #ef9a9a" }}>
          <Typography sx={{ fontSize: 14, color: "#c62828" }}>Program tidak ditemukan</Typography>
        </Box>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
            Distribusi Pembimbing
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
            Kelola pembimbing akademik untuk setiap proposal tim
          </Typography>

          <Paper sx={{ borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", mb: 3 }}>
            <Box sx={{ height: 4, background: "linear-gradient(90deg, #0D59F2, #3B82F6)" }} />
            <Box sx={{ borderBottom: "1px solid #eef2f7", backgroundColor: "#fff" }}>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons={isMobile ? "auto" : false}
                allowScrollButtonsMobile
                sx={{
                  px: { xs: 1, sm: 2 },
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontSize: { xs: 13, sm: 14 },
                    fontWeight: 700,
                    color: "#64748B",
                    minHeight: 56,
                    px: { xs: 2, sm: 3 },
                    "&.Mui-selected": { fontWeight: 800, color: "#0D59F2" },
                  },
                  "& .MuiTabs-indicator": { backgroundColor: "#0D59F2", height: 3, borderRadius: "3px 3px 0 0" },
                }}
              >
                <Tab label="Proposal" />
                <Tab label="Dosen Pembimbing" />
              </Tabs>
            </Box>

            <Box sx={{ p: { xs: 2, sm: 3 }, minWidth: 0 }}>
              {activeTab === 0 && <ProposalPembimbingTab id_program={program.id_program} />}
              {activeTab === 1 && <DosenPembimbingTab id_program={program.id_program} />}
            </Box>
          </Paper>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}
