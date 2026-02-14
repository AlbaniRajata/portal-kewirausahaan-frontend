import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  getTahapProgram,
  createTahapProgram,
  updateTahapProgram,
  deleteTahapProgram,
} from "../../api/admin";

const emptyForm = {
  nama_tahap: "",
  urutan: "",
  penilaian_mulai: "",
  penilaian_selesai: "",
};

export default function TahapPenilaianTab({ id_program }) {
  const [loading, setLoading] = useState(true);
  const [tahapList, setTahapList] = useState([]);
  const [alert, setAlert] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [dialog, setDialog] = useState({ open: false, mode: "create", data: null });
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const fetchTahap = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getTahapProgram(id_program);

      if (response.success) {
        setTahapList(response.data || []);
      } else {
        setAlert(response.message);
      }
    } catch (err) {
      console.error("Error fetching tahap:", err);
      setAlert("Gagal memuat tahap penilaian");
    } finally {
      setLoading(false);
    }
  }, [id_program]);

  useEffect(() => {
    fetchTahap();
  }, [fetchTahap]);

  const getJadwalStatus = (mulai, selesai) => {
    if (!mulai || !selesai) return { label: "Belum Diatur", color: "default" };
    const now = new Date();
    if (now < new Date(mulai)) return { label: "Belum Dimulai", color: "info" };
    if (now <= new Date(selesai)) return { label: "Sedang Berjalan", color: "success" };
    return { label: "Sudah Ditutup", color: "error" };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setErrors({});
    setAlert("");
    setDialog({ open: true, mode: "create", data: null });
  };

  const handleOpenEdit = (tahap) => {
    setForm({
      nama_tahap: tahap.nama_tahap,
      urutan: tahap.urutan,
      penilaian_mulai: new Date(tahap.penilaian_mulai).toISOString().slice(0, 16),
      penilaian_selesai: new Date(tahap.penilaian_selesai).toISOString().slice(0, 16),
    });
    setErrors({});
    setAlert("");
    setDialog({ open: true, mode: "edit", data: tahap });
  };

  const handleCloseDialog = () => {
    setDialog({ open: false, mode: "create", data: null });
    setForm(emptyForm);
    setErrors({});
    setAlert("");
  };

  const usedUrutanList = tahapList.map((t) => t.urutan);

  const validate = (mode) => {
    const newErrors = {};

    if (mode === "create") {
      if (!form.nama_tahap.trim()) {
        newErrors.nama_tahap = "Nama tahap wajib diisi";
      }

      if (!form.urutan) {
        newErrors.urutan = "Urutan wajib diisi";
      } else if (Number(form.urutan) < 1) {
        newErrors.urutan = "Urutan minimal 1";
      } else if (usedUrutanList.includes(Number(form.urutan))) {
        newErrors.urutan = `Urutan ${form.urutan} sudah digunakan`;
      }
    }

    if (!form.penilaian_mulai) newErrors.penilaian_mulai = "Tanggal mulai wajib diisi";
    if (!form.penilaian_selesai) newErrors.penilaian_selesai = "Tanggal selesai wajib diisi";

    if (form.penilaian_mulai && form.penilaian_selesai) {
      if (new Date(form.penilaian_mulai) >= new Date(form.penilaian_selesai)) {
        newErrors.penilaian_selesai = "Tanggal selesai harus lebih besar dari tanggal mulai";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
  if (!validate(dialog.mode)) return;

  const currentDialog = dialog;
  const currentForm = form;

  setDialog({ open: false, mode: currentDialog.mode, data: currentDialog.data });

  const result = await Swal.fire({
    title: "Konfirmasi",
    text: currentDialog.mode === "create"
      ? "Tambah tahap penilaian baru?"
      : "Simpan perubahan jadwal tahap?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#0D59F2",
    cancelButtonColor: "#d33",
    confirmButtonText: "Ya, Simpan",
    cancelButtonText: "Tidak",
  });

  if (!result.isConfirmed) {
    setDialog({ open: true, mode: currentDialog.mode, data: currentDialog.data });
    setForm(currentForm);
    return;
  }

  try {
    setSubmitting(true);
    let response;

    if (currentDialog.mode === "create") {
      response = await createTahapProgram(id_program, {
        nama_tahap: currentForm.nama_tahap,
        urutan: Number(currentForm.urutan),
        penilaian_mulai: currentForm.penilaian_mulai,
        penilaian_selesai: currentForm.penilaian_selesai,
      });
    } else {
      response = await updateTahapProgram(currentDialog.data.id_tahap, {
        penilaian_mulai: currentForm.penilaian_mulai,
        penilaian_selesai: currentForm.penilaian_selesai,
      });
    }

    if (response.success) {
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: response.message,
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      fetchTahap();
    } else {
      Swal.fire({ icon: "error", title: "Gagal", text: response.message });
    }
  } catch (err) {
    console.error("Error saving tahap:", err);
    const msg = err.response?.data?.message || "Gagal menyimpan tahap";
    Swal.fire({ icon: "error", title: "Gagal", text: msg });
  } finally {
    setSubmitting(false);
  }
};

  const handleDelete = async (tahap) => {
    const result = await Swal.fire({
      title: "Hapus Tahap?",
      html: `Tahap <b>${tahap.nama_tahap}</b> akan dihapus permanen beserta semua data terkait.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteTahapProgram(tahap.id_tahap);

      if (response.success) {
        await Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: response.message,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        fetchTahap();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message });
      }
    } catch (err) {
      console.error("Error deleting tahap:", err);
      const msg = err.response?.data?.message || "Gagal menghapus tahap";
      Swal.fire({ icon: "error", title: "Gagal", text: msg });
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 600 }}>
          Tahap Penilaian
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenCreate}
          sx={{ textTransform: "none", backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" } }}
        >
          Tambah Tahap
        </Button>
      </Box>

      {alert && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAlert("")}>
          {alert}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress />
        </Box>
      ) : tahapList.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography sx={{ fontSize: 16, color: "#666", mb: 1 }}>
            Belum ada tahap penilaian
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#999" }}>
            Klik "Tambah Tahap" untuk menambahkan tahap penilaian
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 700 }}>Urutan</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Nama Tahap</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Penilaian Mulai</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Penilaian Selesai</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status Jadwal</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tahapList.map((tahap) => {
                const jadwalStatus = getJadwalStatus(tahap.penilaian_mulai, tahap.penilaian_selesai);
                return (
                  <TableRow key={tahap.id_tahap} hover>
                    <TableCell>
                      <Chip label={`Tahap ${tahap.urutan}`} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500 }}>
                        {tahap.nama_tahap}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(tahap.penilaian_mulai)}</TableCell>
                    <TableCell>{formatDate(tahap.penilaian_selesai)}</TableCell>
                    <TableCell>
                      <Chip label={jadwalStatus.label} color={jadwalStatus.color} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tahap.status === 1 ? "Aktif" : "Nonaktif"}
                        color={tahap.status === 1 ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                        <Tooltip title="Edit Jadwal">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEdit(tahap)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Hapus Tahap">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(tahap)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialog.open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialog.mode === "create" ? "Tambah Tahap Penilaian" : "Edit Jadwal Tahap"}
        </DialogTitle>

        <DialogContent dividers>
          {dialog.mode === "create" ? (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>
                  Nama Tahap <span style={{ color: "red" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Contoh: Desk Evaluasi"
                  value={form.nama_tahap}
                  onChange={(e) => {
                    setForm({ ...form, nama_tahap: e.target.value });
                    setErrors({ ...errors, nama_tahap: "" });
                  }}
                  error={!!errors.nama_tahap}
                  helperText={errors.nama_tahap}
                  disabled={submitting}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>
                  Urutan <span style={{ color: "red" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Contoh: 1"
                  value={form.urutan}
                  onChange={(e) => {
                    setForm({ ...form, urutan: e.target.value });
                    setErrors({ ...errors, urutan: "" });
                  }}
                  inputProps={{ min: 1 }}
                  error={!!errors.urutan}
                  helperText={errors.urutan}
                  disabled={submitting}
                />
              </Box>
            </>
          ) : (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Nama Tahap</Typography>
                <TextField fullWidth value={form.nama_tahap} disabled />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Urutan</Typography>
                <TextField fullWidth value={`Tahap ${form.urutan}`} disabled />
              </Box>
            </>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              Penilaian Mulai <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              type="datetime-local"
              value={form.penilaian_mulai}
              onChange={(e) => {
                setForm({ ...form, penilaian_mulai: e.target.value });
                setErrors({ ...errors, penilaian_mulai: "" });
              }}
              error={!!errors.penilaian_mulai}
              helperText={errors.penilaian_mulai}
              disabled={submitting}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              Penilaian Selesai <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              type="datetime-local"
              value={form.penilaian_selesai}
              onChange={(e) => {
                setForm({ ...form, penilaian_selesai: e.target.value });
                setErrors({ ...errors, penilaian_selesai: "" });
              }}
              error={!!errors.penilaian_selesai}
              helperText={errors.penilaian_selesai}
              disabled={submitting}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Batal
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={submitting}
            sx={{ textTransform: "none" }}
          >
            {submitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}