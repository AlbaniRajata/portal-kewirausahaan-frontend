import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Box, Paper, Tabs, Tab, CircularProgress, Alert } from "@mui/material";
import BodyLayout from "../../components/layouts/BodyLayout";
import ReviewerSidebar from "../../components/layouts/ReviewerSidebar";
import DetailPenugasanTab from "../../components/reviewer/DetailPenugasanTab";
import FormPenilaianTab from "../../components/reviewer/FormPenilaianTab";
import { getDetailPenugasan, acceptPenugasan, rejectPenugasan } from "../../api/reviewer";
import Swal from "sweetalert2";

export default function PenugasanDetailPage() {
  const { id_distribusi } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [penugasan, setPenugasan] = useState(null);
  const [alert, setAlert] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(parseInt(tabParam) || 0);

  useEffect(() => {
    const tabValue = parseInt(tabParam) || 0;
    setActiveTab(tabValue);
  }, [tabParam]);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getDetailPenugasan(id_distribusi);

      if (response.success) {
        setPenugasan(response.data);
      } else {
        setAlert(response.message);
      }
    } catch (err) {
      console.error("Error fetching detail:", err);
      setAlert("Gagal memuat detail penugasan");
    } finally {
      setLoading(false);
    }
  }, [id_distribusi]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchParams({ tab: newValue });
  };

  const handleAccept = async () => {
    const result = await Swal.fire({
      title: "Konfirmasi",
      html: `Terima penugasan untuk proposal:<br/><br/><b>${penugasan.proposal.judul}</b>?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0D59F2",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Terima",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);
      const response = await acceptPenugasan(id_distribusi);

      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: response.message,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        fetchDetail();
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: response.message,
          confirmButtonText: "OK",
        });
      }
    } catch (err) {
      console.error("Error accepting:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Terjadi kesalahan saat menerima penugasan",
        confirmButtonText: "OK",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (catatan) => {
    try {
      setSubmitting(true);
      const response = await rejectPenugasan(id_distribusi, catatan);

      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: response.message,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        fetchDetail();
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: response.message,
          confirmButtonText: "OK",
        });
      }
    } catch (err) {
      console.error("Error rejecting:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Terjadi kesalahan saat menolak penugasan",
        confirmButtonText: "OK",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={ReviewerSidebar}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }

  if (alert) {
    return (
      <BodyLayout Sidebar={ReviewerSidebar}>
        <Alert severity="error">{alert}</Alert>
      </BodyLayout>
    );
  }

  if (!penugasan) {
    return (
      <BodyLayout Sidebar={ReviewerSidebar}>
        <Alert severity="error">Data penugasan tidak ditemukan</Alert>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={ReviewerSidebar}>
      <Box>
        <Paper>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                px: 2,
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontSize: 15,
                  fontWeight: 500,
                },
              }}
            >
              <Tab label="Detail Penugasan" />
              <Tab
                label="Form Penilaian"
                disabled={penugasan.status !== 1 && penugasan.status !== 3}
              />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <DetailPenugasanTab
                penugasan={penugasan}
                onAccept={handleAccept}
                onReject={handleReject}
                submitting={submitting}
              />
            )}

            {activeTab === 1 && <FormPenilaianTab id_distribusi={id_distribusi} />}
          </Box>
        </Paper>
      </Box>
    </BodyLayout>
  );
}