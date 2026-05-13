import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog,
  DialogContent, DialogActions, TextField,
  IconButton, Tooltip,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import Swal from "sweetalert2";
import LoadingScreen from "../common/LoadingScreen";
import {
  getTahapProgram, createTahapProgram, updateTahapProgram, deleteTahapProgram,
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
  success:      "#059669",
  successLight: "#ECFDF5",
  warning:      "#D97706",
  warningLight: "#FFFBEB",
  error:        "#DC2626",
  errorLight:    "#ff7070",
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

const StatusPill = ({ label, type = "primary" }) => {
  const colorMap = {
    warning: { bg: COLORS.warningLight, text: COLORS.warning },
    success: { bg: COLORS.successLight, text: COLORS.success },
    error: { bg: COLORS.errorLight, text: COLORS.error },
    primary: { bg: COLORS.primaryLight, text: COLORS.primary },
    info: { bg: "#E0F2FE", text: "#0284C7" },
    slate: { bg: COLORS.slateLight, text: COLORS.slate },
  };

  const colors = colorMap[type] || colorMap.primary;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1.5,
        py: 0.5,
        borderRadius: "8px",
        backgroundColor: colors.bg,
        color: colors.text,
        fontSize: 11,
        fontWeight: 800,
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        letterSpacing: "0.02em",
      }}
    >
      {label}
    </Box>
  );
};

const emptyForm = { nama_tahap: "", urutan: "", penilaian_mulai: "", penilaian_selesai: "" };

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const getJadwalStatus = (mulai, selesai) => {
  if (!mulai || !selesai) return { label: "Belum Diatur", type: "slate" };
  const now = new Date();
  if (now < new Date(mulai)) return { label: "Belum Dimulai", type: "primary" };
  if (now <= new Date(selesai)) return { label: "Sedang Berjalan", type: "success" };
  return { label: "Sudah Ditutup", type: "error" };
};

