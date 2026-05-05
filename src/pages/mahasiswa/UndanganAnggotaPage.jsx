import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  IconButton,
} from "@mui/material";
import { Close, MailOutline, Group } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import MahasiswaNavbar from "../../components/layouts/MahasiswaNavbar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getTimDetail, acceptInvite, rejectInvite } from "../../api/mahasiswa";

const COLORS = {
  primary: "#0D59F2",
  primaryLight: "#E0F2FE",
  primaryDark: "#0369A1",
  primaryMuted: "#93C5FD",
  secondary: "#2563EB",
  accent: "#3B82F6",
  slate: "#64748B",
  slateLight: "#F1F5F9",
  success: "#059669",
  warning: "#D97706",
  error: "#DC2626",
};

const SectionHeader = ({ icon: Icon, title, subtitle, gradient }) => (
  <Box sx={{
    display: "flex", alignItems: "center", gap: 2, mb: 3,
    p: 2.5, borderRadius: "14px",
    background: gradient,
  }}>
    <Box sx={{
      width: 44, height: 44, borderRadius: "12px",
      background: "rgba(255,255,255,0.25)",
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(4px)",
    }}>
      <Icon sx={{ color: "#fff", fontSize: 22 }} />
    </Box>
    <Box>
      <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>{title}</Typography>
      <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>{subtitle}</Typography>
    </Box>
  </Box>
);

const StatusPill = ({ label, color }) => (
  <Box sx={{
    display: "inline-flex",
    alignItems: "center",
    px: 1.5,
    py: 0.4,
    borderRadius: "50px",
    backgroundColor: color,
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
  }}>
    {label}
  </Box>
);

const getStatusInfo = (status) => {
  switch (status) {
    case 0: return { label: "Menunggu", color: COLORS.warning };
    case 1: return { label: "Disetujui", color: COLORS.success };
    case 2: return { label: "Ditolak", color: COLORS.error };
    default: return { label: "Unknown", color: COLORS.slate };
  }
};

