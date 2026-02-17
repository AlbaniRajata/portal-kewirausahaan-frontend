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
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  Visibility,
  Assignment,
  Close,
} from "@mui/icons-material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import JuriSidebar from "../../components/layouts/JuriSidebar";
import {
  getListPenugasan,
  acceptPenugasan,
  rejectPenugasan,
} from "../../api/juri";

const roundedField = {
  "& .MuiOutlinedInput-root": { borderRadius: "12px" },
};

const tableHeadCell = {
  fontWeight: 700,
  fontSize: 13,
  color: "#555",
  backgroundColor: "#fafafa",
  borderBottom: "2px solid #f0f0f0",
  py: 2,
};

const tableBodyRow = {
  "&:hover": { backgroundColor: "#f8f9ff" },
  "& td": { borderBottom: "1px solid #f5f5f5", py: 2 },
};

const StatusPill = ({ label, bg, color }) => (
  <Box sx={{
    display: "inline-flex", alignItems: "center",
    px: 1.5, py: 0.4, borderRadius: "50px",
    backgroundColor: bg, color, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {label}
  </Box>
);

const getStatusInfo = (status) => {
  const map = {
    0: { label: "Menunggu Response", bg: "#fff8e1",  color: "#f57f17" },
    1: { label: "Disetujui",         bg: "#e8f5e9",  color: "#2e7d32" },
    2: { label: "Ditolak",           bg: "#fce4ec",  color: "#c62828" },
    3: { label: "Draft Penilaian",   bg: "#e3f2fd",  color: "#1565c0" },
    4: { label: "Selesai Dinilai",   bg: "#f3e5f5",  color: "#6a1b9a" },
  };
  return map[status] || { label: "Unknown", bg: "#f5f5f5", color: "#666" };
};

const formatRupiah = (value) => {
  if (!value) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function PenugasanPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [penugasan, setPenugasan] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [alert, setAlert] = useState("");

  const [rejectDialog, setRejectDialog] = useState({ open: false, penugasan: null });
  const [catatan, setCatatan] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchPenugasan = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getListPenugasan(statusFilter);
      if (response.success) setPenugasan(response.data.penugasan || []);
      else setAlert(response.message);
    } catch (err) {
      console.error("Error fetching penugasan:", err);
      setAlert("Gagal memuat daftar penugasan");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchPenugasan(); }, [fetchPenugasan]);

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
        Swal.fire({ icon: "success", title: "Berhasil", text: response.message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
        fetchPenugasan();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message, confirmButtonText: "OK" });
      }
    } catch (err) {
      console.error("Error accepting penugasan:", err);
      Swal.fire({ icon: "error", title: "Error", text: "Terjadi kesalahan saat menerima penugasan", confirmButtonText: "OK" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReject = (item) => {
    setRejectDialog({ open: true, penugasan: item });
    setCatatan(""); setErrors({});
  };

  const handleCloseReject = () => {
    setRejectDialog({ open: false, penugasan: null });
    setCatatan(""); setErrors({});
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
    if (!result.isConfirmed) { setRejectDialog((prev) => ({ ...prev, open: true })); return; }
    try {
      setSubmitting(true);
      const response = await rejectPenugasan(rejectDialog.penugasan.id_distribusi, catatan.trim());
      if (response.success) {
        Swal.fire({ icon: "success", title: "Berhasil", text: response.message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
        handleCloseReject(); fetchPenugasan();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message, confirmButtonText: "OK" });
        setRejectDialog((prev) => ({ ...prev, open: true }));
      }
    } catch (err) {
      console.error("Error rejecting penugasan:", err);
      Swal.fire({ icon: "error", title: "Error", text: "Terjadi kesalahan saat menolak penugasan", confirmButtonText: "OK" });
      setRejectDialog((prev) => ({ ...prev, open: true }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BodyLayout Sidebar={JuriSidebar}>
      <Box>
        {/* ── Header ── */}
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Penugasan Saya</Typography>
          <Typography sx={{ fontSize: 14, color: "#777" }}>Kelola penugasan penilaian wawancara proposal</Typography>
        </Box>

        {alert && <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setAlert("")}>{alert}</Alert>}

        {/* ── Filter ── */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>Filter Penugasan</Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ minWidth: 400 }}>
              <TextField
                select fullWidth label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={roundedField}
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

        {/* ── Tabel ── */}
        <Paper sx={{ overflow: "hidden", borderRadius: "16px", border: "1px solid #f0f0f0" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
          ) : penugasan.length === 0 ? (
            <Box sx={{ py: 10, textAlign: "center" }}>
              <Box sx={{ width: 100, height: 100, borderRadius: "50%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
                <AssignmentIcon sx={{ fontSize: 48, color: "#ccc" }} />
              </Box>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}>Belum Ada Penugasan</Typography>
              <Typography sx={{ fontSize: 14, color: "#999" }}>Penugasan penilaian yang diberikan akan muncul di sini</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {["Judul Proposal", "Nama Tim", "Program", "Kategori", "Modal", "Timeline Penilaian", "Status", "Aksi"].map((h, i) => (
                      <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 6 && { textAlign: "center" }) }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {penugasan.map((item) => {
                    const si = getStatusInfo(item.status);
                    return (
                      <TableRow key={item.id_distribusi} sx={tableBodyRow}>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, fontSize: 14, maxWidth: 280, lineHeight: 1.4 }}>{item.judul}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, color: "#555" }}>{item.nama_tim}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, color: "#555" }}>{item.keterangan}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, color: "#555" }}>{item.nama_kategori}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, color: "#555" }}>{formatRupiah(item.modal_diajukan)}</Typography>
                        </TableCell>
                        <TableCell>
                          {item.penilaian_mulai && item.penilaian_selesai ? (
                            <Box>
                              <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{formatDate(item.penilaian_mulai)}</Typography>
                              <Typography sx={{ fontSize: 11, color: "#bbb" }}>s/d</Typography>
                              <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{formatDate(item.penilaian_selesai)}</Typography>
                            </Box>
                          ) : (
                            <Typography sx={{ fontSize: 13, color: "#bbb" }}>-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusPill label={si.label} bg={si.bg} color={si.color} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap" }}>
                            {item.status === 0 && (
                              <>
                                <Button
                                  size="small" variant="outlined"
                                  startIcon={<Cancel sx={{ fontSize: 14 }} />}
                                  onClick={() => handleOpenReject(item)}
                                  disabled={submitting}
                                  sx={{
                                    textTransform: "none", borderRadius: "50px",
                                    fontSize: 12, fontWeight: 600, px: 2,
                                    borderColor: "#e53935", color: "#e53935",
                                    "&:hover": { backgroundColor: "rgba(229,57,53,0.06)", borderColor: "#e53935" },
                                  }}
                                >
                                  Tolak
                                </Button>
                                <Button
                                  size="small" variant="contained"
                                  startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
                                  onClick={() => handleAccept(item)}
                                  disabled={submitting}
                                  sx={{
                                    textTransform: "none", borderRadius: "50px",
                                    fontSize: 12, fontWeight: 600, px: 2,
                                    backgroundColor: "#2e7d32", "&:hover": { backgroundColor: "#1b5e20" },
                                  }}
                                >
                                  Terima
                                </Button>
                              </>
                            )}

                            {item.status !== 0 && (
                              <>
                                <Button
                                  size="small" variant="outlined"
                                  startIcon={<Visibility sx={{ fontSize: 14 }} />}
                                  onClick={() => navigate(`/juri/penugasan/${item.id_distribusi}?tab=0`)}
                                  sx={{
                                    textTransform: "none", borderRadius: "50px",
                                    fontSize: 12, fontWeight: 600, px: 2,
                                    borderColor: "#0D59F2", color: "#0D59F2",
                                    "&:hover": { backgroundColor: "#f0f4ff" },
                                  }}
                                >
                                  Detail
                                </Button>
                                <Button
                                  size="small" variant="contained"
                                  startIcon={<Assignment sx={{ fontSize: 14 }} />}
                                  onClick={() => navigate(`/juri/penugasan/${item.id_distribusi}?tab=1`)}
                                  disabled={![1, 3].includes(item.status)}
                                  sx={{
                                    textTransform: "none", borderRadius: "50px",
                                    fontSize: 12, fontWeight: 600, px: 2,
                                    backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0846c7" },
                                  }}
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

        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontSize: 13, color: "#999" }}>Total: {penugasan.length} penugasan</Typography>
        </Box>

        {/* ── Dialog Tolak ── */}
        <Dialog open={rejectDialog.open} onClose={handleCloseReject} maxWidth="sm" fullWidth
          PaperProps={{ sx: { borderRadius: "16px" } }}>
          <DialogTitle sx={{ pb: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Tolak Penugasan</Typography>
            <IconButton onClick={handleCloseReject} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}>
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ px: 3, py: 3 }}>
            <Box sx={{ p: 2.5, backgroundColor: "#fce4ec", borderRadius: "12px", border: "1px solid #ef9a9a", mb: 3 }}>
              <Typography sx={{ fontSize: 12, color: "#c62828", fontWeight: 700, mb: 0.5 }}>Proposal yang akan ditolak</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{rejectDialog.penugasan?.judul}</Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
                Catatan Penolakan <span style={{ color: "#ef5350" }}>*</span>
              </Typography>
              <TextField
                fullWidth multiline rows={4}
                placeholder="Masukkan alasan penolakan (minimal 10 karakter)..."
                value={catatan}
                onChange={(e) => { setCatatan(e.target.value); setErrors({}); }}
                error={!!errors.catatan}
                helperText={errors.catatan}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button onClick={handleCloseReject}
              sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, color: "#666", border: "1.5px solid #e0e0e0", "&:hover": { backgroundColor: "#f5f5f5" } }}>
              Batal
            </Button>
            <Button variant="contained" onClick={handleReject}
              sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, backgroundColor: "#e53935", "&:hover": { backgroundColor: "#c62828" } }}>
              Tolak Penugasan
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </BodyLayout>
  );
}