import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Dialog, DialogContent, DialogActions,
  TextField, MenuItem, IconButton, Pagination,
} from "@mui/material";
import { Close, Search } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getProdi, createProdi, updateProdi, deleteProdi, getKampus, getJurusan } from "../../api/admin";

const COLORS = {
  primary: "#0D59F2",
  primaryLight: "#E0F2FE",
  primaryDark: "#0369A1",
  primaryMuted: "#93C5FD",
  secondary: "#2563EB",
  accent: "#3B82F6",
  slate: "#64748B",
  slateLight: "#F1F5F9",
  success: "#059669",
  successLight: "#ECFDF5",
  warning: "#D97706",
  warningLight: "#FFFBEB",
  error: "#DC2626",
  errorLight: "#ff7070",
};

const roundedField = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#fff",
    transition: "all 0.2s ease-in-out",
    "&:hover fieldset": { borderColor: COLORS.primary },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "2px" },
    "&.Mui-focused": { boxShadow: `0 0 0 4px ${COLORS.primaryLight}` },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: COLORS.primary, fontWeight: 700 },
};

const tableHeadCell = {
  fontWeight: 800,
  fontSize: 12,
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  backgroundColor: "#F8FAFC",
  borderBottom: `2px solid ${COLORS.primaryMuted}`,
  py: 2.5,
};

const tableBodyRow = {
  "&:hover": { backgroundColor: "#F1F5F9/50" },
  "& td": { borderBottom: "1.5px solid #E2E8F0", py: 2 },
};

