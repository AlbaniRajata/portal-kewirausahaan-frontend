import { useState, useEffect, useCallback } from "react";
import { Box, Paper, Typography, Tabs, Tab, TextField, MenuItem } from "@mui/material";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import DistribusiOtomatisTab from "../../components/admin/DistribusiOtomatisTab";
import DistribusiManualTab from "../../components/admin/DistribusiManualTab";
import HistoryDistribusiTable from "../../components/admin/HistoryDistribusiTable";
import { getAllProgram } from "../../api/public";
import Swal from "sweetalert2";

const tahapOptions = [
  { value: 1, label: "Tahap 1 - Desk Evaluasi" },
  { value: 2, label: "Tahap 2 - Wawancara" },
];

const tabLabels = {
  1: ["Distribusi Otomatis", "Distribusi Manual", "History Distribusi"],
  2: ["Distribusi Otomatis Panel", "Distribusi Manual Panel", "History Distribusi"],
};

export default function DistribusiPenilaiPage() {
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedTahap, setSelectedTahap] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [programOptions, setProgramOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllProgram();
      setProgramOptions(res.data || []);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat daftar program", confirmButtonColor: "#0D59F2" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  useEffect(() => { setActiveTab(0); }, [selectedTahap]);

  const handleDistribusiSuccess = (message) => {
    setRefreshHistory((prev) => prev + 1);
    Swal.fire({ icon: "success", title: "Berhasil", text: message || "Distribusi berhasil!", timer: 2000, timerProgressBar: true, showConfirmButton: false });
  };

  const handleDistribusiError = (message) => {
    Swal.fire({ icon: "error", title: "Gagal", text: message || "Terjadi kesalahan", confirmButtonColor: "#0D59F2" });
  };

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Distribusi Penilai</Typography>
          <Typography sx={{ fontSize: 14, color: "#777" }}>Kelola distribusi proposal ke penilai untuk setiap tahap penilaian</Typography>
        </Box>

        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, mb: 2 }}>Filter Program & Tahap</Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              select fullWidth label="Program"
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              disabled={loading}
              sx={{ flex: "1 1 280px" }}
            >
              <MenuItem value="">Pilih Program</MenuItem>
              {programOptions.map((prog) => (
                <MenuItem key={prog.id_program} value={prog.id_program}>{prog.keterangan}</MenuItem>
              ))}
            </TextField>

            <TextField
              select fullWidth label="Tahap Penilaian"
              value={selectedTahap}
              onChange={(e) => setSelectedTahap(e.target.value)}
              sx={{ flex: "1 1 240px" }}
            >
              {tahapOptions.map((tahap) => (
                <MenuItem key={tahap.value} value={tahap.value}>{tahap.label}</MenuItem>
              ))}
            </TextField>
          </Box>
        </Paper>

        {!selectedProgram ? (
          <Paper sx={{ p: 5, textAlign: "center", borderRadius: 3 }}>
            <Typography sx={{ fontSize: 15, color: "#999" }}>Silakan pilih program untuk melanjutkan distribusi</Typography>
          </Paper>
        ) : (
          <Paper sx={{ borderRadius: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
            >
              {tabLabels[selectedTahap].map((label, i) => (
                <Tab key={i} label={label} sx={{ textTransform: "none", fontWeight: 600, fontSize: 13 }} />
              ))}
            </Tabs>

            <Box sx={{ p: 3 }}>
              {activeTab === 0 && (
                <DistribusiOtomatisTab
                  id_program={selectedProgram}
                  tahap={selectedTahap}
                  onSuccess={handleDistribusiSuccess}
                  onError={handleDistribusiError}
                />
              )}
              {activeTab === 1 && (
                <DistribusiManualTab
                  id_program={selectedProgram}
                  tahap={selectedTahap}
                  onSuccess={handleDistribusiSuccess}
                  onError={handleDistribusiError}
                />
              )}
              {activeTab === 2 && (
                <HistoryDistribusiTable
                  id_program={selectedProgram}
                  tahap={selectedTahap}
                  refresh={refreshHistory}
                  onError={handleDistribusiError}
                  onSuccess={handleDistribusiSuccess}
                />
              )}
            </Box>
          </Paper>
        )}
      </PageTransition>
    </BodyLayout>
  );
}