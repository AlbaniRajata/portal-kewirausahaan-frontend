import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button,
  CircularProgress, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from "@mui/material";
import { Search, Inbox, Close } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import DosenSidebar from "../../components/layouts/DosenSidebar";
import PageTransition from "../../components/PageTransition";
import { getPengajuanMasuk, approvePengajuan, rejectPengajuan } from "../../api/dosen";

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

const STATUS_PENGAJUAN = {
  0: { label: "Menunggu Respon", backgroundColor: "#f57f17" },
  1: { label: "Disetujui",       backgroundColor: "#2e7d32" },
  2: { label: "Ditolak",         backgroundColor: "#c62828" },
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function DaftarPengajuanPembimbingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pengajuanList, setPengajuanList] = useState([]);
  const [search, setSearch] = useState("");
  const [submittingId, setSubmittingId] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPengajuan, setSelectedPengajuan] = useState(null);
  const [catatan, setCatatan] = useState("");
  const [errors, setErrors] = useState({});

  const fetchPengajuan = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPengajuanMasuk();
      if (res.success) setPengajuanList(res.data || []);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat daftar pengajuan", confirmButtonText: "OK" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPengajuan(); }, [fetchPengajuan]);

  const filtered = pengajuanList.filter((p) =>
    (p.nama_tim || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.keterangan || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.mahasiswa_pengaju || "").toLowerCase().includes(search.toLowerCase())
  );

  const pending = pengajuanList.filter((p) => p.status === 0).length;

  const handleApprove = async (p) => {
    const result = await Swal.fire({
      title: "Setujui Pengajuan?",
      html: `Anda akan menyetujui pengajuan pembimbing dari tim <b>${p.nama_tim}</b>.<br/><br/>Lanjutkan?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2e7d32",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Setujui",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;

    try {
      setSubmittingId(p.id_pengajuan);
      const res = await approvePengajuan(p.id_pengajuan);
      await Swal.fire({ icon: "success", title: "Berhasil", text: res.message || "Pengajuan pembimbing disetujui", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchPengajuan();
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menyetujui pengajuan", confirmButtonText: "OK" });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleOpenReject = (p) => {
    setSelectedPengajuan(p);
    setCatatan("");
    setErrors({});
    setRejectDialogOpen(true);
  };

  const handleCloseReject = () => {
    setRejectDialogOpen(false);
    setSelectedPengajuan(null);
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
      title: "Tolak Pengajuan?",
      html: `Anda akan menolak pengajuan pembimbing dari tim <b>${selectedPengajuan?.nama_tim}</b>.<br/><br/>Lanjutkan?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c62828",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Tolak",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) {
      setRejectDialogOpen(true);
      return;
    }

    try {
      setSubmittingId(selectedPengajuan?.id_pengajuan);
      const res = await rejectPengajuan(selectedPengajuan?.id_pengajuan, catatan.trim());
      await Swal.fire({ icon: "success", title: "Pengajuan Ditolak", text: res.message || "Pengajuan pembimbing ditolak", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchPengajuan();
      setSelectedPengajuan(null);
      setCatatan("");
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menolak pengajuan", confirmButtonText: "OK" });
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <BodyLayout Sidebar={DosenSidebar}>
      <PageTransition>
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
            <Box>
              <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Pengajuan Pembimbing</Typography>
              <Typography sx={{ fontSize: 14, color: "#777" }}>Kelola pengajuan dosen pembimbing dari mahasiswa</Typography>
            </Box>
            {pending > 0 && (
              <Box sx={{ px: 2, py: 0.8, borderRadius: "50px", backgroundColor: "#fff8e1", border: "1px solid #ffe082" }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#f57f17" }}>
                  {pending} menunggu respon
                </Typography>
              </Box>
            )}
          </Box>

          <Paper sx={{ p: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 700 }}>Daftar Pengajuan</Typography>
              <TextField
                size="small"
                placeholder="Cari tim, program, mahasiswa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 18, color: "#999" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 300, ...roundedField }}
              />
            </Box>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
            ) : filtered.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 10 }}>
                <Box sx={{ width: 100, height: 100, borderRadius: "50%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
                  <Inbox sx={{ fontSize: 48, color: "#ccc" }} />
                </Box>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}>
                  {search ? "Pengajuan tidak ditemukan" : "Belum ada pengajuan masuk"}
                </Typography>
                <Typography sx={{ fontSize: 14, color: "#999" }}>
                  {search ? "Coba kata kunci lain" : "Pengajuan dari mahasiswa akan muncul di sini"}
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      {["Tim", "Program", "Diajukan Oleh", "Tanggal Pengajuan", "Status", "Aksi"].map((h, i) => (
                        <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 5 && { textAlign: "center" }) }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((p) => {
                      const si = STATUS_PENGAJUAN[p.status];
                      return (
                        <TableRow key={p.id_pengajuan} sx={tableBodyRow}>
                          <TableCell>
                            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{p.nama_tim}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{p.keterangan || "-"}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{p.mahasiswa_pengaju}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{formatDate(p.created_at)}</Typography>
                          </TableCell>
                          <TableCell>
                            <StatusPill label={si?.label || "-"} backgroundColor={si?.backgroundColor || "#9e9e9e"} />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: "inline-flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => navigate(`/dosen/pembimbing/pengajuan/${p.id_pengajuan}`)}
                                sx={{
                                  textTransform: "none", borderRadius: "50px",
                                  fontSize: 12, fontWeight: 600, px: 2,
                                  borderColor: "#0D59F2", color: "#0D59F2",
                                  "&:hover": { backgroundColor: "#f0f4ff" },
                                }}
                              >
                                Detail
                              </Button>
                              {p.status === 0 && (
                                <>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => handleOpenReject(p)}
                                    disabled={submittingId === p.id_pengajuan}
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
                                    onClick={() => handleApprove(p)}
                                    disabled={submittingId === p.id_pengajuan}
                                    sx={{
                                      textTransform: "none", borderRadius: "50px",
                                      fontSize: 12, fontWeight: 600, px: 2,
                                      backgroundColor: "#2e7d32", "&:hover": { backgroundColor: "#1b5e20" },
                                    }}
                                  >
                                    {submittingId === p.id_pengajuan ? "Memproses..." : "Terima"}
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

          <Dialog open={rejectDialogOpen} onClose={handleCloseReject} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
            <DialogTitle sx={{ pb: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Tolak Pengajuan Pembimbing</Typography>
              <IconButton onClick={handleCloseReject} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}>
                <Close />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ px: 3, py: 3 }}>
              <Box sx={{ p: 2.5, backgroundColor: "#fce4ec", borderRadius: "12px", border: "1px solid #ef9a9a", mb: 3 }}>
                <Typography sx={{ fontSize: 12, color: "#c62828", fontWeight: 700, mb: 0.5 }}>Tim yang akan ditolak</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{selectedPengajuan?.nama_tim || "-"}</Typography>
              </Box>

              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
                  Catatan Penolakan <span style={{ color: "#ef5350" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
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
                {submittingId ? "Memproses..." : "Tolak Pengajuan"}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}