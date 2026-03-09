import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton,
} from "@mui/material";
import { Add, Close, BookOutlined, Visibility } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import SidebarMahasiswa from "../../components/layouts/MahasiswaSidebar";
import PageTransition from "../../components/PageTransition";
import { getListBimbingan, ajukanBimbingan } from "../../api/mahasiswa";

const roundedField = {
  "& .MuiOutlinedInput-root": { borderRadius: "12px" },
};

const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#000",
  backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 2,
};

const tableBodyRow = {
  "& td": { borderBottom: "1px solid #f5f5f5", py: 2 },
};

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

const InfoBox = ({ children, color, borderColor, bgColor }) => (
  <Box sx={{ mb: 3, p: 2, borderRadius: "12px", backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
    <Typography sx={{ fontSize: 14, color, fontWeight: 500 }}>{children}</Typography>
  </Box>
);

const STATUS_BIMBINGAN = {
  0: { label: "Menunggu Konfirmasi", backgroundColor: "#f57f17" },
  1: { label: "Disetujui",           backgroundColor: "#2e7d32" },
  2: { label: "Ditolak",             backgroundColor: "#c62828" },
};

const METODE_OPTIONS = [
  { value: 1, label: "Online" },
  { value: 2, label: "Offline" },
];

const METODE_PILL = {
  1: { label: "Online",  backgroundColor: "#1565c0" },
  2: { label: "Offline", backgroundColor: "#555" },
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const formatDateDisplay = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
  });
};

const swalOptions = {
  customClass: { container: "swal-over-dialog" },
  didOpen: () => {
    const container = document.querySelector(".swal-over-dialog");
    if (container) container.style.zIndex = "99999";
  },
};

const emptyForm = { tanggal_bimbingan: "", metode: "", topik: "", deskripsi: "" };