export default function TahapPenilaianTab({ id_program }) {
  const [loading, setLoading] = useState(true);
  const [tahapList, setTahapList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [dialog, setDialog] = useState({ open: false, mode: "create", data: null });
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const fetchTahap = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTahapProgram(id_program);
      setTahapList(res.data || []);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat tahap penilaian", confirmButtonColor: COLORS.primary });
    } finally {
      setLoading(false);
    }
  }, [id_program]);

  useEffect(() => { fetchTahap(); }, [fetchTahap]);

  const canAddTahap = tahapList.length < 2;
  const usedUrutanList = tahapList.map((t) => t.urutan);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setErrors({});
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
    setDialog({ open: true, mode: "edit", data: tahap });
  };

  const handleCloseDialog = () => {
    setDialog({ open: false, mode: "create", data: null });
    setForm(emptyForm);
    setErrors({});
  };

  const validate = (mode) => {
    const newErrors = {};
    if (mode === "create") {
      if (!form.nama_tahap.trim()) newErrors.nama_tahap = "Nama tahap wajib diisi";
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
      text: currentDialog.mode === "create" ? "Tambah tahap penilaian baru?" : "Simpan perubahan jadwal tahap?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: COLORS.primary, 
      cancelButtonColor: "#6B7280",
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
        await createTahapProgram(id_program, {
          nama_tahap: currentForm.nama_tahap,
          urutan: Number(currentForm.urutan),
          penilaian_mulai: currentForm.penilaian_mulai,
          penilaian_selesai: currentForm.penilaian_selesai,
        });
      } else {
        await updateTahapProgram(currentDialog.data.id_tahap, {
          penilaian_mulai: currentForm.penilaian_mulai,
          penilaian_selesai: currentForm.penilaian_selesai,
        });
      }
      await Swal.fire({ icon: "success", title: "Berhasil", text: currentDialog.mode === "create" ? "Tahap penilaian berhasil ditambahkan" : "Jadwal tahap berhasil diperbarui", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchTahap();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menyimpan tahap", confirmButtonColor: COLORS.primary });
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
      confirmButtonColor: COLORS.error, 
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Ya, Hapus", 
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteTahapProgram(tahap.id_tahap);
      await Swal.fire({ icon: "success", title: "Berhasil", text: "Tahap penilaian berhasil dihapus", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchTahap();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menghapus tahap", confirmButtonColor: COLORS.primary });
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 3, gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Tooltip 
            title={!canAddTahap ? "Maksimal 2 tahap penilaian" : ""} 
            componentsProps={{ root: { style: { display: 'block' } } }}
          >
            <Button
              variant="contained"
              onClick={handleOpenCreate}
              disabled={!canAddTahap}
              sx={{
                textTransform: "none", borderRadius: "12px", px: { xs: 2, sm: 3 }, py: 1.2, fontWeight: 700,
                backgroundColor: canAddTahap ? COLORS.primary : "#E2E8F0",
                color: canAddTahap ? "#fff" : "#94A3B8",
                boxShadow: canAddTahap ? "0 4px 12px rgba(13, 89, 242, 0.2)" : "none",
                width: { xs: "100%", sm: "auto" },
                minWidth: 0,
                "&:hover": { 
                  backgroundColor: canAddTahap ? COLORS.primaryDark : "#E2E8F0",
                  boxShadow: canAddTahap ? "0 6px 16px rgba(13, 89, 242, 0.3)" : "none",
                },
              }}
            >
              Tambah Tahap
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {!canAddTahap && (
        <Box sx={{ p: 2, mb: 3, borderRadius: "12px", backgroundColor: COLORS.primaryLight, border: `1.5px solid ${COLORS.primaryMuted}` }}>
          <Typography sx={{ fontSize: 13, color: COLORS.primaryDark, fontWeight: 600 }}>
            Sudah terdapat 2 tahap penilaian (maksimal). Hapus salah satu tahap jika ingin menambahkan tahap baru.
          </Typography>
        </Box>
      )}

      {loading ? (
        <Box sx={{ position: "relative", minHeight: 320 }}>
          <LoadingScreen message="Memuat tahap penilaian..." overlay minHeight="320px" />
        </Box>
      ) : tahapList.length === 0 ? (
        <Paper elevation={0} sx={{ p: { xs: 5, sm: 8 }, textAlign: "center", borderRadius: "20px", border: "1.5px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
          <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#1E293B", mb: 1 }}>Belum ada tahap penilaian</Typography>
          <Typography sx={{ fontSize: 14, color: COLORS.slate, fontWeight: 500 }}>Klik Tambah Tahap untuk menentukan alur penilaian program</Typography>
        </Paper>
      ) : (
        <TableContainer sx={{ borderRadius: "16px", border: "1.5px solid #E2E8F0", overflow: "hidden", overflowX: "auto", mb: 4 }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                {["URUTAN", "NAMA TAHAP", "PENILAIAN MULAI", "PENILAIAN SELESAI", "STATUS JADWAL", "STATUS", "AKSI"].map((h, i) => (
                  <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 6 && { textAlign: "center" }), ...(i === 0 && { pl: { xs: 1.5, sm: 3 } }) }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tahapList.map((tahap) => {
                const jadwalStatus = getJadwalStatus(tahap.penilaian_mulai, tahap.penilaian_selesai);
                return (
                  <TableRow key={tahap.id_tahap} sx={tableBodyRow}>
                    <TableCell sx={{ pl: { xs: 1.5, sm: 3 } }}>
                      <StatusPill label={`Tahap ${tahap.urutan}`} type="info" />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, fontSize: { xs: 13, sm: 14 }, color: "#1E293B" }}>{tahap.nama_tahap}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: { xs: 12, sm: 13 }, color: COLORS.slate, fontWeight: 600 }}>{formatDate(tahap.penilaian_mulai)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: { xs: 12, sm: 13 }, color: COLORS.slate, fontWeight: 600 }}>{formatDate(tahap.penilaian_selesai)}</Typography>
                    </TableCell>
                    <TableCell>
                      <StatusPill label={jadwalStatus.label} type={jadwalStatus.type} />
                    </TableCell>
                    <TableCell>
                      <StatusPill
                        label={tahap.status === 1 ? "Aktif" : "Nonaktif"}
                        type={tahap.status === 1 ? "success" : "slate"}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 1 }, justifyContent: "center", flexWrap: "wrap" }}>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          onClick={() => handleOpenEdit(tahap)}
                          sx={{
                            textTransform: "none",
                            color: COLORS.primary,
                            borderColor: COLORS.primaryMuted,
                            borderRadius: "10px",
                            fontWeight: 700,
                            fontSize: { xs: 11, sm: 12 },
                            px: { xs: 1, sm: 2 },
                            minWidth: 0,
                            "&:hover": { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary }
                          }}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error" 
                          onClick={() => handleDelete(tahap)}
                          sx={{
                            textTransform: "none",
                            borderColor: COLORS.errorLight,
                            borderRadius: "10px",
                            fontWeight: 700,
                            fontSize: { xs: 11, sm: 12 },
                            px: { xs: 1, sm: 2 },
                            minWidth: 0,
                            "&:hover": { backgroundColor: COLORS.errorLight, borderColor: COLORS.error }
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

      <Dialog open={dialog.open} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: { xs: "16px", sm: "24px" }, overflow: "hidden" } }}>
        <Box sx={{ p: { xs: 1.5, sm: 2 }, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, color: "#fff" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: 16, sm: 18 } }}>
              {dialog.mode === "create" ? "Tambah Tahap Penilaian" : "Edit Jadwal Tahap"}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} sx={{ color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" } }}>
            <Close />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {dialog.mode === "create" ? (
              <>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Nama Tahap <span style={{ color: COLORS.error }}>*</span></Typography>
                  <TextField
                    fullWidth placeholder="Contoh: Desk Evaluasi"
                    value={form.nama_tahap}
                    onChange={(e) => { setForm({ ...form, nama_tahap: e.target.value }); setErrors({ ...errors, nama_tahap: "" }); }}
                    error={!!errors.nama_tahap} helperText={errors.nama_tahap}
                    disabled={submitting} sx={roundedField}
                  />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Urutan <span style={{ color: COLORS.error }}>*</span></Typography>
                  <TextField
                    fullWidth placeholder="Contoh: 1"
                    value={form.urutan}
                    onChange={(e) => { setForm({ ...form, urutan: e.target.value }); setErrors({ ...errors, urutan: "" }); }}
                    inputProps={{ min: 1 }}
                    error={!!errors.urutan} helperText={errors.urutan}
                    disabled={submitting} sx={roundedField}
                  />
                </Box>
              </>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Nama Tahap</Typography>
                  <TextField fullWidth value={form.nama_tahap} disabled sx={{ ...roundedField, "& .MuiOutlinedInput-root": { backgroundColor: "#F1F5F9" } }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Urutan</Typography>
                  <TextField fullWidth value={`Tahap ${form.urutan}`} disabled sx={{ ...roundedField, "& .MuiOutlinedInput-root": { backgroundColor: "#F1F5F9" } }} />
                </Box>
              </Box>
            )}

            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Penilaian Mulai <span style={{ color: COLORS.error }}>*</span></Typography>
              <TextField
                fullWidth type="datetime-local"
                value={form.penilaian_mulai}
                onChange={(e) => { setForm({ ...form, penilaian_mulai: e.target.value }); setErrors({ ...errors, penilaian_mulai: "" }); }}
                error={!!errors.penilaian_mulai} helperText={errors.penilaian_mulai}
                disabled={submitting} InputLabelProps={{ shrink: true }} sx={roundedField}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Penilaian Selesai <span style={{ color: COLORS.error }}>*</span></Typography>
              <TextField
                fullWidth type="datetime-local"
                value={form.penilaian_selesai}
                onChange={(e) => { setForm({ ...form, penilaian_selesai: e.target.value }); setErrors({ ...errors, penilaian_selesai: "" }); }}
                error={!!errors.penilaian_selesai} helperText={errors.penilaian_selesai}
                disabled={submitting} InputLabelProps={{ shrink: true }} sx={roundedField}
              />
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
    </Box>
  );
}
