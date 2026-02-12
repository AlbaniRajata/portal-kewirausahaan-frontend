import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { CheckCircle, Cancel, Download } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import ReviewerSidebar from "../../components/layouts/ReviewerSidebar";
import {
  getDetailPenugasan,
  acceptPenugasan,
  rejectPenugasan,
} from "../../api/reviewer";

export default function DetailPenugasanPage() {
  const navigate = useNavigate();
  const { id_distribusi } = useParams();
  const [loading, setLoading] = useState(true);
  const [penugasan, setPenugasan] = useState(null);
  const [alert, setAlert] = useState("");

  const [rejectDialog, setRejectDialog] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchDetailPenugasan = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getDetailPenugasan(id_distribusi);

      if (response.success) {
        setPenugasan(response.data);
      } else {
        setAlert(response.message);
      }
    } catch (err) {
      console.error("Error fetching detail penugasan:", err);
      setAlert("Gagal memuat detail penugasan");
    } finally {
      setLoading(false);
    }
  }, [id_distribusi]);

  useEffect(() => {
    fetchDetailPenugasan();
  }, [fetchDetailPenugasan]);

  const formatRupiah = (value) => {
    if (!value) return "Rp 0";
    return "Rp " + new Intl.NumberFormat("id-ID").format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      0: { text: "Menunggu Response", color: "warning" },
      1: { text: "Disetujui", color: "success" },
      2: { text: "Ditolak", color: "error" },
      3: { text: "Dibatalkan", color: "default" },
    };
    return labels[status] || { text: "Unknown", color: "default" };
  };

  const handleAccept = async () => {
    const result = await Swal.fire({
      title: "Konfirmasi",
      html: `Terima penugasan untuk proposal:<br/><br/><b>${penugasan.judul}</b>?`,
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
        fetchDetailPenugasan();
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: response.message,
          confirmButtonText: "OK",
        });
      }
    } catch (err) {
      console.error("Error accepting penugasan:", err);
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

  const handleOpenReject = () => {
    setRejectDialog(true);
    setCatatan("");
    setErrors({});
  };

  const handleCloseReject = () => {
    setRejectDialog(false);
    setCatatan("");
    setErrors({});
  };

  const handleReject = async () => {
    if (!catatan || catatan.trim().length < 10) {
      setErrors({ catatan: "Catatan penolakan minimal 10 karakter" });
      return;
    }

    setRejectDialog(false);

    const result = await Swal.fire({
      title: "Konfirmasi",
      html: `Tolak penugasan untuk proposal:<br/><br/><b>${penugasan.judul}</b>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Tolak",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) {
      setRejectDialog(true);
      return;
    }

    try {
      setSubmitting(true);
      const response = await rejectPenugasan(id_distribusi, catatan.trim());

      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: response.message,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        handleCloseReject();
        fetchDetailPenugasan();
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: response.message,
          confirmButtonText: "OK",
        });
        setRejectDialog(true);
      }
    } catch (err) {
      console.error("Error rejecting penugasan:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Terjadi kesalahan saat menolak penugasan",
        confirmButtonText: "OK",
      });
      setRejectDialog(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={ReviewerSidebar}>
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

  if (!penugasan) {
    return (
      <BodyLayout Sidebar={ReviewerSidebar}>
        <Box>
          <Alert severity="error">{alert || "Penugasan tidak ditemukan"}</Alert>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              onClick={() => navigate("/reviewer/penugasan")}
              sx={{
                textTransform: "none",
                px: 4,
                backgroundColor: "#FDB022",
                color: "#fff",
                "&:hover": { backgroundColor: "#e09a1a" },
              }}
            >
              Kembali
            </Button>
          </Box>
        </Box>
      </BodyLayout>
    );
  }

  const statusInfo = getStatusLabel(penugasan.status);

  return (
    <BodyLayout Sidebar={ReviewerSidebar}>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
            Detail Penugasan
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#777" }}>
            Informasi lengkap penugasan penilaian
          </Typography>
        </Box>

        {alert && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAlert("")}>
            {alert}
          </Alert>
        )}

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>
            Informasi Proposal
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              Judul Proposal
            </Typography>
            <TextField
              fullWidth
              value={penugasan.judul}
              disabled
              multiline
              rows={2}
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 3,
              mb: 3,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>Nama Tim</Typography>
              <TextField fullWidth value={penugasan.nama_tim} disabled />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>Program</Typography>
              <TextField fullWidth value={penugasan.keterangan} disabled />
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 3,
              mb: 3,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Kategori Usaha
              </Typography>
              <TextField fullWidth value={penugasan.nama_kategori} disabled />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Modal Diajukan
              </Typography>
              <TextField
                fullWidth
                value={formatRupiah(penugasan.modal_diajukan)}
                disabled
              />
            </Box>
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              File Proposal
            </Typography>
            {penugasan.file_proposal ? (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Download />}
                component="a"
                href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/proposal/${penugasan.file_proposal}`}
                target="_blank"
                sx={{ textTransform: "none", justifyContent: "flex-start" }}
              >
                {penugasan.file_proposal}
              </Button>
            ) : (
              <TextField fullWidth value="-" disabled />
            )}
          </Box>
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>
            Status Penugasan
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 3,
              mb: 3,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Tahap Penilaian
              </Typography>
              <TextField
                fullWidth
                value={
                  penugasan.nama_tahap || `Tahap ${penugasan.urutan_tahap}`
                }
                disabled
              />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>Status</Typography>
              <Box sx={{ pt: 1 }}>
                <Chip label={statusInfo.text} color={statusInfo.color} />
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 3,
              mb: 3,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Tanggal Ditugaskan
              </Typography>
              <TextField
                fullWidth
                value={formatDate(penugasan.assigned_at)}
                disabled
              />
            </Box>

            {penugasan.responded_at && (
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>
                  Tanggal Response
                </Typography>
                <TextField
                  fullWidth
                  value={formatDate(penugasan.responded_at)}
                  disabled
                />
              </Box>
            )}
          </Box>

          {penugasan.status === 2 && penugasan.catatan_reviewer && (
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Catatan Penolakan
              </Typography>
              <TextField
                fullWidth
                value={penugasan.catatan_reviewer}
                disabled
                multiline
                rows={4}
              />
            </Box>
          )}
        </Paper>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          {penugasan.status === 0 && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                onClick={handleOpenReject}
                disabled={submitting}
                sx={{ textTransform: "none", px: 4 }}
              >
                Tolak Penugasan
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={handleAccept}
                disabled={submitting}
                sx={{ textTransform: "none", px: 4 }}
              >
                Terima Penugasan
              </Button>
            </>
          )}

          <Button
            onClick={() => navigate("/juri/penugasan")}
            sx={{
              textTransform: "none",
              px: 4,
              backgroundColor: "#FDB022",
              color: "#fff",
              "&:hover": { backgroundColor: "#e09a1a" },
            }}
          >
            Kembali
          </Button>
        </Box>

        <Dialog
          open={rejectDialog}
          onClose={handleCloseReject}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Tolak Penugasan</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Anda akan menolak penugasan untuk proposal:{" "}
              <strong>{penugasan.judul}</strong>
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Catatan Penolakan"
              placeholder="Masukkan alasan penolakan (minimal 10 karakter)..."
              value={catatan}
              onChange={(e) => {
                setCatatan(e.target.value);
                setErrors({});
              }}
              error={!!errors.catatan}
              helperText={errors.catatan}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseReject}>Batal</Button>
            <Button onClick={handleReject} color="error" variant="contained">
              Tolak
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </BodyLayout>
  );
}
