import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button,
  TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from "@mui/material";
import { Search, Inbox, Close, HowToReg } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import DosenNavbar from "../../components/layouts/DosenNavbar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getPengajuanMasuk, approvePengajuan, rejectPengajuan } from "../../api/dosen";

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

const STATUS_PENGAJUAN = {
  0: { label: "Menunggu Respon", backgroundColor: "#f57f17" },
  1: { label: "Disetujui",       backgroundColor: "#2e7d32" },
  2: { label: "Ditolak",         backgroundColor: "#c62828" },
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
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const isPengajuanReassigned = (item) => {
  if (item?.is_reassigned === true) return true;
  const source = item?.pengajuan_raw || item?.pengajuan || item;
  return Boolean(
    source?.is_reassign || source?.is_reassigned || source?.reassigned ||
    source?.reassign || source?.dari_reassign || source?.reassigned_at ||
    source?.reassign_at || source?.id_pengajuan_sebelumnya ||
    source?.id_pengajuan_lama || source?.id_dosen_sebelumnya ||
    source?.id_dosen_lama || (Number(source?.reassign_count) > 0) ||
    String(source?.sumber || "").toLowerCase() === "reassign" ||
    String(source?.jenis_pengajuan || "").toLowerCase().includes("reassign") ||
    String(source?.tipe_pengajuan || "").toLowerCase().includes("reassign") ||
    String(source?.catatan_admin || "").toLowerCase().includes("reassign") ||
    String(source?.keterangan_admin || "").toLowerCase().includes("reassign")
  );
};

export default function DaftarPengajuanPembimbingPage() {
  const navigate = useNavigate();
  const [loading, setLoading]                   = useState(true);
  const [pengajuanList, setPengajuanList]       = useState([]);
  const [search, setSearch]                     = useState("");
  const [submittingId, setSubmittingId]         = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPengajuan, setSelectedPengajuan] = useState(null);
  const [catatan, setCatatan]                   = useState("");
  const [errors, setErrors]                     = useState({});

  const fetchPengajuan = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPengajuanMasuk();
      if (res.success) setPengajuanList(res.data || []);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat daftar pengajuan", confirmButtonText: "OK" });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPengajuan(); }, [fetchPengajuan]);

  const filtered = pengajuanList.filter((p) =>
    (p.nama_tim         || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.keterangan       || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.mahasiswa_pengaju || "").toLowerCase().includes(search.toLowerCase())
  );

  const reassignedPengajuan = pengajuanList.filter((p) => isPengajuanReassigned(p));
  const reassignedTimNames  = [...new Set(reassignedPengajuan.map((item) => item.nama_tim).filter(Boolean))];
  const reassignedTimPreview = reassignedTimNames.slice(0, 3).join(", ");
  const pending = pengajuanList.filter((p) => p.status === 0).length;

  const handleApprove = async (p) => {
    const result = await Swal.fire({
      title: "Setujui Pengajuan?",
      html: `Anda akan menyetujui pengajuan pembimbing dari tim <b>${p.nama_tim}</b>.<br/><br/>Lanjutkan?`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: COLORS.success, cancelButtonColor: "#666",
      confirmButtonText: "Ya, Setujui", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      setSubmittingId(p.id_pengajuan);
      const res = await approvePengajuan(p.id_pengajuan);
      await Swal.fire({ icon: "success", title: "Berhasil", text: res.message || "Pengajuan pembimbing disetujui", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchPengajuan();
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menyetujui pengajuan", confirmButtonText: "OK" });
    } finally { setSubmittingId(null); }
  };

  const handleOpenReject = (p) => { setSelectedPengajuan(p); setCatatan(""); setErrors({}); setRejectDialogOpen(true); };
  const handleCloseReject = () => { setRejectDialogOpen(false); setSelectedPengajuan(null); setCatatan(""); setErrors({}); };

  const handleReject = async () => {
    if (!catatan || catatan.trim().length < 5) { setErrors({ catatan: "Catatan penolakan minimal 5 karakter" }); return; }
    setRejectDialogOpen(false);
    const result = await Swal.fire({
      title: "Tolak Pengajuan?",
      html: `Anda akan menolak pengajuan pembimbing dari tim <b>${selectedPengajuan?.nama_tim}</b>.<br/><br/>Lanjutkan?`,
      icon: "warning", showCancelButton: true,
      confirmButtonColor: COLORS.error, cancelButtonColor: "#666",
      confirmButtonText: "Ya, Tolak", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) { setRejectDialogOpen(true); return; }
    try {
      setSubmittingId(selectedPengajuan?.id_pengajuan);
      const res = await rejectPengajuan(selectedPengajuan?.id_pengajuan, catatan.trim());
      await Swal.fire({ icon: "success", title: "Pengajuan Ditolak", text: res.message || "Pengajuan pembimbing ditolak", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchPengajuan();
      setSelectedPengajuan(null);
      setCatatan("");
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menolak pengajuan", confirmButtonText: "OK" });
    } finally { setSubmittingId(null); }
  };

  return (
    <BodyLayout Sidebar={DosenNavbar}>
      <PageTransition>
        <Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
                Pengajuan Pembimbing
              </Typography>
              <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
                Kelola pengajuan dosen pembimbing dari mahasiswa
              </Typography>
            </Box>
            {pending > 0 && (
              <Box sx={{
                px: 2, py: 1, borderRadius: "12px",
                backgroundColor: COLORS.warningLight, border: `1.5px solid #FDE68A`,
                display: "flex", alignItems: "center", gap: 1,
              }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.warning }} />
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#92400E" }}>
                  {pending} menunggu respon
                </Typography>
              </Box>
            )}
          </Box>

          {reassignedPengajuan.length > 0 && (
            <Box sx={{
              mb: 3, p: 2.5, borderRadius: "12px",
              backgroundColor: COLORS.primaryLight, border: `1.5px solid ${COLORS.primaryMuted}`,
              display: "flex", gap: 1.5, alignItems: "flex-start",
            }}>
              <Box sx={{ width: 8, height: 8, mt: 0.6, borderRadius: "50%", background: COLORS.primary, flexShrink: 0 }} />
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.primaryDark, mb: 0.3 }}>
                  Keterangan Reassign
                </Typography>
                <Typography sx={{ fontSize: 13, color: COLORS.primaryDark }}>
                  Anda telah di-reassign ke tim {reassignedTimPreview}
                  {reassignedTimNames.length > 3 ? ` dan ${reassignedTimNames.length - 3} tim lainnya` : ""}.
                </Typography>
              </Box>
            </Box>
          )}

          <Paper elevation={0} sx={{ borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <SectionHeader
                icon={HowToReg}
                title="Daftar Pengajuan"
                subtitle={`${filtered.length} pengajuan ditemukan`}
                gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
              />

              <Box sx={{ mb: 3 }}>
                <TextField
                  size="small" fullWidth
                  placeholder="Cari tim, program, mahasiswa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ fontSize: 18, color: COLORS.slate }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ maxWidth: { xs: "100%", sm: 360 }, ...roundedField }}
                />
              </Box>

              {loading ? (
                <Box sx={{ position: "relative", minHeight: 320 }}>
                  <LoadingScreen message="Memuat pengajuan pembimbing..." overlay minHeight="320px" />
                </Box>
              ) : filtered.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Box sx={{
                    width: 90, height: 90, borderRadius: "50%",
                    backgroundColor: COLORS.slateLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mx: "auto", mb: 2.5,
                  }}>
                    <Inbox sx={{ fontSize: 44, color: "#CBD5E1" }} />
                  </Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#374151", mb: 0.5 }}>
                    {search ? "Pengajuan tidak ditemukan" : "Belum ada pengajuan masuk"}
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: COLORS.slate }}>
                    {search ? "Coba kata kunci lain" : "Pengajuan dari mahasiswa akan muncul di sini"}
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden", overflowX: "auto" }}>
                  <Table sx={{ minWidth: 700 }}>
                    <TableHead>
                      <TableRow>
                        {["Tim", "Program", "Diajukan Oleh", "Tanggal Pengajuan", "Status", "Aksi"].map((h, i) => (
                          <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 5 && { textAlign: "center" }) }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.map((p) => {
                        const si           = STATUS_PENGAJUAN[p.status];
                        const isReassigned = isPengajuanReassigned(p);
                        return (
                          <TableRow key={p.id_pengajuan} sx={tableBodyRow}>
                            <TableCell>
                              <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{p.nama_tim}</Typography>
                              {isReassigned && (
                                <Typography sx={{ fontSize: 12, color: COLORS.primary, fontWeight: 600, mt: 0.4 }}>
                                  Anda telah di-reassign ke tim ini
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13 }}>{p.keterangan || "—"}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13 }}>{p.mahasiswa_pengaju}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13 }}>{formatDate(p.created_at)}</Typography>
                            </TableCell>
                            <TableCell>
                              <StatusPill label={si?.label || "—"} backgroundColor={si?.backgroundColor || "#9e9e9e"} />
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: "inline-flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
                                <Button
                                  size="small" variant="outlined"
                                  onClick={() => navigate(`/dosen/pembimbing/pengajuan/${p.id_pengajuan}`)}
                                  sx={{
                                    textTransform: "none", borderRadius: "10px",
                                    fontSize: 12, fontWeight: 600, px: 2,
                                    borderColor: COLORS.primary, color: COLORS.primary,
                                    "&:hover": { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
                                  }}
                                >
                                  Detail
                                </Button>
                                {p.status === 0 && (
                                  <>
                                    <Button
                                      size="small" variant="contained"
                                      onClick={() => handleOpenReject(p)}
                                      disabled={submittingId === p.id_pengajuan}
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
                                      onClick={() => handleApprove(p)}
                                      disabled={submittingId === p.id_pengajuan}
                                      sx={{
                                        textTransform: "none", borderRadius: "10px",
                                        fontSize: 12, fontWeight: 600, px: 2,
                                        background: `linear-gradient(135deg, ${COLORS.success}, #34D399)`,
                                        boxShadow: "none",
                                        "&:hover": { background: `linear-gradient(135deg, #047857, ${COLORS.success})`, boxShadow: "none" },
                                        "&:disabled": { background: "#E5E7EB", color: "#9CA3AF", boxShadow: "none" },
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
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Tolak Pengajuan Pembimbing</Typography>
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
                Tim yang akan ditolak
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#991B1B" }}>
                {selectedPengajuan?.nama_tim || "—"}
              </Typography>
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
            {submittingId ? "Memproses..." : "Tolak Pengajuan"}
          </Button>
        </DialogActions>
      </Dialog>
    </BodyLayout>
  );
}