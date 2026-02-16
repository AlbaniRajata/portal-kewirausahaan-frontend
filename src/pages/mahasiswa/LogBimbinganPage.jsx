import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Chip,
  CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem,
  IconButton,
} from "@mui/material";
import {
  Add, Close, BookOutlined, Visibility,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import SidebarMahasiswa from "../../components/layouts/MahasiswaSidebar";
import { getListBimbingan, ajukanBimbingan } from "../../api/mahasiswa";

const STATUS_BIMBINGAN = {
  0: { text: "Menunggu Konfirmasi", color: "warning" },
  1: { text: "Disetujui", color: "success" },
  2: { text: "Ditolak", color: "error" },
};

const METODE_OPTIONS = [
  { value: 1, label: "Online" },
  { value: 2, label: "Offline" },
];

const METODE_LABEL = {
  1: { text: "Online", color: "info" },
  2: { text: "Offline", color: "default" },
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
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
  const [alertMsg, setAlertMsg] = useState("");
  const [alertType, setAlertType] = useState("error");
  const [canAjukan, setCanAjukan] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchBimbingan = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getListBimbingan();
      if (res.success) {
        const list = res.data || [];
        setBimbinganList(list);
        const hasPending = list.some((b) => b.status === 0);
        setCanAjukan(!hasPending);
      } else {
        setAlertMsg(res.message || "Gagal memuat data bimbingan");
        setAlertType("warning");
      }
    } catch (err) {
      console.error("Error fetching bimbingan:", err);
      const msg = err.response?.data?.message || "Gagal memuat data bimbingan";
      setAlertMsg(msg);
      setAlertType("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBimbingan();
  }, [fetchBimbingan]);

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
    if (!form.tanggal_bimbingan) errors.tanggal_bimbingan = "Tanggal wajib diisi";
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

    const metodeLabel = METODE_OPTIONS.find((m) => m.value === Number(form.metode))?.label || "-";

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
      const msg = err.response?.data?.message || "Gagal mengajukan bimbingan";
      await Swal.fire({
        ...swalOptions,
        icon: "error",
        title: "Gagal",
        text: msg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BodyLayout Sidebar={SidebarMahasiswa}>
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
              Log Bimbingan
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#777" }}>
              Riwayat dan pengajuan sesi bimbingan dengan dosen pembimbing
            </Typography>
          </Box>

          {!loading && canAjukan && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenDialog}
              sx={{
                textTransform: "none",
                backgroundColor: "#0D59F2",
                "&:hover": { backgroundColor: "#0846c7" },
              }}
            >
              Ajukan Bimbingan
            </Button>
          )}
        </Box>

        {alertMsg && (
          <Alert severity={alertType} sx={{ mb: 3 }} onClose={() => setAlertMsg("")}>
            {alertMsg}
          </Alert>
        )}

        {!loading && bimbinganList.some((b) => b.status === 0) && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Ada pengajuan bimbingan yang sedang menunggu konfirmasi dosen. Anda dapat mengajukan bimbingan baru setelah dosen merespons.
          </Alert>
        )}

        <Paper sx={{ overflow: "hidden" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : bimbinganList.length === 0 ? (
            <Box sx={{ p: 8, textAlign: "center" }}>
              <BookOutlined sx={{ fontSize: 72, color: "#ddd", mb: 2 }} />
              <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#666", mb: 1 }}>
                Belum Ada Riwayat Bimbingan
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#999", mb: 3 }}>
                Mulai ajukan sesi bimbingan pertama Anda
              </Typography>
              {canAjukan && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleOpenDialog}
                  sx={{
                    textTransform: "none",
                    backgroundColor: "#0D59F2",
                    "&:hover": { backgroundColor: "#0846c7" },
                  }}
                >
                  Ajukan Bimbingan
                </Button>
              )}
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Topik</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tanggal Bimbingan</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Metode</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Dosen</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Diajukan Oleh</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bimbinganList.map((b, idx) => (
                    <TableRow key={b.id_bimbingan} hover>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: "#888" }}>
                          {bimbinganList.length - idx}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 500, fontSize: 14, maxWidth: 200 }}>
                          {b.topik}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14 }}>
                          {formatDate(b.tanggal_bimbingan)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={METODE_LABEL[b.metode]?.text || b.metode}
                          size="small"
                          variant="outlined"
                          color={METODE_LABEL[b.metode]?.color || "default"}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14 }}>
                          {b.nama_dosen}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14 }}>
                          {b.nama_pengaju}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={STATUS_BIMBINGAN[b.status]?.text || "-"}
                          color={STATUS_BIMBINGAN[b.status]?.color || "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() => navigate(`/mahasiswa/bimbingan/${b.id_bimbingan}`)}
                          sx={{ textTransform: "none" }}
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

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, pr: 4 }}>
            <BookOutlined sx={{ color: "#0D59F2" }} />
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
              Ajukan Sesi Bimbingan
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} sx={{ position: "absolute", right: 8, top: 8 }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
                Tanggal Bimbingan <span style={{ color: "#ef5350" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                type="datetime-local"
                name="tanggal_bimbingan"
                value={form.tanggal_bimbingan}
                onChange={handleFormChange}
                error={!!formError.tanggal_bimbingan}
                helperText={formError.tanggal_bimbingan}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
                Metode <span style={{ color: "#ef5350" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                select
                name="metode"
                value={form.metode}
                onChange={handleFormChange}
                error={!!formError.metode}
                helperText={formError.metode}
                size="small"
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
                fullWidth
                name="topik"
                value={form.topik}
                onChange={handleFormChange}
                error={!!formError.topik}
                helperText={formError.topik}
                size="small"
                placeholder="Contoh: Revisi BAB 2 - Tinjauan Pustaka"
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
                Deskripsi / Catatan
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="deskripsi"
                value={form.deskripsi}
                onChange={handleFormChange}
                size="small"
                placeholder="Opsional — tuliskan detail topik atau hal yang ingin didiskusikan"
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{ textTransform: "none", color: "#666" }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{
              textTransform: "none",
              backgroundColor: "#0D59F2",
              "&:hover": { backgroundColor: "#0846c7" },
            }}
          >
            {submitting ? "Memproses..." : "Ajukan Bimbingan"}
          </Button>
        </DialogActions>
      </Dialog>
    </BodyLayout>
  );
}