import { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  Download,
  Info,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function DetailPenugasanTab({
  penugasan,
  onAccept,
  onReject,
  submitting,
}) {
  const navigate = useNavigate();
  const [rejectDialog, setRejectDialog] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [errors, setErrors] = useState({});

  const formatRupiah = (value) => {
    if (!value) return "Rp 0";
    return "Rp " + new Intl.NumberFormat("id-ID").format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      0: { text: "Menunggu Response", color: "warning" },
      1: { text: "Disetujui", color: "success" },
      2: { text: "Ditolak", color: "error" },
      3: { text: "Draft Penilaian", color: "info" },
      4: { text: "Selesai Dinilai", color: "secondary" },
    };
    return labels[status] || { text: "Unknown", color: "default" };
  };

  const handleOpenReject = () => {
    setRejectDialog(true);
    setCatatan("");
    setErrors({});
  };

  const handleCloseReject = () => {
    setRejectDialog(false);
    setCatatan("");
    setErrors({});
  };

  const handleRejectConfirm = async () => {
    if (!catatan || catatan.trim().length < 10) {
      setErrors({ catatan: "Catatan penolakan minimal 10 karakter" });
      return;
    }

    setRejectDialog(false);

    const result = await Swal.fire({
      title: "Konfirmasi",
      html: `Tolak penugasan untuk proposal:<br/><br/><b>${penugasan.judul}</b>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Tolak",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) {
      setRejectDialog(true);
      return;
    }

    await onReject(catatan.trim());
  };

  const statusInfo = getStatusLabel(penugasan.status);

  return (
    <Box>
      <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 3 }}>
        Informasi Proposal
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 600, mb: 1 }}>
          Judul Proposal
        </Typography>
        <TextField
          fullWidth
          value={penugasan.judul}
          disabled
          multiline
          rows={2}
        />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>
            Nama Tim
          </Typography>
          <TextField fullWidth value={penugasan.nama_tim} disabled />
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>
            Program
          </Typography>
          <TextField fullWidth value={penugasan.keterangan} disabled />
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>
            Kategori
          </Typography>
          <TextField fullWidth value={penugasan.nama_kategori} disabled />
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>
            Modal Diajukan
          </Typography>
          <TextField
            fullWidth
            value={formatRupiah(penugasan.modal_diajukan)}
            disabled
          />
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 600, mb: 1 }}>File Proposal</Typography>
        {penugasan.file_proposal ? (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Download />}
            component="a"
            href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/proposal/${penugasan.file_proposal}`}
            target="_blank"
            sx={{ textTransform: "none", justifyContent: "flex-start" }}
          >
            {penugasan.file_proposal}
          </Button>
        ) : (
          <TextField fullWidth value="-" disabled />
        )}
      </Box>

      <Divider sx={{ my: 4 }} />

      <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 3 }}>
        Status Penugasan
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>
            Tahap Penilaian
          </Typography>
          <TextField
            fullWidth
            value={penugasan.nama_tahap || `Tahap ${penugasan.urutan_tahap || '-'}`}
            disabled
          />
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>
            Status
          </Typography>
          <Box sx={{ pt: 1 }}>
            <Chip label={statusInfo.text} color={statusInfo.color} />
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>
            Tanggal Ditugaskan
          </Typography>
          <TextField
            fullWidth
            value={formatDate(penugasan.assigned_at)}
            disabled
          />
        </Box>

        {penugasan.responded_at && (
          <Box>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              Tanggal Response
            </Typography>
            <TextField
              fullWidth
              value={formatDate(penugasan.responded_at)}
              disabled
            />
          </Box>
        )}
      </Box>

      {penugasan.penilaian_mulai && penugasan.penilaian_selesai && (
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>
            Timeline Penilaian
          </Typography>
          <Alert severity="info" icon={<Info />}>
            <Typography sx={{ fontSize: 14 }}>
              <strong>Mulai:</strong> {formatDate(penugasan.penilaian_mulai)}
            </Typography>
            <Typography sx={{ fontSize: 14 }}>
              <strong>Selesai:</strong> {formatDate(penugasan.penilaian_selesai)}
            </Typography>
          </Alert>
        </Box>
      )}

      {penugasan.status === 2 && penugasan.catatan_juri && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="error" icon={<Info />}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>
              Catatan Penolakan
            </Typography>
            <Typography sx={{ fontSize: 14 }}>{penugasan.catatan_juri}</Typography>
          </Alert>
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
        {penugasan.status === 0 && (
          <>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={handleOpenReject}
              disabled={submitting}
              sx={{ textTransform: "none", px: 3 }}
            >
              Tolak
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={onAccept}
              disabled={submitting}
              sx={{ textTransform: "none", px: 3 }}
            >
              Terima
            </Button>
          </>
        )}

        <Button
          variant="contained"
          onClick={() => navigate("/juri/penugasan")}
          sx={{
            backgroundColor: "#FDB022",
            "&:hover": { backgroundColor: "#E09A1A" },
            textTransform: "none",
            px: 3,
          }}
        >
          Kembali
        </Button>
      </Box>

      <Dialog open={rejectDialog} onClose={handleCloseReject} maxWidth="sm" fullWidth>
        <DialogTitle>Tolak Penugasan</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Anda akan menolak penugasan untuk proposal:{" "}
            <strong>{penugasan.judul}</strong>
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Catatan Penolakan"
            placeholder="Masukkan alasan penolakan (minimal 10 karakter)..."
            value={catatan}
            onChange={(e) => {
              setCatatan(e.target.value);
              setErrors({});
            }}
            error={!!errors.catatan}
            helperText={errors.catatan}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReject}>Batal</Button>
          <Button onClick={handleRejectConfirm} color="error" variant="contained">
            Tolak
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}