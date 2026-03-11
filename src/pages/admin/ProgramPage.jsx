import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, CircularProgress, Tabs, Tab, Paper,
} from "@mui/material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import TimelineProgramTab from "../../components/admin/TimelineProgramTab";
import TahapPenilaianTab from "../../components/admin/TahapPenilaianTab";
import KriteriaPenilaianTab from "../../components/admin/KriteriaPenilaianTab";
import KategoriTab from "../../components/admin/KategoriTab";
import { getMyProgram } from "../../api/admin";

export default function ProgramPage() {
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const fetchProgram = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyProgram();
      setProgram(res.data);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data program", confirmButtonColor: "#0D59F2" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProgram(); }, [fetchProgram]);

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
        <Box sx={{ textAlign: "center", py: 10 }}>
          <Typography sx={{ fontSize: 16, color: "#888" }}>Program tidak ditemukan</Typography>
        </Box>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Kelola Program</Typography>
            <Typography sx={{ fontSize: 14, color: "#777" }}>
              Atur timeline pendaftaran program, tahap dan kriteria penilaian
            </Typography>
          </Box>

          <Paper sx={{ borderRadius: "16px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
            <Box sx={{ borderBottom: "1px solid #f0f0f0" }}>
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                sx={{
                  px: 2,
                  "& .MuiTab-root": {
                    textTransform: "none", fontSize: 14, fontWeight: 500,
                    color: "#888", minHeight: 52,
                    "&.Mui-selected": { fontWeight: 700, color: "#0D59F2" },
                  },
                  "& .MuiTabs-indicator": {
                    backgroundColor: "#0D59F2", height: 3, borderRadius: "3px 3px 0 0",
                  },
                }}
              >
                <Tab label="Timeline Pendaftaran" />
                <Tab label="Tahap Penilaian" />
                <Tab label="Kriteria Penilaian" />
                <Tab label="Kategori" />
              </Tabs>
            </Box>

            <Box sx={{ p: 4 }}>
              {activeTab === 0 && <TimelineProgramTab program={program} onUpdate={fetchProgram} />}
              {activeTab === 1 && <TahapPenilaianTab id_program={program.id_program} />}
              {activeTab === 2 && <KriteriaPenilaianTab id_program={program.id_program} />}
              {activeTab === 3 && <KategoriTab />}
            </Box>
          </Paper>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}