export default function LogBimbinganPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bimbinganList, setBimbinganList] = useState([]);
  const [canAjukan, setCanAjukan] = useState(false);
  const [isKetua, setIsKetua] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchBimbingan = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getListBimbingan();
      if (res.success) {
        const list = res.data?.bimbingan || [];
        setBimbinganList(list);
        setCanAjukan(!list.some((b) => b.status === 0));
        setIsKetua(res.data?.is_ketua || false);
      } else {
        await Swal.fire({
          icon: "warning", title: "Peringatan",
          text: res.message || "Gagal memuat data bimbingan",
          confirmButtonText: "OK",
        });
      }
    } catch {
      await Swal.fire({
        icon: "error", title: "Gagal Memuat",
        text: "Gagal memuat data bimbingan. Silakan refresh halaman.",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBimbingan(); }, [fetchBimbingan]);

  const handleOpenDialog = () => { setForm(emptyForm); setFormError({}); setDialogOpen(true); };
  const handleCloseDialog = () => { setDialogOpen(false); setForm(emptyForm); setFormError({}); };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!form.tanggal_bimbingan) errors.tanggal_bimbingan = "Tanggal wajib diisi";
    if (!form.metode) errors.metode = "Metode wajib dipilih";
    if (!form.topik.trim()) errors.topik = "Topik wajib diisi";
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormError(errors); return; }

    const metodeLabel = METODE_OPTIONS.find((m) => m.value === Number(form.metode))?.label || "-";
    const result = await Swal.fire({
      ...swalOptions,
      title: "Ajukan Bimbingan?",
      html: `Topik: <b>${form.topik}</b><br/>Tanggal: <b>${formatDateDisplay(form.tanggal_bimbingan)}</b><br/>Metode: <b>${metodeLabel}</b><br/><br/>Lanjutkan?`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: "#0D59F2", cancelButtonColor: "#666",
      confirmButtonText: "Ya, Ajukan", cancelButtonText: "Batal",
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
          ...swalOptions, icon: "success", title: "Berhasil",
          text: res.message || "Pengajuan bimbingan berhasil dikirim",
          timer: 2000, timerProgressBar: true, showConfirmButton: false,
        });
        fetchBimbingan();
      } else {
        await Swal.fire({ ...swalOptions, icon: "error", title: "Gagal", text: res.message || "Terjadi kesalahan" });
      }
    } catch (err) {
      await Swal.fire({
        ...swalOptions, icon: "error", title: "Gagal",
        text: err.response?.data?.message || "Gagal mengajukan bimbingan",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BodyLayout Sidebar={SidebarMahasiswa}>
      <PageTransition>
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 4 }}>
            <Box>
              <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Log Bimbingan</Typography>
              <Typography sx={{ fontSize: 14, color: "#777" }}>
                Riwayat dan pengajuan sesi bimbingan dengan dosen pembimbing
              </Typography>
            </Box>
            <Button
              variant="contained" startIcon={<Add />}
              onClick={handleOpenDialog}
              disabled={!canAjukan || !isKetua}
              sx={{
                textTransform: "none", borderRadius: "50px",
                backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0846c7" },
                px: 3, py: 1.2, fontWeight: 600,
              }}
            >
              Ajukan Bimbingan
            </Button>
          </Box>

          {!isKetua && !loading && (
            <InfoBox color="#1565c0" borderColor="#90caf9" bgColor="#e3f2fd">
              Hanya ketua tim yang dapat mengajukan bimbingan.
            </InfoBox>
          )}
          {!loading && bimbinganList.some((b) => b.status === 0) && isKetua && (
            <InfoBox color="#1565c0" borderColor="#90caf9" bgColor="#e3f2fd">
              Ada pengajuan bimbingan yang sedang menunggu konfirmasi dosen. Anda dapat mengajukan bimbingan baru setelah dosen merespons.
            </InfoBox>
          )}

          <Paper sx={{ overflow: "hidden", borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            ) : bimbinganList.length === 0 ? (
              <Box sx={{ py: 10, textAlign: "center" }}>
                <Box sx={{
                  width: 100, height: 100, borderRadius: "50%",
                  backgroundColor: "#f5f5f5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  mx: "auto", mb: 3,
                }}>
                  <BookOutlined sx={{ fontSize: 48, color: "#ccc" }} />
                </Box>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}>
                  Belum Ada Riwayat Bimbingan
                </Typography>
                <Typography sx={{ fontSize: 14, color: "#999" }}>
                  {isKetua
                    ? "Silakan ajukan sesi bimbingan terlebih dahulu."
                    : "Riwayat bimbingan akan muncul di sini setelah ketua tim mengajukan."}
                </Typography>
              </Box>
            ) : (
              <TableContainer>
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
                          <Typography sx={{ fontWeight: 600, fontSize: 14, maxWidth: 200 }}>{b.topik}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13 }}>{formatDate(b.tanggal_bimbingan)}</Typography>
                        </TableCell>
                        <TableCell>
                          <StatusPill
                            label={METODE_PILL[b.metode]?.label || b.metode}
                            backgroundColor={METODE_PILL[b.metode]?.backgroundColor || "#666"}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13 }}>{b.nama_dosen}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13 }}>{b.nama_pengaju}</Typography>
                        </TableCell>
                        <TableCell>
                          <StatusPill
                            label={STATUS_BIMBINGAN[b.status]?.label || "-"}
                            backgroundColor={STATUS_BIMBINGAN[b.status]?.backgroundColor || "#666"}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small" variant="outlined"
                            startIcon={<Visibility sx={{ fontSize: 14 }} />}
                            onClick={() => navigate(`/mahasiswa/bimbingan/${b.id_bimbingan}`)}
                            sx={{
                              textTransform: "none", borderRadius: "50px",
                              fontSize: 12, fontWeight: 600, px: 2,
                              borderColor: "#0D59F2", color: "#0D59F2",
                              "&:hover": { backgroundColor: "#f0f4ff" },
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
            )}
          </Paper>
        </Box>
      </PageTransition>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Ajukan Sesi Bimbingan</Typography>
          <IconButton onClick={handleCloseDialog} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
                Tanggal Bimbingan <span style={{ color: "#ef5350" }}>*</span>
              </Typography>
              <TextField
                fullWidth size="small" type="datetime-local"
                name="tanggal_bimbingan" value={form.tanggal_bimbingan}
                onChange={handleFormChange}
                error={!!formError.tanggal_bimbingan} helperText={formError.tanggal_bimbingan}
                InputLabelProps={{ shrink: true }} sx={roundedField}
              />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
                Metode <span style={{ color: "#ef5350" }}>*</span>
              </Typography>
              <TextField
                fullWidth select size="small"
                name="metode" value={form.metode}
                onChange={handleFormChange}
                error={!!formError.metode} helperText={formError.metode}
                sx={roundedField}
              >
                <MenuItem value="" disabled>Pilih metode bimbingan</MenuItem>
                {METODE_OPTIONS.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </TextField>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
                Topik Bimbingan <span style={{ color: "#ef5350" }}>*</span>
              </Typography>
              <TextField
                fullWidth size="small"
                name="topik" value={form.topik}
                onChange={handleFormChange}
                error={!!formError.topik} helperText={formError.topik}
                placeholder="Contoh: Revisi BAB 2 - Tinjauan Pustaka"
                sx={roundedField}
              />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Deskripsi / Catatan</Typography>
              <TextField
                fullWidth multiline rows={3} size="small"
                name="deskripsi" value={form.deskripsi}
                onChange={handleFormChange}
                placeholder="Opsional — tuliskan detail topik atau hal yang ingin didiskusikan"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={handleCloseDialog}
            sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, color: "#666", border: "1.5px solid #e0e0e0", "&:hover": { backgroundColor: "#f5f5f5" } }}>
            Batal
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}
            sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0846c7" } }}>
            {submitting ? "Memproses..." : "Ajukan Bimbingan"}
          </Button>
        </DialogActions>
      </Dialog>
    </BodyLayout>
  );
}