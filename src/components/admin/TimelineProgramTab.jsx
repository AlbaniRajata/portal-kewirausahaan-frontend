import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
} from "@mui/material";
import { Edit, CalendarMonth, Close } from "@mui/icons-material";
import Swal from "sweetalert2";
import { setProgramTimeline } from "../../api/admin";

const roundedField = {
  "& .MuiOutlinedInput-root": { borderRadius: "15px" },
};

const StatusPill = ({ label, bg, color }) => (
  <Box sx={{
    display: "inline-flex", alignItems: "center",
    px: 1.5, py: 0.4, borderRadius: "50px",
    backgroundColor: bg, color, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {label}
  </Box>
);

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function TimelineProgramTab({ program, onUpdate }) {
  const [openDialog, setOpenDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState("");
  const [form, setForm] = useState({ pendaftaran_mulai: "", pendaftaran_selesai: "" });
  const [errors, setErrors] = useState({});

  const getTimelineStatus = (prog) => {
    if (!prog.pendaftaran_mulai || !prog.pendaftaran_selesai) {
      return { label: "Belum Diatur", color: "#666", bg: "#f5f5f5" };
    }
    const now = new Date();
    const mulai = new Date(prog.pendaftaran_mulai);
    const selesai = new Date(prog.pendaftaran_selesai);
    if (now < mulai) return { label: "Belum Dimulai", bg: "#1565c0", color: "#e3f2fd" };
    if (now >= mulai && now <= selesai) return { label: "Sedang Berjalan", bg: "#2e7d32", color: "#e8f5e9" };
    return { label: "Sudah Ditutup", bg: "#c62828", color: "#fce4ec" };
  };

  const isOngoing = getTimelineStatus(program).label === "Sedang Berjalan";
  const status = getTimelineStatus(program);

  const handleOpenDialog = () => {
    setForm({
      pendaftaran_mulai: program.pendaftaran_mulai ? new Date(program.pendaftaran_mulai).toISOString().slice(0, 16) : "",
      pendaftaran_selesai: program.pendaftaran_selesai ? new Date(program.pendaftaran_selesai).toISOString().slice(0, 16) : "",
    });
    setErrors({});
    setAlert("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setErrors({});
    setAlert("");
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
      confirmButtonColor: "#0D59F2", cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Simpan", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) { setOpenDialog(true); return; }
    try {
      setSubmitting(true);
      const response = await setProgramTimeline(program.id_program, {
        pendaftaran_mulai: form.pendaftaran_mulai,
        pendaftaran_selesai: form.pendaftaran_selesai,
      });
      if (response.success) {
        await Swal.fire({ icon: "success", title: "Berhasil", text: response.message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
        handleCloseDialog();
        onUpdate();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message });
        setOpenDialog(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menyimpan timeline";
      Swal.fire({ icon: "error", title: "Gagal", text: msg });
      setAlert(msg);
      setOpenDialog(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Timeline Pendaftaran</Typography>
        <Button
          variant="contained"
          startIcon={<Edit sx={{ fontSize: 14 }} />}
          onClick={handleOpenDialog}
          sx={{
            textTransform: "none", borderRadius: "50px",
            px: 3, py: 1.2, fontWeight: 600,
            backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" },
          }}
        >
          Edit Timeline
        </Button>
      </Box>

      <Box sx={{ p: 3, border: "1.5px solid #f0f0f0", borderRadius: "12px", backgroundColor: "#fafafa" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 3 }}>
          <Box>
            <Typography sx={{ fontSize: 12, color: "#888", mb: 0.75 }}>Nama Program</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{program.keterangan}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, color: "#888", mb: 0.75 }}>Pendaftaran Mulai</Typography>
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{formatDate(program.pendaftaran_mulai)}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, color: "#888", mb: 0.75 }}>Pendaftaran Selesai</Typography>
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{formatDate(program.pendaftaran_selesai)}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, color: "#888", mb: 0.75 }}>Status</Typography>
            <StatusPill label={status.label} bg={status.bg} color={status.color} />
          </Box>
        </Box>
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarMonth sx={{ color: "#0D59F2" }} />
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Edit Timeline Pendaftaran</Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 3 }}>
          {alert && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setAlert("")}>
              {alert}
            </Alert>
          )}

          {isOngoing && (
            <Alert severity="info" sx={{ mb: 3, borderRadius: "12px" }}>
              Pendaftaran sedang berjalan. Hanya tanggal selesai yang bisa diubah.
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
              Pendaftaran Mulai <span style={{ color: "#ef5350" }}>*</span>
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
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
              Pendaftaran Selesai <span style={{ color: "#ef5350" }}>*</span>
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