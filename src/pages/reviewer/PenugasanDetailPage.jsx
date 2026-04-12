import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Box, Paper, Tabs, Tab, Button, Divider } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import ReviewerSidebar from "../../components/layouts/ReviewerSidebar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import DetailPenugasanTab from "../../components/reviewer/DetailPenugasanTab";
import FormPenilaianTab from "../../components/reviewer/FormPenilaianTab";
import { getDetailPenugasan, acceptPenugasan, rejectPenugasan } from "../../api/reviewer";

const toNumberOrNull = (value) => {
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const isAcceptedStatus = (status) => [1, 3, 4].includes(Number(status));

const isTahap2BlockedByPairApproval = (item) => {
  const tahap = toNumberOrNull(item?.urutan_tahap ?? item?.tahap);
  if (tahap !== 2) return false;

  const statusReviewer = toNumberOrNull(item?.status_reviewer);
  const statusJuri = toNumberOrNull(item?.status_juri);
  return !(isAcceptedStatus(statusReviewer) && isAcceptedStatus(statusJuri));
};

export default function PenugasanDetailPage() {
  const { id_distribusi } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [penugasan, setPenugasan] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formActions, setFormActions] = useState(null);

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(parseInt(tabParam) || 0);

  useEffect(() => {
    setActiveTab(parseInt(tabParam) || 0);
  }, [tabParam]);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getDetailPenugasan(id_distribusi);
      if (response.success) {
        setPenugasan(response.data);
      } else {
        await Swal.fire({
          icon: "warning", title: "Peringatan",
          text: response.message || "Gagal memuat detail penugasan",
          confirmButtonText: "OK",
        });
        navigate("/reviewer/penugasan");
      }
    } catch {
      await Swal.fire({
        icon: "error", title: "Gagal Memuat",
        text: "Gagal memuat detail penugasan. Silahkan coba lagi.",
        confirmButtonText: "OK",
      });
      navigate("/reviewer/penugasan");
    } finally {
      setLoading(false);
    }
  }, [id_distribusi, navigate]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    setSearchParams({ tab: newValue });
  };

  const handleAccept = async () => {
    const result = await Swal.fire({
      title: "Konfirmasi",
      html: `Terima penugasan untuk proposal:<br/><br/><b>${penugasan.judul}</b>?`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: "#0D59F2", cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Terima", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      setSubmitting(true);
      const response = await acceptPenugasan(id_distribusi);
      if (response.success) {
        Swal.fire({ icon: "success", title: "Berhasil", text: response.message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
        fetchDetail();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message, confirmButtonText: "OK" });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan saat menerima penugasan", confirmButtonText: "OK" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (catatan) => {
    try {
      setSubmitting(true);
      const response = await rejectPenugasan(id_distribusi, catatan);
      if (response.success) {
        Swal.fire({ icon: "success", title: "Berhasil", text: response.message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
        fetchDetail();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message, confirmButtonText: "OK" });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan saat menolak penugasan", confirmButtonText: "OK" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={ReviewerSidebar}>
        <Box sx={{ position: "relative", minHeight: "60vh" }}>
          <LoadingScreen message="Memuat detail penugasan..." overlay minHeight="60vh" />
        </Box>
      </BodyLayout>
    );
  }

  if (!penugasan) return null;

  const blockedByPairApproval = isTahap2BlockedByPairApproval(penugasan);

  return (
    <BodyLayout Sidebar={ReviewerSidebar}>
      <PageTransition>
        <Box>
          <Button
            onClick={() => navigate("/reviewer/penugasan")}
            startIcon={<ArrowBack />}
            sx={{
              borderRadius: "50px",
              textTransform: "none", color: "#777", fontSize: 13,
              fontWeight: 500, p: 0, mb: 2, minWidth: 0,
              "&:hover": { backgroundColor: "transparent", color: "#0D59F2" },
            }}
          >
            Kembali ke Daftar Penugasan
          </Button>

          <Paper sx={{ borderRadius: "16px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
            <Box sx={{ borderBottom: "1px solid #f0f0f0" }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
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
                <Tab label="Detail Penugasan" />
                <Tab
                  label="Form Penilaian"
                  disabled={(penugasan.status !== 1 && penugasan.status !== 3) || blockedByPairApproval}
                />
              </Tabs>
            </Box>

            <Box sx={{ p: 4 }}>
              {activeTab === 0 && (
                <DetailPenugasanTab
                  penugasan={penugasan}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  submitting={submitting}
                />
              )}
              {activeTab === 1 && (
                <FormPenilaianTab id_distribusi={id_distribusi} onActionsChange={setFormActions} />
              )}
            </Box>
          </Paper>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
            {activeTab === 1 && formActions && !formActions.isSubmitted && (
              <>
                <Button
                  variant="contained"
                  onClick={() => navigate("/reviewer/penugasan")}
                  sx={{
                    textTransform: "none", borderRadius: "50px",
                    px: 4, py: 1.2, fontWeight: 600,
                    backgroundColor: "#FDB022", "&:hover": { backgroundColor: "#e09a1a" },
                  }}
                >
                  Kembali
                </Button>
                <Button
                  variant="contained"
                  onClick={formActions.handleSimpanDraft}
                  disabled={formActions.saving || formActions.submitting}
                  sx={{
                    textTransform: "none", borderRadius: "50px",
                    px: 3, py: 1.2, fontWeight: 600,
                    backgroundColor: "#0D59F2", color: "#fff",
                    "&:hover": { backgroundColor: "#0a47c4" },
                  }}
                >
                  {formActions.saving ? "Menyimpan..." : "Simpan"}
                </Button>
                {formActions.canSubmit && (
                  <Button
                    variant="contained"
                    onClick={formActions.handleSubmit}
                    disabled={formActions.saving || formActions.submitting}
                    sx={{
                      textTransform: "none", borderRadius: "50px",
                      px: 3, py: 1.2, fontWeight: 600,
                      backgroundColor: "#2e7d32", "&:hover": { backgroundColor: "#1b5e20" },
                    }}
                  >
                    {formActions.submitting ? "Memproses..." : "Simpan dan Ajukan"}
                  </Button>
                )}
              </>
            )}
            {!(activeTab === 1 && formActions && !formActions.isSubmitted) && (
              <Button
                variant="contained"
                onClick={() => navigate("/reviewer/penugasan")}
                sx={{
                  textTransform: "none", borderRadius: "50px",
                  px: 4, py: 1.2, fontWeight: 600,
                  backgroundColor: "#FDB022", "&:hover": { backgroundColor: "#e09a1a" },
                }}
              >
                Kembali ke Daftar Penugasan
              </Button>
            )}
          </Box>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}