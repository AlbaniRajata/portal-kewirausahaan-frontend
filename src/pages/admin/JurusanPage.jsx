import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Tooltip, Pagination,
} from "@mui/material";
import { Add, Edit, Delete, Close, School } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import { getJurusan, createJurusan, updateJurusan, deleteJurusan } from "../../api/admin";

const roundedField = { "& .MuiOutlinedInput-root": { borderRadius: "15px" } };

const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#000",
  backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 2,
};

const tableBodyRow = { "& td": { borderBottom: "1px solid #f5f5f5", py: 2 } };

const emptyForm = { nama_jurusan: "" };

export default function JurusanPage() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [alert, setAlert] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dialog, setDialog] = useState({ open: false, mode: "create", data: null });
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getJurusan();
      if (res.success) setList(res.data || []);
      else setAlert(res.message);
    } catch {
      setAlert("Gagal memuat data jurusan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredList = list.filter((item) =>
    item.nama_jurusan?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filteredList.length / rowsPerPage);
  const paginatedList = filteredList.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setErrors({});
    setAlert("");
    setDialog({ open: true, mode: "create", data: null });
  };

  const handleOpenEdit = (item) => {
    setForm({ nama_jurusan: item.nama_jurusan });
    setErrors({});
    setAlert("");
    setDialog({ open: true, mode: "edit", data: item });
  };

  const handleCloseDialog = () => {
    setDialog({ open: false, mode: "create", data: null });
    setForm(emptyForm);
    setErrors({});
  };

  const validate = () => {
    const newErrors = {};
    if (!form.nama_jurusan.trim()) newErrors.nama_jurusan = "Nama jurusan wajib diisi";
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
      text: currentDialog.mode === "create" ? "Tambah jurusan baru?" : "Simpan perubahan jurusan?",
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
        response = await createJurusan(currentForm);
      } else {
        response = await updateJurusan(currentDialog.data.id_jurusan, currentForm);
      }

      if (response.success) {
        await Swal.fire({ icon: "success", title: "Berhasil", text: response.message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
        fetchData();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menyimpan jurusan" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: "Hapus Jurusan?",
      html: `Jurusan <b>${item.nama_jurusan}</b> akan dihapus permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteJurusan(item.id_jurusan);
      if (response.success) {
        await Swal.fire({ icon: "success", title: "Berhasil", text: response.message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
        fetchData();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menghapus jurusan" });
    }
  };

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <Box>
        <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Data Jurusan</Typography>
        <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>Kelola data jurusan yang terdaftar dalam sistem</Typography>

        {alert && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setAlert("")}>{alert}</Alert>
        )}

        <Paper sx={{ borderRadius: "16px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
              <TextField
                size="small" placeholder="Cari nama jurusan..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                sx={{ ...roundedField, flex: 1, maxWidth: 340 }}
              />
              <Box sx={{ flex: 1 }} />
              <Button
                variant="contained"
                startIcon={<Add sx={{ fontSize: 14 }} />}
                onClick={handleOpenCreate}
                sx={{ textTransform: "none", borderRadius: "50px", px: 3, py: 1.2, fontWeight: 600, backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" }, whiteSpace: "nowrap" }}
              >
                Tambah Jurusan
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
            ) : paginatedList.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 10 }}>
                <Box sx={{ width: 100, height: 100, borderRadius: "50%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
                  <School sx={{ fontSize: 48, color: "#ccc" }} />
                </Box>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}>
                  {search ? "Jurusan tidak ditemukan" : "Belum ada jurusan"}
                </Typography>
                <Typography sx={{ fontSize: 14, color: "#999" }}>
                  {search ? "Coba kata kunci lain" : `Klik "Tambah Jurusan" untuk menambahkan data`}
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden", mb: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {["No", "Nama Jurusan", "Aksi"].map((h, i) => (
                          <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 2 && { textAlign: "center" }), ...(i === 0 && { width: 60 }) }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedList.map((item, idx) => (
                        <TableRow key={item.id_jurusan} sx={tableBodyRow}>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, color: "#888" }}>{(page - 1) * rowsPerPage + idx + 1}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{item.nama_jurusan}</Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                              <Tooltip title="Edit">
                                <Button size="small" variant="outlined" startIcon={<Edit fontSize="small" />} onClick={() => handleOpenEdit(item)}
                                  sx={{ textTransform: "none", color: "#0D59F2", borderColor: "#e3f2fd", borderRadius: "8px", "&:hover": { backgroundColor: "#f0f4ff", borderColor: "#0D59F2" } }}>
                                  Edit
                                </Button>
                              </Tooltip>
                              <Tooltip title="Hapus">
                                <Button size="small" variant="outlined" color="error" startIcon={<Delete fontSize="small" />} onClick={() => handleDelete(item)}
                                  sx={{ textTransform: "none", borderColor: "#fce4ec", borderRadius: "8px", "&:hover": { backgroundColor: "rgba(229,57,53,0.06)", borderColor: "#e53935" } }}>
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

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontSize: 13, color: "#777" }}>
                    Menampilkan {((page - 1) * rowsPerPage) + 1}–{Math.min(page * rowsPerPage, filteredList.length)} dari {filteredList.length} data
                  </Typography>
                  <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" shape="rounded" showFirstButton showLastButton />
                </Box>
              </>
            )}
          </Box>
        </Paper>

        <Dialog open={dialog.open} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
          <DialogTitle sx={{ pb: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
              {dialog.mode === "create" ? "Tambah Jurusan" : "Edit Jurusan"}
            </Typography>
            <IconButton onClick={handleCloseDialog} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ px: 3, py: 3 }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Nama Jurusan <span style={{ color: "#ef5350" }}>*</span></Typography>
              <TextField
                fullWidth placeholder="Contoh: Teknik Informatika"
                value={form.nama_jurusan}
                onChange={(e) => { setForm({ ...form, nama_jurusan: e.target.value }); setErrors({ ...errors, nama_jurusan: "" }); }}
                error={!!errors.nama_jurusan} helperText={errors.nama_jurusan}
                disabled={submitting} sx={roundedField}
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
    </BodyLayout>
  );
}