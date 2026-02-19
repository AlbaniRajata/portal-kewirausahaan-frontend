import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  Close,
  Download,
  AttachFile,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import DosenSidebar from "../../components/layouts/DosenSidebar";
import {
  getDetailPengajuan,
  approvePengajuan,
  rejectPengajuan,
} from "../../api/dosen";

const roundedField = {
  "& .MuiOutlinedInput-root": { borderRadius: "15px" },
};

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
  <Box
    sx={{
      display: "inline-flex",
      alignItems: "center",
      px: 1.5,
      py: 0.4,
      borderRadius: "50px",
      backgroundColor: bg,
      color,
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </Box>
);

const STATUS_PENGAJUAN = {
  0: { label: "Menunggu Respon", color: "#fff8e1", bg: "#f57f17" },
  1: { label: "Disetujui", color: "#e8f5e9", bg: "#2e7d32" },
  2: { label: "Ditolak", color: "#fce4ec", bg: "#c62828" },
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

const formatRupiah = (value) => {
  if (!value) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
};

const swalOptions = {
  customClass: { container: "swal-over-dialog" },
  didOpen: () => {
    const container = document.querySelector(".swal-over-dialog");
    if (container) container.style.zIndex = "99999";
  },
};

export default function DetailPengajuanPembimbingPage() {
  const navigate = useNavigate();
  const { id_pengajuan } = useParams();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [alertMsg, setAlertMsg] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDetailPengajuan(id_pengajuan);
      if (res.success) setDetail(res.data);
      else setAlertMsg(res.message || "Gagal memuat detail pengajuan");
    } catch (err) {
      console.error("Error fetching detail pengajuan:", err);
      setAlertMsg("Gagal memuat detail pengajuan");
    } finally {
      setLoading(false);
    }
  }, [id_pengajuan]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleApprove = async () => {
    const result = await Swal.fire({
      ...swalOptions,
      title: "Setujui Pengajuan?",
      html: `Anda akan menyetujui pengajuan pembimbing dari tim <b>${detail?.tim?.nama_tim}</b>.<br/><br/>Lanjutkan?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2e7d32",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Setujui",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      setSubmitting(true);
      const res = await approvePengajuan(id_pengajuan);
      if (res.success) {
        await Swal.fire({
          ...swalOptions,
          icon: "success",
          title: "Berhasil",
          text: res.message || "Pengajuan pembimbing disetujui",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        fetchDetail();
      } else {
        await Swal.fire({
          ...swalOptions,
          icon: "error",
          title: "Gagal",
          text: res.message || "Terjadi kesalahan",
        });
      }
    } catch (err) {
      await Swal.fire({
        ...swalOptions,
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Gagal menyetujui pengajuan",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReject = () => {
    setCatatan("");
    setErrors({});
    setRejectDialogOpen(true);
  };
  const handleCloseReject = () => {
    setRejectDialogOpen(false);
    setCatatan("");
    setErrors({});
  };

  const handleReject = async () => {
    if (!catatan || catatan.trim().length < 10) {
      setErrors({ catatan: "Catatan penolakan minimal 10 karakter" });
      return;
    }
    setRejectDialogOpen(false);
    const result = await Swal.fire({
      ...swalOptions,
      title: "Tolak Pengajuan?",
      html: `Anda akan menolak pengajuan pembimbing dari tim <b>${detail?.tim?.nama_tim}</b>.<br/><br/>Lanjutkan?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c62828",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Tolak",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) {
      setRejectDialogOpen(true);
      return;
    }
    try {
      setSubmitting(true);
      const res = await rejectPengajuan(id_pengajuan, catatan.trim());
      if (res.success) {
        await Swal.fire({
          ...swalOptions,
          icon: "success",
          title: "Pengajuan Ditolak",
          text: res.message || "Pengajuan pembimbing ditolak",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        fetchDetail();
      } else {
        await Swal.fire({
          ...swalOptions,
          icon: "error",
          title: "Gagal",
          text: res.message || "Terjadi kesalahan",
        });
      }
    } catch (err) {
      await Swal.fire({
        ...swalOptions,
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Gagal menolak pengajuan",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={DosenSidebar}>
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

  if (!detail) {
    return (
      <BodyLayout Sidebar={DosenSidebar}>
        <Alert severity="error" sx={{ borderRadius: "12px" }}>
          {alertMsg || "Pengajuan tidak ditemukan"}
        </Alert>
      </BodyLayout>
    );
  }

  const { pengajuan, proposal, tim } = detail;
  const sudahDirespon = pengajuan.status !== 0;
  const si = STATUS_PENGAJUAN[pengajuan.status];

  return (
    <BodyLayout Sidebar={DosenSidebar}>
      <Box>
        <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
          Detail Pengajuan Pembimbing
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
          Diajukan pada {formatDate(pengajuan.created_at)}
        </Typography>

        {alertMsg && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: "12px" }}
            onClose={() => setAlertMsg("")}
          >
            {alertMsg}
          </Alert>
        )}

        <Paper
          sx={{
            p: 4,
            mb: 3,
            borderRadius: "16px",
            border: "1px solid #f0f0f0",
          }}
        >
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>
            Informasi Tim
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 3,
              mb: tim?.anggota?.length > 0 ? 3 : 0,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                Nama Tim
              </Typography>
              <TextField
                fullWidth
                value={tim?.nama_tim || "-"}
                disabled
                sx={roundedField}
              />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                Diajukan Oleh
              </Typography>
              <TextField
                fullWidth
                value={pengajuan.mahasiswa_pengaju || "-"}
                disabled
                sx={roundedField}
              />
            </Box>
          </Box>

          {tim?.anggota && tim.anggota.length > 0 && (
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1.5, fontSize: 14 }}>
                Anggota Tim
              </Typography>
              <TableContainer
                sx={{
                  borderRadius: "12px",
                  border: "1px solid #f0f0f0",
                  overflow: "hidden",
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      {["Nama", "Peran"].map((h, i) => (
                        <TableCell key={i} sx={tableHeadCell}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tim.anggota.map((a) => (
                      <TableRow key={a.id_user} sx={tableBodyRow}>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                            {a.nama}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <StatusPill
                            label={a.peran === 1 ? "Ketua" : "Anggota"}
                            color={a.peran === 1 ? "#e8eaf6" : "#f5f5f5"}
                            bg={a.peran === 1 ? "#3949ab" : "#555"}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Paper>

        <Paper
          sx={{
            p: 4,
            mb: 3,
            borderRadius: "16px",
            border: "1px solid #f0f0f0",
          }}
        >
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>
            Informasi Proposal
          </Typography>

          {proposal ? (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                  Judul Proposal
                </Typography>
                <TextField
                  fullWidth
                  value={proposal.judul}
                  disabled
                  multiline
                  rows={2}
                  sx={roundedField}
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 3,
                  mb: 3,
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                    Modal Diajukan
                  </Typography>
                  <TextField
                    fullWidth
                    value={formatRupiah(proposal.modal_diajukan)}
                    disabled
                    sx={roundedField}
                  />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                    Tanggal Submit
                  </Typography>
                  <TextField
                    fullWidth
                    value={formatDate(proposal.tanggal_submit)}
                    disabled
                    sx={roundedField}
                  />
                </Box>
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                  File Proposal
                </Typography>
                {proposal.file_proposal ? (
                  <Box
                    sx={{
                      border: "1.5px solid #f0f0f0",
                      borderRadius: "12px",
                      p: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "8px",
                          backgroundColor: "#e3f2fd",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <AttachFile sx={{ color: "#1565c0", fontSize: 18 }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: 13 }}>
                          {proposal.file_proposal}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: "#2e7d32",
                            fontWeight: 600,
                          }}
                        >
                          File Proposal
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      startIcon={<Download sx={{ fontSize: 16 }} />}
                      component="a"
                      href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/proposal/${proposal.file_proposal}`}
                      target="_blank"
                      size="small"
                      sx={{
                        textTransform: "none",
                        borderRadius: "50px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#0D59F2",
                        border: "1.5px solid #0D59F2",
                        px: 2,
                        "&:hover": { backgroundColor: "#f0f4ff" },
                      }}
                    >
                      Download
                    </Button>
                  </Box>
                ) : (
                  <TextField fullWidth value="-" disabled sx={roundedField} />
                )}
              </Box>
            </>
          ) : (
            <Alert severity="info" sx={{ borderRadius: "12px" }}>
              Proposal tidak tersedia
            </Alert>
          )}
        </Paper>

        {pengajuan.status === 2 && pengajuan.catatan_dosen && (
          <Paper
            sx={{
              p: 4,
              mb: 3,
              borderRadius: "16px",
              border: "1px solid #f0f0f0",
            }}
          >
            <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>
              Catatan Penolakan
            </Typography>
            <Box
              sx={{
                p: 2.5,
                backgroundColor: "#fce4ec",
                borderRadius: "12px",
                border: "1px solid #ef9a9a",
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  color: "#c62828",
                  fontWeight: 700,
                  mb: 0.5,
                }}
              >
                Alasan Penolakan
              </Typography>
              <Typography sx={{ fontSize: 14, lineHeight: 1.7 }}>
                {pengajuan.catatan_dosen}
              </Typography>
            </Box>
          </Paper>
        )}

        {pengajuan.responded_at && (
          <Box
            sx={{
              mb: 3,
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 2.5,
              borderRadius: "12px",
              backgroundColor: "#f5f5f5",
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography sx={{ fontSize: 13, color: "#555" }}>
              Direspon pada:{" "}
              <strong>{formatDate(pengajuan.responded_at)}</strong>
            </Typography>
            <StatusPill
              label={si?.label || "-"}
              bg={si?.bg || "#f5f5f5"}
              color={si?.color || "#666"}
            />
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
            onClick={() => navigate("/dosen/pembimbing/pengajuan")}
            sx={{
              textTransform: "none",
              borderRadius: "50px",
              px: 4,
              py: 1.2,
              fontWeight: 600,
              backgroundColor: "#FDB022",
              "&:hover": { backgroundColor: "#e09a1a" },
            }}
          >
            Kembali
          </Button>

          {!sudahDirespon && (
            <>
              <Button
                variant="outlined"
                startIcon={<Cancel sx={{ fontSize: 14 }} />}
                onClick={handleOpenReject}
                disabled={submitting}
                sx={{
                  textTransform: "none",
                  borderRadius: "50px",
                  px: 3,
                  py: 1.2,
                  fontWeight: 600,
                  borderColor: "#e53935",
                  color: "#e53935",
                  "&:hover": {
                    backgroundColor: "rgba(229,57,53,0.06)",
                    borderColor: "#e53935",
                  },
                }}
              >
                Tolak
              </Button>
              <Button
                variant="contained"
                startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
                onClick={handleApprove}
                disabled={submitting}
                sx={{
                  textTransform: "none",
                  borderRadius: "50px",
                  px: 3,
                  py: 1.2,
                  fontWeight: 600,
                  backgroundColor: "#2e7d32",
                  "&:hover": { backgroundColor: "#1b5e20" },
                }}
              >
                {submitting ? "Memproses..." : "Terima"}
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Dialog
        open={rejectDialogOpen}
        onClose={handleCloseReject}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
            Tolak Pengajuan Pembimbing
          </Typography>
          <IconButton
            onClick={handleCloseReject}
            sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 3 }}>
          <Box
            sx={{
              p: 2.5,
              backgroundColor: "#fce4ec",
              borderRadius: "12px",
              border: "1px solid #ef9a9a",
              mb: 3,
            }}
          >
            <Typography
              sx={{ fontSize: 12, color: "#c62828", fontWeight: 700, mb: 0.5 }}
            >
              Tim yang akan ditolak
            </Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
              {tim?.nama_tim}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
              Catatan Penolakan <span style={{ color: "#ef5350" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Masukkan alasan penolakan (minimal 10 karakter)..."
              value={catatan}
              onChange={(e) => {
                setCatatan(e.target.value);
                setErrors({});
              }}
              error={!!errors.catatan}
              helperText={errors.catatan}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={handleCloseReject}
            sx={{
              textTransform: "none",
              borderRadius: "50px",
              px: 3,
              fontWeight: 600,
              color: "#666",
              border: "1.5px solid #e0e0e0",
              "&:hover": { backgroundColor: "#f5f5f5" },
            }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleReject}
            disabled={submitting}
            sx={{
              textTransform: "none",
              borderRadius: "50px",
              px: 3,
              fontWeight: 600,
              backgroundColor: "#e53935",
              "&:hover": { backgroundColor: "#c62828" },
            }}
          >
            {submitting ? "Memproses..." : "Tolak Pengajuan"}
          </Button>
        </DialogActions>
      </Dialog>
    </BodyLayout>
  );
}