export default function UndanganAnggotaPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timDetail, setTimDetail] = useState(null);
  const [openReject, setOpenReject] = useState(false);
  const [selectedTim, setSelectedTim] = useState(null);
  const [catatan, setCatatan] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchTimDetail(); }, []);

  const fetchTimDetail = async () => {
    try {
      setLoading(true);
      const response = await getTimDetail();
      setTimDetail(response.data);
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Gagal Memuat",
        text: "Gagal memuat detail tim.",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (tim) => {
    const result = await Swal.fire({
      title: "Konfirmasi",
      text: `Terima undangan sebagai anggota tim "${tim.nama_tim}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: COLORS.primary,
      cancelButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    setSubmitting(true);
    try {
      await acceptInvite(tim.id_tim);
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Undangan diterima",
        timer: 2000,
        showConfirmButton: false,
      });
      navigate("/mahasiswa/anggota-tim", { replace: true });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Gagal menerima",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!catatan || catatan.trim().length < 5) {
      setErrors({ catatan: "Minimal 5 karakter" });
      return;
    }

    setSubmitting(true);
    try {
      await rejectInvite(selectedTim.id_tim, catatan.trim());
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Undangan ditolak",
        timer: 2000,
        showConfirmButton: false,
      });
      navigate("/mahasiswa/anggota-tim", { replace: true });
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal menolak",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={MahasiswaNavbar}>
        <Box sx={{ minHeight: "60vh" }}>
          <LoadingScreen message="Memuat..." overlay />
        </Box>
      </BodyLayout>
    );
  }

  const invitation = timDetail?.anggota?.find(a => a.peran === 2 && a.status === 0);

  if (!invitation) {
    return (
      <BodyLayout Sidebar={MahasiswaNavbar}>
        <PageTransition>
          <Box>
            <Typography sx={{ fontSize: 36, fontWeight: 800, mb: 1 }}>
              Undangan Tim
            </Typography>
            <Typography sx={{ color: "#6B7280", mb: 4 }}>
              Tidak ada undangan
            </Typography>

            <Paper sx={{
              py: 10,
              borderRadius: "20px",
              border: "1.5px solid #E5E7EB",
              textAlign: "center"
            }}>
              <MailOutline sx={{ fontSize: 60, color: "#ccc" }} />
              <Typography sx={{ mt: 2, fontWeight: 700 }}>
                Kosong
              </Typography>
            </Paper>
          </Box>
        </PageTransition>
      </BodyLayout>
    );
  }

  const status = getStatusInfo(invitation.status);

  return (
    <BodyLayout Sidebar={MahasiswaNavbar}>
      <PageTransition>
        <Box>

          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 800 }}>
              Undangan Tim
            </Typography>
            <Typography sx={{ color: "#6B7280" }}>
              Kelola undangan yang masuk
            </Typography>
          </Box>

          <Paper sx={{
            borderRadius: "20px",
            border: "1.5px solid #E5E7EB",
            overflow: "hidden"
          }}>
            <Box sx={{
              height: 5,
              background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})`
            }} />

            <Box sx={{ p: 4 }}>
              <SectionHeader
                icon={Group}
                title="Undangan Masuk"
                subtitle="Detail undangan tim"
                gradient={`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`}
              />

              <Box sx={{
                p: 3,
                borderRadius: "16px",
                background: COLORS.primaryLight,
                border: `1.5px solid ${COLORS.primaryMuted}`,
                mb: 3
              }}>
                <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
                  {timDetail.nama_tim}
                </Typography>
                <Typography sx={{ fontSize: 13, color: COLORS.slate }}>
                  Ketua: {timDetail.ketua_tim?.nama_lengkap}
                </Typography>
                <Typography sx={{ fontSize: 13, color: COLORS.slate }}>
                  {timDetail.keterangan}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <StatusPill label={status.label} color={status.color} />
                </Box>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button
                  onClick={() => {
                    setSelectedTim(timDetail);
                    setOpenReject(true);
                  }}
                  sx={{
                    borderRadius: "10px", px: 3, py: 1.2, fontWeight: 700, textTransform: "none",
                    backgroundColor: "#DC2626", color: "#fff",
                    "&:hover": { backgroundColor: "#DC2626" },
                  }}
                >
                  Tolak
                </Button>

                <Button
                  variant="contained"
                  onClick={() => handleAccept(timDetail)}
                  sx={{
                    borderRadius: "10px", px: 3, py: 1.2, fontWeight: 700, textTransform: "none",
                    backgroundColor: COLORS.primary,
                    "&:hover": { backgroundColor: COLORS.primaryDark },
                  }}
                >
                  Terima
                </Button>
              </Box>
            </Box>
          </Paper>

          <Dialog open={openReject} onClose={() => setOpenReject(false)} fullWidth maxWidth="sm">
            <DialogTitle>
              Tolak Undangan
              <IconButton onClick={() => setOpenReject(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
                <Close />
              </IconButton>
            </DialogTitle>

            <DialogContent>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                error={!!errors.catatan}
                helperText={errors.catatan}
                sx={{ mt: 2 }}
              />
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setOpenReject(false)} sx={{
                borderRadius: "10px", px: 3, py: 1.2, fontWeight: 700, textTransform: "none",
                backgroundColor: COLORS.error, color: "#fff",
                "&:hover": { backgroundColor: "#B91C1C" },
              }}>
                Batal
              </Button>
              <Button onClick={handleReject} variant="contained" sx={{
                borderRadius: "10px", px: 3, py: 1.2, fontWeight: 700, textTransform: "none",
                backgroundColor: COLORS.error,
                "&:hover": { backgroundColor: "#DC2626" },
              }}>
                Tolak
              </Button>
            </DialogActions>
          </Dialog>

        </Box>
      </PageTransition>
    </BodyLayout>
  );
}