import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Button, CircularProgress,
  Alert, Avatar, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import {
  ArrowBack, CheckCircle, Cancel, Close, Download, AttachFile,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import DosenSidebar from "../../components/layouts/DosenSidebar";
import { getDetailBimbinganDosen, approveBimbingan, rejectBimbingan } from "../../api/dosen";

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
  <Box sx={{
    display: "inline-flex", alignItems: "center",
    px: 1.5, py: 0.4, borderRadius: "50px",
    backgroundColor: bg, color, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {label}
  </Box>
);

const STATUS_BIMBINGAN = {
  0: { label: "Menunggu Konfirmasi", bg: "#f57f17", color: "#fff8e1" },
  1: { label: "Disetujui",           bg: "#2e7d32", color: "#e8f5e9" },
  2: { label: "Ditolak",             bg: "#c62828", color: "#fce4ec" },
};

const METODE_LABEL = {
  1: { label: "Online",  bg: "#1565c0", color: "#e3f2fd" },
  2: { label: "Offline", bg: "#555",    color: "#f5f5f5" },
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
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

export default function DetailBimbinganDosenPage() {
  const navigate = useNavigate();
  const { id_bimbingan } = useParams();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [alertMsg, setAlertMsg] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [catatanError, setCatatanError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDetailBimbinganDosen(id_bimbingan);
      if (res.success) setDetail(res.data);
      else setAlertMsg(res.message || "Gagal memuat detail bimbingan");
    } catch (err) {
      console.error("Error fetching detail bimbingan:", err);
      setAlertMsg(err.response?.data?.message || "Gagal memuat detail bimbingan");
    } finally {
      setLoading(false);
    }
  }, [id_bimbingan]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleApprove = async () => {
    const result = await Swal.fire({
      ...swalOptions,
      title: "Setujui Bimbingan?",
      html: `Anda akan menyetujui pengajuan bimbingan dari tim <b>${detail?.tim?.nama_tim}</b>.<br/>Topik: <b>${detail?.bimbingan?.topik}</b><br/><br/>Lanjutkan?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2e7d32", cancelButtonColor: "#666",
      confirmButtonText: "Ya, Setujui", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      setSubmitting(true);
      const res = await approveBimbingan(id_bimbingan);
      if (res.success) {
        await Swal.fire({ ...swalOptions, icon: "success", title: "Berhasil", text: res.message || "Bimbingan disetujui", timer: 2000, timerProgressBar: true, showConfirmButton: false });
        fetchDetail();
      } else {
        await Swal.fire({ ...swalOptions, icon: "error", title: "Gagal", text: res.message || "Terjadi kesalahan" });
      }
    } catch (err) {
      await Swal.fire({ ...swalOptions, icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menyetujui bimbingan" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReject = () => { setCatatan(""); setCatatanError(""); setRejectDialogOpen(true); };
  const handleCloseReject = () => { setRejectDialogOpen(false); setCatatan(""); setCatatanError(""); };

  const handleReject = async () => {
    if (!catatan.trim() || catatan.trim().length < 10) {
      setCatatanError("Catatan penolakan minimal 10 karakter");
      return;
    }
    setRejectDialogOpen(false);
    const result = await Swal.fire({
      ...swalOptions,
      title: "Tolak Bimbingan?",
      html: `Anda akan menolak pengajuan bimbingan dari tim <b>${detail?.tim?.nama_tim}</b>.<br/><br/>Lanjutkan?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c62828", cancelButtonColor: "#666",
      confirmButtonText: "Ya, Tolak", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) { setRejectDialogOpen(true); return; }
    try {
      setSubmitting(true);
      const res = await rejectBimbingan(id_bimbingan, catatan.trim());
      if (res.success) {
        await Swal.fire({ ...swalOptions, icon: "success", title: "Bimbingan Ditolak", text: res.message || "Pengajuan bimbingan ditolak", timer: 2000, timerProgressBar: true, showConfirmButton: false });
        fetchDetail();
      } else {
        await Swal.fire({ ...swalOptions, icon: "error", title: "Gagal", text: res.message || "Terjadi kesalahan" });
      }
    } catch (err) {
      await Swal.fire({ ...swalOptions, icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menolak bimbingan" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={DosenSidebar}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }

  if (!detail) {
    return (
      <BodyLayout Sidebar={DosenSidebar}>
        <Alert severity="error" sx={{ borderRadius: "12px" }}>{alertMsg || "Data bimbingan tidak ditemukan"}</Alert>
      </BodyLayout>
    );
  }

  const { bimbingan, proposal, tim } = detail;
  const sudahDirespon = bimbingan.status !== 0;
  const si = STATUS_BIMBINGAN[bimbingan.status];
  const metode = METODE_LABEL[bimbingan.metode];

  return (
    <BodyLayout Sidebar={DosenSidebar}>
      <Box>
        <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Detail Pengajuan Bimbingan</Typography>
        <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
          Diajukan pada {formatDate(bimbingan.created_at)}
        </Typography>

        {alertMsg && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setAlertMsg("")}>
            {alertMsg}
          </Alert>
        )}

        <Paper sx={{ p: 4, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>Informasi Bimbingan</Typography>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Topik</Typography>
            <TextField fullWidth value={bimbingan.topik} disabled sx={roundedField} />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Tanggal Bimbingan</Typography>
              <TextField fullWidth value={formatDate(bimbingan.tanggal_bimbingan)} disabled sx={roundedField} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 2, fontSize: 14 }}>Metode</Typography>
              <StatusPill label={metode?.label || "-"} bg={metode?.bg || "#555"} color={metode?.color || "#f5f5f5"} />
            </Box>
          </Box>

          {bimbingan.deskripsi && (
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Deskripsi / Catatan Mahasiswa</Typography>
              <TextField fullWidth value={bimbingan.deskripsi} disabled multiline rows={3} sx={roundedField} />
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 4, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>Informasi Tim</Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: tim?.anggota?.length > 0 ? 3 : 0 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Nama Tim</Typography>
              <TextField fullWidth value={tim?.nama_tim || "-"} disabled sx={roundedField} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Diajukan Oleh</Typography>
              <TextField fullWidth value={bimbingan.mahasiswa_pengaju || "-"} disabled sx={roundedField} />
            </Box>
          </Box>

          {tim?.anggota && tim.anggota.length > 0 && (
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1.5, fontSize: 14 }}>Anggota Tim</Typography>
              <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      {["Nama", "Peran"].map((h, i) => (
                        <TableCell key={i} sx={tableHeadCell}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tim.anggota.map((a) => (
                      <TableRow key={a.id_user} sx={tableBodyRow}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{a.nama}</Typography>
                          </Box>
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

        <Paper sx={{ p: 4, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>Informasi Proposal</Typography>

          {proposal ? (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Judul Proposal</Typography>
                <TextField fullWidth value={proposal.judul} disabled multiline rows={2} sx={roundedField} />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: proposal.file_proposal ? 3 : 0 }}>
                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Modal Diajukan</Typography>
                  <TextField fullWidth value={formatRupiah(proposal.modal_diajukan)} disabled sx={roundedField} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Tanggal Submit</Typography>
                  <TextField fullWidth value={formatDate(proposal.tanggal_submit)} disabled sx={roundedField} />
                </Box>
              </Box>

              {proposal.file_proposal && (
                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>File Proposal</Typography>
                  <Box sx={{
                    border: "1.5px solid #f0f0f0", borderRadius: "12px", p: 2,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    backgroundColor: "#fafafa",
                  }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: "8px", backgroundColor: "#e3f2fd", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <AttachFile sx={{ color: "#1565c0", fontSize: 18 }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{proposal.file_proposal}</Typography>
                        <Typography sx={{ fontSize: 11, color: "#2e7d32", fontWeight: 600 }}>File Proposal</Typography>
                      </Box>
                    </Box>
                    <Button
                      startIcon={<Download sx={{ fontSize: 16 }} />}
                      component="a"
                      href={`${import.meta.env.VITE_API_URL}/uploads/${proposal.file_proposal}`}
                      target="_blank"
                      size="small"
                      sx={{
                        textTransform: "none", borderRadius: "50px",
                        fontSize: 13, fontWeight: 600,
                        color: "#0D59F2", border: "1.5px solid #0D59F2", px: 2,
                        "&:hover": { backgroundColor: "#f0f4ff" },
                      }}
                    >
                      Download
                    </Button>
                  </Box>
                </Box>
              )}
            </>
          ) : (
            <Alert severity="info" sx={{ borderRadius: "12px" }}>Proposal tidak tersedia</Alert>
          )}
        </Paper>

        {bimbingan.status === 2 && bimbingan.catatan_dosen && (
          <Paper sx={{ p: 4, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>Catatan Penolakan</Typography>
            <Box sx={{ p: 2.5, backgroundColor: "#fce4ec", borderRadius: "12px", border: "1px solid #ef9a9a" }}>
              <Typography sx={{ fontSize: 12, color: "#c62828", fontWeight: 700, mb: 0.5 }}>Alasan Penolakan</Typography>
              <Typography sx={{ fontSize: 14, lineHeight: 1.7 }}>{bimbingan.catatan_dosen}</Typography>
            </Box>
          </Paper>
        )}

        {bimbingan.responded_at && (
          <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2, p: 2.5, borderRadius: "12px", backgroundColor: "#f5f5f5", border: "1px solid #e0e0e0" }}>
            <Typography sx={{ fontSize: 13, color: "#555" }}>
              Direspon pada: <strong>{formatDate(bimbingan.responded_at)}</strong>
            </Typography>
            <StatusPill label={si?.label || "-"} bg={si?.bg || "#f5f5f5"} color={si?.color || "#666"} />
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
            onClick={() => navigate("/dosen/bimbingan")}
            sx={{
              textTransform: "none", borderRadius: "50px",
              px: 4, py: 1.2, fontWeight: 600,
              backgroundColor: "#FDB022", "&:hover": { backgroundColor: "#e09a1a" },
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
                  textTransform: "none", borderRadius: "50px",
                  px: 3, py: 1.2, fontWeight: 600,
                  borderColor: "#e53935", color: "#e53935",
                  "&:hover": { backgroundColor: "rgba(229,57,53,0.06)", borderColor: "#e53935" },
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
                  textTransform: "none", borderRadius: "50px",
                  px: 3, py: 1.2, fontWeight: 600,
                  backgroundColor: "#2e7d32", "&:hover": { backgroundColor: "#1b5e20" },
                }}
              >
                {submitting ? "Memproses..." : "Setujui Bimbingan"}
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
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Tolak Pengajuan Bimbingan</Typography>
          <IconButton onClick={handleCloseReject} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 3 }}>
          <Box sx={{ p: 2.5, backgroundColor: "#fce4ec", borderRadius: "12px", border: "1px solid #ef9a9a", mb: 3 }}>
            <Typography sx={{ fontSize: 12, color: "#c62828", fontWeight: 700, mb: 0.5 }}>Tim yang akan ditolak</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{tim?.nama_tim}</Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
              Catatan Penolakan <span style={{ color: "#ef5350" }}>*</span>
            </Typography>
            <TextField
              fullWidth multiline rows={4}
              placeholder="Masukkan alasan penolakan (minimal 10 karakter)..."
              value={catatan}
              onChange={(e) => { setCatatan(e.target.value); setCatatanError(""); }}
              error={!!catatanError}
              helperText={catatanError}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={handleCloseReject}
            sx={{
              textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600,
              color: "#666", border: "1.5px solid #e0e0e0",
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
              textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600,
              backgroundColor: "#e53935", "&:hover": { backgroundColor: "#c62828" },
            }}
          >
            {submitting ? "Memproses..." : "Tolak Bimbingan"}
          </Button>
        </DialogActions>
      </Dialog>
    </BodyLayout>
  );
}