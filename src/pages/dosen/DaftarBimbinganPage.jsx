import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button,
  TextField, MenuItem, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from "@mui/material";
import { Search, BookOutlined, Close, FilterList } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import DosenNavbar from "../../components/layouts/DosenNavbar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getBimbinganMasuk, approveBimbingan, rejectBimbingan } from "../../api/dosen";

const COLORS = {
  primary:      "#0D59F2",
  primaryLight: "#E0F2FE",
  primaryDark:  "#0369A1",
  primaryMuted: "#93C5FD",
  secondary:    "#2563EB",
  accent:       "#3B82F6",
  slate:        "#64748B",
  slateLight:   "#F1F5F9",
  success:      "#059669",
  successLight: "#ECFDF5",
  warning:      "#D97706",
  warningLight: "#FFFBEB",
  error:        "#DC2626",
  errorLight:   "#FEF2F2",
};

const roundedField = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#fff",
    transition: "box-shadow 0.2s",
    "&:hover fieldset": { borderColor: COLORS.primary },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary },
    "&.Mui-focused": { boxShadow: `0 0 0 3px ${COLORS.primaryLight}` },
  },
};

const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#000",
  backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 2,
};

const tableBodyRow = {
  "&:hover": { backgroundColor: "#f8f9ff" },
  "& td": { borderBottom: "1px solid #f5f5f5", py: 2 },
};

const STATUS_BIMBINGAN = {
  0: { label: "Menunggu Konfirmasi", backgroundColor: "#f57f17" },
  1: { label: "Disetujui",           backgroundColor: "#2e7d32" },
  2: { label: "Ditolak",             backgroundColor: "#c62828" },
};

const METODE_LABEL = {
  1: { label: "Online",  backgroundColor: "#1565c0" },
  2: { label: "Offline", backgroundColor: "#555" },
};

