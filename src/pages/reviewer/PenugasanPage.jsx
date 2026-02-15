import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  Visibility,
  Assignment,
} from "@mui/icons-material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import ReviewerSidebar from "../../components/layouts/ReviewerSidebar";
import {
  getListPenugasan,
  acceptPenugasan,
  rejectPenugasan,
} from "../../api/reviewer";

export default function PenugasanPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [penugasan, setPenugasan] = useState([]);
  const [tahapFilter, setTahapFilter] = useState("1");
  const [statusFilter, setStatusFilter] = useState("");
  const [alert, setAlert] = useState("");

  const [rejectDialog, setRejectDialog] = useState({
    open: false,
    penugasan: null,
  });
  const [catatan, setCatatan] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchPenugasan = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getListPenugasan(tahapFilter, statusFilter);

      if (response.success) {
        setPenugasan(response.data.penugasan || []);
      } else {
        setAlert(response.message);
      }
    } catch (err) {
      console.error("Error fetching penugasan:", err);
      setAlert("Gagal memuat daftar penugasan");
    } finally {
      setLoading(false);
    }
  }, [tahapFilter, statusFilter]);

  useEffect(() => {
    fetchPenugasan();
  }, [fetchPenugasan]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
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
      3: { text: "Draft Penilaian", color: "info" },
      4: { text: "Selesai Dinilai", color: "secondary" },
    };
    return labels[status] || { text: "Unknown", color: "default" };
  };

  const handleAccept = async (item) => {
    const result = await Swal.fire({
      title: "Konfirmasi",
      html: `Terima penugasan untuk proposal:<br/><br/><b>${item.judul}</b>?`,
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
      const response = await acceptPenugasan(item.id_distribusi);

      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: response.message,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        fetchPenugasan();
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

  const handleOpenReject = (item) => {
    setRejectDialog({ open: true, penugasan: item });
    setCatatan("");
    setErrors({});
  };

  const handleCloseReject = () => {
    setRejectDialog({ open: false, penugasan: null });
    setCatatan("");
    setErrors({});
  };

  const handleReject = async () => {
    if (!catatan || catatan.trim().length < 10) {
      setErrors({ catatan: "Catatan penolakan minimal 10 karakter" });
      return;
    }

    setRejectDialog((prev) => ({ ...prev, open: false }));

    const result = await Swal.fire({
      title: "Konfirmasi",
      html: `Tolak penugasan untuk proposal:<br/><br/><b>${rejectDialog.penugasan.judul}</b>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Tolak",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) {
      setRejectDialog((prev) => ({ ...prev, open: true }));
      return;
    }

    try {
      setSubmitting(true);
      const response = await rejectPenugasan(
        rejectDialog.penugasan.id_distribusi,
        catatan.trim(),
      );

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
        fetchPenugasan();
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: response.message,
          confirmButtonText: "OK",
        });
        setRejectDialog((prev) => ({ ...prev, open: true }));
      }
    } catch (err) {
      console.error("Error rejecting penugasan:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Terjadi kesalahan saat menolak penugasan",
        confirmButtonText: "OK",
      });
      setRejectDialog((prev) => ({ ...prev, open: true }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BodyLayout Sidebar={ReviewerSidebar}>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
            Penugasan Saya
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#777" }}>
            Kelola penugasan penilaian proposal
          </Typography>
        </Box>

        {alert && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAlert("")}>
            {alert}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>
            Filter Penugasan
          </Typography>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ minWidth: 200, flex: "1 1 auto" }}>
              <TextField
                select
                fullWidth
                label="Tahap"
                value={tahapFilter}
                onChange={(e) => setTahapFilter(e.target.value)}
              >
                <MenuItem value="1">Tahap 1 - Desk Evaluasi</MenuItem>
                <MenuItem value="2">Tahap 2 - Panel Wawancara</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ minWidth: 200, flex: "1 1 auto" }}>
              <TextField
                select
                fullWidth
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Semua Status</MenuItem>
                <MenuItem value="0">Menunggu Response</MenuItem>
                <MenuItem value="1">Disetujui</MenuItem>
                <MenuItem value="2">Ditolak</MenuItem>
                <MenuItem value="3">Draft Penilaian</MenuItem>
                <MenuItem value="4">Selesai Dinilai</MenuItem>
              </TextField>
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ overflow: "hidden" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress />
            </Box>
          ) : penugasan.length === 0 ? (
            <Box sx={{ p: 8, textAlign: "center" }}>
              <AssignmentIcon sx={{ fontSize: 80, color: "#ddd", mb: 2 }} />
              <Typography
                sx={{ fontSize: 18, fontWeight: 600, color: "#666", mb: 1 }}
              >
                Belum Ada Penugasan
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#999" }}>
                Penugasan penilaian yang diberikan akan muncul di sini
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#fff" }}>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Judul Proposal
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Nama Tim</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Program</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Kategori</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Timeline Penilaian
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>
                      Aksi
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {penugasan.map((item) => {
                    const statusInfo = getStatusLabel(item.status);
                    return (
                      <TableRow key={item.id_distribusi} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 500, maxWidth: 300 }}>
                            {item.judul}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 14 }}>
                            {item.nama_tim}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 14 }}>
                            {item.keterangan}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 14 }}>
                            {item.nama_kategori}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {item.penilaian_mulai && item.penilaian_selesai ? (
                            <Box>
                              <Typography
                                sx={{ fontSize: 13, fontWeight: 500 }}
                              >
                                {formatDate(item.penilaian_mulai)}
                              </Typography>
                              <Typography sx={{ fontSize: 11, color: "#999" }}>
                                s/d
                              </Typography>
                              <Typography
                                sx={{ fontSize: 13, fontWeight: 500 }}
                              >
                                {formatDate(item.penilaian_selesai)}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography sx={{ fontSize: 13, color: "#999" }}>
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusInfo.text}
                            color={statusInfo.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              justifyContent: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            {item.status === 0 && (
                              <>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  startIcon={<Cancel />}
                                  onClick={() => handleOpenReject(item)}
                                  disabled={submitting}
                                  sx={{ textTransform: "none" }}
                                >
                                  Tolak
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<CheckCircle />}
                                  onClick={() => handleAccept(item)}
                                  disabled={submitting}
                                  sx={{ textTransform: "none" }}
                                >
                                  Terima
                                </Button>
                              </>
                            )}

                            {item.status !== 0 && (
                              <>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<Visibility />}
                                  onClick={() =>
                                    navigate(
                                      `/reviewer/penugasan/${item.id_distribusi}?tab=0`,
                                    )
                                  }
                                  sx={{ textTransform: "none" }}
                                >
                                  Detail
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<Assignment />}
                                  onClick={() =>
                                    navigate(
                                      `/reviewer/penugasan/${item.id_distribusi}?tab=1`,
                                    )
                                  }
                                  disabled={![1, 3].includes(item.status)}
                                  sx={{ textTransform: "none" }}
                                >
                                  Nilai
                                </Button>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Box sx={{ mt: 3 }}>
          <Typography sx={{ fontSize: 14, color: "#666" }}>
            Total: {penugasan.length} penugasan
          </Typography>
        </Box>

        <Dialog
          open={rejectDialog.open}
          onClose={handleCloseReject}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Tolak Penugasan</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Anda akan menolak penugasan untuk proposal:{" "}
              <strong>{rejectDialog.penugasan?.judul}</strong>
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