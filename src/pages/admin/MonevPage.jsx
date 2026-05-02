import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, CircularProgress,
  IconButton, Chip,
} from "@mui/material";
import { Close, Add, AssignmentTurnedIn } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { useNavigate } from "react-router-dom";
import {
  getMyProgram, getLuaranProgram, createLuaran, updateLuaran, deleteLuaran,
} from "../../api/admin";

const COLORS = {
  primary:      "#0D59F2",
  primaryLight: "#E0F2FE",
  primaryDark:  "#0369A1",
  primaryMuted: "#93C5FD",
  secondary:    "#2563EB",
  accent:       "#3B82F6",
  slate:        "#64748B",
  slateLight:   "#F1F5F9",
  warning:      "#D97706",
  warningLight: "#FFFBEB",
  error:        "#DC2626",
  success:      "#059669",
  successLight: "#ECFDF5",
};

const roundedField = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#fff",
    transition: "box-shadow 0.2s",
    "&:hover fieldset": { borderColor: COLORS.primary },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary },
    "&.Mui-focused": { boxShadow: `0 0 0 3px ${COLORS.primaryLight}` },
  },
};

const tableHeadCell = {
  fontWeight: 700,
  fontSize: { xs: 11, sm: 12 },
  color: "#374151",
  backgroundColor: "#F8FAFC",
  borderBottom: `2px solid ${COLORS.primaryMuted}`,
  py: 2,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const tableBodyRow = {
  "& td": { borderBottom: `1px solid ${COLORS.slateLight}`, py: 2 },
  "&:hover": { backgroundColor: "#F8FAFC" },
};

const TIPE_MAP = {
  1: { label: "File", bg: COLORS.primary },
  2: { label: "Link", bg: "#7C3AED" },
  3: { label: "File & Link", bg: COLORS.success },
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const isDeadlineLewat = (deadline) => {
  if (!deadline) return false;
  return new Date() > new Date(deadline);
};

const emptyForm = { nama_luaran: "", keterangan: "", tipe: "", deadline: "", urutan: "" };

export default function MonevPage() { 
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [luaranList, setLuaranList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgram, setLoadingProgram] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [tahun, setTahun] = useState("");

  useEffect(() => {
    getMyProgram()
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
        setPrograms(list);
        if (list.length > 0) setSelectedProgram(list[0]);
      })
      .catch(() => {
        Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data program", confirmButtonColor: "#0D59F2" });
      })
      .finally(() => setLoadingProgram(false));
  }, []);

  const fetchLuaran = useCallback(async () => {
    if (!selectedProgram) return;
    try {
      setLoading(true);
      const res = await getLuaranProgram(selectedProgram.id_program);
      setLuaranList(res.data || []);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data luaran", confirmButtonColor: "#0D59F2" });
    } finally {
      setLoading(false);
    }
  }, [selectedProgram]);

  useEffect(() => { fetchLuaran(); }, [fetchLuaran]);

  const tahunOptions = Array.from(new Set(
    luaranList
      .map((item) => {
        const dateValue = item.deadline || item.created_at;
        if (!dateValue) return null;
        const year = new Date(dateValue).getFullYear();
        return Number.isNaN(year) ? null : year;
      })
      .filter(Boolean)
  )).sort((a, b) => b - a);

  const filteredLuaranList = tahun === ""
    ? luaranList
    : luaranList.filter((item) => {
      const dateValue = item.deadline || item.created_at;
      return dateValue && new Date(dateValue).getFullYear() === Number(tahun);
    });

  const handleOpenCreate = () => {
    setEditData(null);
    setForm(emptyForm);
    setErrors({});
    setOpenForm(true);
  };

  const handleOpenEdit = (luaran) => {
    setEditData(luaran);
    setForm({
      nama_luaran: luaran.nama_luaran,
      keterangan: luaran.keterangan || "",
      tipe: luaran.tipe,
      deadline: luaran.deadline ? new Date(luaran.deadline).toISOString().slice(0, 16) : "",
      urutan: luaran.urutan,
    });
    setErrors({});
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditData(null);
    setForm(emptyForm);
    setErrors({});
  };

  const validate = () => {
    const e = {};
    if (!form.nama_luaran.trim()) e.nama_luaran = "Nama luaran wajib diisi";
    if (!form.tipe) e.tipe = "Tipe wajib dipilih";
    if (!form.deadline) e.deadline = "Deadline wajib diisi";
    if (!form.urutan || parseInt(form.urutan) < 1) e.urutan = "Urutan wajib diisi minimal 1";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        nama_luaran: form.nama_luaran.trim(),
        keterangan: form.keterangan.trim() || null,
        tipe: parseInt(form.tipe),
        deadline: new Date(form.deadline).toISOString(),
        urutan: parseInt(form.urutan),
      };
      if (editData) {
        await updateLuaran(editData.id_luaran, payload);
      } else {
        await createLuaran(selectedProgram.id_program, payload);
      }
      await Swal.fire({
        icon: "success", title: "Berhasil",
        text: editData ? "Luaran berhasil diperbarui" : "Luaran berhasil dibuat",
        timer: 2000, timerProgressBar: true, showConfirmButton: false,
      });
      handleCloseForm();
      fetchLuaran();
    } catch (err) {
      Swal.fire({
        icon: "error", title: "Gagal",
        text: err.response?.data?.message || "Gagal menyimpan luaran",
        confirmButtonColor: "#0D59F2",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (luaran) => {
    const result = await Swal.fire({
      title: "Hapus Luaran",
      text: `Hapus luaran "${luaran.nama_luaran}"? Aksi ini tidak bisa dibatalkan.`,
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#e53935", cancelButtonColor: "#666",
      confirmButtonText: "Ya, Hapus", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteLuaran(luaran.id_luaran);
      await Swal.fire({
        icon: "success", title: "Berhasil", text: "Luaran berhasil dihapus",
        timer: 2000, timerProgressBar: true, showConfirmButton: false,
      });
      fetchLuaran();
    } catch (err) {
      Swal.fire({
        icon: "error", title: "Gagal",
        text: err.response?.data?.message || "Gagal menghapus luaran",
        confirmButtonColor: "#0D59F2",
      });
    }
  };

  if (loadingProgram) {
    return (
      <BodyLayout Sidebar={AdminSidebar}>
        <Box sx={{ position: "relative", minHeight: "60vh" }}>
          <LoadingScreen message="Memuat data program..." overlay minHeight="60vh" />
        </Box>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box sx={{ px: 1, py: 1 }}>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: { xs: 26, sm: 32, md: 36 }, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>Monitoring dan Evaluasi</Typography>
            <Typography sx={{ fontSize: { xs: 14, sm: 16 }, color: "#6B7280" }}>Kelola jenis luaran kegiatan per program</Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-start", mb: 3 }}>
            <Box sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              justifyContent: "flex-end",
              flexDirection: { xs: "column", sm: "row" },
              width: { xs: "100%", sm: "auto" },
              alignItems: { xs: "stretch", sm: "center" },
            }}>
              {selectedProgram && (
                <Button
                  variant="contained"
                  onClick={() => navigate(`/admin/monev/${selectedProgram.id_program}/progress`)}
                  sx={{
                    textTransform: "none", borderRadius: "50px",
                    fontWeight: 600, px: 3, py: 1.2, fontSize: 14,
                    backgroundColor: "#fff", color: "#0D59F2", border: "1px solid #0D59F2",
                    width: { xs: "100%", sm: "auto" },
                    "&:hover": { backgroundColor: "#f0f4ff" },
                  }}
                >
                  Lihat Progress Tim
                </Button>
              )}

              <Button
                variant="contained"
                onClick={handleOpenCreate}
                disabled={!selectedProgram}
                sx={{
                  textTransform: "none", borderRadius: "50px",
                  backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0846c7" },
                  px: 3, py: 1.2, fontSize: 14, fontWeight: 600,
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                Tambah Luaran
              </Button>
            </Box>
          </Box>

          {programs.length > 1 && (
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
              {programs.map((prog) => (
                <Button
                  key={prog.id_program}
                  onClick={() => setSelectedProgram(prog)}
                  variant={selectedProgram?.id_program === prog.id_program ? "contained" : "outlined"}
                  sx={{
                    textTransform: "none", borderRadius: "12px", fontWeight: 600, px: 3,
                    ...(selectedProgram?.id_program === prog.id_program
                      ? { backgroundColor: COLORS.primary, boxShadow: "0 4px 12px rgba(13,89,242,0.2)", "&:hover": { backgroundColor: COLORS.primaryDark } }
                      : { borderColor: COLORS.primary, color: COLORS.primary, "&:hover": { backgroundColor: COLORS.primaryLight } }),
                  }}
                >
                  {prog.keterangan || prog.nama_program}
                </Button>
              ))}
            </Box>
          )}

          <Paper sx={{
            borderRadius: "20px",
            border: "1.5px solid #E5E7EB",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}>
            <Box sx={{ height: 4, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 3.5 }, borderBottom: `1.5px solid ${COLORS.slateLight}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <TextField
                select
                size="small"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (v) => (
                    <span style={{ fontSize: 14, color: !v ? "#9CA3AF" : "inherit" }}>
                      {!v ? "Semua Tahun" : v}
                    </span>
                  ),
                }}
                sx={{ ...roundedField, width: { xs: "100%", sm: "auto" }, minWidth: { sm: 160 } }}
              >
                <MenuItem value="" sx={{ fontSize: 13 }}>Semua Tahun</MenuItem>
                {tahunOptions.map((itemTahun) => (
                  <MenuItem key={itemTahun} value={String(itemTahun)} sx={{ fontSize: 13 }}>{itemTahun}</MenuItem>
                ))}
              </TextField>
              <Typography sx={{ fontSize: 14, color: COLORS.slate, fontWeight: 500 }}>
                Total <b>{filteredLuaranList.length} luaran</b>
              </Typography>
            </Box>
            <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              {loading ? (
                <Box sx={{ position: "relative", minHeight: 320 }}>
                  <LoadingScreen message="Memuat data luaran..." overlay minHeight="320px" />
                </Box>
              ) : filteredLuaranList.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 10 }}>
                  <Box sx={{
                    width: 100, height: 100, borderRadius: "50%", backgroundColor: COLORS.slateLight,
                    display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3,
                  }}>
                    <AssignmentTurnedIn sx={{ fontSize: 48, color: COLORS.primaryMuted }} />
                  </Box>
                  <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#1F2937", mb: 1 }}>Belum Ada Luaran</Typography>
                  <Typography sx={{ fontSize: 14, color: COLORS.slate }}>
                    Tambahkan jenis luaran kegiatan untuk program ini
                  </Typography>
                </Box>
              ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {["No", "Nama Luaran", "Keterangan", "Tipe", "Deadline", "Aksi"].map((h, i) => (
                        <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 5 && { textAlign: "center" }) }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLuaranList.map((luaran) => {
                      const tipe = TIPE_MAP[luaran.tipe] || {};
                      const lewat = isDeadlineLewat(luaran.deadline);
                      return (
                        <TableRow key={luaran.id_luaran} sx={tableBodyRow}>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, color: "#777" }}>{luaran.urutan}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{luaran.nama_luaran}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, color: "#555", maxWidth: 240 }}>
                              {luaran.keterangan || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={tipe.label}
                              size="small"
                              sx={{ backgroundColor: tipe.bg, color: "#fff", fontWeight: 700, fontSize: 12 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, color: lewat ? "#c62828" : "#555", fontWeight: lewat ? 700 : 400 }}>
                              {formatDate(luaran.deadline)}
                            </Typography>
                            {lewat && (
                              <Typography sx={{ fontSize: 11, color: "#c62828", fontWeight: 600 }}>Sudah Lewat</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                              <Button
                                size="small" variant="outlined"
                                onClick={() => handleOpenEdit(luaran)}
                                sx={{
                                  textTransform: "none", borderRadius: "50px", fontSize: 12,
                                  fontWeight: 600, px: 2, borderColor: "#0D59F2", color: "#0D59F2",
                                  "&:hover": { backgroundColor: "#f0f4ff" },
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small" variant="outlined"
                                onClick={() => handleDelete(luaran)}
                                sx={{
                                  textTransform: "none", borderRadius: "50px", fontSize: 12,
                                  fontWeight: 600, px: 2, borderColor: "#e53935", color: "#e53935",
                                  "&:hover": { backgroundColor: "rgba(229,57,53,0.06)" },
                                }}
                              >
                                Hapus
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            </Box>
          </Paper>
        </Box>

        <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: { xs: "16px", sm: "24px" }, overflow: "hidden" } }}>
          <Box sx={{ p: { xs: 1.5, sm: 2 }, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, color: "#fff" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: 16, sm: 18 } }}>
                {editData ? "Edit Data Luaran" : "Tambah Data Luaran"}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseForm} sx={{ color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" } }}>
              <Close />
            </IconButton>
          </Box>
          <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>
                  Nama Luaran <span style={{ color: COLORS.error }}>*</span>
                </Typography>
                <TextField
                  fullWidth placeholder="Contoh: Laporan Kemajuan"
                  value={form.nama_luaran}
                  onChange={(e) => { setForm({ ...form, nama_luaran: e.target.value }); setErrors({ ...errors, nama_luaran: "" }); }}
                  error={!!errors.nama_luaran} helperText={errors.nama_luaran}
                  disabled={submitting} sx={roundedField}
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Keterangan</Typography>
                <TextField
                  fullWidth multiline rows={3}
                  placeholder="Deskripsi atau keterangan tambahan..."
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  disabled={submitting} sx={roundedField}
                />
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>
                    Tipe Pengumpulan <span style={{ color: COLORS.error }}>*</span>
                  </Typography>
                  <TextField
                    select fullWidth value={form.tipe}
                    onChange={(e) => { setForm({ ...form, tipe: e.target.value }); setErrors({ ...errors, tipe: "" }); }}
                    error={!!errors.tipe} helperText={errors.tipe}
                    disabled={submitting} sx={roundedField}
                  >
                    <MenuItem value="">Pilih tipe</MenuItem>
                    <MenuItem value={1}>File (PDF)</MenuItem>
                    <MenuItem value={2}>Link URL</MenuItem>
                    <MenuItem value={3}>File & Link</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>
                    Urutan <span style={{ color: COLORS.error }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth type="text" placeholder="1"
                    value={form.urutan}
                    onChange={(e) => { setForm({ ...form, urutan: e.target.value }); setErrors({ ...errors, urutan: "" }); }}
                    error={!!errors.urutan} helperText={errors.urutan}
                    disabled={submitting} inputProps={{ min: 1 }} sx={roundedField}
                  />
                </Box>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>
                  Deadline <span style={{ color: COLORS.error }}>*</span>
                </Typography>
                <TextField
                  fullWidth type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => { setForm({ ...form, deadline: e.target.value }); setErrors({ ...errors, deadline: "" }); }}
                  error={!!errors.deadline} helperText={errors.deadline}
                  disabled={submitting} InputLabelProps={{ shrink: true }} sx={roundedField}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 2, sm: 3 }, backgroundColor: "#F8FAFC", borderTop: "1.5px solid #E2E8F0", gap: 1.5, flexDirection: { xs: "column", sm: "row" }, "& > button": { width: { xs: "100%", sm: "auto" } } }}>
            <Button
              variant="contained"
              onClick={handleCloseForm}
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
              onClick={handleSubmit}
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
