import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
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
import { Add, Edit, Delete, Close, Assignment } from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  getTahapProgram,
  createTahapProgram,
  updateTahapProgram,
  deleteTahapProgram,
} from "../../api/admin";

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

const StatusPill = ({ label, bg, color }) => (
  <Box
    sx={{
      display: "inline-flex",
      alignItems: "center",
      px: 1.5,
      py: 0.4,
      borderRadius: "50px",
      backgroundColor: bg,
      color,
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </Box>
);

const emptyForm = {
  nama_tahap: "",
  urutan: "",
  penilaian_mulai: "",
  penilaian_selesai: "",
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

export default function TahapPenilaianTab({ id_program }) {
  const [loading, setLoading] = useState(true);
  const [tahapList, setTahapList] = useState([]);
  const [alert, setAlert] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    mode: "create",
    data: null,
  });
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
      console.error("Error Fetching tahap penilaian:", err);
      setAlert("Gagal memuat tahap penilaian");
    } finally {
      setLoading(false);
    }
  }, [id_program]);

  useEffect(() => {
    fetchTahap();
  }, [fetchTahap]);

  const getJadwalStatus = (mulai, selesai) => {
    if (!mulai || !selesai)
      return { label: "Belum Diatur", bg: "#f5f5f5", color: "#666" };
    const now = new Date();
    if (now < new Date(mulai))
      return { label: "Belum Dimulai", bg: "#1565c0", color: "#e3f2fd" };
    if (now <= new Date(selesai))
      return { label: "Sedang Berjalan", bg: "#2e7d32", color: "#e8f5e9" };
    return { label: "Sudah Ditutup", bg: "#c62828", color: "#fce4ec" };
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
      penilaian_mulai: new Date(tahap.penilaian_mulai)
        .toISOString()
        .slice(0, 16),
      penilaian_selesai: new Date(tahap.penilaian_selesai)
        .toISOString()
        .slice(0, 16),
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
      if (!form.nama_tahap.trim())
        newErrors.nama_tahap = "Nama tahap wajib diisi";
      if (!form.urutan) {
        newErrors.urutan = "Urutan wajib diisi";
      } else if (Number(form.urutan) < 1) {
        newErrors.urutan = "Urutan minimal 1";
      } else if (usedUrutanList.includes(Number(form.urutan))) {
        newErrors.urutan = `Urutan ${form.urutan} sudah digunakan`;
      }
    }
    if (!form.penilaian_mulai)
      newErrors.penilaian_mulai = "Tanggal mulai wajib diisi";
    if (!form.penilaian_selesai)
      newErrors.penilaian_selesai = "Tanggal selesai wajib diisi";
    if (form.penilaian_mulai && form.penilaian_selesai) {
      if (new Date(form.penilaian_mulai) >= new Date(form.penilaian_selesai)) {
        newErrors.penilaian_selesai =
          "Tanggal selesai harus lebih besar dari tanggal mulai";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate(dialog.mode)) return;
    const currentDialog = dialog;
    const currentForm = form;
    setDialog({
      open: false,
      mode: currentDialog.mode,
      data: currentDialog.data,
    });
    const result = await Swal.fire({
      title: "Konfirmasi",
      text:
        currentDialog.mode === "create"
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
      setDialog({
        open: true,
        mode: currentDialog.mode,
        data: currentDialog.data,
      });
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
      const msg = err.response?.data?.message || "Gagal menghapus tahap";
      Swal.fire({ icon: "error", title: "Gagal", text: msg });
    }
  };

  const canAddTahap = tahapList.length < 2;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
          Tahap Penilaian
        </Typography>
        <Tooltip title={!canAddTahap ? "Maksimal 2 tahap penilaian" : ""}>
          <span>
            <Button
              variant="contained"
              startIcon={<Add sx={{ fontSize: 14 }} />}
              onClick={handleOpenCreate}
              disabled={!canAddTahap}
              sx={{
                textTransform: "none",
                borderRadius: "50px",
                px: 3,
                py: 1.2,
                fontWeight: 600,
                backgroundColor: canAddTahap ? "#0D59F2" : "#e0e0e0",
                color: canAddTahap ? "#fff" : "#999",
                "&:hover": {
                  backgroundColor: canAddTahap ? "#0a47c4" : "#e0e0e0",
                },
                cursor: canAddTahap ? "pointer" : "not-allowed",
              }}
            >
              Tambah Tahap
            </Button>
          </span>
        </Tooltip>
      </Box>

      {alert && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: "12px" }}
          onClose={() => setAlert("")}
        >
          {alert}
        </Alert>
      )}

      {!canAddTahap && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: "12px" }}>
          Sudah terdapat 2 tahap penilaian (maksimal). Hapus salah satu tahap
          jika ingin menambah tahap baru.
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : tahapList.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              backgroundColor: "#f5f5f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
            }}
          >
            <Assignment sx={{ fontSize: 48, color: "#ccc" }} />
          </Box>
          <Typography
            sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}
          >
            Belum ada tahap penilaian
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#999" }}>
            Klik "Tambah Tahap" untuk menambahkan tahap penilaian
          </Typography>
        </Box>
      ) : (
        <TableContainer
          sx={{
            borderRadius: "12px",
            border: "1px solid #f0f0f0",
            overflow: "hidden",
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                {[
                  "Urutan",
                  "Nama Tahap",
                  "Penilaian Mulai",
                  "Penilaian Selesai",
                  "Status Jadwal",
                  "Status",
                  "Aksi",
                ].map((h, i) => (
                  <TableCell
                    key={i}
                    sx={{
                      ...tableHeadCell,
                      ...(i === 6 && { textAlign: "center" }),
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tahapList.map((tahap) => {
                const jadwalStatus = getJadwalStatus(
                  tahap.penilaian_mulai,
                  tahap.penilaian_selesai,
                );
                return (
                  <TableRow key={tahap.id_tahap} sx={tableBodyRow}>
                    <TableCell>
                      <StatusPill
                        label={`Tahap ${tahap.urutan}`}
                        color="#e8eaf6"
                        bg="#3949ab"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                        {tahap.nama_tahap}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13 }}>
                        {formatDate(tahap.penilaian_mulai)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13 }}>
                        {formatDate(tahap.penilaian_selesai)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusPill
                        label={jadwalStatus.label}
                        color={jadwalStatus.color}
                        bg={jadwalStatus.bg}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusPill
                        label={tahap.status === 1 ? "Aktif" : "Nonaktif"}
                        color={tahap.status === 1 ? "#e8f5e9" : "#f5f5f5"}
                        bg={tahap.status === 1 ? "#2e7d32" : "#666"}
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          justifyContent: "center",
                        }}
                      >
                        <Tooltip title="Edit Jadwal">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Edit fontSize="small" />}
                            onClick={() => handleOpenEdit(tahap)}
                            sx={{
                              textTransform: "none",
                              color: "#0D59F2",
                              borderColor: "#e3f2fd",
                              "&:hover": {
                                backgroundColor: "#f0f4ff",
                                borderColor: "#0D59F2",
                                borderRadius: "8px",
                              },
                            }}
                          >
                            Edit
                          </Button>
                        </Tooltip>
                        <Tooltip title="Hapus Tahap">
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Delete fontSize="small" />}
                            onClick={() => handleDelete(tahap)}
                            sx={{
                              textTransform: "none",
                              borderColor: "#fce4ec",
                              "&:hover": {
                                backgroundColor: "rgba(229,57,53,0.06)",
                                borderColor: "#e53935",
                                borderRadius: "8px",
                              },
                            }}
                          >
                            Hapus
                          </Button>
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

      <Dialog
        open={dialog.open}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
            {dialog.mode === "create"
              ? "Tambah Tahap Penilaian"
              : "Edit Jadwal Tahap"}
          </Typography>
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 3 }}>
          {dialog.mode === "create" ? (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
                  Nama Tahap <span style={{ color: "#ef5350" }}>*</span>
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
                  sx={roundedField}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
                  Urutan <span style={{ color: "#ef5350" }}>*</span>
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
                  sx={roundedField}
                />
              </Box>
            </>
          ) : (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
                  Nama Tahap
                </Typography>
                <TextField
                  fullWidth
                  value={form.nama_tahap}
                  disabled
                  sx={roundedField}
                />
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
                  Urutan
                </Typography>
                <TextField
                  fullWidth
                  value={`Tahap ${form.urutan}`}
                  disabled
                  sx={roundedField}
                />
              </Box>
            </>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
              Penilaian Mulai <span style={{ color: "#ef5350" }}>*</span>
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
              sx={roundedField}
            />
          </Box>

          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
              Penilaian Selesai <span style={{ color: "#ef5350" }}>*</span>
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
              sx={roundedField}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={handleCloseDialog}
            disabled={submitting}
            sx={{
              textTransform: "none",
              borderRadius: "50px",
              px: 3,
              fontWeight: 600,
              color: "#666",
              border: "1.5px solid #e0e0e0",
              "&:hover": { backgroundColor: "#f5f5f5" },
            }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={submitting}
            sx={{
              textTransform: "none",
              borderRadius: "50px",
              px: 3,
              fontWeight: 600,
              backgroundColor: "#0D59F2",
              "&:hover": { backgroundColor: "#0a47c4" },
            }}
          >
            {submitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
