import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  TextField,
  MenuItem,
} from "@mui/material";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import DistribusiOtomatisTab from "../../components/admin/DistribusiOtomatisTab";
import DistribusiManualTab from "../../components/admin/DistribusiManualTab";
import HistoryDistribusiTable from "../../components/admin/HistoryDistribusiTable";
import { getAllProgram } from "../../api/public";

export default function DistribusiPenilaiPage() {
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedTahap, setSelectedTahap] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [refreshHistory, setRefreshHistory] = useState(0);

  const [programOptions, setProgramOptions] = useState([]);

  const tahapOptions = [
    { value: 1, label: "Tahap 1 - Desk Evaluasi" },
    { value: 2, label: "Tahap 2 - Wawancara" },
  ];

  const tabLabels = {
    1: ["Distribusi Otomatis", "Distribusi Manual", "History Distribusi"],
    2: ["Distribusi Otomatis Panel", "Distribusi Manual Panel", "History Distribusi"],
  };

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const response = await getAllProgram();
        if (response.success) {
          setProgramOptions(response.data);
        }
      } catch (err) {
        console.error("Error fetching programs:", err);
        setAlert({
          show: true,
          type: "error",
          message: "Gagal memuat daftar program",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  useEffect(() => {
    setActiveTab(0);
  }, [selectedTahap]);

  const handleDistribusiSuccess = (message) => {
    setAlert({
      show: true,
      type: "success",
      message: message || "Distribusi berhasil!",
    });

    setRefreshHistory((prev) => prev + 1);

    setTimeout(() => {
      setAlert({ show: false, type: "", message: "" });
    }, 5000);
  };

  const handleDistribusiError = (message) => {
    setAlert({
      show: true,
      type: "error",
      message: message || "Terjadi kesalahan",
    });

    setTimeout(() => {
      setAlert({ show: false, type: "", message: "" });
    }, 5000);
  };

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
            Distribusi Penilai
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#777" }}>
            Kelola distribusi proposal ke penilai untuk setiap tahap penilaian
          </Typography>
        </Box>

        {alert.show && (
          <Alert
            severity={alert.type}
            sx={{ mb: 3 }}
            onClose={() => setAlert({ show: false, type: "", message: "" })}
          >
            {alert.message}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>
            Filter Program & Tahap
          </Typography>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ minWidth: 300, flex: "1 1 auto" }}>
              <TextField
                select
                fullWidth
                label="Program"
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="">Pilih Program</MenuItem>
                {programOptions.map((prog) => (
                  <MenuItem key={prog.id_program} value={prog.id_program}>
                    {prog.keterangan}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ minWidth: 250, flex: "1 1 auto" }}>
              <TextField
                select
                fullWidth
                label="Tahap Penilaian"
                value={selectedTahap}
                onChange={(e) => setSelectedTahap(e.target.value)}
              >
                {tahapOptions.map((tahap) => (
                  <MenuItem key={tahap.value} value={tahap.value}>
                    {tahap.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>
        </Paper>

        {!selectedProgram && (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography sx={{ fontSize: 16, color: "#666" }}>
              Silakan pilih program untuk melanjutkan distribusi
            </Typography>
          </Paper>
        )}

        {selectedProgram && (
          <>
            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                {tabLabels[selectedTahap].map((label, index) => (
                  <Tab
                    key={index}
                    label={label}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  />
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
          </>
        )}
      </Box>
    </BodyLayout>
  );
}