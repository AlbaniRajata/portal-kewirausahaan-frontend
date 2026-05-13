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

const COLORS = {
  primary: "#0D59F2",
  primaryLight: "#E0F2FE",
  primaryDark: "#0369A1",
  primaryMuted: "#93C5FD",
  secondary: "#2563EB",
  accent: "#3B82F6",
  slate: "#64748B",
  slateLight: "#F1F5F9",
  success: "#059669",
  successLight: "#ECFDF5",
  warning: "#D97706",
  warningLight: "#FFFBEB",
  error: "#DC2626",
  errorLight: "#ff7070",
};

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
        <PageTransition>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Distribusi Pembimbing
            </Typography>
            <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
              Kelola pembimbing akademik untuk setiap proposal tim
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              borderRadius: "20px",
              border: "1.5px solid #E2E8F0",
              overflow: "hidden",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
              p: { xs: 5, sm: 10 },
              textAlign: "center",
              backgroundColor: "#F8FAFC",
            }}
          >
            <Typography sx={{ fontSize: { xs: 18, sm: 22 }, fontWeight: 800, color: "#1E293B", mb: 1 }}>
              Program tidak ditemukan
            </Typography>
            <Typography sx={{ fontSize: { xs: 14, sm: 16 }, color: COLORS.slate, fontWeight: 500 }}>
              Silakan pastikan Anda adalah admin dari suatu program
            </Typography>
          </Paper>
        </PageTransition>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
            Distribusi Pembimbing
          </Typography>
          <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
            Kelola pembimbing akademik untuk setiap proposal tim
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
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
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
                "& .MuiTabs-indicator": { backgroundColor: COLORS.primary, height: 3, borderRadius: "3px 3px 0 0" },
              }}
            >
              <Tab label="Proposal" />
              <Tab label="Dosen Pembimbing" />
            </Tabs>
          </Box>

          <Box sx={{ p: { xs: 3, md: 4 }, minWidth: 0 }}>
            {activeTab === 0 && <ProposalPembimbingTab id_program={program.id_program} />}
            {activeTab === 1 && <DosenPembimbingTab id_program={program.id_program} />}
          </Box>
        </Paper>
      </PageTransition>
    </BodyLayout>
  );
}
