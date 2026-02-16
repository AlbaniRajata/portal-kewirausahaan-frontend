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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from "@mui/material";
import { CheckCircle, Cancel } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import SidebarMahasiswa from "../../components/layouts/MahasiswaSidebar";
import { getTimDetail, acceptInvite, rejectInvite } from "../../api/mahasiswa";

export default function UndanganAnggotaPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timDetail, setTimDetail] = useState(null);
  const [openReject, setOpenReject] = useState(false);
  const [selectedTim, setSelectedTim] = useState(null);
  const [catatan, setCatatan] = useState("");
  const [alert, setAlert] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchTimDetail();
  }, []);

  const fetchTimDetail = async () => {
    try {
      setLoading(true);
      const response = await getTimDetail();
      setTimDetail(response.data);
    } catch (err) {
      console.error("Error fetching tim detail:", err);
      setAlert("Gagal memuat detail tim");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (tim) => {
    const result = await Swal.fire({
      title: "Konfirmasi",
      text: `Terima undangan sebagai anggota tim "${tim.nama_tim}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0D59F2",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Terima",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    setSubmitting(true);

    try {
      await acceptInvite(tim.id_tim);

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Undangan berhasil diterima",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      window.location.href = "/mahasiswa/anggota-tim";

    } catch (err) {
      console.error("Error accepting invite:", err);
      const errorMessage =
        err.response?.data?.message || "Gagal menerima undangan";

      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: errorMessage,
        confirmButtonText: "OK",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReject = (tim) => {
    setSelectedTim(tim);
    setCatatan("");
    setErrors({});
    setAlert("");
    setOpenReject(true);
  };

  const handleCloseReject = () => {
    setOpenReject(false);
    setSelectedTim(null);
    setCatatan("");
    setErrors({});
    setAlert("");
  };

  const handleReject = async () => {
    if (!catatan || catatan.trim().length < 5) {
      setErrors({ catatan: "Catatan penolakan minimal 5 karakter" });
      return;
    }

    setOpenReject(false);

    const result = await Swal.fire({
      title: "Konfirmasi",
      text: `Tolak undangan dari tim "${selectedTim.nama_tim}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Tolak",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) {
      setOpenReject(true);
      return;
    }

    setSubmitting(true);

    try {
      await rejectInvite(selectedTim.id_tim, catatan.trim());

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Undangan berhasil ditolak",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      handleCloseReject();

      window.location.href = "/mahasiswa/anggota-tim";

    } catch (err) {
      console.error("Error rejecting invite:", err);
      const errorMessage =
        err.response?.data?.message || "Gagal menolak undangan";

      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: errorMessage,
        confirmButtonText: "OK",
      });

      setOpenReject(true);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 0:
        return { label: "Menunggu", color: "warning" };
      case 1:
        return { label: "Disetujui", color: "success" };
      case 2:
        return { label: "Ditolak", color: "error" };
      default:
        return { label: "Unknown", color: "default" };
    }
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }

  const pendingInvitations =
    timDetail?.anggota?.filter(
      (item) => item.peran === 2 && item.status === 0,
    ) || [];

  const myInvitation = pendingInvitations[0];

  if (!myInvitation) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
            Undangan Anggota Tim
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
            Daftar undangan yang Anda terima
          </Typography>

          <Alert severity="info">
            Anda tidak memiliki undangan yang menunggu persetujuan.
          </Alert>
        </Box>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={SidebarMahasiswa}>
      <Box>
        <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
          Undangan Anggota Tim
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
          Daftar undangan yang Anda terima
        </Typography>

        {alert && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAlert("")}>
            {alert}
          </Alert>
        )}

        <Paper sx={{ mb: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nama Tim</TableCell>
                  <TableCell>Ketua Tim</TableCell>
                  <TableCell>Program</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>
                      {timDetail.nama_tim}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>
                        {timDetail.ketua_tim?.nama_lengkap}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "#666" }}>
                        {timDetail.ketua_tim?.nim}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{timDetail.keterangan}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(myInvitation.status).label}
                      color={getStatusLabel(myInvitation.status).color}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{ display: "flex", gap: 1, justifyContent: "center" }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => handleOpenReject(timDetail)}
                        disabled={submitting}
                        sx={{ textTransform: "none" }}
                      >
                        Tolak
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => handleAccept(timDetail)}
                        disabled={submitting}
                        sx={{ textTransform: "none" }}
                      >
                        Terima
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Dialog
          open={openReject}
          onClose={handleCloseReject}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Tolak Undangan</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Anda akan menolak undangan dari tim:{" "}
              <strong>{selectedTim?.nama_tim}</strong>
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Catatan Penolakan"
              placeholder="Masukkan alasan penolakan (minimal 5 karakter)..."
              value={catatan}
              onChange={(e) => {
                setCatatan(e.target.value);
                setErrors({});
                setAlert("");
              }}
              error={!!errors.catatan}
              helperText={errors.catatan}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseReject}>Batal</Button>
            <Button onClick={handleReject} color="error" variant="contained">
              Tolak
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </BodyLayout>
  );
}
