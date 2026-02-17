import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  Download,
  AttachFile,
  Close,
  ArrowBack,
} from "@mui/icons-material";
import Swal from "sweetalert2";

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

const getStatusInfo = (status) => {
  const map = {
    0: { label: "Menunggu Response", color: "#fff8e1",  bg: "#f57f17" },
    1: { label: "Disetujui",         color: "#e8f5e9",  bg: "#2e7d32" },
    2: { label: "Ditolak",           color: "#fce4ec",  bg: "#c62828" },
    3: { label: "Draft Penilaian",   color: "#e3f2fd",  bg: "#1565c0" },
    4: { label: "Selesai Dinilai",   color: "#f3e5f5",  bg: "#6a1b9a" },
  };
  return map[status] || { label: "Unknown", bg: "#f5f5f5", color: "#666" };
};

const formatRupiah = (value) => {
  if (!value) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function DetailPenugasanTab({ penugasan, onAccept, onReject, submitting }) {
  const [rejectDialog, setRejectDialog] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [errors, setErrors] = useState({});

  const handleOpenReject = () => { setRejectDialog(true); setCatatan(""); setErrors({}); };
  const handleCloseReject = () => { setRejectDialog(false); setCatatan(""); setErrors({}); };

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
      confirmButtonColor: "#d33", cancelButtonColor: "#666",
      confirmButtonText: "Ya, Tolak", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) { setRejectDialog(true); return; }
    await onReject(catatan.trim());
  };

  const si = getStatusInfo(penugasan.status);

  return (
    <Box>
      <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 3 }}>Informasi Proposal</Typography>

      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Judul Proposal</Typography>
        <TextField fullWidth value={penugasan.judul} disabled multiline rows={2} sx={roundedField} />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Nama Tim</Typography>
          <TextField fullWidth value={penugasan.nama_tim} disabled sx={roundedField} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Program</Typography>
          <TextField fullWidth value={penugasan.keterangan} disabled sx={roundedField} />
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Kategori</Typography>
          <TextField fullWidth value={penugasan.nama_kategori} disabled sx={roundedField} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Modal Diajukan</Typography>
          <TextField
            fullWidth value={formatRupiah(penugasan.modal_diajukan)} disabled sx={roundedField}
            InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: "#555" }}>Rp</Typography> }}
          />
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>File Proposal</Typography>
        {penugasan.file_proposal ? (
          <Box sx={{ border: "1.5px solid #f0f0f0", borderRadius: "12px", p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fafafa" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: "8px", backgroundColor: "#e3f2fd", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AttachFile sx={{ color: "#1565c0", fontSize: 18 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{penugasan.file_proposal}</Typography>
                <Typography sx={{ fontSize: 11, color: "#2e7d32", fontWeight: 600 }}>File Proposal</Typography>
              </Box>
            </Box>
            <Button
              startIcon={<Download sx={{ fontSize: 16 }} />}
              component="a"
              href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/proposal/${penugasan.file_proposal}`}
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
        ) : (
          <TextField fullWidth value="-" disabled sx={roundedField} />
        )}
      </Box>

      <Divider sx={{ my: 4 }} />

      <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 3 }}>Status Penugasan</Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Tahap Penilaian</Typography>
          <TextField
            fullWidth
            value={penugasan.nama_tahap || `Tahap ${penugasan.urutan_tahap || "-"}`}
            disabled sx={roundedField}
          />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 2, fontSize: 14 }}>Status</Typography>
          <StatusPill label={si.label} bg={si.bg} color={si.color} />
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Tanggal Ditugaskan</Typography>
          <TextField fullWidth value={formatDate(penugasan.assigned_at)} disabled sx={roundedField} />
        </Box>
        {penugasan.responded_at && (
          <Box>
            <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Tanggal Response</Typography>
            <TextField fullWidth value={formatDate(penugasan.responded_at)} disabled sx={roundedField} />
          </Box>
        )}
      </Box>

      {penugasan.penilaian_mulai && penugasan.penilaian_selesai && (
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Timeline Penilaian</Typography>
          <Box sx={{ p: 2.5, backgroundColor: "#e3f2fd", borderRadius: "12px", border: "1px solid #90caf9" }}>
            <Typography sx={{ fontSize: 12, color: "#1565c0", fontWeight: 700, mb: 1 }}>Periode Penilaian</Typography>
            <Typography sx={{ fontSize: 14 }}>
              <strong>Mulai:</strong> {formatDate(penugasan.penilaian_mulai)}
            </Typography>
            <Typography sx={{ fontSize: 14, mt: 0.5 }}>
              <strong>Selesai:</strong> {formatDate(penugasan.penilaian_selesai)}
            </Typography>
          </Box>
        </Box>
      )}

      {penugasan.status === 2 && penugasan.catatan_reviewer && (
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Catatan Penolakan</Typography>
          <Box sx={{ p: 2.5, backgroundColor: "#fce4ec", borderRadius: "12px", border: "1px solid #ef9a9a" }}>
            <Typography sx={{ fontSize: 12, color: "#c62828", fontWeight: 700, mb: 0.5 }}>Alasan Penolakan</Typography>
            <Typography sx={{ fontSize: 14 }}>{penugasan.catatan_reviewer}</Typography>
          </Box>
        </Box>
      )}

      {penugasan.status === 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
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
              onClick={onAccept}
              disabled={submitting}
              sx={{
                textTransform: "none", borderRadius: "50px",
                px: 3, py: 1.2, fontWeight: 600,
                backgroundColor: "#2e7d32", "&:hover": { backgroundColor: "#1b5e20" },
              }}
            >
              Terima
            </Button>
          </Box>
        </>
      )}

      <Dialog open={rejectDialog} onClose={handleCloseReject} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Tolak Penugasan</Typography>
          <IconButton onClick={handleCloseReject} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 3 }}>
          <Box sx={{ p: 2.5, backgroundColor: "#fce4ec", borderRadius: "12px", border: "1px solid #ef9a9a", mb: 3 }}>
            <Typography sx={{ fontSize: 12, color: "#c62828", fontWeight: 700, mb: 0.5 }}>Proposal yang akan ditolak</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{penugasan.judul}</Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
              Catatan Penolakan <span style={{ color: "#ef5350" }}>*</span>
            </Typography>
            <TextField
              fullWidth multiline rows={4}
              placeholder="Masukkan alasan penolakan (minimal 10 karakter)..."
              value={catatan}
              onChange={(e) => { setCatatan(e.target.value); setErrors({}); }}
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
          <Button variant="contained" onClick={handleRejectConfirm}
            sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, backgroundColor: "#e53935", "&:hover": { backgroundColor: "#c62828" } }}>
            Tolak Penugasan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}