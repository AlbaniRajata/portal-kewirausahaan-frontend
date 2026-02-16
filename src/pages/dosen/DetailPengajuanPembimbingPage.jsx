import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Button, Chip, CircularProgress,
  Alert, Divider, Avatar, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton,
} from "@mui/material";
import {
  ArrowBack, CheckCircle, Cancel, Person,
  Groups, Description, Close,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import DosenSidebar from "../../components/layouts/DosenSidebar";
import { getDetailPengajuan, approvePengajuan, rejectPengajuan } from "../../api/dosen";

const STATUS_PENGAJUAN = {
  0: { text: "Menunggu Respon", color: "warning" },
  1: { text: "Disetujui", color: "success" },
  2: { text: "Ditolak", color: "error" },
};

const STATUS_PROPOSAL = {
  7: { text: "Lolos Wawancara", color: "success" },
  8: { text: "Pembimbing Diajukan", color: "info" },
  9: { text: "Pembimbing Disetujui", color: "success" },
};

const PERAN = {
  1: "Ketua",
  2: "Anggota",
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

export default function DetailPengajuanPembimbingPage() {
  const navigate = useNavigate();
  const { id_pengajuan } = useParams();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [alertMsg, setAlertMsg] = useState("");

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDetailPengajuan(id_pengajuan);
      if (res.success) {
        setDetail(res.data);
      } else {
        setAlertMsg(res.message || "Gagal memuat detail pengajuan");
      }
    } catch (err) {
      console.error("Error fetching detail:", err);
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
      const msg = err.response?.data?.message || "Gagal menyetujui pengajuan";
      await Swal.fire({
        ...swalOptions,
        icon: "error",
        title: "Gagal",
        text: msg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReject = () => {
    setCatatan("");
    setRejectDialogOpen(true);
  };

  const handleCloseReject = () => {
    setRejectDialogOpen(false);
    setCatatan("");
  };

  const handleReject = async () => {
    if (!catatan.trim()) return;

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

    if (!result.isConfirmed) return;

    handleCloseReject();

    try {
      setSubmitting(true);
      const res = await rejectPengajuan(id_pengajuan, catatan);

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
      const msg = err.response?.data?.message || "Gagal menolak pengajuan";
      await Swal.fire({
        ...swalOptions,
        icon: "error",
        title: "Gagal",
        text: msg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const sudahDirespon = detail?.pengajuan?.status !== 0;

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
        <Alert severity="error">
          {alertMsg || "Pengajuan tidak ditemukan"}
        </Alert>
      </BodyLayout>
    );
  }

  const { pengajuan, proposal, tim } = detail;

  return (
    <BodyLayout Sidebar={DosenSidebar}>
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/dosen/pembimbing/pengajuan")}
            sx={{ textTransform: "none", color: "#555" }}
          >
            Kembali
          </Button>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography sx={{ fontSize: 24, fontWeight: 700 }}>
              Detail Pengajuan Pembimbing
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#777" }}>
              Diajukan pada {formatDate(pengajuan.created_at)}
            </Typography>
          </Box>
          <Box sx={{ ml: "auto" }}>
            <Chip
              label={STATUS_PENGAJUAN[pengajuan.status]?.text || "-"}
              color={STATUS_PENGAJUAN[pengajuan.status]?.color || "default"}
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Box>

        {alertMsg && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAlertMsg("")}>
            {alertMsg}
          </Alert>
        )}

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Groups sx={{ color: "#0D59F2", fontSize: 20 }} />
              <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                Informasi Tim
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Nama Tim</Typography>
              <Typography sx={{ fontWeight: 600, fontSize: 15 }}>
                {tim?.nama_tim || "-"}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Diajukan Oleh</Typography>
              <Typography sx={{ fontSize: 14 }}>
                {pengajuan.mahasiswa_pengaju}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1.5, color: "#555" }}>
              Anggota Tim
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {(tim?.anggota || []).map((a) => (
                <Box
                  key={a.id_user}
                  sx={{
                    display: "flex", alignItems: "center", gap: 1.5,
                    p: 1.5, backgroundColor: "#f8f9ff", borderRadius: 1,
                  }}
                >
                  <Avatar sx={{ width: 32, height: 32, fontSize: 13, backgroundColor: a.peran === 1 ? "#0D59F2" : "#90a4ae" }}>
                    {(a.nama || "?")[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                      {a.nama}
                    </Typography>
                  </Box>
                  <Chip
                    label={PERAN[a.peran] || "Anggota"}
                    size="small"
                    color={a.peran === 1 ? "primary" : "default"}
                    variant={a.peran === 1 ? "filled" : "outlined"}
                  />
                </Box>
              ))}
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Description sx={{ color: "#0D59F2", fontSize: 20 }} />
              <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                Informasi Proposal
              </Typography>
            </Box>

            {proposal ? (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Judul Proposal</Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: 15, lineHeight: 1.4 }}>
                    {proposal.judul}
                  </Typography>
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Modal Diajukan</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                      {formatRupiah(proposal.modal_diajukan)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Status Proposal</Typography>
                    <Chip
                      label={STATUS_PROPOSAL[proposal.status]?.text || "-"}
                      color={STATUS_PROPOSAL[proposal.status]?.color || "default"}
                      size="small"
                    />
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Tanggal Submit</Typography>
                  <Typography sx={{ fontSize: 14 }}>
                    {formatDate(proposal.tanggal_submit)}
                  </Typography>
                </Box>

                {proposal.file_proposal && (
                  <Button
                    variant="outlined"
                    size="small"
                    component="a"
                    href={`${import.meta.env.VITE_API_URL}/uploads/${proposal.file_proposal}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<Description />}
                    sx={{ textTransform: "none", mt: 1 }}
                  >
                    Unduh File Proposal
                  </Button>
                )}
              </>
            ) : (
              <Typography sx={{ fontSize: 14, color: "#999" }}>
                Proposal tidak tersedia
              </Typography>
            )}
          </Paper>
        </Box>

        {pengajuan.catatan_dosen && (
          <Paper sx={{ p: 3, mb: 3, borderLeft: "4px solid #ef5350" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Person sx={{ color: "#ef5350", fontSize: 20 }} />
              <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
                Catatan Penolakan
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 14, color: "#444" }}>
              {pengajuan.catatan_dosen}
            </Typography>
          </Paper>
        )}

        {pengajuan.responded_at && (
          <Paper sx={{ p: 2, mb: 3, backgroundColor: "#f5f5f5" }}>
            <Typography sx={{ fontSize: 13, color: "#777" }}>
              Direspon pada: <strong>{formatDate(pengajuan.responded_at)}</strong>
            </Typography>
          </Paper>
        )}

        {!sudahDirespon && (
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={handleOpenReject}
              disabled={submitting}
              sx={{ textTransform: "none", px: 3 }}
            >
              Tolak Pengajuan
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={handleApprove}
              disabled={submitting}
              sx={{ textTransform: "none", px: 3 }}
            >
              {submitting ? "Memproses..." : "Setujui Pengajuan"}
            </Button>
          </Box>
        )}
      </Box>

      <Dialog open={rejectDialogOpen} onClose={handleCloseReject} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, pr: 4 }}>
            <Cancel sx={{ color: "#ef5350" }} />
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
              Tolak Pengajuan Pembimbing
            </Typography>
          </Box>
          <IconButton onClick={handleCloseReject} sx={{ position: "absolute", right: 8, top: 8 }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Mahasiswa akan dapat mengajukan ulang pembimbing setelah pengajuan ini ditolak.
          </Alert>

          <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>
            Catatan Penolakan <span style={{ color: "#ef5350" }}>*</span>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Tuliskan alasan penolakan..."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            error={catatan.trim() === ""}
            helperText={catatan.trim() === "" ? "Catatan wajib diisi" : ""}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleCloseReject}
            sx={{ textTransform: "none", color: "#666" }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={submitting || catatan.trim() === ""}
            sx={{ textTransform: "none" }}
          >
            {submitting ? "Memproses..." : "Tolak Pengajuan"}
          </Button>
        </DialogActions>
      </Dialog>
    </BodyLayout>
  );
}