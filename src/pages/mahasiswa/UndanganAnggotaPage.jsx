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
  IconButton,
} from "@mui/material";
import { CheckCircle, Cancel, Close, MailOutline } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import SidebarMahasiswa from "../../components/layouts/MahasiswaSidebar";
import { getTimDetail, acceptInvite, rejectInvite } from "../../api/mahasiswa";

const tableHeadCell = {
  fontWeight: 700,
  fontSize: 13,
  color: "#000",
  backgroundColor: "#fafafa",
  borderBottom: "2px solid #f0f0f0",
  py: 2,
};

const tableBodyRow = {
  "& td": { borderBottom: "1px solid #f5f5f5", py: 2 },
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

const getStatusInfo = (status) => {
  switch (status) {
    case 0: return { label: "Menunggu",  color: "#fff8e1", bg: "#f57f17" };
    case 1: return { label: "Disetujui", color: "#e8f5e9", bg: "#2e7d32" };
    case 2: return { label: "Ditolak",   color: "#fce4ec", bg: "#c62828" };
    default: return { label: "Unknown",  color: "#f5f5f5", bg: "#666" };
  }
};

export default function UndanganAnggotaPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timDetail, setTimDetail] = useState(null);
  const [openReject, setOpenReject] = useState(false);
  const [selectedTim, setSelectedTim] = useState(null);
  const [catatan, setCatatan] = useState("");
  const [alert, setAlert] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchTimDetail(); }, []);

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
      await Swal.fire({ icon: "success", title: "Berhasil", text: "Undangan berhasil diterima", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      window.location.href = "/mahasiswa/anggota-tim";
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Gagal menerima undangan";
      await Swal.fire({ icon: "error", title: "Gagal", text: errorMessage, confirmButtonText: "OK" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReject = (tim) => {
    setSelectedTim(tim); setCatatan(""); setErrors({}); setAlert(""); setOpenReject(true);
  };

  const handleCloseReject = () => {
    setOpenReject(false); setSelectedTim(null); setCatatan(""); setErrors({}); setAlert("");
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
    if (!result.isConfirmed) { setOpenReject(true); return; }

    setSubmitting(true);
    try {
      await rejectInvite(selectedTim.id_tim, catatan.trim());
      await Swal.fire({ icon: "success", title: "Berhasil", text: "Undangan berhasil ditolak", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      handleCloseReject();
      window.location.href = "/mahasiswa/anggota-tim";
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Gagal menolak undangan";
      await Swal.fire({ icon: "error", title: "Gagal", text: errorMessage, confirmButtonText: "OK" });
      setOpenReject(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }

  const pendingInvitations = timDetail?.anggota?.filter((item) => item.peran === 2 && item.status === 0) || [];
  const myInvitation = pendingInvitations[0];

  if (!myInvitation) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Undangan Anggota Tim</Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>Daftar undangan yang Anda terima</Typography>

          <Paper sx={{ py: 10, borderRadius: "16px", border: "1px solid #f0f0f0", textAlign: "center" }}>
            <Box sx={{ width: 100, height: 100, borderRadius: "50%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
              <MailOutline sx={{ fontSize: 48, color: "#ccc" }} />
            </Box>
            <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}>Tidak Ada Undangan</Typography>
            <Typography sx={{ fontSize: 14, color: "#999" }}>Anda tidak memiliki undangan yang menunggu persetujuan.</Typography>
          </Paper>
        </Box>
      </BodyLayout>
    );
  }

  const statusInfo = getStatusInfo(myInvitation.status);

  return (
    <BodyLayout Sidebar={SidebarMahasiswa}>
      <Box>
        <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Undangan Anggota Tim</Typography>
        <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>Daftar undangan yang Anda terima</Typography>

        {alert && <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setAlert("")}>{alert}</Alert>}

        <Paper sx={{ overflow: "hidden", borderRadius: "16px", border: "1px solid #f0f0f0" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {["Nama Tim", "Ketua Tim", "Program", "Status", "Aksi"].map((h, i) => (
                    <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 4 && { textAlign: "center" }) }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={tableBodyRow}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{timDetail.nama_tim}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{timDetail.ketua_tim?.nama_lengkap}</Typography>
                    <Typography sx={{ fontSize: 12, color: "#888" }}>{timDetail.ketua_tim?.nim}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, color: "#555" }}>{timDetail.keterangan}</Typography>
                  </TableCell>
                  <TableCell>
                    <StatusPill label={statusInfo.label} bg={statusInfo.bg} color={statusInfo.color} />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Cancel sx={{ fontSize: 14 }} />}
                        onClick={() => handleOpenReject(timDetail)}
                        disabled={submitting}
                        sx={{
                          textTransform: "none",
                          borderRadius: "50px",
                          fontSize: 12, fontWeight: 600, px: 2,
                          borderColor: "#e53935", color: "#e53935",
                          "&:hover": { backgroundColor: "rgba(229,57,53,0.06)", borderColor: "#e53935" },
                        }}
                      >
                        Tolak
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
                        onClick={() => handleAccept(timDetail)}
                        disabled={submitting}
                        sx={{
                          textTransform: "none",
                          borderRadius: "50px",
                          fontSize: 12, fontWeight: 600, px: 2,
                          backgroundColor: "#2e7d32",
                          "&:hover": { backgroundColor: "#1b5e20" },
                        }}
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

        <Dialog open={openReject} onClose={handleCloseReject} maxWidth="sm" fullWidth
          PaperProps={{ sx: { borderRadius: "16px" } }}>
          <DialogTitle sx={{ pb: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Tolak Undangan</Typography>
            <IconButton onClick={handleCloseReject} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}>
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ px: 3, py: 3 }}>
            <Box sx={{ p: 2.5, backgroundColor: "#fce4ec", borderRadius: "12px", border: "1px solid #ef9a9a", mb: 3 }}>
              <Typography sx={{ fontSize: 12, color: "#c62828", fontWeight: 700, mb: 0.5 }}>Tim yang akan ditolak</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{selectedTim?.nama_tim}</Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
                Catatan Penolakan <span style={{ color: "#ef5350" }}>*</span>
              </Typography>
              <TextField
                fullWidth multiline rows={4}
                placeholder="Masukkan alasan penolakan (minimal 5 karakter)..."
                value={catatan}
                onChange={(e) => { setCatatan(e.target.value); setErrors({}); setAlert(""); }}
                error={!!errors.catatan}
                helperText={errors.catatan}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button onClick={handleCloseReject}
              sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, color: "#666", border: "1.5px solid #e0e0e0", "&:hover": { backgroundColor: "#f5f5f5" } }}>
              Batal
            </Button>
            <Button variant="contained" onClick={handleReject}
              sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, backgroundColor: "#e53935", "&:hover": { backgroundColor: "#c62828" } }}>
              Tolak Undangan
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </BodyLayout>
  );
}