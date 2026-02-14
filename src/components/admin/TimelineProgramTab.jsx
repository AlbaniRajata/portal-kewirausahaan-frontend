import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Paper,
} from "@mui/material";
import { Edit, CalendarMonth } from "@mui/icons-material";
import Swal from "sweetalert2";
import { setProgramTimeline } from "../../api/admin";

export default function TimelineProgramTab({ program, onUpdate }) {
  const [openDialog, setOpenDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState("");
  const [form, setForm] = useState({
    pendaftaran_mulai: "",
    pendaftaran_selesai: "",
  });
  const [errors, setErrors] = useState({});

  const getTimelineStatus = (prog) => {
    if (!prog.pendaftaran_mulai || !prog.pendaftaran_selesai) {
      return { label: "Belum Diatur", color: "default" };
    }

    const now = new Date();
    const mulai = new Date(prog.pendaftaran_mulai);
    const selesai = new Date(prog.pendaftaran_selesai);

    if (now < mulai) return { label: "Belum Dimulai", color: "info" };
    if (now >= mulai && now <= selesai)
      return { label: "Sedang Berjalan", color: "success" };
    return { label: "Sudah Ditutup", color: "error" };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOngoing = getTimelineStatus(program).label === "Sedang Berjalan";
  const status = getTimelineStatus(program);

  const handleOpenDialog = () => {
    setForm({
      pendaftaran_mulai: program.pendaftaran_mulai
        ? new Date(program.pendaftaran_mulai).toISOString().slice(0, 16)
        : "",
      pendaftaran_selesai: program.pendaftaran_selesai
        ? new Date(program.pendaftaran_selesai).toISOString().slice(0, 16)
        : "",
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

    if (!form.pendaftaran_mulai)
      newErrors.pendaftaran_mulai = "Tanggal mulai wajib diisi";
    if (!form.pendaftaran_selesai)
      newErrors.pendaftaran_selesai = "Tanggal selesai wajib diisi";

    if (form.pendaftaran_mulai && form.pendaftaran_selesai) {
      if (
        new Date(form.pendaftaran_mulai) >= new Date(form.pendaftaran_selesai)
      ) {
        newErrors.pendaftaran_selesai =
          "Tanggal selesai harus lebih besar dari tanggal mulai";
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
      confirmButtonColor: "#0D59F2",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Simpan",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) {
      setOpenDialog(true);
      return;
    }

    try {
      setSubmitting(true);
      const response = await setProgramTimeline(program.id_program, {
        pendaftaran_mulai: form.pendaftaran_mulai,
        pendaftaran_selesai: form.pendaftaran_selesai,
      });

      if (response.success) {
        await Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: response.message,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        handleCloseDialog();
        onUpdate();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message });
        setOpenDialog(true);
      }
    } catch (err) {
      console.error("Error saving timeline:", err);
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 600 }}>
          Timeline Pendaftaran
        </Typography>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={handleOpenDialog}
          sx={{
            textTransform: "none",
            backgroundColor: "#0D59F2",
            "&:hover": { backgroundColor: "#0a47c4" },
          }}
        >
          Edit Timeline
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box
          sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 3 }}
        >
            <Box>
            <Typography sx={{ fontSize: 13, color: "#888", mb: 0.5 }}>
              Nama Program
            </Typography>
            <Typography sx={{ fontWeight: 600 }}>
              {program.keterangan}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13, color: "#888", mb: 0.5 }}>
              Pendaftaran Mulai
            </Typography>
            <Typography sx={{ fontWeight: 600 }}>
              {formatDate(program.pendaftaran_mulai)}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 13, color: "#888", mb: 0.5 }}>
              Pendaftaran Selesai
            </Typography>
            <Typography sx={{ fontWeight: 600 }}>
              {formatDate(program.pendaftaran_selesai)}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 13, color: "#888", mb: 0.5 }}>
              Status
            </Typography>
            <Chip label={status.label} color={status.color} size="small" />
          </Box>
        </Box>
      </Paper>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarMonth />
            Edit Timeline Pendaftaran
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {alert && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAlert("")}>
              {alert}
            </Alert>
          )}

          {isOngoing && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Pendaftaran sedang berjalan. Hanya tanggal selesai yang bisa
              diubah.
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              Pendaftaran Mulai <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              type="datetime-local"
              value={form.pendaftaran_mulai}
              onChange={(e) => {
                setForm({ ...form, pendaftaran_mulai: e.target.value });
                setErrors({ ...errors, pendaftaran_mulai: "" });
              }}
              error={!!errors.pendaftaran_mulai}
              helperText={errors.pendaftaran_mulai}
              disabled={submitting || isOngoing}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              Pendaftaran Selesai <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              type="datetime-local"
              value={form.pendaftaran_selesai}
              onChange={(e) => {
                setForm({ ...form, pendaftaran_selesai: e.target.value });
                setErrors({ ...errors, pendaftaran_selesai: "" });
              }}
              error={!!errors.pendaftaran_selesai}
              helperText={errors.pendaftaran_selesai}
              disabled={submitting}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Batal
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={submitting}
            sx={{ textTransform: "none" }}
          >
            {submitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
