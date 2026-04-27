import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, InputAdornment,
} from "@mui/material";
import { Close, Assignment, FilterList, Search } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import JuriNavbar from "../../components/layouts/JuriNavbar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getListPenugasan, acceptPenugasan, rejectPenugasan } from "../../api/juri";

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
    backgroundColor, color: "#fff",
    fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
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

const getStatusInfo = (status) => {
  const map = {
    0: { label: "Menunggu Response", backgroundColor: "#f57f17" },
    1: { label: "Disetujui",         backgroundColor: COLORS.success },
    2: { label: "Ditolak",           backgroundColor: COLORS.error },
    3: { label: "Draft Penilaian",   backgroundColor: COLORS.secondary },
    4: { label: "Selesai Dinilai",   backgroundColor: "#6a1b9a" },
  };
  return map[status] || { label: "Unknown", backgroundColor: COLORS.slate };
};

const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const formatRupiah = (v) => {
  if (!v) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(v);
};

const toNumberOrNull = (value) => {
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const isAcceptedStatus = (status) => [1, 3, 4].includes(Number(status));

export default function PenugasanJuriPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [penugasan, setPenugasan] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [rejectDialog, setRejectDialog] = useState({ open: false, penugasan: null });
  const [catatan, setCatatan] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [pairApprovalMap, setPairApprovalMap] = useState({});

  const fetchPenugasan = useCallback(async () => {
    try {
      setLoading(true);
      setPairApprovalMap({});
      const response = await getListPenugasan(statusFilter);
      if (response.success) {
        const list = response.data.penugasan || [];
        setPenugasan(list);
        if (list.length > 0) {
          const details = list.map((item) => {
            const tahap = toNumberOrNull(item?.urutan_tahap ?? item?.tahap);
            const statusReviewer = toNumberOrNull(item?.status_reviewer);
            const statusJuri = toNumberOrNull(item?.status_juri);
            const blocked = tahap === 2 && !(isAcceptedStatus(statusReviewer) && isAcceptedStatus(statusJuri));
            return [item.id_distribusi, { tahap, statusReviewer, statusJuri, blocked }];
          });
          setPairApprovalMap(Object.fromEntries(details));
        }
      } else {
        await Swal.fire({ icon: "warning", title: "Peringatan", text: response.message || "Gagal memuat daftar penugasan", confirmButtonText: "OK" });
      }
    } catch {
      await Swal.fire({ icon: "error", title: "Gagal Memuat", text: "Gagal memuat daftar penugasan. Silahkan refresh halaman.", confirmButtonText: "OK" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchPenugasan(); }, [fetchPenugasan]);

  const handleAccept = async (item) => {
    const result = await Swal.fire({
      title: "Konfirmasi",
      html: `Terima penugasan untuk proposal:<br/><br/><b>${item.judul}</b>?`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: COLORS.success, cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Terima", cancelButtonText: "Batal",
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
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan saat menerima penugasan", confirmButtonText: "OK" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReject = (item) => { setRejectDialog({ open: true, penugasan: item }); setCatatan(""); setErrors({}); };
  const handleCloseReject = () => { setRejectDialog({ open: false, penugasan: null }); setCatatan(""); setErrors({}); };

  const handleReject = async () => {
    if (!catatan || catatan.trim().length < 5) {
      setErrors({ catatan: "Catatan penolakan minimal 5 karakter" });
      return;
    }
    setRejectDialog((prev) => ({ ...prev, open: false }));
    const result = await Swal.fire({
      title: "Konfirmasi",
      html: `Tolak penugasan untuk proposal:<br/><br/><b>${rejectDialog.penugasan.judul}</b>?`,
      icon: "warning", showCancelButton: true,
      confirmButtonColor: COLORS.error, cancelButtonColor: "#666",
      confirmButtonText: "Ya, Tolak", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) { setRejectDialog((prev) => ({ ...prev, open: true })); return; }
    try {
      setSubmitting(true);
      const response = await rejectPenugasan(rejectDialog.penugasan.id_distribusi, catatan.trim());
      if (response.success) {
        Swal.fire({ icon: "success", title: "Berhasil", text: response.message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
        handleCloseReject();
        fetchPenugasan();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message, confirmButtonText: "OK" });
        setRejectDialog((prev) => ({ ...prev, open: true }));
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan saat menolak penugasan", confirmButtonText: "OK" });
      setRejectDialog((prev) => ({ ...prev, open: true }));
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = penugasan.filter((item) => {
    const q = search.toLowerCase();
    return (
      (item.judul         || "").toLowerCase().includes(q) ||
      (item.nama_tim      || "").toLowerCase().includes(q) ||
      (item.keterangan    || "").toLowerCase().includes(q) ||
      (item.nama_kategori || "").toLowerCase().includes(q)
    );
  });

  const blockedTahap2Count = penugasan.filter((item) => pairApprovalMap[item.id_distribusi]?.blocked).length;

  return (
    <BodyLayout Sidebar={JuriNavbar}>
      <PageTransition>
        <Box>

          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Penugasan Saya
            </Typography>
            <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
              Kelola penugasan penilaian wawancara proposal
            </Typography>
          </Box>

          <Paper elevation={0} sx={{ mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <SectionHeader
                icon={FilterList}
                title="Filter Penugasan"
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
                    <MenuItem value="0">Menunggu Response</MenuItem>
                    <MenuItem value="1">Disetujui</MenuItem>
                    <MenuItem value="2">Ditolak</MenuItem>
                    <MenuItem value="3">Draft Penilaian</MenuItem>
                    <MenuItem value="4">Selesai Dinilai</MenuItem>
                  </TextField>
                </Box>
                <Box sx={{ minWidth: 280, flex: "2 1 auto" }}>
                  <TextField
                    fullWidth label="Cari"
                    placeholder="Cari judul, tim, program, kategori..."
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

          {blockedTahap2Count > 0 && (
            <Box sx={{
              mb: 3, p: 2.5, borderRadius: "12px",
              backgroundColor: COLORS.warningLight, border: `1.5px solid #FCD34D`,
              display: "flex", gap: 1.5, alignItems: "flex-start",
            }}>
              <Box sx={{ width: 8, height: 8, mt: 0.5, borderRadius: "50%", background: COLORS.warning, flexShrink: 0 }} />
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.warning, mb: 0.25 }}>
                  Penilaian tahap 2 belum aktif untuk sebagian penugasan.
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#92400E" }}>
                  {blockedTahap2Count} penugasan menunggu reviewer dan juri sama-sama menyetujui penugasan.
                </Typography>
              </Box>
            </Box>
          )}

          <Paper elevation={0} sx={{ borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.success})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <SectionHeader
                icon={Assignment}
                title="Daftar Penugasan"
                subtitle={`${filtered.length} penugasan ditemukan`}
                gradient={`linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.success} 100%)`}
              />

              {loading ? (
                <Box sx={{ position: "relative", minHeight: 320 }}>
                  <LoadingScreen message="Memuat penugasan juri..." overlay minHeight="320px" />
                </Box>
              ) : filtered.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Box sx={{
                    width: 90, height: 90, borderRadius: "50%",
                    backgroundColor: COLORS.slateLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mx: "auto", mb: 2.5,
                  }}>
                    <Assignment sx={{ fontSize: 44, color: "#CBD5E1" }} />
                  </Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#374151", mb: 0.5 }}>
                    Belum Ada Penugasan
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: COLORS.slate }}>
                    {search || statusFilter ? "Tidak ada penugasan yang sesuai filter" : "Penugasan penilaian yang diberikan akan muncul di sini"}
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden", overflowX: "auto" }}>
                  <Table sx={{ minWidth: 900 }}>
                    <TableHead>
                      <TableRow>
                        {["Judul Proposal", "Nama Tim", "Program", "Kategori", "Modal", "Timeline Penilaian", "Status", "Aksi"].map((h, i) => (
                          <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 7 && { textAlign: "center" }) }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.map((item) => {
                        const si = getStatusInfo(item.status);
                        return (
                          <TableRow key={item.id_distribusi} sx={tableBodyRow}>
                            <TableCell>
                              <Typography sx={{ fontWeight: 600, fontSize: 14, maxWidth: 220, lineHeight: 1.4 }}>{item.judul}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13 }}>{item.nama_tim}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13 }}>{item.keterangan}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13 }}>{item.nama_kategori}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13 }}>{formatRupiah(item.modal_diajukan)}</Typography>
                            </TableCell>
                            <TableCell>
                              {item.penilaian_mulai && item.penilaian_selesai ? (
                                <Box>
                                  <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{formatDate(item.penilaian_mulai)}</Typography>
                                  <Typography sx={{ fontSize: 11, color: "#CBD5E1" }}>s/d</Typography>
                                  <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{formatDate(item.penilaian_selesai)}</Typography>
                                </Box>
                              ) : (
                                <Typography sx={{ fontSize: 13, color: "#CBD5E1" }}>-</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <StatusPill label={si.label} backgroundColor={si.backgroundColor} />
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: "inline-flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
                                {item.status === 0 && (
                                  <>
                                    <Button
                                      size="small" variant="contained"
                                      onClick={() => handleOpenReject(item)}
                                      disabled={submitting}
                                      sx={{
                                        textTransform: "none", borderRadius: "10px",
                                        fontSize: 12, fontWeight: 600, px: 2,
                                        background: COLORS.error,
                                        boxShadow: "none",
                                        "&:hover": { background: `linear-gradient(135deg, #B91C1C, ${COLORS.error})`, boxShadow: "none" },
                                        "&:disabled": { background: "#E5E7EB", color: "#9CA3AF", boxShadow: "none" },
                                      }}
                                    >
                                      Tolak
                                    </Button>
                                    <Button
                                      size="small" variant="contained"
                                      onClick={() => handleAccept(item)}
                                      disabled={submitting}
                                      sx={{
                                        textTransform: "none", borderRadius: "10px",
                                        fontSize: 12, fontWeight: 600, px: 2,
                                        background: COLORS.success,
                                        boxShadow: "none",
                                        "&:hover": { background: `linear-gradient(135deg, #047857, ${COLORS.success})`, boxShadow: "none" },
                                        "&:disabled": { background: "#E5E7EB", color: "#9CA3AF", boxShadow: "none" },
                                      }}
                                    >
                                      {submitting ? "Memproses..." : "Terima"}
                                    </Button>
                                  </>
                                )}
                                {item.status !== 0 && (
                                  <>
                                    <Button
                                      size="small" variant="outlined"
                                      onClick={() => navigate(`/juri/penugasan/${item.id_distribusi}?tab=0`)}
                                      sx={{
                                        textTransform: "none", borderRadius: "10px",
                                        fontSize: 12, fontWeight: 600, px: 2,
                                        borderColor: COLORS.primary, color: COLORS.primary,
                                        "&:hover": { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
                                      }}
                                    >
                                      Detail
                                    </Button>
                                    <Button
                                      size="small" variant="contained"
                                      onClick={() => navigate(`/juri/penugasan/${item.id_distribusi}?tab=1`)}
                                      disabled={![1, 3].includes(item.status) || !!pairApprovalMap[item.id_distribusi]?.blocked}
                                      sx={{
                                        textTransform: "none", borderRadius: "10px",
                                        fontSize: 12, fontWeight: 600, px: 2,
                                        background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
                                        boxShadow: "none",
                                        "&:hover": { background: `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary})`, boxShadow: "none" },
                                        "&:disabled": { background: "#E5E7EB", color: "#9CA3AF", boxShadow: "none" },
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
            </Box>
          </Paper>

          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: 13, color: COLORS.slate }}>Total: {penugasan.length} penugasan</Typography>
          </Box>

        </Box>
      </PageTransition>

      <Dialog
        open={rejectDialog.open}
        onClose={handleCloseReject}
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
            <Typography sx={{ fontWeight: 700, fontSize: 16, color: "#1F2937" }}>Tolak Penugasan</Typography>
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
                Proposal yang akan ditolak
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#991B1B" }}>
                {rejectDialog.penugasan?.judul}
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

        <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
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
            variant="contained" onClick={handleReject} disabled={!!submitting}
            sx={{
              textTransform: "none", borderRadius: "12px", px: 3, py: 1,
              fontWeight: 700, fontSize: 14,
              background: `linear-gradient(135deg, ${COLORS.error}, #EF4444)`,
              boxShadow: `0 4px 15px rgba(220,38,38,0.35)`,
              "&:hover": { background: `linear-gradient(135deg, #B91C1C, ${COLORS.error})`, boxShadow: `0 6px 20px rgba(220,38,38,0.45)` },
              "&:disabled": { background: "#E5E7EB", color: "#9CA3AF", boxShadow: "none" },
            }}
          >
            {submitting ? "Memproses..." : "Tolak Penugasan"}
          </Button>
        </DialogActions>
      </Dialog>

    </BodyLayout>
  );
}