const StatusPill = ({ label, type = "slate" }) => {
  const config = {
    success: { bg: COLORS.successLight, color: COLORS.success, border: COLORS.success },
    warning: { bg: COLORS.warningLight, color: COLORS.warning, border: COLORS.warning },
    error: { bg: COLORS.errorLight, color: COLORS.error, border: COLORS.error },
    primary: { bg: COLORS.primaryLight, color: COLORS.primary, border: COLORS.primary },
    slate: { bg: COLORS.slateLight, color: COLORS.slate, border: COLORS.slate },
  };
  const style = config[type] || config.slate;
  return (
    <Box sx={{
      display: "inline-flex", alignItems: "center", px: 1.5, py: 0.5, borderRadius: "50px",
      backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}`,
      fontSize: 12, fontWeight: 700, whiteSpace: "nowrap"
    }}>
      {label}
    </Box>
  );
};

const JENJANG_OPTIONS = ["D3", "D4", "S2"];

const emptyForm = { nama_prodi: "", jenjang: "", id_jurusan: "", id_kampus: "" };

export default function ProdiPage() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [kampusList, setKampusList] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);
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
      const [resProdi, resKampus, resJurusan] = await Promise.allSettled([
        getProdi(),
        getKampus(),
        getJurusan(),
      ]);
      if (resProdi.status === "fulfilled") setList(resProdi.value.data || []);
      if (resKampus.status === "fulfilled") setKampusList(resKampus.value.data || []);
      if (resJurusan.status === "fulfilled") setJurusanList(resJurusan.value.data || []);
      if (resProdi.status === "rejected") throw resProdi.reason;
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data program studi", confirmButtonColor: "#0D59F2" });
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
      if (currentDialog.mode === "create") {
        await createProdi(currentForm);
      } else {
        await updateProdi(currentDialog.data.id_prodi, currentForm);
      }
      await Swal.fire({ icon: "success", title: "Berhasil", text: currentDialog.mode === "create" ? "Program studi berhasil ditambahkan" : "Program studi berhasil diperbarui", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchData();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menyimpan program studi", confirmButtonColor: "#0D59F2" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: "Hapus Program Studi?",
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
      await deleteProdi(item.id_prodi);
      await Swal.fire({ icon: "success", title: "Berhasil", text: "Program studi berhasil dihapus", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchData();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menghapus program studi", confirmButtonColor: "#0D59F2" });
    }
  };

  const hasFilter = search || filterKampus || filterJurusan || filterJenjang;

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
            Data Program Studi
          </Typography>
          <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
            Kelola data program studi yang terdaftar dalam sistem portal kewirausahaan
          </Typography>
        </Box>

        <Paper 
          elevation={0} 
          sx={{
            borderRadius: "20px",
            border: "1.5px solid #E2E8F0",
            overflow: "hidden",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            position: "relative",
          }}
        >
          <Box sx={{ height: "6px", background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
          
          <Box sx={{ p: { xs: 3, md: 4 } }}>
      <Box
        sx={{
          display: "flex",
          gap: { xs: 1.25, xl: 2 },
          mb: 4,
          alignItems: "center",
          flexWrap: "wrap",
          flexDirection: "row",
          "@media (max-width: 1650px)": {
            flexDirection: "column",
            alignItems: "stretch",
          },
          "@media (min-width: 1651px)": {
            flexDirection: "row",
            alignItems: "center",
          },
        }}
      >
              <TextField
                size="small" placeholder="Cari nama prodi..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                InputProps={{
                  startAdornment: (
                    <IconButton size="small" sx={{ p: 0, mr: 1, color: COLORS.primary }}>
                      <Search sx={{ fontSize: { xs: 18, sm: 20 } }} />
                    </IconButton>
                  ),
                }}
                sx={{
                  ...roundedField,
                  width: { xs: "100%", xl: "auto" },
                  minWidth: { xs: "100%", xl: 260 },
                  maxWidth: { xs: "100%", sm: 360, xl: 320 },
                  flex: { xl: "1 1 260px" },
                }}
              />
              <TextField
                select size="small"
                value={filterKampus}
                onChange={(e) => { setFilterKampus(e.target.value); setPage(1); }}
                sx={{
                  ...roundedField,
                  width: { xs: "100%", xl: "auto" },
                  minWidth: { xs: "100%", xl: 200 },
                  flex: { xl: "0 1 200px" },
                }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => (
                    <span style={{ fontSize: 14, color: !selected ? "#9CA3AF" : "inherit" }}>
                      {selected || "Semua Kampus"}
                    </span>
                  ),
                }}
              >
                <MenuItem value="" sx={{ fontSize: 13 }}>Semua Kampus</MenuItem>
                {kampusList.map((k) => (
                  <MenuItem key={k.id_kampus} value={k.id_kampus} sx={{ fontSize: 13 }}>{k.nama_kampus}</MenuItem>
                ))}
              </TextField>
              <TextField
                select size="small"
                value={filterJurusan}
                onChange={(e) => { setFilterJurusan(e.target.value); setPage(1); }}
                sx={{
                  ...roundedField,
                  width: { xs: "100%", xl: "auto" },
                  minWidth: { xs: "100%", xl: 200 },
                  flex: { xl: "0 1 200px" },
                }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => (
                    <span style={{ fontSize: 14, color: !selected ? "#9CA3AF" : "inherit" }}>
                      {selected || "Semua Jurusan"}
                    </span>
                  ),
                }}
              >
                <MenuItem value="" sx={{ fontSize: 13 }}>Semua Jurusan</MenuItem>
                {jurusanList.map((j) => (
                  <MenuItem key={j.id_jurusan} value={j.id_jurusan} sx={{ fontSize: 13 }}>{j.nama_jurusan}</MenuItem>
                ))}
              </TextField>
              <TextField
                select size="small"
                value={filterJenjang}
                onChange={(e) => { setFilterJenjang(e.target.value); setPage(1); }}
                sx={{
                  ...roundedField,
                  width: { xs: "100%", xl: "auto" },
                  minWidth: { xs: "100%", xl: 220 },
                  flex: { xl: "0 1 220px" },
                }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => (
                    <span style={{ fontSize: 14, color: !selected ? "#9CA3AF" : "inherit" }}>
                      {selected || "Semua Jenjang"}
                    </span>
                  ),
                }}
              >
                <MenuItem value="" sx={{ fontSize: 13 }}>Semua Jenjang</MenuItem>
                {JENJANG_OPTIONS.map((j) => (
                  <MenuItem key={j} value={j} sx={{ fontSize: 13 }}>{j}</MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                onClick={handleOpenCreate}
                sx={{
                  textTransform: "none",
                  borderRadius: "12px",
                  px: { xs: 2, sm: 3 },
                  py: 1.2,
                  fontWeight: 700,
                  backgroundColor: COLORS.primary,
                  boxShadow: "0 4px 12px rgba(13, 89, 242, 0.2)",
                  width: { xs: "100%", xl: "auto" },
                  minWidth: { xl: 150 },
                  ml: { xl: "auto" },
                  "&:hover": { 
                    backgroundColor: COLORS.primaryDark,
                    boxShadow: "0 6px 16px rgba(13, 89, 242, 0.3)",
                  },
                }}
              >
                Tambah Prodi
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ position: "relative", minHeight: 400 }}>
                <LoadingScreen message="Memuat data program studi..." overlay minHeight="400px" />
              </Box>
            ) : paginatedList.length === 0 ? (
                <Paper elevation={0} sx={{ p: { xs: 5, sm: 10 }, textAlign: "center", borderRadius: "20px", border: "1.5px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                  <Typography sx={{ fontSize: { xs: 18, sm: 22 }, fontWeight: 800, color: "#1E293B", mb: 1 }}>
                    {hasFilter ? "Prodi tidak ditemukan" : "Belum ada program studi"}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: 14, sm: 16 }, color: COLORS.slate, fontWeight: 500 }}>
                    {hasFilter ? "Coba gunakan kata kunci pencarian atau filter lainnya" : "Klik tombol Tambah Prodi untuk mulai menambahkan data"}
                  </Typography>
                </Paper>
            ) : (
              <>
                <TableContainer sx={{ borderRadius: "16px", border: "1.5px solid #E2E8F0", overflow: "hidden", overflowX: "auto", mb: 4 }}>
                  <Table sx={{ minWidth: 800 }}>
                     <TableHead>
                       <TableRow>
                         {["NO", "NAMA PRODI", "JENJANG", "JURUSAN", "KAMPUS", "AKSI"].map((h, i) => (
                           <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 5 && { textAlign: "center" }), ...(i === 0 && { width: 80, pl: { xs: 1.5, sm: 3 } }) }}>{h}</TableCell>
                         ))}
                       </TableRow>
                     </TableHead>
                     <TableBody>
                       {paginatedList.map((item, idx) => (
                         <TableRow key={item.id_prodi} sx={tableBodyRow}>
                           <TableCell sx={{ pl: { xs: 1.5, sm: 3 } }}>
                             <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORS.slate }}>{(page - 1) * rowsPerPage + idx + 1}</Typography>
                           </TableCell>
                           <TableCell>
                             <Typography sx={{ fontWeight: 700, fontSize: { xs: 13, sm: 15 }, color: "#1E293B" }}>{item.nama_prodi}</Typography>
                           </TableCell>
                           <TableCell>
                             <StatusPill label={item.jenjang} type="primary" />
                           </TableCell>
                           <TableCell>
                             <Typography sx={{ fontSize: { xs: 12, sm: 14 }, color: "#334155", fontWeight: 500 }}>{item.nama_jurusan}</Typography>
                           </TableCell>
                           <TableCell>
                             <Typography sx={{ fontSize: { xs: 12, sm: 14 }, color: "#334155", fontWeight: 500 }}>{item.nama_kampus}</Typography>
                           </TableCell>
                           <TableCell>
                             <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 1.5 }, justifyContent: "center", flexWrap: "wrap" }}>
                               <Button 
                                 size="small" 
                                 variant="outlined" 
                                 onClick={() => handleOpenEdit(item)}
                                 sx={{
                                   textTransform: "none",
                                   color: COLORS.primary,
                                   borderColor: COLORS.primaryMuted,
                                   borderRadius: "10px",
                                   fontWeight: 700,
                                   fontSize: { xs: 11, sm: 12 },
                                   px: { xs: 1, sm: 2 },
                                   "&:hover": { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary }
                                 }}
                               >
                                 Edit
                               </Button>
                               <Button 
                                 size="small" 
                                 variant="outlined" 
                                 color="error" 
                                 onClick={() => handleDelete(item)}
                                 sx={{
                                   textTransform: "none",
                                   borderColor: COLORS.errorLight,
                                   borderRadius: "10px",
                                   fontWeight: 700,
                                   fontSize: { xs: 11, sm: 12 },
                                   px: { xs: 1, sm: 2 },
                                   "&:hover": { backgroundColor: COLORS.errorLight, borderColor: COLORS.error }
                                 }}
                               >
                                 Hapus
                               </Button>
                             </Box>
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2, px: 1 }}>
                  <Typography sx={{ fontSize: 14, color: COLORS.slate, fontWeight: 600 }}>
                    Menampilkan <span style={{ color: "#1E293B" }}>{((page - 1) * rowsPerPage) + 1}–{Math.min(page * rowsPerPage, filteredList.length)}</span> dari <span style={{ color: "#1E293B" }}>{filteredList.length}</span> data
                  </Typography>
                  <Pagination 
                    count={totalPages} 
                    page={page} 
                    onChange={(e, v) => setPage(v)} 
                    color="primary" 
                    shape="rounded"
                    size="small"
                    sx={{
                      "& .MuiPaginationItem-root": {
                        fontWeight: 700,
                        borderRadius: "10px",
                        "&.Mui-selected": {
                          backgroundColor: COLORS.primary,
                          color: "#fff",
                          "&:hover": { backgroundColor: COLORS.primaryDark },
                        },
                      },
                    }}
                  />
                </Box>
              </>
            )}
          </Box>
        </Paper>

        <Dialog open={dialog.open} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: { xs: "16px", sm: "24px" }, overflow: "hidden" } }}>
          <Box sx={{ p: { xs: 1.5, sm: 2 }, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, color: "#fff" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: 16, sm: 18 } }}>
                {dialog.mode === "create" ? "Tambah Program Studi" : "Edit Program Studi"}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDialog} sx={{ color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" } }}>
              <Close />
            </IconButton>
          </Box>
          <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Nama Program Studi <span style={{ color: COLORS.error }}>*</span></Typography>
                <TextField
                  fullWidth placeholder="Contoh: Teknik Informatika"
                  value={form.nama_prodi}
                  onChange={(e) => { setForm({ ...form, nama_prodi: e.target.value }); setErrors({ ...errors, nama_prodi: "" }); }}
                  error={!!errors.nama_prodi} helperText={errors.nama_prodi}
                  disabled={submitting} sx={roundedField}
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Jenjang <span style={{ color: COLORS.error }}>*</span></Typography>
                <TextField
                  select fullWidth value={form.jenjang}
                  onChange={(e) => { setForm({ ...form, jenjang: e.target.value }); setErrors({ ...errors, jenjang: "" }); }}
                  error={!!errors.jenjang} helperText={errors.jenjang}
                  disabled={submitting} sx={roundedField}
                >
                  <MenuItem value="" disabled>Pilih jenjang</MenuItem>
                  {JENJANG_OPTIONS.map((j) => <MenuItem key={j} value={j}>{j}</MenuItem>)}
                </TextField>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Kampus <span style={{ color: COLORS.error }}>*</span></Typography>
                <TextField
                  select fullWidth value={form.id_kampus}
                  onChange={(e) => { setForm({ ...form, id_kampus: e.target.value }); setErrors({ ...errors, id_kampus: "" }); }}
                  error={!!errors.id_kampus} helperText={errors.id_kampus}
                  disabled={submitting} sx={roundedField}
                >
                  <MenuItem value="" disabled>Pilih kampus</MenuItem>
                  {kampusList.map((k) => <MenuItem key={k.id_kampus} value={k.id_kampus}>{k.nama_kampus}</MenuItem>)}
                </TextField>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Jurusan <span style={{ color: COLORS.error }}>*</span></Typography>
                <TextField
                  select fullWidth value={form.id_jurusan}
                  onChange={(e) => { setForm({ ...form, id_jurusan: e.target.value }); setErrors({ ...errors, id_jurusan: "" }); }}
                  error={!!errors.id_jurusan} helperText={errors.id_jurusan}
                  disabled={submitting} sx={roundedField}
                >
                  <MenuItem value="" disabled>Pilih jurusan</MenuItem>
                  {jurusanList.map((j) => <MenuItem key={j.id_jurusan} value={j.id_jurusan}>{j.nama_jurusan}</MenuItem>)}
                </TextField>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 2, sm: 3 }, backgroundColor: "#F8FAFC", borderTop: "1.5px solid #E2E8F0", gap: 1.5, flexDirection: { xs: "column", sm: "row" }, "& > button": { width: { xs: "100%", sm: "auto" } } }}>
              <Button 
                variant="contained"
                onClick={handleCloseDialog} 
                disabled={submitting}
                sx={{
                  textTransform: "none", borderRadius: "12px", px: 3, fontWeight: 700,
                  backgroundColor: COLORS.error,
                  boxShadow: "0 4px 12px rgba(220,38,38,0.2)",
                  "&:hover": { 
                    backgroundColor: "#B91C1C",
                    boxShadow: "0 6px 16px rgba(220,38,38,0.3)",
                  },
                }}
              >
                Batal
              </Button>
            <Button 
              variant="contained" 
              onClick={handleSave} 
              disabled={submitting}
              sx={{
                textTransform: "none", borderRadius: "12px", px: 4, fontWeight: 700,
                backgroundColor: COLORS.primary,
                boxShadow: "0 4px 12px rgba(13, 89, 242, 0.2)",
                "&:hover": { 
                  backgroundColor: COLORS.primaryDark,
                  boxShadow: "0 6px 16px rgba(13, 89, 242, 0.3)",
                },
              }}
            >
              {submitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogActions>
        </Dialog>
      </PageTransition>
    </BodyLayout>
  );
}