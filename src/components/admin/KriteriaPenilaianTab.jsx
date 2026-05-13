import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Dialog, DialogContent, DialogActions,
  TextField, MenuItem, IconButton, Paper
} from "@mui/material";
import { Close } from "@mui/icons-material";
import Swal from "sweetalert2";
import LoadingScreen from "../common/LoadingScreen";
import {
  getTahapProgram, getKriteriaPenilaian,
  createKriteriaPenilaian, updateKriteriaPenilaian, deleteKriteriaPenilaian,
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

const emptyForm = { nama_kriteria: "", deskripsi: "", bobot: "", urutan: "", status: 1 };

export default function KriteriaPenilaianTab({ id_program }) {
  const [loading, setLoading] = useState(true);
  const [tahapList, setTahapList] = useState([]);
  const [selectedTahap, setSelectedTahap] = useState("");
  const [kriteriaList, setKriteriaList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [dialog, setDialog] = useState({ open: false, mode: "create", data: null });
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const fetchTahap = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTahapProgram(id_program);
      const data = res.data || [];
      setTahapList(data);
      if (data.length > 0) setSelectedTahap(data[0].id_tahap);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat tahap penilaian", confirmButtonColor: COLORS.primary });
    } finally {
      setLoading(false);
    }
  }, [id_program]);

  const fetchKriteria = useCallback(async () => {
    if (!selectedTahap) return;
    try {
      setLoading(true);
      const res = await getKriteriaPenilaian(selectedTahap);
      setKriteriaList(res.data?.kriteria || []);
    } catch {
      setKriteriaList([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTahap]);

  useEffect(() => { fetchTahap(); }, [fetchTahap]);
  useEffect(() => { if (selectedTahap) fetchKriteria(); }, [selectedTahap, fetchKriteria]);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setErrors({});
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
    setDialog({ open: true, mode: "edit", data: kriteria });
  };

  const handleCloseDialog = () => {
    setDialog({ open: false, mode: "create", data: null });
    setForm(emptyForm);
    setErrors({});
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
      const payload = {
        nama_kriteria: currentForm.nama_kriteria,
        deskripsi: currentForm.deskripsi,
        bobot: Number(currentForm.bobot),
        urutan: Number(currentForm.urutan),
        status: Number(currentForm.status),
      };
      if (currentDialog.mode === "create") {
        await createKriteriaPenilaian(selectedTahap, payload);
      } else {
        await updateKriteriaPenilaian(currentDialog.data.id_kriteria, payload);
      }
      await Swal.fire({ icon: "success", title: "Berhasil", text: currentDialog.mode === "create" ? "Kriteria berhasil ditambahkan" : "Kriteria berhasil diperbarui", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchKriteria();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menyimpan kriteria", confirmButtonColor: COLORS.primary });
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
      confirmButtonColor: "#d33", cancelButtonColor: "#666",
      confirmButtonText: "Ya, Hapus", cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteKriteriaPenilaian(kriteria.id_kriteria);
      await Swal.fire({ icon: "success", title: "Berhasil", text: "Kriteria berhasil dihapus", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchKriteria();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menghapus kriteria", confirmButtonColor: COLORS.primary });
    }
  };

  if (loading && tahapList.length === 0) {
    return (
      <Box sx={{ position: "relative", minHeight: 320 }}>
        <LoadingScreen message="Memuat tahap penilaian..." overlay minHeight="320px" />
      </Box>
    );
  }

  if (tahapList.length === 0) {
    return (
      <Box sx={{ p: 2, borderRadius: "10px", backgroundColor: COLORS.primaryLight, border: `1px solid ${COLORS.primaryMuted}` }}>
        <Typography sx={{ fontSize: 13, color: COLORS.primaryDark }}>
          Belum ada tahap penilaian. Silakan buat tahap terlebih dahulu di tab Tahap Penilaian.
        </Typography>
      </Box>
    );
  }

  const aktifKriteria = kriteriaList.filter((k) => Number(k.status) === 1);
  const totalBobot = aktifKriteria.reduce((sum, k) => sum + Number(k.bobot), 0);
  const isBobotComplete = totalBobot === 100;
  const isBobotExceeded = totalBobot > 100;

  const selectedTahapName = tahapList.find((t) => t.id_tahap === selectedTahap)?.nama_tahap || "Tahap ini";

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, mb: 3, gap: 2, flexWrap: "wrap", flexDirection: { xs: "column", sm: "row" } }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: { xs: "stretch", sm: "center" }, flexWrap: "wrap", flexDirection: { xs: "column", sm: "row" }, minWidth: 0 }}>
          <Typography sx={{ fontSize: { xs: 14, sm: 16 }, fontWeight: 700, color: "#1E293B" }}>Pilih Tahap:</Typography>
          <TextField
            select
            size="small"
            value={selectedTahap}
            onChange={(e) => setSelectedTahap(e.target.value)}
            sx={{
              minWidth: { xs: "100%", sm: 280 },
              width: { xs: "100%", sm: 280 },
              ...roundedField,
              "& .MuiSelect-select": {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "block",
                paddingRight: "36px !important",
              },
            }}
            SelectProps={{
              renderValue: (value) => {
                const t = tahapList.find((x) => x.id_tahap === value);
                const label = t ? `${t.nama_tahap} (Urutan ${t.urutan})` : "";
                return (
                  <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{label}</Box>
                );
              }
            }}
          >
            {tahapList.map((tahap) => (
              <MenuItem key={tahap.id_tahap} value={tahap.id_tahap}>
                <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                  {tahap.nama_tahap} (Urutan {tahap.urutan})
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button
            variant="contained"
            onClick={handleOpenCreate}
            disabled={isBobotComplete || isBobotExceeded}
            sx={{
              textTransform: "none", borderRadius: "12px", px: { xs: 2, sm: 3 }, py: 1.2, fontWeight: 700,
              backgroundColor: (isBobotComplete || isBobotExceeded) ? "#E2E8F0" : COLORS.primary,
              boxShadow: (isBobotComplete || isBobotExceeded) ? "none" : "0 4px 12px rgba(13, 89, 242, 0.2)",
              width: { xs: "100%", sm: "auto" },
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              "&:hover": { 
                backgroundColor: (isBobotComplete || isBobotExceeded) ? "#E2E8F0" : COLORS.primaryDark,
                boxShadow: (isBobotComplete || isBobotExceeded) ? "none" : "0 6px 16px rgba(13, 89, 242, 0.3)",
              },
            }}
          >
            Tambah Kriteria
          </Button>
        </Box>
      </Box>

      {(isBobotComplete || isBobotExceeded || totalBobot > 0) && (
        <Box sx={{
          mb: 3,
          p: 2,
          borderRadius: "12px",
          border: `1.5px solid ${isBobotComplete ? COLORS.success : isBobotExceeded ? COLORS.error : COLORS.warning}`,
          backgroundColor: isBobotComplete ? COLORS.successLight : isBobotExceeded ? COLORS.errorLight : COLORS.warningLight,
          display: "flex",
          alignItems: "center",
          gap: 1.5
        }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: isBobotComplete ? COLORS.success : isBobotExceeded ? COLORS.error : COLORS.warning }}>
            {isBobotComplete
              ? `Status: Bobot tahap ${selectedTahapName} sudah lengkap 100%`
              : isBobotExceeded
              ? `Peringatan: Bobot tahap ${selectedTahapName} sudah ${totalBobot}% (melebihi 100%)`
              : `Informasi: Bobot tahap ${selectedTahapName} saat ini ${totalBobot}%, kurang ${100 - totalBobot}% lagi`}
          </Typography>
        </Box>
      )}

      {loading ? (
        <Box sx={{ position: "relative", minHeight: 320 }}>
          <LoadingScreen message="Memuat kriteria penilaian..." overlay minHeight="320px" />
        </Box>
      ) : kriteriaList.length === 0 ? (
        <Paper elevation={0} sx={{ p: { xs: 5, sm: 8 }, textAlign: "center", borderRadius: "20px", border: "1.5px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
          <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#1E293B", mb: 1 }}>Belum ada kriteria penilaian</Typography>
          <Typography sx={{ fontSize: 14, color: COLORS.slate, fontWeight: 500 }}>Klik Tambah Kriteria untuk menentukan aspek penilaian di tahap ini</Typography>
        </Paper>
      ) : (
        <TableContainer sx={{ borderRadius: "16px", border: "1.5px solid #E2E8F0", overflow: "hidden", overflowX: "auto", mb: 4 }}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                {["URUTAN", "NAMA KRITERIA", "DESKRIPSI", "BOBOT (%)", "STATUS", "AKSI"].map((h, i) => (
                  <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 5 && { textAlign: "center" }), ...(i === 0 && { pl: { xs: 1.5, sm: 3 } }) }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {kriteriaList.map((kriteria) => (
                  <TableRow key={kriteria.id_kriteria} sx={tableBodyRow}>
                    <TableCell sx={{ pl: { xs: 1.5, sm: 3 } }}>
                      <Typography sx={{ fontWeight: 800, fontSize: { xs: 13, sm: 14 }, color: "#1E293B" }}>{kriteria.urutan}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, fontSize: { xs: 13, sm: 14 }, color: "#1E293B" }}>{kriteria.nama_kriteria}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: { xs: 12, sm: 13 }, color: COLORS.slate, fontWeight: 500 }}>{kriteria.deskripsi || "-"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: { xs: 13, sm: 14 }, fontWeight: 800, color: COLORS.primary }}>{kriteria.bobot}%</Typography>
                    </TableCell>
                    <TableCell>
                      <StatusPill
                        label={kriteria.status === 1 ? "Aktif" : "Nonaktif"}
                        type={kriteria.status === 1 ? "success" : "slate"}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 1 }, justifyContent: "center", flexWrap: "wrap" }}>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          onClick={() => handleOpenEdit(kriteria)}
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
                          onClick={() => handleDelete(kriteria)}
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialog.open} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: { xs: "16px", sm: "24px" }, overflow: "hidden" } }}>
        <Box sx={{ p: { xs: 1.5, sm: 2 }, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, color: "#fff" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: 16, sm: 18 } }}>
              {dialog.mode === "create" ? "Tambah Kriteria Penilaian" : "Edit Kriteria Penilaian"}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} sx={{ color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" } }}>
            <Close />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Nama Kriteria <span style={{ color: COLORS.error }}>*</span></Typography>
              <TextField
                fullWidth placeholder="Contoh: Deskripsi Bisnis"
                value={form.nama_kriteria}
                onChange={(e) => { setForm({ ...form, nama_kriteria: e.target.value }); setErrors({ ...errors, nama_kriteria: "" }); }}
                error={!!errors.nama_kriteria} helperText={errors.nama_kriteria}
                disabled={submitting} sx={roundedField}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Deskripsi</Typography>
              <TextField
                fullWidth multiline rows={3}
                placeholder="Deskripsi singkat kriteria penilaian"
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                disabled={submitting} sx={roundedField}
              />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Bobot (%) <span style={{ color: COLORS.error }}>*</span></Typography>
                <TextField
                  fullWidth placeholder="1-100"
                  value={form.bobot}
                  onChange={(e) => { setForm({ ...form, bobot: e.target.value }); setErrors({ ...errors, bobot: "" }); }}
                  inputProps={{ min: 1, max: 100 }}
                  error={!!errors.bobot} helperText={errors.bobot}
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
            </Box>

            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Status <span style={{ color: COLORS.error }}>*</span></Typography>
              <TextField
                select fullWidth value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                disabled={submitting} sx={roundedField}
              >
                <MenuItem value={1}>Aktif</MenuItem>
                <MenuItem value={0}>Nonaktif</MenuItem>
              </TextField>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 2, sm: 3 }, backgroundColor: "#F8FAFC", borderTop: "1.5px solid #E2E8F0", gap: 1.5, flexDirection: { xs: "column", sm: "row" }, "& button": { width: { xs: "100%", sm: "auto" } } }}>
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
