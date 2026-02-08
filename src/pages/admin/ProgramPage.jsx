import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import { Edit, CalendarMonth } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import { getAllProgram } from "../../api/public";
import { setProgramTimeline } from "../../api/admin";

export default function ProgramPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [programList, setProgramList] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [alert, setAlert] = useState("");

  const [form, setForm] = useState({
    pendaftaran_mulai: "",
    pendaftaran_selesai: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProgram();
  }, []);

  const fetchProgram = async () => {
    try {
      setLoading(true);
      const response = await getAllProgram();
      if (response.success) {
        setProgramList(response.data);
      }
    } catch (err) {
      console.error("Error fetching program:", err);
      setAlert("Gagal memuat data program");
    } finally {
      setLoading(false);
    }
  };

  const getTimelineStatus = (program) => {
    if (!program.pendaftaran_mulai || !program.pendaftaran_selesai) {
      return { label: "Belum Diatur", color: "default", status: "not_set" };
    }

    const now = new Date();
    const mulai = new Date(program.pendaftaran_mulai);
    const selesai = new Date(program.pendaftaran_selesai);

    if (now < mulai) {
      return { label: "Belum Dimulai", color: "info", status: "not_started" };
    } else if (now >= mulai && now <= selesai) {
      return { label: "Sedang Berjalan", color: "success", status: "ongoing" };
    } else {
      return { label: "Sudah Ditutup", color: "error", status: "closed" };
    }
  };

  const handleOpenDialog = (program) => {
    setSelectedProgram(program);
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
    setSelectedProgram(null);
    setForm({ pendaftaran_mulai: "", pendaftaran_selesai: "" });
    setErrors({});
    setAlert("");
  };

  const validate = () => {
    const newErrors = {};

    if (!form.pendaftaran_mulai) {
      newErrors.pendaftaran_mulai = "Tanggal mulai wajib diisi";
    }

    if (!form.pendaftaran_selesai) {
      newErrors.pendaftaran_selesai = "Tanggal selesai wajib diisi";
    }

    if (form.pendaftaran_mulai && form.pendaftaran_selesai) {
      const mulai = new Date(form.pendaftaran_mulai);
      const selesai = new Date(form.pendaftaran_selesai);

      if (mulai >= selesai) {
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
      text: "Simpan timeline pendaftaran untuk program ini?",
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

    setSubmitting(true);
    setAlert("");

    try {
      await setProgramTimeline(selectedProgram.id_program, {
        pendaftaran_mulai: form.pendaftaran_mulai,
        pendaftaran_selesai: form.pendaftaran_selesai,
      });

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Timeline pendaftaran berhasil diperbarui",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      handleCloseDialog();
      fetchProgram();
    } catch (err) {
      console.error("Error saving timeline:", err);
      const errorMessage =
        err.response?.data?.message || "Gagal menyimpan timeline";
      setAlert(errorMessage);

      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: errorMessage,
        confirmButtonText: "OK",
      });

      setOpenDialog(true);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOngoing = selectedProgram
    ? getTimelineStatus(selectedProgram).status === "ongoing"
    : false;

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <Box>
        <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
          Kelola Program
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
          Atur timeline pendaftaran untuk program PMW dan INBIS
        </Typography>

        {alert && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAlert("")}>
            {alert}
          </Alert>
        )}

        <Paper sx={{ mb: 3 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nama Program</TableCell>
                    <TableCell>Pendaftaran Mulai</TableCell>
                    <TableCell>Pendaftaran Selesai</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {programList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Tidak ada data program
                      </TableCell>
                    </TableRow>
                  ) : (
                    programList.map((prog) => {
                      const status = getTimelineStatus(prog);
                      return (
                        <TableRow key={prog.id_program}>
                          <TableCell>
                            <Box>
                              <Typography sx={{ fontWeight: 600 }}>
                                {prog.nama_program}
                              </Typography>
                              {prog.keterangan && (
                                <Typography
                                  sx={{ fontSize: 12, color: "#666" }}
                                >
                                  {prog.keterangan}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>{formatDate(prog.pendaftaran_mulai)}</TableCell>
                          <TableCell>{formatDate(prog.pendaftaran_selesai)}</TableCell>
                          <TableCell>
                            <Chip
                              label={status.label}
                              color={status.color}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              startIcon={<Edit />}
                              onClick={() => handleOpenDialog(prog)}
                              sx={{ textTransform: "none" }}
                            >
                              Atur Timeline
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
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
              Atur Timeline Pendaftaran
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {alert && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAlert("")}>
                {alert}
              </Alert>
            )}

            <Typography sx={{ mb: 3, color: "#666" }}>
              Program: <strong>{selectedProgram?.nama_program}</strong>
            </Typography>

            {isOngoing && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Pendaftaran sedang berjalan. Hanya tanggal selesai yang bisa diubah.
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
                  setAlert("");
                }}
                error={!!errors.pendaftaran_mulai}
                helperText={errors.pendaftaran_mulai}
                disabled={submitting || isOngoing}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
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
                  setAlert("");
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
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </BodyLayout>
  );
}