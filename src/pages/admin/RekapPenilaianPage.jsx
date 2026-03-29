import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Paper, Tabs, Tab, CircularProgress } from "@mui/material";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import RekapTahap1Tab from "../../components/admin/RekapTahap1Tab";
import RekapTahap2Tab from "../../components/admin/RekapTahap2Tab";
import HistoryPenilaianTab from "../../components/admin/HistoryPenilaianTab";
import { getMyProgram, getTahapProgram } from "../../api/admin";
import Swal from "sweetalert2";

export default function RekapPenilaianPage() {
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [tahapList, setTahapList] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

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
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data program", confirmButtonColor: "#0D59F2" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProgram(); }, [fetchProgram]);

  const tahap1 = tahapList.find((t) => Number(t.urutan) === 1);
  const tahap2 = tahapList.find((t) => Number(t.urutan) === 2);

  const tabItems = [];
  if (tahap1) tabItems.push({ key: "tahap1", label: `Tahap 1 — ${tahap1.nama_tahap || "Desk Evaluasi"}` });
  if (tahap2) tabItems.push({ key: "tahap2", label: `Tahap 2 — ${tahap2.nama_tahap || "Wawancara"}` });
  tabItems.push({ key: "history", label: "History Penilaian" });

  useEffect(() => {
    if (activeTab > tabItems.length - 1) setActiveTab(0);
  }, [activeTab, tabItems.length]);

  if (loading) {
    return (
      <BodyLayout Sidebar={AdminSidebar}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress />
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
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Rekap Penilaian</Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
            Rekap hasil penilaian dan finalisasi proposal — {program.keterangan}
          </Typography>

          <Paper sx={{ borderRadius: "16px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
            {tabItems.length === 1 && (
              <Box sx={{ p: 2, backgroundColor: "#fff8e1", borderBottom: "1px solid #f0f0f0" }}>
                <Typography sx={{ fontSize: 13, color: "#8a6d3b" }}>
                  Tahap penilaian belum diatur. Silakan atur tahap di menu Program terlebih dahulu.
                </Typography>
              </Box>
            )}
            <Box sx={{ borderBottom: "1px solid #f0f0f0" }}>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{
                  px: 2,
                  "& .MuiTab-root": {
                    textTransform: "none", fontSize: 14, fontWeight: 500,
                    color: "#888", minHeight: 52,
                    "&.Mui-selected": { fontWeight: 700, color: "#0D59F2" },
                  },
                  "& .MuiTabs-indicator": { backgroundColor: "#0D59F2", height: 3, borderRadius: "3px 3px 0 0" },
                }}
              >
                {tabItems.map((item) => (
                  <Tab key={item.key} label={item.label} />
                ))}
              </Tabs>
            </Box>

            <Box sx={{ p: 3 }}>
              {tabItems[activeTab]?.key === "tahap1" && <RekapTahap1Tab id_program={program.id_program} />}
              {tabItems[activeTab]?.key === "tahap2" && <RekapTahap2Tab id_program={program.id_program} />}
              {tabItems[activeTab]?.key === "history" && <HistoryPenilaianTab id_program={program.id_program} />}
            </Box>
          </Paper>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}