const SectionHeader = ({ icon: Icon, title, subtitle, gradient }) => (
  <Box sx={{
    display: "flex", alignItems: "center", gap: 2, mb: 3,
    p: 2.5, borderRadius: "14px", background: gradient,
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
      <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{title}</Typography>
      {subtitle && <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.8)", mt: 0.3 }}>{subtitle}</Typography>}
    </Box>
  </Box>
);

const StatusPill = ({ label, backgroundColor }) => (
  <Box sx={{
    display: "inline-flex", alignItems: "center",
    px: 1.5, py: 0.4, borderRadius: "50px",
    backgroundColor, color: "#fff", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {label}
  </Box>
);

const FieldLabel = ({ children, required }) => (
  <Typography sx={{ fontWeight: 600, mb: 0.8, fontSize: 13, color: "#374151", display: "flex", gap: 0.4 }}>
    {children}
    {required && <span style={{ color: COLORS.error }}>*</span>}
  </Typography>
);

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function DaftarBimbinganPage() {
  const navigate = useNavigate();
  const [loading, setLoading]                   = useState(true);
  const [bimbinganList, setBimbinganList]       = useState([]);
  const [search, setSearch]                     = useState("");
  const [statusFilter, setStatusFilter]         = useState("");
  const [submittingId, setSubmittingId]         = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedBimbingan, setSelectedBimbingan] = useState(null);
  const [catatan, setCatatan]                   = useState("");
  const [errors, setErrors]                     = useState({});

  const fetchBimbingan = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBimbinganMasuk();
      if (res.success) setBimbinganList(res.data || []);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat daftar bimbingan", confirmButtonText: "OK" });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBimbingan(); }, [fetchBimbingan]);

  const handleApprove = async (b) => {
    const result = await Swal.fire({
      title: "Setujui Bimbingan?",
      html: `Anda akan menyetujui pengajuan bimbingan dari tim <b>${b.nama_tim}</b>.<br/>Topik: <b>${b.topik}</b><br/><br/>Lanjutkan?`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: COLORS.success, cancelButtonColor: "#666",
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
    } finally { setSubmittingId(null); }
  };

  const handleOpenReject  = (b) => { setSelectedBimbingan(b); setCatatan(""); setErrors({}); setRejectDialogOpen(true); };
  const handleCloseReject = () => { setRejectDialogOpen(false); setSelectedBimbingan(null); setCatatan(""); setErrors({}); };

  const handleReject = async () => {
    if (!catatan || catatan.trim().length < 5) { setErrors({ catatan: "Catatan penolakan minimal 5 karakter" }); return; }
    setRejectDialogOpen(false);
    const result = await Swal.fire({
      title: "Tolak Bimbingan?",
      html: `Anda akan menolak pengajuan bimbingan dari tim <b>${selectedBimbingan?.nama_tim}</b>.<br/><br/>Lanjutkan?`,
      icon: "warning", showCancelButton: true,
      confirmButtonColor: COLORS.error, cancelButtonColor: "#666",
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
    } finally { setSubmittingId(null); }
  };

  const filtered = bimbinganList.filter((b) => {
    const matchSearch =
      (b.nama_tim          || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.topik             || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.mahasiswa_pengaju || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.judul_proposal    || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "" || String(b.status) === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <BodyLayout Sidebar={DosenNavbar}>
      <PageTransition>
        <Box>

          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Log Bimbingan
            </Typography>
            <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
              Kelola jadwal bimbingan dari mahasiswa bimbingan Anda
            </Typography>
          </Box>

          <Paper elevation={0} sx={{ mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <SectionHeader
                icon={FilterList}
                title="Filter Bimbingan"
                subtitle="Saring berdasarkan status atau kata kunci"
                gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
              />
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
                    fullWidth label="Cari"
                    placeholder="Cari tim, topik, mahasiswa..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ fontSize: 18, color: COLORS.slate }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={roundedField}
                  />
                </Box>
              </Box>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.success})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <SectionHeader
                icon={BookOutlined}
                title="Daftar Bimbingan"
                subtitle={`${filtered.length} bimbingan ditemukan`}
                gradient={`linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.success} 100%)`}
              />

              {loading ? (
                <Box sx={{ position: "relative", minHeight: 320 }}>
                  <LoadingScreen message="Memuat daftar bimbingan..." overlay minHeight="320px" />
                </Box>
              ) : filtered.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Box sx={{
                    width: 90, height: 90, borderRadius: "50%",
                    backgroundColor: COLORS.slateLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mx: "auto", mb: 2.5,
                  }}>
                    <BookOutlined sx={{ fontSize: 44, color: "#CBD5E1" }} />
                  </Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#374151", mb: 0.5 }}>
                    Belum Ada Bimbingan
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: COLORS.slate }}>
                    {search || statusFilter ? "Tidak ada bimbingan yang sesuai filter" : "Pengajuan bimbingan dari mahasiswa akan muncul di sini"}
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden", overflowX: "auto" }}>
                  <Table sx={{ minWidth: 800 }}>
                    <TableHead>
                      <TableRow>
                        {["Topik", "Tim", "Diajukan Oleh", "Tanggal Bimbingan", "Metode", "Status", "Aksi"].map((h, i) => (
                          <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 6 && { textAlign: "center" }) }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.map((b) => {
                        const si     = STATUS_BIMBINGAN[b.status];
                        const metode = METODE_LABEL[b.metode];
                        return (
                          <TableRow key={b.id_bimbingan} sx={tableBodyRow}>
                            <TableCell sx={{ maxWidth: 240 }}>
                              <Typography sx={{
                                fontWeight: 600, fontSize: 14, maxWidth: 240, lineHeight: 1.4,
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                              }}>
                                {b.topik}
                              </Typography>
                              {b.judul_proposal && (
                                <Typography sx={{
                                  fontSize: 12, color: COLORS.slate, mt: 0.25, maxWidth: 240,
                                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                }}>
                                  {b.judul_proposal}
                                </Typography>
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
                              <StatusPill label={metode?.label || "—"} backgroundColor={metode?.backgroundColor || "#555"} />
                            </TableCell>
                            <TableCell>
                              <StatusPill label={si?.label || "—"} backgroundColor={si?.backgroundColor || "#9e9e9e"} />
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: "inline-flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
                                <Button
                                  size="small" variant="outlined"
                                  onClick={() => navigate(`/dosen/bimbingan/pengajuan/${b.id_bimbingan}`)}
                                  sx={{
                                    textTransform: "none", borderRadius: "10px",
                                    fontSize: 12, fontWeight: 600, px: 2,
                                    borderColor: COLORS.primary, color: COLORS.primary,
                                    "&:hover": { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
                                  }}
                                >
                                  Detail
                                </Button>
                                {b.status === 0 && (
                                  <>
                                    <Button
                                      size="small" variant="contained"
                                      onClick={() => handleOpenReject(b)}
                                      disabled={submittingId === b.id_bimbingan}
                                      sx={{
                                        textTransform: "none", borderRadius: "10px",
                                        fontSize: 12, fontWeight: 600, px: 2,
                                        background: `linear-gradient(135deg, ${COLORS.error}, #EF4444)`,
                                        boxShadow: "none",
                                        "&:hover": { background: `linear-gradient(135deg, #B91C1C, ${COLORS.error})`, boxShadow: "none" },
                                        "&:disabled": { background: "#E5E7EB", color: "#9CA3AF", boxShadow: "none" },
                                      }}
                                    >
                                      Tolak
                                    </Button>
                                    <Button
                                      size="small" variant="contained"
                                      onClick={() => handleApprove(b)}
                                      disabled={submittingId === b.id_bimbingan}
                                      sx={{
                                        textTransform: "none", borderRadius: "10px",
                                        fontSize: 12, fontWeight: 600, px: 2,
                                        background: `linear-gradient(135deg, ${COLORS.success}, #34D399)`,
                                        boxShadow: "none",
                                        "&:hover": { background: `linear-gradient(135deg, #047857, ${COLORS.success})`, boxShadow: "none" },
                                        "&:disabled": { background: "#E5E7EB", color: "#9CA3AF", boxShadow: "none" },
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
            </Box>
          </Paper>

        </Box>
      </PageTransition>

      <Dialog
        open={rejectDialogOpen} onClose={handleCloseReject}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden" } }}
      >
        <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.error}, #EF4444)` }} />

        <DialogTitle sx={{ pb: 1.5, pt: 2.5, px: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: "10px",
              background: `linear-gradient(135deg, ${COLORS.error}, #EF4444)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Close sx={{ color: "#fff", fontSize: 18 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Tolak Pengajuan Bimbingan</Typography>
          </Box>
          <IconButton
            onClick={handleCloseReject}
            sx={{ position: "absolute", right: 12, top: 14, color: COLORS.slate, borderRadius: "10px", "&:hover": { backgroundColor: COLORS.slateLight } }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 3 }}>
          <Box sx={{
            mb: 3, p: 2.5, borderRadius: "12px",
            backgroundColor: COLORS.errorLight, border: `1.5px solid #FCA5A5`,
            display: "flex", gap: 1.5, alignItems: "flex-start",
          }}>
            <Box sx={{ width: 8, height: 8, mt: 0.5, borderRadius: "50%", background: COLORS.error, flexShrink: 0 }} />
            <Box>
              <Typography sx={{ fontSize: 12, color: COLORS.error, fontWeight: 700, mb: 0.3 }}>
                Bimbingan yang akan ditolak
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#991B1B" }}>
                {selectedBimbingan?.nama_tim || "—"}
              </Typography>
              {selectedBimbingan?.topik && (
                <Typography sx={{ fontSize: 13, color: "#7F1D1D", mt: 0.25 }}>
                  Topik: {selectedBimbingan.topik}
                </Typography>
              )}
            </Box>
          </Box>

          <FieldLabel required>Catatan Penolakan</FieldLabel>
          <TextField
            fullWidth multiline rows={4}
            placeholder="Masukkan catatan penolakan (minimal 5 karakter)..."
            value={catatan}
            onChange={(e) => { setCatatan(e.target.value); setErrors({}); }}
            error={!!errors.catatan} helperText={errors.catatan}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px", backgroundColor: "#fff",
                "&:hover fieldset": { borderColor: COLORS.error },
                "&.Mui-focused fieldset": { borderColor: COLORS.error },
                "&.Mui-focused": { boxShadow: `0 0 0 3px ${COLORS.errorLight}` },
              },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={handleCloseReject}
            sx={{
              textTransform: "none", borderRadius: "12px", px: 3, py: 1,
              fontWeight: 700, fontSize: 14, color: COLORS.slate,
              border: `1.5px solid #CBD5E1`,
              "&:hover": { backgroundColor: COLORS.slateLight },
            }}
          >
            Batal
          </Button>
          <Button
            variant="contained" onClick={handleReject} disabled={!!submittingId}
            sx={{
              textTransform: "none", borderRadius: "12px", px: 3, py: 1,
              fontWeight: 700, fontSize: 14,
              background: `linear-gradient(135deg, ${COLORS.error}, #EF4444)`,
              boxShadow: `0 4px 15px rgba(220,38,38,0.35)`,
              "&:hover": { background: `linear-gradient(135deg, #B91C1C, ${COLORS.error})`, boxShadow: `0 6px 20px rgba(220,38,38,0.45)` },
              "&:disabled": { background: "#E5E7EB", color: "#9CA3AF", boxShadow: "none" },
            }}
          >
            {submittingId ? "Memproses..." : "Tolak Bimbingan"}
          </Button>
        </DialogActions>
      </Dialog>
    </BodyLayout>
  );
}