import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Paper, Tabs, Tab } from "@mui/material";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import RekapTahap1Tab from "../../components/admin/RekapTahap1Tab";
import RekapTahap2Tab from "../../components/admin/RekapTahap2Tab";
import HistoryPenilaianTab from "../../components/admin/HistoryPenilaianTab";
import { getMyProgram, getTahapProgram } from "../../api/admin";
import Swal from "sweetalert2";

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

export default function RekapPenilaianPage() {
  const [loading, setLoading]       = useState(true);
  const [program, setProgram]       = useState(null);
  const [tahapList, setTahapList]   = useState([]);
  const [activeTab, setActiveTab]   = useState(0);

  const fetchProgram = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyProgram();
      const myProgram = res.data;
      setProgram(myProgram || null);
      if (myProgram?.id_program) {
        const tahapRes = await getTahapProgram(myProgram.id_program);
        setTahapList(tahapRes.data || []);
      } else {
        setTahapList([]);
      }
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data program", confirmButtonColor: COLORS.primary });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProgram(); }, [fetchProgram]);

  const tahap1 = tahapList.find((t) => Number(t.urutan) === 1);
  const tahap2 = tahapList.find((t) => Number(t.urutan) === 2);

  if (loading) {
    return (
      <BodyLayout Sidebar={AdminSidebar}>
        <Box sx={{ position: "relative", minHeight: "60vh" }}>
          <LoadingScreen message="Memuat data..." overlay minHeight="60vh" />
        </Box>
      </BodyLayout>
    );
  }

  if (!program) {
    return (
      <BodyLayout Sidebar={AdminSidebar}>
        <Box sx={{ p: 2.5, borderRadius: "12px", backgroundColor: "#FEF2F2", border: `1.5px solid ${COLORS.error}30` }}>
          <Typography sx={{ fontSize: 14, color: COLORS.error, fontWeight: 600 }}>Program tidak ditemukan</Typography>
        </Box>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box sx={{ px: 1, py: 1 }}>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: { xs: 26, sm: 32, md: 36 }, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Rekap Penilaian
            </Typography>
            <Typography sx={{ fontSize: { xs: 14, sm: 16 }, color: "#6B7280" }}>
              Rekap hasil penilaian dan finalisasi proposal
            </Typography>
          </Box>

          <Paper sx={{
            borderRadius: "20px",
            border: "1.5px solid #E5E7EB",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}>
            <Box sx={{ height: 4, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />

            {!tahap1 && !tahap2 && (
              <Box sx={{
                px: { xs: 2.5, sm: 4 }, py: 2,
                backgroundColor: COLORS.warningLight,
                borderBottom: `1.5px solid ${COLORS.warning}30`,
              }}>
                <Typography sx={{ fontSize: 13, color: COLORS.warning, fontWeight: 600 }}>
                  Tahap penilaian belum diatur. Silahkan atur tahap di menu Program terlebih dahulu.
                </Typography>
              </Box>
            )}

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
                <Tab label="Rekap Penilaian" />
                <Tab label="History Penilaian" />
              </Tabs>
            </Box>

            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              {activeTab === 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {tahap1 && (
                    <Box sx={{ mb: 6 }}>
                      <Box sx={{ mb: 3, pb: 2, borderBottom: `1.5px solid ${COLORS.slateLight}` }}>
                        <Typography sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 800, color: "#1E293B" }}>
                          Rekap {tahap1.nama_tahap || "Desk Evaluasi"}
                        </Typography>
                      </Box>
                      <RekapTahap1Tab id_program={program.id_program} />
                    </Box>
                  )}

                  {tahap2 && (
                    <Box sx={{ mb: 6 }}>
                      <Box sx={{ mb: 3, pb: 2, borderBottom: `1.5px solid ${COLORS.slateLight}` }}>
                        <Typography sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 800, color: "#1E293B" }}>
                          Rekap {tahap2.nama_tahap || "Wawancara"}
                        </Typography>
                      </Box>
                      <RekapTahap2Tab id_program={program.id_program} />
                    </Box>
                  )}

                  {!tahap1 && !tahap2 && (
                    <Box sx={{ textAlign: "center", py: 10 }}>
                      <Typography sx={{ fontSize: 16, color: COLORS.slate, fontWeight: 500 }}>
                        Belum ada tahap penilaian yang diatur
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {activeTab === 1 && (
                <HistoryPenilaianTab id_program={program.id_program} />
              )}
            </Box>
          </Paper>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}