import { useState } from "react";
import {
  Box, Typography, Button, Dialog, DialogContent,
  DialogActions, TextField, IconButton, Paper,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import Swal from "sweetalert2";
import { setProgramTimeline } from "../../api/admin";

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

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const getTimelineStatus = (prog) => {
  if (!prog.pendaftaran_mulai || !prog.pendaftaran_selesai) {
    return { label: "Belum Diatur", type: "slate" };
  }
  const now = new Date();
  const mulai = new Date(prog.pendaftaran_mulai);
  const selesai = new Date(prog.pendaftaran_selesai);
  if (now < mulai) return { label: "Belum Dimulai", type: "primary" };
  if (now >= mulai && now <= selesai) return { label: "Sedang Berjalan", type: "success" };
  return { label: "Sudah Ditutup", type: "error" };
};

export default function TimelineProgramTab({ program, onUpdate }) {
  const [openDialog, setOpenDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ pendaftaran_mulai: "", pendaftaran_selesai: "" });
  const [errors, setErrors] = useState({});

  const status = getTimelineStatus(program);
  const isOngoing = status.label === "Sedang Berjalan";

  const handleOpenDialog = () => {
    setForm({
      pendaftaran_mulai: program.pendaftaran_mulai
        ? new Date(program.pendaftaran_mulai).toISOString().slice(0, 16) : "",
      pendaftaran_selesai: program.pendaftaran_selesai
        ? new Date(program.pendaftaran_selesai).toISOString().slice(0, 16) : "",
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setErrors({});
  };

  const validate = () => {
    const newErrors = {};
    if (!form.pendaftaran_mulai) newErrors.pendaftaran_mulai = "Tanggal mulai wajib diisi";
    if (!form.pendaftaran_selesai) newErrors.pendaftaran_selesai = "Tanggal selesai wajib diisi";
    if (form.pendaftaran_mulai && form.pendaftaran_selesai) {
      if (new Date(form.pendaftaran_mulai) >= new Date(form.pendaftaran_selesai)) {
        newErrors.pendaftaran_selesai = "Tanggal selesai harus lebih besar dari tanggal mulai";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setOpenDialog(false);

    const result = await Swal.fire({
      title: "Konfirmasi",
      text: "Simpan timeline pendaftaran?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: COLORS.primary, 
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Ya, Simpan", 
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) { setOpenDialog(true); return; }

    try {
      setSubmitting(true);
      await setProgramTimeline(program.id_program, {
        pendaftaran_mulai: form.pendaftaran_mulai,
        pendaftaran_selesai: form.pendaftaran_selesai,
      });
      await Swal.fire({ icon: "success", title: "Berhasil", text: "Timeline berhasil disimpan", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      handleCloseDialog();
      onUpdate();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menyimpan timeline", confirmButtonColor: COLORS.primary });
      setOpenDialog(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 3, gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          onClick={handleOpenDialog}
          sx={{
            textTransform: "none", borderRadius: "12px", px: { xs: 2, sm: 3 }, py: 1.2, fontWeight: 700,
            backgroundColor: COLORS.primary,
            boxShadow: "0 4px 12px rgba(13, 89, 242, 0.2)",
            width: { xs: "100%", sm: "auto" },
            minWidth: 0,
            "&:hover": { 
              backgroundColor: COLORS.primaryDark,
              boxShadow: "0 6px 16px rgba(13, 89, 242, 0.3)",
            },
          }}
        >
          Edit Timeline
        </Button>
      </Box>

      <Paper elevation={0} sx={{
        p: { xs: 3, sm: 4 }, 
        borderRadius: "16px",
        border: `1.5px solid #E2E8F0`,
        backgroundColor: "#fff",
      }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1.5fr 1fr 1fr 1fr" }, gap: { xs: 3, sm: 4 } }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.slate, mb: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nama Program</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 16, color: "#1E293B" }}>{program.keterangan}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.slate, mb: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}>Pendaftaran Mulai</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#334155" }}>{formatDate(program.pendaftaran_mulai)}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.slate, mb: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}>Pendaftaran Selesai</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#334155" }}>{formatDate(program.pendaftaran_selesai)}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.slate, mb: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status Saat Ini</Typography>
            <StatusPill label={status.label} type={status.type} />
          </Box>
        </Box>
      </Paper>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth 
        PaperProps={{ sx: { borderRadius: { xs: "16px", sm: "24px" }, overflow: "hidden" } }}
      >
        <Box sx={{ p: { xs: 1.5, sm: 2 }, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, color: "#fff" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: 16, sm: 18 } }}>Edit Timeline Pendaftaran</Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} sx={{ color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" } }}>
            <Close />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}>
          {isOngoing && (
            <Box sx={{ p: 2, mb: 3, borderRadius: "12px", backgroundColor: COLORS.primaryLight, border: `1.5px solid ${COLORS.primaryMuted}`, display: "flex", gap: 1.5 }}>
              <Typography sx={{ fontSize: 13, color: COLORS.primaryDark, fontWeight: 600, lineHeight: 1.5 }}>
                Pendaftaran sedang berjalan. Hanya tanggal selesai yang bisa diubah untuk memperpanjang atau memperpendek periode pendaftaran.
              </Typography>
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>
              Pendaftaran Mulai <span style={{ color: COLORS.error }}>*</span>
            </Typography>
            <TextField
              fullWidth type="datetime-local"
              value={form.pendaftaran_mulai}
              onChange={(e) => { setForm({ ...form, pendaftaran_mulai: e.target.value }); setErrors({ ...errors, pendaftaran_mulai: "" }); }}
              error={!!errors.pendaftaran_mulai}
              helperText={errors.pendaftaran_mulai}
              disabled={submitting || isOngoing}
              InputLabelProps={{ shrink: true }}
              sx={roundedField}
            />
          </Box>

          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>
              Pendaftaran Selesai <span style={{ color: COLORS.error }}>*</span>
            </Typography>
            <TextField
              fullWidth type="datetime-local"
              value={form.pendaftaran_selesai}
              onChange={(e) => { setForm({ ...form, pendaftaran_selesai: e.target.value }); setErrors({ ...errors, pendaftaran_selesai: "" }); }}
              error={!!errors.pendaftaran_selesai}
              helperText={errors.pendaftaran_selesai}
              disabled={submitting}
              InputLabelProps={{ shrink: true }}
              sx={roundedField}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 2, sm: 3 }, backgroundColor: "#F8FAFC", borderTop: "1.5px solid #E2E8F0", gap: 1.5, flexDirection: { xs: "column", sm: "row" }, "& > button": { width: { xs: "100%", sm: "auto" } } }}>
          <Button 
            onClick={handleCloseDialog} 
            disabled={submitting}
            variant="contained"
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