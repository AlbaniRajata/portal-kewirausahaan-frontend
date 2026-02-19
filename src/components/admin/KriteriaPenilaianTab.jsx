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
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Add, Edit, Delete, Close, Assignment } from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  getTahapProgram,
  getKriteriaPenilaian,
  createKriteriaPenilaian,
  updateKriteriaPenilaian,
  deleteKriteriaPenilaian,
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
  <Box sx={{
    display: "inline-flex", alignItems: "center",
    px: 1.5, py: 0.4, borderRadius: "50px",
    backgroundColor: bg, color, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {label}
  </Box>
);

const emptyForm = {
  nama_kriteria: "",
  deskripsi: "",
  bobot: "",
  urutan: "",
  status: 1,
};

export default function KriteriaPenilaianTab({ id_program }) {
  const [loading, setLoading] = useState(true);
  const [tahapList, setTahapList] = useState([]);
  const [selectedTahap, setSelectedTahap] = useState("");
  const [kriteriaList, setKriteriaList] = useState([]);
  const [alert, setAlert] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dialog, setDialog] = useState({ open: false, mode: "create", data: null });
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const fetchTahap = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTahapProgram(id_program);
      if (res.success) {
        setTahapList(res.data || []);
        if (res.data.length > 0) {
          setSelectedTahap(res.data[0].id_tahap);
        }
      } else {
        setAlert(res.message);
      }
    } catch (err) {
      console.error("Error Fetching tahap penilaian:", err);
      setAlert("Gagal memuat tahap penilaian");
    } finally {
      setLoading(false);
    }
  }, [id_program]);

  const fetchKriteria = useCallback(async () => {
    if (!selectedTahap) return;
    try {
      setLoading(true);
      const res = await getKriteriaPenilaian(selectedTahap);
      if (res.success) {
        setKriteriaList(res.data.kriteria || []);
      }
    } catch (err) {
      console.error("Error Fetching kriteria penilaian:", err);
      setAlert("Gagal memuat kriteria");
    } finally {
      setLoading(false);
    }
  }, [selectedTahap]);

  useEffect(() => {
    fetchTahap();
  }, [fetchTahap]);

  useEffect(() => {
    if (selectedTahap) {
      fetchKriteria();
    }
  }, [selectedTahap, fetchKriteria]);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setErrors({});
    setAlert("");
    setDialog({ open: true, mode: "create", data: null });
  };

  const handleOpenEdit = (kriteria) => {
    setForm({
      nama_kriteria: kriteria.nama_kriteria,
      deskripsi: kriteria.deskripsi || "",
      bobot: kriteria.bobot,
      urutan: kriteria.urutan,
      status: kriteria.status,
    });
    setErrors({});
    setAlert("");
    setDialog({ open: true, mode: "edit", data: kriteria });
  };

  const handleCloseDialog = () => {
    setDialog({ open: false, mode: "create", data: null });
    setForm(emptyForm);
    setErrors({});
    setAlert("");
  };

  const usedUrutanList = kriteriaList
    .filter((k) => dialog.mode === "edit" ? k.id_kriteria !== dialog.data?.id_kriteria : true)
    .map((k) => k.urutan);

  const validate = () => {
    const newErrors = {};
    if (!form.nama_kriteria.trim()) newErrors.nama_kriteria = "Nama kriteria wajib diisi";
    if (!form.bobot) {
      newErrors.bobot = "Bobot wajib diisi";
    } else if (Number(form.bobot) < 1 || Number(form.bobot) > 100) {
      newErrors.bobot = "Bobot harus antara 1-100";
    }
    if (!form.urutan) {
      newErrors.urutan = "Urutan wajib diisi";
    } else if (Number(form.urutan) < 1) {
      newErrors.urutan = "Urutan minimal 1";
    } else if (usedUrutanList.includes(Number(form.urutan))) {
      newErrors.urutan = `Urutan ${form.urutan} sudah digunakan`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const currentDialog = dialog;
    const currentForm = form;
    setDialog({ open: false, mode: currentDialog.mode, data: currentDialog.data });

    const result = await Swal.fire({
      title: "Konfirmasi",
      text: currentDialog.mode === "create" ? "Tambah kriteria penilaian baru?" : "Simpan perubahan kriteria?",
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
        response = await createKriteriaPenilaian(selectedTahap, {
          nama_kriteria: currentForm.nama_kriteria,
          deskripsi: currentForm.deskripsi,
          bobot: Number(currentForm.bobot),
          urutan: Number(currentForm.urutan),
          status: Number(currentForm.status),
        });
      } else {
        response = await updateKriteriaPenilaian(currentDialog.data.id_kriteria, {
          nama_kriteria: currentForm.nama_kriteria,
          deskripsi: currentForm.deskripsi,
          bobot: Number(currentForm.bobot),
          urutan: Number(currentForm.urutan),
          status: Number(currentForm.status),
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
        fetchKriteria();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menyimpan kriteria";
      Swal.fire({ icon: "error", title: "Gagal", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (kriteria) => {
    const result = await Swal.fire({
      title: "Hapus Kriteria?",
      html: `Kriteria <b>${kriteria.nama_kriteria}</b> akan dihapus permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteKriteriaPenilaian(kriteria.id_kriteria);
      if (response.success) {
        await Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: response.message,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        fetchKriteria();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menghapus kriteria";
      Swal.fire({ icon: "error", title: "Gagal", text: msg });
    }
  };

  if (loading && tahapList.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (tahapList.length === 0) {
    return (
      <Alert severity="info" sx={{ borderRadius: "12px" }}>
        Belum ada tahap penilaian. Silakan buat tahap terlebih dahulu.
      </Alert>
    );
  }

  return (
    <Box>
      {alert && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setAlert("")}>
          {alert}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Pilih Tahap:</Typography>
          <TextField
            select
            size="small"
            value={selectedTahap}
            onChange={(e) => setSelectedTahap(e.target.value)}
            sx={{ minWidth: 250, ...roundedField }}
          >
            {tahapList.map((tahap) => (
              <MenuItem key={tahap.id_tahap} value={tahap.id_tahap}>
                {tahap.nama_tahap} (Urutan {tahap.urutan})
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add sx={{ fontSize: 14 }} />}
          onClick={handleOpenCreate}
          sx={{
            textTransform: "none",
            borderRadius: "50px",
            px: 3,
            py: 1.2,
            fontWeight: 600,
            backgroundColor: "#0D59F2",
            "&:hover": { backgroundColor: "#0a47c4" },
          }}
        >
          Tambah Kriteria
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : kriteriaList.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <Box sx={{
            width: 100, height: 100, borderRadius: "50%", backgroundColor: "#f5f5f5",
            display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3
          }}>
            <Assignment sx={{ fontSize: 48, color: "#ccc" }} />
          </Box>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}>
            Belum ada kriteria penilaian
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#999" }}>
            Klik "Tambah Kriteria" untuk menambahkan kriteria penilaian
          </Typography>
        </Box>
      ) : (
        <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
          <Table>
            <TableHead>
              <TableRow>
                {["Urutan", "Nama Kriteria", "Deskripsi", "Bobot (%)", "Status", "Aksi"].map((h, i) => (
                  <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 5 && { textAlign: "center" }) }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {kriteriaList.map((kriteria) => (
                <TableRow key={kriteria.id_kriteria} sx={tableBodyRow}>
                  <TableCell sx={{ fontWeight: 600, fontSize: 14 }}>
                    {kriteria.urutan}
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                      {kriteria.nama_kriteria}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, color: "#666" }}>
                      {kriteria.deskripsi || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                      {kriteria.bobot}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusPill
                      label={kriteria.status === 1 ? "Aktif" : "Nonaktif"}
                      color={kriteria.status === 1 ? "#e8f5e9" : "#f5f5f5"}
                      bg={kriteria.status === 1 ? "#2e7d32" : "#666"}
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
                        <Tooltip title="Edit Kriteria">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Edit fontSize="small" />}
                            onClick={() => handleOpenEdit(kriteria)}
                            sx={{
                              textTransform: "none",
                              color: "#0D59F2",
                              borderColor: "#e3f2fd",
                              borderRadius: "8px",
                              "&:hover": {
                                backgroundColor: "#f0f4ff",
                                borderColor: "#0D59F2",
                              },
                            }}
                          >
                            Edit
                          </Button>
                        </Tooltip>
                        <Tooltip title="Hapus Kriteria">
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Delete fontSize="small" />}
                            onClick={() => handleDelete(kriteria)}
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialog.open} onClose={handleCloseDialog} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
            {dialog.mode === "create" ? "Tambah Kriteria Penilaian" : "Edit Kriteria Penilaian"}
          </Typography>
          <IconButton onClick={handleCloseDialog} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
              Nama Kriteria <span style={{ color: "#ef5350" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              placeholder="Contoh: Deskripsi Bisnis"
              value={form.nama_kriteria}
              onChange={(e) => {
                setForm({ ...form, nama_kriteria: e.target.value });
                setErrors({ ...errors, nama_kriteria: "" });
              }}
              error={!!errors.nama_kriteria}
              helperText={errors.nama_kriteria}
              disabled={submitting}
              sx={roundedField}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Deskripsi</Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Deskripsi singkat kriteria penilaian"
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              disabled={submitting}
              sx={roundedField}
            />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
                Bobot (%) <span style={{ color: "#ef5350" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                placeholder="1-100"
                value={form.bobot}
                onChange={(e) => {
                  setForm({ ...form, bobot: e.target.value });
                  setErrors({ ...errors, bobot: "" });
                }}
                inputProps={{ min: 1, max: 100 }}
                error={!!errors.bobot}
                helperText={errors.bobot}
                disabled={submitting}
                sx={roundedField}
              />
            </Box>

            <Box>
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
          </Box>

          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
              Status <span style={{ color: "#ef5350" }}>*</span>
            </Typography>
            <TextField
              select
              fullWidth
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              disabled={submitting}
              sx={roundedField}
            >
              <MenuItem value={1}>Aktif</MenuItem>
              <MenuItem value={0}>Nonaktif</MenuItem>
            </TextField>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={handleCloseDialog} disabled={submitting}
            sx={{
              textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600,
              color: "#666", border: "1.5px solid #e0e0e0", "&:hover": { backgroundColor: "#f5f5f5" }
            }}>
            Batal
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={submitting}
            sx={{
              textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600,
              backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" }
            }}>
            {submitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}