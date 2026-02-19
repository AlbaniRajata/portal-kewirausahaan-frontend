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
  IconButton,
  Tooltip,
} from "@mui/material";
import { Add, Edit, Delete, Close, Category } from "@mui/icons-material";
import Swal from "sweetalert2";
import { getKategori, createKategori, updateKategori, deleteKategori } from "../../api/admin";

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

const stickyAksiHead = {
  ...tableHeadCell,
  textAlign: "center",
  position: "sticky",
  right: 0,
  backgroundColor: "#fafafa",
  zIndex: 2,
  boxShadow: "-2px 0 6px rgba(0,0,0,0.04)",
};

const stickyAksiCell = {
  position: "sticky",
  right: 0,
  backgroundColor: "#fff",
  zIndex: 1,
  boxShadow: "-2px 0 6px rgba(0,0,0,0.04)",
  borderBottom: "1px solid #f5f5f5",
  py: 2,
};

const emptyForm = { nama_kategori: "", keterangan: "" };

export default function KategoriTab() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [alert, setAlert] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dialog, setDialog] = useState({ open: false, mode: "create", data: null });
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getKategori();
      if (res.success) setList(res.data || []);
      else setAlert(res.message);
    } catch {
      setAlert("Gagal memuat kategori");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setErrors({});
    setAlert("");
    setDialog({ open: true, mode: "create", data: null });
  };

  const handleOpenEdit = (item) => {
    setForm({
      nama_kategori: item.nama_kategori,
      keterangan: item.keterangan || "",
    });
    setErrors({});
    setAlert("");
    setDialog({ open: true, mode: "edit", data: item });
  };

  const handleCloseDialog = () => {
    setDialog({ open: false, mode: "create", data: null });
    setForm(emptyForm);
    setErrors({});
    setAlert("");
  };

  const validate = () => {
    const newErrors = {};
    if (!form.nama_kategori.trim()) newErrors.nama_kategori = "Nama kategori wajib diisi";
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
      text: currentDialog.mode === "create" ? "Tambah kategori baru?" : "Simpan perubahan kategori?",
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
        response = await createKategori(currentForm);
      } else {
        response = await updateKategori(currentDialog.data.id_kategori, currentForm);
      }

      if (response.success) {
        await Swal.fire({ icon: "success", title: "Berhasil", text: response.message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
        fetchData();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menyimpan kategori" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: "Hapus Kategori?",
      html: `Kategori <b>${item.nama_kategori}</b> akan dihapus permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteKategori(item.id_kategori);
      if (response.success) {
        await Swal.fire({ icon: "success", title: "Berhasil", text: response.message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
        fetchData();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menghapus kategori" });
    }
  };

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
          Kategori Proposal
        </Typography>
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
          Tambah Kategori
        </Button>
      </Box>

      {alert && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setAlert("")}>
          {alert}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : list.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <Box sx={{
            width: 100, height: 100, borderRadius: "50%", backgroundColor: "#f5f5f5",
            display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3,
          }}>
            <Category sx={{ fontSize: 48, color: "#ccc" }} />
          </Box>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}>
            Belum ada kategori
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#999" }}>
            Klik "Tambah Kategori" untuk menambahkan kategori
          </Typography>
        </Box>
      ) : (
        <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                {["Nama Kategori", "Keterangan"].map((h, i) => (
                  <TableCell key={i} sx={tableHeadCell}>{h}</TableCell>
                ))}
                <TableCell sx={stickyAksiHead}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((item) => (
                <TableRow key={item.id_kategori} sx={tableBodyRow}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{item.nama_kategori}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, color: "#666" }}>{item.keterangan || "-"}</Typography>
                  </TableCell>
                  <TableCell sx={stickyAksiCell}>
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                      <Tooltip title="Edit Kategori">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Edit fontSize="small" />}
                          onClick={() => handleOpenEdit(item)}
                          sx={{
                            textTransform: "none",
                            color: "#0D59F2",
                            borderColor: "#e3f2fd",
                            borderRadius: "8px",
                            "&:hover": { backgroundColor: "#f0f4ff", borderColor: "#0D59F2" },
                          }}
                        >
                          Edit
                        </Button>
                      </Tooltip>
                      <Tooltip title="Hapus Kategori">
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<Delete fontSize="small" />}
                          onClick={() => handleDelete(item)}
                          sx={{
                            textTransform: "none",
                            borderColor: "#fce4ec",
                            borderRadius: "8px",
                            "&:hover": { backgroundColor: "rgba(229,57,53,0.06)", borderColor: "#e53935" },
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
            {dialog.mode === "create" ? "Tambah Kategori" : "Edit Kategori"}
          </Typography>
          <IconButton onClick={handleCloseDialog} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
              Nama Kategori <span style={{ color: "#ef5350" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              placeholder="Contoh: Teknologi"
              value={form.nama_kategori}
              onChange={(e) => { setForm({ ...form, nama_kategori: e.target.value }); setErrors({ ...errors, nama_kategori: "" }); }}
              error={!!errors.nama_kategori}
              helperText={errors.nama_kategori}
              disabled={submitting}
              sx={roundedField}
            />
          </Box>

          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Keterangan</Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Deskripsi singkat kategori (opsional)"
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              disabled={submitting}
              sx={roundedField}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={handleCloseDialog} disabled={submitting}
            sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, color: "#666", border: "1.5px solid #e0e0e0", "&:hover": { backgroundColor: "#f5f5f5" } }}>
            Batal
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={submitting}
            sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" } }}>
            {submitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}