import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, CircularProgress,
  TextField, MenuItem, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from "@mui/material";
import { Search, BookOutlined, Close } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import DosenSidebar from "../../components/layouts/DosenSidebar";
import PageTransition from "../../components/PageTransition";
import { getBimbinganMasuk, approveBimbingan, rejectBimbingan } from "../../api/dosen";

const roundedField = {
  "& .MuiOutlinedInput-root": { borderRadius: "15px" },
};

const tableHeadCell = {
  fontWeight: 700,
  fontSize: 13,
  color: "#000",
  backgroundColor: "#fafafa",
  borderBottom: "2px solid #f0f0f0",
  py: 2,
};

const tableBodyRow = {
  "& td": { borderBottom: "1px solid #f5f5f5", py: 2 },
};

const StatusPill = ({ label, backgroundColor }) => (
  <Box sx={{
    display: "inline-flex", alignItems: "center",
    px: 1.5, py: 0.4, borderRadius: "50px",
    backgroundColor, color: "#fff", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {label}
  </Box>
);

const STATUS_BIMBINGAN = {
  0: { label: "Menunggu Konfirmasi", backgroundColor: "#f57f17" },
  1: { label: "Disetujui",           backgroundColor: "#2e7d32" },
  2: { label: "Ditolak",             backgroundColor: "#c62828" },
};

const METODE_LABEL = {
  1: { label: "Online",  backgroundColor: "#1565c0" },
  2: { label: "Offline", backgroundColor: "#555" },
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function DaftarBimbinganPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bimbinganList, setBimbinganList] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [submittingId, setSubmittingId] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedBimbingan, setSelectedBimbingan] = useState(null);
  const [catatan, setCatatan] = useState("");
  const [errors, setErrors] = useState({});

  const fetchBimbingan = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBimbinganMasuk();
      if (res.success) setBimbinganList(res.data || []);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat daftar bimbingan", confirmButtonText: "OK" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBimbingan(); }, [fetchBimbingan]);

  const handleApprove = async (b) => {
    const result = await Swal.fire({
      title: "Setujui Bimbingan?",
      html: `Anda akan menyetujui pengajuan bimbingan dari tim <b>${b.nama_tim}</b>.<br/>Topik: <b>${b.topik}</b><br/><br/>Lanjutkan?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2e7d32", cancelButtonColor: "#666",
      confirmButtonText: "Ya, Setujui", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      setSubmittingId(b.id_bimbingan);
      const res = await approveBimbingan(b.id_bimbingan);
      await Swal.fire({ icon: "success", title: "Berhasil", text: res.message || "Bimbingan disetujui", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchBimbingan();
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menyetujui bimbingan", confirmButtonText: "OK" });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleOpenReject = (b) => {
    setSelectedBimbingan(b);
    setCatatan("");
    setErrors({});
    setRejectDialogOpen(true);
  };

  const handleCloseReject = () => {
    setRejectDialogOpen(false);
    setSelectedBimbingan(null);
    setCatatan("");
    setErrors({});
  };

  const handleReject = async () => {
    if (!catatan || catatan.trim().length < 5) {
      setErrors({ catatan: "Catatan penolakan minimal 5 karakter" });
      return;
    }
    setRejectDialogOpen(false);
    const result = await Swal.fire({
      title: "Tolak Bimbingan?",
      html: `Anda akan menolak pengajuan bimbingan dari tim <b>${selectedBimbingan?.nama_tim}</b>.<br/><br/>Lanjutkan?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c62828", cancelButtonColor: "#666",
      confirmButtonText: "Ya, Tolak", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) { setRejectDialogOpen(true); return; }
    try {
      setSubmittingId(selectedBimbingan?.id_bimbingan);
      const res = await rejectBimbingan(selectedBimbingan?.id_bimbingan, catatan.trim());
      await Swal.fire({ icon: "success", title: "Bimbingan Ditolak", text: res.message || "Pengajuan bimbingan ditolak", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchBimbingan();
      setSelectedBimbingan(null);
      setCatatan("");
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menolak bimbingan", confirmButtonText: "OK" });
    } finally {
      setSubmittingId(null);
    }
  };

  const filtered = bimbinganList.filter((b) => {
    const matchSearch =
      (b.nama_tim || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.topik || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.mahasiswa_pengaju || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.judul_proposal || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "" || String(b.status) === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <BodyLayout Sidebar={DosenSidebar}>
      <PageTransition>
        <Box>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Log Bimbingan</Typography>
            <Typography sx={{ fontSize: 14, color: "#777" }}>Kelola jadwal bimbingan dari mahasiswa bimbingan Anda</Typography>
          </Box>

          <Paper sx={{ p: 3, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>Filter Bimbingan</Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Box sx={{ minWidth: 200, flex: "1 1 auto" }}>
                <TextField
                  select fullWidth label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={roundedField}
                >
                  <MenuItem value="">Semua Status</MenuItem>
                  <MenuItem value="0">Menunggu Konfirmasi</MenuItem>
                  <MenuItem value="1">Disetujui</MenuItem>
                  <MenuItem value="2">Ditolak</MenuItem>
                </TextField>
              </Box>
              <Box sx={{ minWidth: 280, flex: "2 1 auto" }}>
                <TextField
                  fullWidth
                  label="Cari"
                  placeholder="Cari tim, topik, mahasiswa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ fontSize: 18, color: "#999" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={roundedField}
                />
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ overflow: "hidden", borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            ) : filtered.length === 0 ? (
              <Box sx={{ py: 10, textAlign: "center" }}>
                <Box sx={{ width: 100, height: 100, borderRadius: "50%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
                  <BookOutlined sx={{ fontSize: 48, color: "#ccc" }} />
                </Box>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}>Belum Ada Bimbingan</Typography>
                <Typography sx={{ fontSize: 14, color: "#999" }}>
                  {search || statusFilter ? "Tidak ada bimbingan yang sesuai filter" : "Pengajuan bimbingan dari mahasiswa akan muncul di sini"}
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {["Topik", "Tim", "Diajukan Oleh", "Tanggal Bimbingan", "Metode", "Status", "Aksi"].map((h, i) => (
                        <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 6 && { textAlign: "center" }) }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((b) => {
                      const si = STATUS_BIMBINGAN[b.status];
                      const metode = METODE_LABEL[b.metode];
                      return (
                        <TableRow key={b.id_bimbingan} sx={tableBodyRow}>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, fontSize: 14, maxWidth: 220, lineHeight: 1.4 }}>{b.topik}</Typography>
                            {b.judul_proposal && (
                              <Typography sx={{ fontSize: 12, color: "#888", mt: 0.25 }}>{b.judul_proposal}</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{b.nama_tim}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{b.mahasiswa_pengaju}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{formatDate(b.tanggal_bimbingan)}</Typography>
                          </TableCell>
                          <TableCell>
                            <StatusPill label={metode?.label || "-"} backgroundColor={metode?.backgroundColor || "#555"} />
                          </TableCell>
                          <TableCell>
                            <StatusPill label={si?.label || "-"} backgroundColor={si?.backgroundColor || "#9e9e9e"} />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: "inline-flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => navigate(`/dosen/bimbingan/pengajuan/${b.id_bimbingan}`)}
                                sx={{
                                  textTransform: "none", borderRadius: "50px",
                                  fontSize: 12, fontWeight: 600, px: 2,
                                  borderColor: "#0D59F2", color: "#0D59F2",
                                  "&:hover": { backgroundColor: "#f0f4ff" },
                                }}
                              >
                                Detail
                              </Button>
                              {b.status === 0 && (
                                <>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => handleOpenReject(b)}
                                    disabled={submittingId === b.id_bimbingan}
                                    sx={{
                                      textTransform: "none", borderRadius: "50px",
                                      fontSize: 12, fontWeight: 600, px: 2,
                                      backgroundColor: "#e53935", "&:hover": { backgroundColor: "#c62828" },
                                    }}
                                  >
                                    Tolak
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => handleApprove(b)}
                                    disabled={submittingId === b.id_bimbingan}
                                    sx={{
                                      textTransform: "none", borderRadius: "50px",
                                      fontSize: 12, fontWeight: 600, px: 2,
                                      backgroundColor: "#2e7d32", "&:hover": { backgroundColor: "#1b5e20" },
                                    }}
                                  >
                                    {submittingId === b.id_bimbingan ? "Memproses..." : "Terima"}
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
            <Typography sx={{ fontSize: 13, color: "#999" }}>Total: {filtered.length} bimbingan</Typography>
          </Box>
        </Box>
      </PageTransition>

      <Dialog open={rejectDialogOpen} onClose={handleCloseReject} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Tolak Pengajuan Bimbingan</Typography>
          <IconButton onClick={handleCloseReject} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 3 }}>
          <Box sx={{ p: 2.5, backgroundColor: "#fce4ec", borderRadius: "12px", border: "1px solid #ef9a9a", mb: 3 }}>
            <Typography sx={{ fontSize: 12, color: "#c62828", fontWeight: 700, mb: 0.5 }}>Tim yang akan ditolak</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{selectedBimbingan?.nama_tim || "-"}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
              Catatan Penolakan <span style={{ color: "#ef5350" }}>*</span>
            </Typography>
            <TextField
              fullWidth multiline rows={4}
              placeholder="Masukkan catatan penolakan (minimal 5 karakter)..."
              value={catatan}
              onChange={(e) => { setCatatan(e.target.value); setErrors({}); }}
              error={!!errors.catatan}
              helperText={errors.catatan}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={handleCloseReject}
            sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, color: "#666", border: "1.5px solid #e0e0e0", "&:hover": { backgroundColor: "#f5f5f5" } }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleReject}
            disabled={!!submittingId}
            sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, backgroundColor: "#e53935", "&:hover": { backgroundColor: "#c62828" } }}
          >
            {submittingId ? "Memproses..." : "Tolak Bimbingan"}
          </Button>
        </DialogActions>
      </Dialog>
    </BodyLayout>
  );
}