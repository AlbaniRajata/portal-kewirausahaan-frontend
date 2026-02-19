import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton, Tooltip, Pagination,
} from "@mui/material";
import { Add, Edit, Delete, Close, MenuBook } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import { getProdi, createProdi, updateProdi, deleteProdi, getKampus, getJurusan } from "../../api/admin";

const roundedField = { "& .MuiOutlinedInput-root": { borderRadius: "15px" } };

const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#000",
  backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 2,
};

const tableBodyRow = { "& td": { borderBottom: "1px solid #f5f5f5", py: 2 } };

const JENJANG_OPTIONS = ["D3", "D4", "S1", "S2", "S3"];

const emptyForm = { nama_prodi: "", jenjang: "", id_jurusan: "", id_kampus: "" };

export default function ProdiPage() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [kampusList, setKampusList] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);
  const [alert, setAlert] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dialog, setDialog] = useState({ open: false, mode: "create", data: null });
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [filterKampus, setFilterKampus] = useState("");
  const [filterJurusan, setFilterJurusan] = useState("");
  const [filterJenjang, setFilterJenjang] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resProdi, resKampus, resJurusan] = await Promise.all([
        getProdi(),
        getKampus(),
        getJurusan(),
      ]);
      if (resProdi.success) setList(resProdi.data || []);
      if (resKampus.success) setKampusList(resKampus.data || []);
      if (resJurusan.success) setJurusanList(resJurusan.data || []);
    } catch {
      setAlert("Gagal memuat data prodi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredList = list.filter((item) => {
    const matchSearch = item.nama_prodi?.toLowerCase().includes(search.toLowerCase());
    const matchKampus = filterKampus ? String(item.id_kampus) === String(filterKampus) : true;
    const matchJurusan = filterJurusan ? String(item.id_jurusan) === String(filterJurusan) : true;
    const matchJenjang = filterJenjang ? item.jenjang === filterJenjang : true;
    return matchSearch && matchKampus && matchJurusan && matchJenjang;
  });
  const totalPages = Math.ceil(filteredList.length / rowsPerPage);
  const paginatedList = filteredList.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setErrors({});
    setAlert("");
    setDialog({ open: true, mode: "create", data: null });
  };

  const handleOpenEdit = (item) => {
    setForm({
      nama_prodi: item.nama_prodi,
      jenjang: item.jenjang,
      id_jurusan: item.id_jurusan,
      id_kampus: item.id_kampus,
    });
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
    if (!form.nama_prodi.trim()) newErrors.nama_prodi = "Nama prodi wajib diisi";
    if (!form.jenjang) newErrors.jenjang = "Jenjang wajib dipilih";
    if (!form.id_kampus) newErrors.id_kampus = "Kampus wajib dipilih";
    if (!form.id_jurusan) newErrors.id_jurusan = "Jurusan wajib dipilih";
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
      text: currentDialog.mode === "create" ? "Tambah prodi baru?" : "Simpan perubahan prodi?",
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
        response = await createProdi(currentForm);
      } else {
        response = await updateProdi(currentDialog.data.id_prodi, currentForm);
      }

      if (response.success) {
        await Swal.fire({ icon: "success", title: "Berhasil", text: response.message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
        fetchData();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menyimpan prodi" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: "Hapus Prodi?",
      html: `Prodi <b>${item.jenjang} ${item.nama_prodi}</b> akan dihapus permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteProdi(item.id_prodi);
      if (response.success) {
        await Swal.fire({ icon: "success", title: "Berhasil", text: response.message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
        fetchData();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menghapus prodi" });
    }
  };

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <Box>
        <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Data Program Studi</Typography>
        <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>Kelola data program studi yang terdaftar dalam sistem</Typography>

        {alert && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setAlert("")}>{alert}</Alert>
        )}

        <Paper sx={{ borderRadius: "16px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                size="small" placeholder="Cari nama prodi..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                sx={{ ...roundedField, minWidth: 200, flex: "1 1 200px" }}
              />
              <TextField
                select size="small" label="Kampus"
                value={filterKampus}
                onChange={(e) => { setFilterKampus(e.target.value); setPage(1); }}
                InputLabelProps={{ shrink: true }}
                SelectProps={{ displayEmpty: true }}
                sx={{ ...roundedField, minWidth: 200, flex: "1 1 200px" }}
              >
                <MenuItem value="">Semua Kampus</MenuItem>
                {kampusList.map((k) => (
                  <MenuItem key={k.id_kampus} value={k.id_kampus}>{k.nama_kampus}</MenuItem>
                ))}
              </TextField>
              <TextField
                select size="small" label="Jurusan"
                value={filterJurusan}
                onChange={(e) => { setFilterJurusan(e.target.value); setPage(1); }}
                InputLabelProps={{ shrink: true }}
                SelectProps={{ displayEmpty: true }}
                sx={{ ...roundedField, minWidth: 200, flex: "1 1 200px" }}
              >
                <MenuItem value="">Semua Jurusan</MenuItem>
                {jurusanList.map((j) => (
                  <MenuItem key={j.id_jurusan} value={j.id_jurusan}>{j.nama_jurusan}</MenuItem>
                ))}
              </TextField>
              <TextField
                select size="small" label="Jenjang"
                value={filterJenjang}
                onChange={(e) => { setFilterJenjang(e.target.value); setPage(1); }}
                InputLabelProps={{ shrink: true }}
                SelectProps={{ displayEmpty: true }}
                sx={{ ...roundedField, minWidth: 130, flex: "0 0 130px" }}
              >
                <MenuItem value="">Semua</MenuItem>
                {JENJANG_OPTIONS.map((j) => (
                  <MenuItem key={j} value={j}>{j}</MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                startIcon={<Add sx={{ fontSize: 14 }} />}
                onClick={handleOpenCreate}
                sx={{ textTransform: "none", borderRadius: "50px", px: 3, py: 1.2, fontWeight: 600, backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" }, whiteSpace: "nowrap", flex: "0 0 auto" }}
              >
                Tambah Prodi
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
            ) : paginatedList.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 10 }}>
                <Box sx={{ width: 100, height: 100, borderRadius: "50%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
                  <MenuBook sx={{ fontSize: 48, color: "#ccc" }} />
                </Box>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}>
                  {search || filterKampus || filterJurusan || filterJenjang ? "Prodi tidak ditemukan" : "Belum ada prodi"}
                </Typography>
                <Typography sx={{ fontSize: 14, color: "#999" }}>
                  {search || filterKampus || filterJurusan || filterJenjang ? "Coba ubah filter pencarian" : `Klik "Tambah Prodi" untuk menambahkan data`}
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden", mb: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {["No", "Nama Prodi", "Jenjang", "Jurusan", "Kampus", "Aksi"].map((h, i) => (
                          <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 5 && { textAlign: "center" }), ...(i === 0 && { width: 60 }) }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedList.map((item, idx) => (
                        <TableRow key={item.id_prodi} sx={tableBodyRow}>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, color: "#888" }}>{(page - 1) * rowsPerPage + idx + 1}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{item.nama_prodi}</Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "inline-flex", px: 1.5, py: 0.4, borderRadius: "50px", backgroundColor: "#e3f2fd", color: "#1565c0", fontSize: 12, fontWeight: 700 }}>
                              {item.jenjang}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{item.nama_jurusan}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{item.nama_kampus}</Typography>
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
              {dialog.mode === "create" ? "Tambah Program Studi" : "Edit Program Studi"}
            </Typography>
            <IconButton onClick={handleCloseDialog} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ px: 3, py: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Nama Program Studi <span style={{ color: "#ef5350" }}>*</span></Typography>
                <TextField
                  fullWidth placeholder="Contoh: Teknik Informatika"
                  value={form.nama_prodi}
                  onChange={(e) => { setForm({ ...form, nama_prodi: e.target.value }); setErrors({ ...errors, nama_prodi: "" }); }}
                  error={!!errors.nama_prodi} helperText={errors.nama_prodi}
                  disabled={submitting} sx={roundedField}
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Jenjang <span style={{ color: "#ef5350" }}>*</span></Typography>
                <TextField
                  select fullWidth value={form.jenjang}
                  onChange={(e) => { setForm({ ...form, jenjang: e.target.value }); setErrors({ ...errors, jenjang: "" }); }}
                  error={!!errors.jenjang} helperText={errors.jenjang}
                  disabled={submitting} sx={roundedField}
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value="" disabled>Pilih jenjang</MenuItem>
                  {JENJANG_OPTIONS.map((j) => <MenuItem key={j} value={j}>{j}</MenuItem>)}
                </TextField>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Kampus <span style={{ color: "#ef5350" }}>*</span></Typography>
                <TextField
                  select fullWidth value={form.id_kampus}
                  onChange={(e) => { setForm({ ...form, id_kampus: e.target.value }); setErrors({ ...errors, id_kampus: "" }); }}
                  error={!!errors.id_kampus} helperText={errors.id_kampus}
                  disabled={submitting} sx={roundedField}
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value="" disabled>Pilih kampus</MenuItem>
                  {kampusList.map((k) => <MenuItem key={k.id_kampus} value={k.id_kampus}>{k.nama_kampus}</MenuItem>)}
                </TextField>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Jurusan <span style={{ color: "#ef5350" }}>*</span></Typography>
                <TextField
                  select fullWidth value={form.id_jurusan}
                  onChange={(e) => { setForm({ ...form, id_jurusan: e.target.value }); setErrors({ ...errors, id_jurusan: "" }); }}
                  error={!!errors.id_jurusan} helperText={errors.id_jurusan}
                  disabled={submitting} sx={roundedField}
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value="" disabled>Pilih jurusan</MenuItem>
                  {jurusanList.map((j) => <MenuItem key={j.id_jurusan} value={j.id_jurusan}>{j.nama_jurusan}</MenuItem>)}
                </TextField>
              </Box>
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