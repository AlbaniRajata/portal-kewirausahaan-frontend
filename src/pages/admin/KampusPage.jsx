import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Dialog, DialogContent, DialogActions,
  TextField, IconButton, Pagination,
} from "@mui/material";
import { Close, Search } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getKampus, createKampus, updateKampus, deleteKampus } from "../../api/admin";

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

const emptyForm = { nama_kampus: "" };

export default function KampusPage() {

  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
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
      const res = await getKampus();
      setList(res.data || []);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data kampus", confirmButtonColor: "#0D59F2" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredList = list.filter((item) =>
    item.nama_kampus?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filteredList.length / rowsPerPage);
  const paginatedList = filteredList.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setErrors({});
    setDialog({ open: true, mode: "create", data: null });
  };

  const handleOpenEdit = (item) => {
    setForm({ nama_kampus: item.nama_kampus });
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
    if (!form.nama_kampus.trim()) newErrors.nama_kampus = "Nama kampus wajib diisi";
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
      text: currentDialog.mode === "create" ? "Tambah kampus baru?" : "Simpan perubahan kampus?",
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
        await createKampus(currentForm);
      } else {
        await updateKampus(currentDialog.data.id_kampus, currentForm);
      }
      await Swal.fire({ icon: "success", title: "Berhasil", text: currentDialog.mode === "create" ? "Kampus berhasil ditambahkan" : "Kampus berhasil diperbarui", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchData();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menyimpan kampus", confirmButtonColor: "#0D59F2" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: "Hapus Kampus?",
      html: `Kampus <b>${item.nama_kampus}</b> akan dihapus permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteKampus(item.id_kampus);
      await Swal.fire({ icon: "success", title: "Berhasil", text: "Kampus berhasil dihapus", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchData();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menghapus kampus", confirmButtonColor: "#0D59F2" });
    }
  };

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
            Data Kampus
          </Typography>
          <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
            Kelola data kampus yang terdaftar dalam sistem portal kewirausahaan
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
            <Box sx={{ display: "flex", gap: { xs: 1, sm: 2 }, mb: 4, alignItems: "center", flexWrap: "wrap" }}>
              <TextField
                size="small" placeholder="Cari nama kampus..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                InputProps={{
                  startAdornment: (
                    <IconButton size="small" sx={{ p: 0, mr: 1, color: COLORS.primary }}>
                      <Search sx={{ fontSize: { xs: 18, sm: 20 } }} />
                    </IconButton>
                  ),
                }}
                sx={{ ...roundedField, flex: { xs: "1 1 100%", sm: 1 }, maxWidth: { sm: 360 } }}
              />
              <Box sx={{ flexGrow: { xs: 0, sm: 1 } }} />
              <Button
                variant="contained"
                onClick={handleOpenCreate}
                sx={{
                  textTransform: "none", borderRadius: "12px", px: { xs: 2, sm: 3 }, py: 1.2, fontWeight: 700,
                  backgroundColor: COLORS.primary,
                  boxShadow: "0 4px 12px rgba(13, 89, 242, 0.2)",
                  width: { xs: "100%", sm: "auto" },
                  "&:hover": { 
                    backgroundColor: COLORS.primaryDark,
                    boxShadow: "0 6px 16px rgba(13, 89, 242, 0.3)",
                  },
                }}
              >
                Tambah Kampus
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ position: "relative", minHeight: 400 }}>
                <LoadingScreen message="Memuat data kampus..." overlay minHeight="400px" />
              </Box>
            ) : paginatedList.length === 0 ? (
                <Paper elevation={0} sx={{ p: { xs: 5, sm: 10 }, textAlign: "center", borderRadius: "20px", border: "1.5px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                  <Typography sx={{ fontSize: { xs: 18, sm: 22 }, fontWeight: 800, color: "#1E293B", mb: 1 }}>
                    {search ? "Kampus tidak ditemukan" : "Belum ada kampus"}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: 14, sm: 16 }, color: COLORS.slate, fontWeight: 500 }}>
                    {search ? "Coba gunakan kata kunci pencarian lainnya" : "Klik tombol Tambah Kampus untuk mulai menambahkan data"}
                  </Typography>
                </Paper>
            ) : (
              <>
                <TableContainer sx={{ borderRadius: "16px", border: "1.5px solid #E2E8F0", overflow: "hidden", overflowX: "auto", mb: 4 }}>
                  <Table sx={{ minWidth: 600 }}>
                     <TableHead>
                       <TableRow>
                         {["NO", "NAMA KAMPUS", "AKSI"].map((h, i) => (
                           <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 2 && { textAlign: "center" }), ...(i === 0 && { width: 80, pl: { xs: 1.5, sm: 3 } }) }}>{h}</TableCell>
                         ))}
                       </TableRow>
                     </TableHead>
                     <TableBody>
                       {paginatedList.map((item, idx) => (
                         <TableRow key={item.id_kampus} sx={tableBodyRow}>
                           <TableCell sx={{ pl: { xs: 1.5, sm: 3 } }}>
                             <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORS.slate }}>{(page - 1) * rowsPerPage + idx + 1}</Typography>
                           </TableCell>
                           <TableCell>
                             <Typography sx={{ fontWeight: 700, fontSize: { xs: 13, sm: 15 }, color: "#1E293B" }}>{item.nama_kampus}</Typography>
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
                {dialog.mode === "create" ? "Tambah Data Kampus" : "Edit Data Kampus"}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDialog} sx={{ color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" } }}>
              <Close />
            </IconButton>
          </Box>
          <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Nama Kampus <span style={{ color: COLORS.error }}>*</span></Typography>
              <TextField
                fullWidth placeholder="Contoh: Politeknik Negeri Malang"
                value={form.nama_kampus}
                onChange={(e) => { setForm({ ...form, nama_kampus: e.target.value }); setErrors({ ...errors, nama_kampus: "" }); }}
                error={!!errors.nama_kampus} helperText={errors.nama_kampus}
                disabled={submitting} sx={roundedField}
              />
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