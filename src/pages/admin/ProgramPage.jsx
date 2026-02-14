import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import TimelineProgramTab from "../../components/admin/TimelineProgramTab";
import TahapPenilaianTab from "../../components/admin/TahapPenilaianTab";
import { getMyProgram } from "../../api/admin";

export default function ProgramPage() {
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [alert, setAlert] = useState("");

  const fetchProgram = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getMyProgram();

      if (response.success) {
        setProgram(response.data);
      } else {
        setAlert(response.message);
      }
    } catch (err) {
      console.error("Error fetching program:", err);
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
            Kelola Program
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#777" }}>
            Atur timeline pendaftaran untuk program
          </Typography>
        </Box>

        {alert && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAlert("")}>
            {alert}
          </Alert>
        )}

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            sx={{ borderBottom: "1px solid #e0e0e0", px: 2 }}
          >
            <Tab
              label="Timeline Pendaftaran"
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
            <Tab
              label="Tahap Penilaian"
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <TimelineProgramTab program={program} onUpdate={fetchProgram} />
            )}
            {activeTab === 1 && (
              <TahapPenilaianTab id_program={program.id_program} />
            )}
          </Box>
        </Paper>
      </Box>
    </BodyLayout>
  );
}
