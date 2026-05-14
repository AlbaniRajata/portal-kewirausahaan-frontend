import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Box, Paper, Tabs, Tab, Button, Typography } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import ReviewerNavbar from "../../components/layouts/ReviewerNavbar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import DetailPenugasanTab from "../../components/reviewer/DetailPenugasanTab";
import FormPenilaianTab from "../../components/reviewer/FormPenilaianTab";
import { getDetailPenugasan, acceptPenugasan, rejectPenugasan } from "../../api/reviewer";

const COLORS = {
  primary:      "#0D59F2",
  primaryLight: "#E0F2FE",
  primaryDark:  "#0369A1",
  accent:       "#3B82F6",
  secondary:    "#2563EB",
  success:      "#059669",
  warning:      "#D97706",
  error:        "#DC2626",
};

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

  useEffect(() => { setActiveTab(parseInt(tabParam) || 0); }, [tabParam]);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getDetailPenugasan(id_distribusi);
      if (response.success) {
        setPenugasan(response.data);
      } else {
        await Swal.fire({ icon: "warning", title: "Peringatan", text: response.message || "Gagal memuat detail penugasan", confirmButtonText: "OK" });
        navigate("/reviewer/penugasan");
      }
    } catch {
      await Swal.fire({ icon: "error", title: "Gagal Memuat", text: "Gagal memuat detail penugasan. Silahkan coba lagi.", confirmButtonText: "OK" });
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
      confirmButtonColor: COLORS.primary, cancelButtonColor: "#d33",
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
      <BodyLayout Sidebar={ReviewerNavbar}>
        <Box sx={{ position: "relative", minHeight: "60vh" }}>
          <LoadingScreen message="Memuat detail penugasan..." overlay minHeight="60vh" />
        </Box>
      </BodyLayout>
    );
  }

  if (!penugasan) return null;

  const blockedByPairApproval = isTahap2BlockedByPairApproval(penugasan);
  const isProposalNonaktif = Number(penugasan?.status_proposal) === 10;

  return (
    <BodyLayout Sidebar={ReviewerNavbar}>
      <PageTransition>
        <Box>

          <Button
            onClick={() => navigate("/reviewer/penugasan")}
            startIcon={<ArrowBack />}
            sx={{
              borderRadius: "50px", textTransform: "none",
              color: "#777", fontSize: 13, fontWeight: 500,
              p: 0, mb: 2, minWidth: 0,
              "&:hover": { backgroundColor: "transparent", color: COLORS.primary },
            }}
          >
            Kembali ke Daftar Penugasan
          </Button>

          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Detail Penugasan
            </Typography>
            <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
              {penugasan.judul}
            </Typography>
          </Box>

          <Paper elevation={0} sx={{ borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
            <Box sx={{ borderBottom: "1.5px solid #E5E7EB" }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                sx={{
                  px: 3,
                  "& .MuiTab-root": {
                    textTransform: "none", fontSize: 14, fontWeight: 500,
                    color: "#9CA3AF", minHeight: 56,
                    "&.Mui-selected": { fontWeight: 700, color: COLORS.primary },
                  },
                  "& .MuiTabs-indicator": {
                    backgroundColor: COLORS.primary, height: 3,
                    borderRadius: "3px 3px 0 0",
                  },
                }}
              >
                <Tab label="Detail Penugasan" />
                <Tab
                  label="Form Penilaian"
                  disabled={(penugasan.status !== 1 && penugasan.status !== 3) || blockedByPairApproval || isProposalNonaktif}
                />
              </Tabs>
            </Box>

            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
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
                  onClick={() => navigate("/reviewer/penugasan")}
                  sx={{
                    textTransform: "none", borderRadius: "12px",
                    px: 4, py: 1.3, fontWeight: 700, fontSize: 14,
                    background: COLORS.warning, color: "#fff",
                    boxShadow: "0 4px 15px rgba(217,119,6,0.3)",
                    "&:hover": { boxShadow: "0 6px 20px rgba(217,119,6,0.4)" },
                  }}
                >
                  Kembali
                </Button>
                <Button
                  onClick={formActions.handleSimpanDraft}
                  disabled={formActions.saving || formActions.submitting}
                  sx={{
                    textTransform: "none", borderRadius: "12px",
                    px: 3, py: 1.3, fontWeight: 700, fontSize: 14,
                    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
                    color: "#fff",
                    boxShadow: "0 4px 15px rgba(13,89,242,0.3)",
                    "&:hover": { boxShadow: "0 6px 20px rgba(13,89,242,0.4)" },
                    "&:disabled": { opacity: 0.7, color: "#fff" },
                  }}
                >
                  {formActions.saving ? "Menyimpan..." : "Simpan"}
                </Button>

              </>
            )}
            {!(activeTab === 1 && formActions && !formActions.isSubmitted) && (
              <Button
                onClick={() => navigate("/reviewer/penugasan")}
                sx={{
                  textTransform: "none", borderRadius: "12px",
                  px: 4, py: 1.3, fontWeight: 700, fontSize: 14,
                  background: COLORS.warning, color: "#fff",
                  boxShadow: "0 4px 15px rgba(217,119,6,0.3)",
                  "&:hover": { boxShadow: "0 6px 20px rgba(217,119,6,0.4)" },
                }}
              >
                Kembali
              </Button>
            )}
          </Box>

        </Box>
      </PageTransition>
    </BodyLayout>
  );
}