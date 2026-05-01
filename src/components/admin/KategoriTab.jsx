import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Dialog, DialogContent, DialogActions,
  TextField, IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import Swal from "sweetalert2";
import LoadingScreen from "../common/LoadingScreen";
import { getKategori, createKategori, updateKategori, deleteKategori } from "../../api/admin";

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
  errorLight: "#FEF2F2",
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

const emptyForm = { nama_kategori: "", keterangan: "" };

export default function KategoriTab() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [dialog, setDialog] = useState({ open: false, mode: "create", data: null });
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getKategori();
      setList(res.data || []);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat kategori", confirmButtonColor: COLORS.primary });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setErrors({});
    setDialog({ open: true, mode: "create", data: null });
  };

  const handleOpenEdit = (item) => {
    setForm({ nama_kategori: item.nama_kategori, keterangan: item.keterangan || "" });
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
      confirmButtonColor: COLORS.primary, cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Simpan", cancelButtonText: "Tidak",
    });

    if (!result.isConfirmed) {
      setDialog({ open: true, mode: currentDialog.mode, data: currentDialog.data });
      setForm(currentForm);
      return;
    }

    try {
      setSubmitting(true);
      if (currentDialog.mode === "create") {
        await createKategori(currentForm);
      } else {
        await updateKategori(currentDialog.data.id_kategori, currentForm);
      }
      await Swal.fire({ icon: "success", title: "Berhasil", text: currentDialog.mode === "create" ? "Kategori berhasil ditambahkan" : "Kategori berhasil diperbarui", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchData();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menyimpan kategori", confirmButtonColor: COLORS.primary });
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
      confirmButtonColor: "#d33", cancelButtonColor: "#666",
      confirmButtonText: "Ya, Hapus", cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteKategori(item.id_kategori);
      await Swal.fire({ icon: "success", title: "Berhasil", text: "Kategori berhasil dihapus", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchData();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menghapus kategori", confirmButtonColor: COLORS.primary });
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 3, gap: 2, flexWrap: "wrap" }}>
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
          Tambah Kategori
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ position: "relative", minHeight: 320 }}>
          <LoadingScreen message="Memuat kategori..." overlay minHeight="320px" />
        </Box>
      ) : list.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: "center", borderRadius: "20px", border: "1.5px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
          <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#1E293B", mb: 1 }}>Belum ada kategori</Typography>
          <Typography sx={{ fontSize: 14, color: COLORS.slate, fontWeight: 500 }}>Klik Tambah Kategori untuk menambahkan kategori baru</Typography>
        </Paper>
      ) : (
        <TableContainer sx={{ borderRadius: "16px", border: "1.5px solid #E2E8F0", overflow: "hidden", overflowX: "auto", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                {["NAMA KATEGORI", "KETERANGAN", "AKSI"].map((h, i) => (
                  <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 0 && { pl: { xs: 1.5, sm: 3 } }) }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((item) => (
                  <TableRow key={item.id_kategori} sx={tableBodyRow}>
                    <TableCell sx={{ pl: { xs: 1.5, sm: 3 } }}>
                      <Typography sx={{ fontWeight: 700, fontSize: { xs: 13, sm: 14 }, color: "#1E293B" }}>{item.nama_kategori}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: { xs: 12, sm: 13 }, color: COLORS.slate, fontWeight: 500 }}>{item.keterangan || "-"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 1 }, justifyContent: "center", flexWrap: "wrap" }}>
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
      )}

      <Dialog open={dialog.open} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: { xs: "16px", sm: "24px" }, overflow: "hidden" } }}>
        <Box sx={{ p: { xs: 1.5, sm: 2 }, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, color: "#fff" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: 16, sm: 18 } }}>
              {dialog.mode === "create" ? "Tambah Kategori" : "Edit Kategori"}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} sx={{ color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" } }}>
            <Close />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Nama Kategori <span style={{ color: COLORS.error }}>*</span></Typography>
              <TextField
                fullWidth placeholder="Contoh: Teknologi"
                value={form.nama_kategori}
                onChange={(e) => { setForm({ ...form, nama_kategori: e.target.value }); setErrors({ ...errors, nama_kategori: "" }); }}
                error={!!errors.nama_kategori} helperText={errors.nama_kategori}
                disabled={submitting} sx={roundedField}
              />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Keterangan</Typography>
              <TextField
                fullWidth multiline rows={3}
                placeholder="Deskripsi singkat kategori (opsional)"
                value={form.keterangan}
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                disabled={submitting} sx={roundedField}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 2, sm: 3 }, backgroundColor: "#F8FAFC", borderTop: "1.5px solid #E2E8F0", gap: 1.5, flexDirection: { xs: "column", sm: "row" }, "& > button": { width: { xs: "100%", sm: "auto" } }}}>
          <>
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
          </>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
