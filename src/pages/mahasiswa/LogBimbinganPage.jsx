import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton,
} from "@mui/material";
import { Close, BookOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import MahasiswaNavbar from "../../components/layouts/MahasiswaNavbar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getListBimbingan, ajukanBimbingan, getStatusPembimbing } from "../../api/mahasiswa";

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
      <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{title}</Typography>
      {subtitle && <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.8)", mt: 0.3 }}>{subtitle}</Typography>}
    </Box>
  </Box>
);

const FieldLabel = ({ children }) => (
  <Typography sx={{ fontWeight: 600, mb: 0.8, fontSize: 13, color: "#374151" }}>
    {children}
  </Typography>
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

const InfoBox = ({ children, type = "info" }) => {
  const styles = {
    info: { bg: COLORS.primaryLight, border: COLORS.primaryMuted, dot: COLORS.primary, text: COLORS.primaryDark },
    warning: { bg: COLORS.warningLight, border: "#FDE68A", dot: COLORS.warning, text: "#92400E" },
    error: { bg: COLORS.errorLight, border: "#FCA5A5", dot: COLORS.error, text: "#7F1D1D" },
    success: { bg: COLORS.successLight, border: "#6EE7B7", dot: COLORS.success, text: "#065F46" },
  };
  const s = styles[type] || styles.info;
  return (
    <Box sx={{
      mb: 3, p: 2.5, borderRadius: "14px",
      background: s.bg, border: `1.5px solid ${s.border}`,
      display: "flex", gap: 1.5, alignItems: "flex-start",
    }}>
      <Box sx={{ width: 8, height: 8, mt: 0.8, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      <Typography sx={{ fontSize: 13.5, color: s.text, fontWeight: 600, lineHeight: 1.6 }}>
        {children}
      </Typography>
    </Box>
  );
};

const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#1F2937",
  backgroundColor: COLORS.slateLight, borderBottom: `2px solid #E5E7EB`, py: 2,
};

const tableBodyRow = {
  "&:hover": { backgroundColor: "#F8FAFF" },
  "& td": { borderBottom: "1px solid #F3F4F6", py: 2 },
};

const STATUS_BIMBINGAN = {
  0: { label: "Menunggu Konfirmasi", backgroundColor: COLORS.warning },
  1: { label: "Disetujui", backgroundColor: COLORS.success },
  2: { label: "Ditolak", backgroundColor: COLORS.error },
};

const METODE_OPTIONS = [
  { value: 1, label: "Online" },
  { value: 2, label: "Offline" },
];

const METODE_PILL = {
  1: { label: "Online", backgroundColor: COLORS.primary },
  2: { label: "Offline", backgroundColor: COLORS.slate },
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateDisplay = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const swalOptions = {
  customClass: { container: "swal-over-dialog" },
  didOpen: () => {
    const container = document.querySelector(".swal-over-dialog");
    if (container) container.style.zIndex = "99999";
  },
};

const emptyForm = {
  tanggal_bimbingan: "",
  metode: "",
  topik: "",
  deskripsi: "",
};

export default function LogBimbinganPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bimbinganList, setBimbinganList] = useState([]);
  const [isKetua, setIsKetua] = useState(false);
  const [pembimbingInfo, setPembimbingInfo] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchBimbingan = useCallback(async () => {
    try {
      setLoading(true);
      const [bimbinganRes, pembimbingRes] = await Promise.all([
        getListBimbingan(),
        getStatusPembimbing(),
      ]);

      if (bimbinganRes.success) {
        const list = bimbinganRes.data?.bimbingan || [];
        setBimbinganList(list);
        setIsKetua(bimbinganRes.data?.is_ketua || false);
      } else {
        setStatusMessage(bimbinganRes.message || "Gagal memuat data bimbingan");
      }

      if (pembimbingRes.success) {
        setPembimbingInfo(pembimbingRes.data || null);
      }

      if (bimbinganRes.success) setStatusMessage(null);
    } catch (err) {
      setStatusMessage(
        err.response?.data?.message ||
          "Gagal memuat data bimbingan. Silahkan refresh halaman.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBimbingan();
  }, [fetchBimbingan]);

  const pengajuanPembimbing = pembimbingInfo?.pengajuan;
  const sudahAjukanPembimbing = !!pengajuanPembimbing;
  const pembimbingDisetujui = pengajuanPembimbing?.status === 1;
  const canAjukanBimbingan =
    isKetua && sudahAjukanPembimbing && pembimbingDisetujui;

  const handleOpenDialog = () => {
    setForm(emptyForm);
    setFormError({});
    setDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setForm(emptyForm);
    setFormError({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!form.tanggal_bimbingan)
      errors.tanggal_bimbingan = "Tanggal wajib diisi";
    if (!form.metode) errors.metode = "Metode wajib dipilih";
    if (!form.topik.trim()) errors.topik = "Topik wajib diisi";
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormError(errors);
      return;
    }

    const metodeLabel =
      METODE_OPTIONS.find((m) => m.value === Number(form.metode))?.label || "-";
    const result = await Swal.fire({
      ...swalOptions,
      title: "Ajukan Bimbingan?",
      html: `Topik: <b>${form.topik}</b><br/>Tanggal: <b>${formatDateDisplay(form.tanggal_bimbingan)}</b><br/>Metode: <b>${metodeLabel}</b><br/><br/>Lanjutkan?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0D59F2",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Ajukan",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;

    handleCloseDialog();
    try {
      setSubmitting(true);
      const res = await ajukanBimbingan({
        tanggal_bimbingan: form.tanggal_bimbingan,
        metode: Number(form.metode),
        topik: form.topik,
        deskripsi: form.deskripsi || undefined,
      });
      if (res.success) {
        await Swal.fire({
          ...swalOptions,
          icon: "success",
          title: "Berhasil",
          text: res.message || "Pengajuan bimbingan berhasil dikirim",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        fetchBimbingan();
      } else {
        await Swal.fire({
          ...swalOptions,
          icon: "error",
          title: "Gagal",
          text: res.message || "Terjadi kesalahan",
        });
      }
    } catch (err) {
      await Swal.fire({
        ...swalOptions,
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Gagal mengajukan bimbingan",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BodyLayout Sidebar={MahasiswaNavbar}>
      <PageTransition>
        <Box>

          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Log Bimbingan
            </Typography>
            <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
              Riwayat dan pengajuan sesi bimbingan dengan dosen pembimbing
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 4 }}>
            <Button
              variant="contained"
              onClick={handleOpenDialog}
              disabled={!canAjukanBimbingan}
              sx={{
                textTransform: "none", borderRadius: "10px",
                backgroundColor: COLORS.primary,
                px: 4, py: 1.3, fontWeight: 700,
                "&:hover": { backgroundColor: COLORS.primaryDark },
                "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" },
              }}
            >
              Ajukan Bimbingan
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ position: "relative", minHeight: 320 }}>
              <LoadingScreen message="Memuat log bimbingan..." overlay minHeight="320px" />
            </Box>
          ) : bimbinganList.length === 0 ? (
            <Paper elevation={0} sx={{ borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
              <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
              <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
                <SectionHeader
                  icon={BookOutlined}
                  title="Belum Ada Riwayat Bimbingan"
                  subtitle="Data pengajuan bimbingan akan muncul di sini"
                  gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
                />
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <Box sx={{
                    width: 100, height: 100, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${COLORS.slateLight}, #E2E8F0)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mx: "auto", mb: 3, border: `3px solid ${COLORS.primaryMuted}`,
                  }}>
                    <BookOutlined sx={{ fontSize: 48, color: COLORS.slate }} />
                  </Box>
                  <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#1F2937", mb: 1 }}>
                    Belum Ada Riwayat Bimbingan
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: COLORS.slate, mb: 4, maxWidth: 420, mx: "auto", lineHeight: 1.7 }}>
                    {canAjukanBimbingan
                      ? "Silahkan ajukan sesi bimbingan terlebih dahulu."
                      : "Riwayat bimbingan akan muncul di sini setelah chairman tim mengajukan."}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{ borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
              <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
              <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
                <SectionHeader
                  icon={BookOutlined}
                  title="Riwayat Bimbingan"
                  subtitle="Daftar sesi bimbingan dengan dosen pembimbing"
                  gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
                />
                <TableContainer sx={{ borderRadius: "14px", border: "1.5px solid #E5E7EB", overflow: "hidden", overflowX: "auto" }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {["Topik", "Tanggal Bimbingan", "Metode", "Dosen", "Diajukan Oleh", "Status", "Aksi"].map((h, i) => (
                          <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 6 && { textAlign: "center" }) }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bimbinganList.map((b) => (
                        <TableRow key={b.id_bimbingan} sx={tableBodyRow}>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, fontSize: 14, maxWidth: 200 }}>
                              {b.topik}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, color: COLORS.slate }}>
                              {formatDate(b.tanggal_bimbingan)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <StatusPill label={METODE_PILL[b.metode]?.label || b.metode} backgroundColor={METODE_PILL[b.metode]?.backgroundColor || "#666"} />
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, color: COLORS.slate }}>{b.nama_dosen}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, color: COLORS.slate }}>{b.nama_pengaju}</Typography>
                          </TableCell>
                          <TableCell>
                            <StatusPill label={STATUS_BIMBINGAN[b.status]?.label || "-"} backgroundColor={STATUS_BIMBINGAN[b.status]?.backgroundColor || "#666"} />
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => navigate(`/mahasiswa/bimbingan/${b.id_bimbingan}`)}
                              sx={{
                                textTransform: "none", borderRadius: "10px",
                                fontSize: 13, fontWeight: 600, px: 2,
                                borderColor: COLORS.primary, color: COLORS.primary,
                                "&:hover": { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
                              }}
                            >
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Paper>
          )}
        </Box>
      </PageTransition>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
        <DialogTitle sx={{ pb: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 18, color: "#1F2937" }}>
            Ajukan Sesi Bimbingan
          </Typography>
          <IconButton onClick={handleCloseDialog} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              <FieldLabel>Tanggal Bimbingan <span style={{ color: COLORS.error }}>*</span></FieldLabel>
              <TextField
                fullWidth size="small" type="datetime-local"
                name="tanggal_bimbingan"
                value={form.tanggal_bimbingan}
                onChange={handleFormChange}
                error={!!formError.tanggal_bimbingan}
                helperText={formError.tanggal_bimbingan}
                InputLabelProps={{ shrink: true }}
                sx={roundedField}
              />
            </Box>
            <Box>
              <FieldLabel>Metode <span style={{ color: COLORS.error }}>*</span></FieldLabel>
              <TextField
                fullWidth select size="small" name="metode"
                value={form.metode}
                onChange={handleFormChange}
                error={!!formError.metode}
                helperText={formError.metode}
                sx={roundedField}
              >
                <MenuItem value="" disabled>Pilih metode bimbingan</MenuItem>
                {METODE_OPTIONS.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </TextField>
            </Box>
            <Box>
              <FieldLabel>Topik Bimbingan <span style={{ color: COLORS.error }}>*</span></FieldLabel>
              <TextField
                fullWidth size="small" name="topik"
                value={form.topik}
                onChange={handleFormChange}
                error={!!formError.topik}
                helperText={formError.topik}
                placeholder="Contoh: Revisi BAB 2 - Tinjauan Pustaka"
                sx={roundedField}
              />
            </Box>
            <Box>
              <FieldLabel>Deskripsi / Catatan</FieldLabel>
              <TextField
                fullWidth multiline rows={3} size="small"
                name="deskripsi"
                value={form.deskripsi}
                onChange={handleFormChange}
                placeholder="Opsional - tuliskan detail topik atau hal yang ingin didiskusikan"
                sx={roundedField}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{
          px: { xs: 2.5, sm: 3 }, py: { xs: 2, sm: 3 },
          gap: 1.5,
          flexDirection: { xs: "column", sm: "row" },
          "& > button": { width: { xs: "100%", sm: "auto" } },
        }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              textTransform: "none", borderRadius: "10px", px: 3, py: 1.2, fontWeight: 600,
              backgroundColor: COLORS.error, color: "#fff",
              "&:hover": { backgroundColor: "#B91C1C" },
            }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{
              textTransform: "none", borderRadius: "10px", px: 4, py: 1.2, fontWeight: 700,
              backgroundColor: COLORS.primary,
              "&:hover": { backgroundColor: COLORS.primaryDark },
              "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" },
            }}
          >
            {submitting ? "Memproses..." : "Ajukan Bimbingan"}
          </Button>
        </DialogActions>
      </Dialog>
    </BodyLayout>
  );
}