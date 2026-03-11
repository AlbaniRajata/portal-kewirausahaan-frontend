import { useState, useEffect, useCallback } from "react";
import { Box, Paper, Typography, Tabs, Tab, TextField, MenuItem } from "@mui/material";
import { TuneOutlined } from "@mui/icons-material";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import DistribusiOtomatisTab from "../../components/admin/DistribusiOtomatisTab";
import DistribusiManualTab from "../../components/admin/DistribusiManualTab";
import HistoryDistribusiTable from "../../components/admin/HistoryDistribusiTable";
import { getAllProgram } from "../../api/public";
import Swal from "sweetalert2";

const roundedField = { "& .MuiOutlinedInput-root": { borderRadius: "15px" } };

const tahapOptions = [
  { value: 1, label: "Tahap 1 — Desk Evaluasi" },
  { value: 2, label: "Tahap 2 — Wawancara" },
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
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Distribusi Penilai</Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
            Kelola distribusi proposal ke penilai untuk setiap tahap penilaian
          </Typography>

          <Paper sx={{ p: 3, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", mb: 2 }}>
              Filter Program & Tahap
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                select size="small" label="Program"
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
                sx={{ ...roundedField, flex: "1 1 280px" }}
              >
                <MenuItem value="">Pilih Program</MenuItem>
                {programOptions.map((prog) => (
                  <MenuItem key={prog.id_program} value={prog.id_program}>
                    {prog.keterangan}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select size="small" label="Tahap Penilaian"
                value={selectedTahap}
                onChange={(e) => setSelectedTahap(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ ...roundedField, flex: "1 1 240px" }}
              >
                {tahapOptions.map((tahap) => (
                  <MenuItem key={tahap.value} value={tahap.value}>
                    {tahap.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Paper>

          {!selectedProgram ? (
            <Paper sx={{ borderRadius: "16px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
              <Box sx={{ textAlign: "center", py: 10 }}>
                <Box sx={{
                  width: 80, height: 80, borderRadius: "50%",
                  backgroundColor: "#f5f5f5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  mx: "auto", mb: 2,
                }}>
                  <TuneOutlined sx={{ fontSize: 36, color: "#ccc" }} />
                </Box>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}>
                  Pilih Program Terlebih Dahulu
                </Typography>
                <Typography sx={{ fontSize: 14, color: "#999" }}>
                  Pilih program untuk melihat dan mengelola distribusi penilai
                </Typography>
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ borderRadius: "16px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
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
                    "& .MuiTabs-indicator": {
                      backgroundColor: "#0D59F2", height: 3,
                      borderRadius: "3px 3px 0 0",
                    },
                  }}
                >
                  {tabLabels[selectedTahap].map((label, i) => (
                    <Tab key={i} label={label} />
                  ))}
                </Tabs>
              </Box>

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
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}