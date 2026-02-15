import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from "@mui/material";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import RekapTahap1Tab from "../../components/admin/RekapTahap1Tab";
import RekapTahap2Tab from "../../components/admin/RekapTahap2Tab";
import { getMyProgram } from "../../api/admin";

export default function RekapPenilaianPage() {
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [alert, setAlert] = useState("");

  const fetchProgram = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyProgram();
      if (res.success) {
        setProgram(res.data);
      } else {
        setAlert(res.message);
      }
    } catch (err) {
      console.error("Error fetching programs:", err);
      setAlert("Gagal memuat data program");
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }

  if (!program) {
    return (
      <BodyLayout Sidebar={AdminSidebar}>
        <Alert severity="error">{alert || "Program tidak ditemukan"}</Alert>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
            Rekap Penilaian
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#777" }}>
            Rekap hasil penilaian dan finalisasi proposal —{" "}
            {program.keterangan}
          </Typography>
        </Box>

        {alert && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAlert("")}>
            {alert}
          </Alert>
        )}

        <Paper>
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            sx={{ borderBottom: "1px solid #e0e0e0", px: 2 }}
          >
            <Tab
              label="Tahap 1 — Desk Evaluasi"
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
            <Tab
              label="Tahap 2 — Wawancara"
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <RekapTahap1Tab id_program={program.id_program} />
            )}
            {activeTab === 1 && (
              <RekapTahap2Tab id_program={program.id_program} />
            )}
          </Box>
        </Paper>
      </Box>
    </BodyLayout>
  );
}
