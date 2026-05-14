import { useState } from "react";
import {
  Box, Typography, Button, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Paper,
} from "@mui/material";
import { AttachFile, Close, Assignment, Lock } from "@mui/icons-material";
import Swal from "sweetalert2";
import { downloadFile } from "../../utils/download";

const COLORS = {
  primary:      "#0D59F2",
  primaryLight: "#E0F2FE",
  primaryDark:  "#0369A1",
  primaryMuted: "#93C5FD",
  secondary:    "#2563EB",
  accent:       "#3B82F6",
  slate:        "#64748B",
  slateLight:   "#F1F5F9",
  success:      "#059669",
  successLight: "#ECFDF5",
  warning:      "#D97706",
  warningLight: "#FFFBEB",
  error:        "#DC2626",
  errorLight:   "#FEF2F2",
};

const roundedField = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#fff",
    transition: "box-shadow 0.2s",
    "&:hover fieldset": { borderColor: COLORS.primary },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary },
    "&.Mui-focused": { boxShadow: `0 0 0 3px ${COLORS.primaryLight}` },
  },
};

const SectionHeader = ({ icon: Icon, title, subtitle, gradient }) => (
  <Box sx={{
    display: "flex", alignItems: "center", gap: 2, mb: 3,
    p: 2.5, borderRadius: "14px", background: gradient,
  }}>
    <Box sx={{
      width: 44, height: 44, borderRadius: "12px",
      background: "rgba(255,255,255,0.25)",
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(4px)",
    }}>
      <Icon sx={{ color: "#fff", fontSize: 22 }} />
    </Box>
    <Box>
      <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{title}</Typography>
      {subtitle && <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.8)", mt: 0.3 }}>{subtitle}</Typography>}
    </Box>
  </Box>
);

const FieldLabel = ({ children }) => (
  <Typography sx={{ fontWeight: 600, mb: 0.8, fontSize: 13, color: "#374151" }}>
    {children}
  </Typography>
);

const StatusPill = ({ label, backgroundColor }) => (
  <Box sx={{
    display: "inline-flex", alignItems: "center",
    px: 1.5, py: 0.4, borderRadius: "50px",
    backgroundColor, color: "#fff",
    fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {label}
  </Box>
);

const getStatusInfo = (status) => {
  const map = {
    0: { label: "Menunggu Response", backgroundColor: "#f57f17" },
    1: { label: "Disetujui",         backgroundColor: COLORS.success },
    2: { label: "Ditolak",           backgroundColor: COLORS.error },
    3: { label: "Draft Penilaian",   backgroundColor: COLORS.secondary },
    4: { label: "Selesai Dinilai",   backgroundColor: "#6a1b9a" },
  };
  return map[status] || { label: "Unknown", backgroundColor: COLORS.slate };
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
  const isProposalNonaktif = Number(penugasan?.status_proposal) === 10;

  const handleOpenReject = () => { setRejectDialog(true); setCatatan(""); setErrors({}); };
  const handleCloseReject = () => { setRejectDialog(false); setCatatan(""); setErrors({}); };

  const handleRejectConfirm = async () => {
    if (!catatan || catatan.trim().length < 5) {
      setErrors({ catatan: "Catatan penolakan minimal 5 karakter" });
      return;
    }
    setRejectDialog(false);
    const result = await Swal.fire({
      title: "Konfirmasi",
      html: `Tolak penugasan untuk proposal:<br/><br/><b>${penugasan.judul}</b>?`,
      icon: "warning", showCancelButton: true,
      confirmButtonColor: COLORS.error, cancelButtonColor: COLORS.slate,
      confirmButtonText: "Ya, Tolak", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) { setRejectDialog(true); return; }
    await onReject(catatan.trim());
  };

  const si = getStatusInfo(penugasan.status);

  return (
    <Box>
        <Box>
          <SectionHeader
            icon={Assignment}
            title="Informasi Proposal"
            subtitle="Detail proposal yang ditugaskan kepada Anda"
            gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
          />

          <Box sx={{ mb: 3 }}>
            <FieldLabel>Judul Proposal</FieldLabel>
            <TextField fullWidth value={penugasan.judul} disabled multiline rows={2} sx={roundedField} />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 3 }}>
            <Box>
              <FieldLabel>Nama Tim</FieldLabel>
              <TextField fullWidth value={penugasan.nama_tim} disabled sx={roundedField} />
            </Box>
            <Box>
              <FieldLabel>Program</FieldLabel>
              <TextField fullWidth value={penugasan.keterangan} disabled sx={roundedField} />
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 3 }}>
            <Box>
              <FieldLabel>Kategori</FieldLabel>
              <TextField fullWidth value={penugasan.nama_kategori} disabled sx={roundedField} />
            </Box>
            <Box>
              <FieldLabel>Modal Diajukan</FieldLabel>
              <TextField fullWidth value={formatRupiah(penugasan.modal_diajukan)} disabled sx={roundedField} />
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <FieldLabel>File Proposal</FieldLabel>
            {penugasan.file_proposal ? (
              <Box sx={{
                border: `1.5px solid ${COLORS.primaryMuted}`,
                borderRadius: "12px", p: 2,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                backgroundColor: COLORS.primaryLight,
              }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: "8px",
                    backgroundColor: "rgba(255,255,255,0.7)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <AttachFile sx={{ color: COLORS.primary, fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: 13, color: "#1F2937" }}>{penugasan.file_proposal}</Typography>
                    <Typography sx={{ fontSize: 11, color: COLORS.success, fontWeight: 600 }}>File Proposal</Typography>
                  </Box>
                </Box>
                <Button
                  onClick={() => downloadFile(penugasan.file_proposal)}
                  size="small"
                  sx={{
                    textTransform: "none", borderRadius: "50px",
                    fontSize: 13, fontWeight: 600,
                    color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, px: 2,
                    backgroundColor: "#fff",
                    "&:hover": { backgroundColor: COLORS.primaryLight },
                  }}
                >
                  Download
                </Button>
              </Box>
            ) : (
              <TextField fullWidth value="-" disabled sx={roundedField} />
            )}
          </Box>
        </Box>
        <Divider sx={{ my: 3 }} />
        <Box>
          <SectionHeader
            icon={Lock}
            title="Status Penugasan"
            subtitle="Informasi tahap dan timeline penilaian"
            gradient={`linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.success} 100%)`}
          />

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 3 }}>
            <Box>
              <FieldLabel>Tahap Penilaian</FieldLabel>
              <TextField
                fullWidth
                value={penugasan.nama_tahap || `Tahap ${penugasan.urutan_tahap || "-"}`}
                disabled sx={roundedField}
              />
            </Box>
            <Box>
              <FieldLabel>Status</FieldLabel>
              <Box sx={{ pt: 0.5 }}>
                <StatusPill label={si.label} backgroundColor={si.backgroundColor} />
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 3 }}>
            <Box>
              <FieldLabel>Tanggal Ditugaskan</FieldLabel>
              <TextField fullWidth value={formatDate(penugasan.assigned_at)} disabled sx={roundedField} />
            </Box>
            {penugasan.responded_at && (
              <Box>
                <FieldLabel>Tanggal Response</FieldLabel>
                <TextField fullWidth value={formatDate(penugasan.responded_at)} disabled sx={roundedField} />
              </Box>
            )}
          </Box>

          {penugasan.penilaian_mulai && penugasan.penilaian_selesai && (
            <Box sx={{ mb: 3 }}>
              <FieldLabel>Timeline Penilaian</FieldLabel>
              <Box sx={{
                p: 2.5, borderRadius: "12px",
                background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.primary}08 100%)`,
                border: `1.5px solid ${COLORS.primaryMuted}`,
              }}>
                <Typography sx={{ fontSize: 12, color: COLORS.primaryDark, fontWeight: 700, mb: 1 }}>Periode Penilaian</Typography>
                <Typography sx={{ fontSize: 14, color: "#374151" }}><strong>Mulai:</strong> {formatDate(penugasan.penilaian_mulai)}</Typography>
                <Typography sx={{ fontSize: 14, color: "#374151", mt: 0.5 }}><strong>Selesai:</strong> {formatDate(penugasan.penilaian_selesai)}</Typography>
              </Box>
            </Box>
          )}

          {penugasan.status === 2 && penugasan.catatan_reviewer && (
            <Box sx={{ mb: 3 }}>
              <FieldLabel>Catatan Penolakan</FieldLabel>
              <Box sx={{
                p: 2.5, borderRadius: "12px",
                background: `linear-gradient(135deg, ${COLORS.errorLight} 0%, ${COLORS.error}08 100%)`,
                border: `1.5px solid #FCA5A5`,
              }}>
                <Typography sx={{ fontSize: 12, color: COLORS.error, fontWeight: 700, mb: 0.5 }}>Catatan Penolakan</Typography>
                <Typography sx={{ fontSize: 14, color: "#374151" }}>{penugasan.catatan_reviewer}</Typography>
              </Box>
            </Box>
          )}

          {penugasan.status === 0 && !isProposalNonaktif && (
            <>
              <Divider sx={{ my: 3 }} />
              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  onClick={handleOpenReject}
                  disabled={submitting}
                  sx={{
                    textTransform: "none", borderRadius: "12px",
                    px: 4, py: 1.3, fontWeight: 700, fontSize: 14,
                    borderColor: COLORS.error, color: COLORS.error,
                    "&:hover": { backgroundColor: COLORS.errorLight, borderColor: COLORS.error },
                    "&:disabled": { opacity: 0.7 },
                  }}
                >
                  Tolak
                </Button>
                <Button
                  variant="contained"
                  onClick={onAccept}
                  disabled={submitting}
                  sx={{
                    textTransform: "none", borderRadius: "12px",
                    px: 4, py: 1.3, fontWeight: 700, fontSize: 14,
                    background: `linear-gradient(135deg, ${COLORS.success} 0%, #10B981 100%)`,
                    color: "#fff",
                    boxShadow: "0 4px 15px rgba(5,150,105,0.3)",
                    "&:hover": { boxShadow: "0 6px 20px rgba(5,150,105,0.4)" },
                    "&:disabled": { opacity: 0.7, color: "#fff" },
                  }}
                >
                  {submitting ? "Memproses..." : "Terima"}
                </Button>
              </Box>
            </>
          )}
        </Box>

      <Dialog open={rejectDialog} onClose={handleCloseReject} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden" } }}>
        <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.error}, #F87171)` }} />
        <DialogTitle sx={{ pb: 1, pt: 2.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16, color: "#1F2937" }}>Tolak Penugasan</Typography>
          <IconButton onClick={handleCloseReject} sx={{ position: "absolute", right: 12, top: 12, color: COLORS.slate }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ px: 3, py: 3 }}>
          <Box sx={{
            p: 2.5, borderRadius: "12px", mb: 3,
            background: `linear-gradient(135deg, ${COLORS.errorLight} 0%, ${COLORS.error}08 100%)`,
            border: `1.5px solid #FCA5A5`,
          }}>
            <Typography sx={{ fontSize: 12, color: COLORS.error, fontWeight: 700, mb: 0.5 }}>Proposal yang akan ditolak</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1F2937" }}>{penugasan.judul}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: "#374151" }}>
              Catatan Penolakan <span style={{ color: COLORS.error }}>*</span>
            </Typography>
            <TextField
              fullWidth multiline rows={4}
              placeholder="Masukkan catatan penolakan (minimal 5 karakter)..."
              value={catatan}
              onChange={(e) => { setCatatan(e.target.value); setErrors({}); }}
              error={!!errors.catatan} helperText={errors.catatan}
              sx={roundedField}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
          <Button onClick={handleCloseReject}
            sx={{
              textTransform: "none", borderRadius: "12px", px: 3, py: 1,
              fontWeight: 600, color: COLORS.slate,
              border: `1.5px solid #E5E7EB`,
              "&:hover": { backgroundColor: COLORS.slateLight },
            }}>
            Batal
          </Button>
          <Button variant="contained" onClick={handleRejectConfirm}
            sx={{
              textTransform: "none", borderRadius: "12px", px: 3, py: 1,
              fontWeight: 700, fontSize: 14,
              background: `linear-gradient(135deg, ${COLORS.error} 0%, #EF4444 100%)`,
              boxShadow: "0 4px 15px rgba(220,38,38,0.3)",
              "&:hover": { boxShadow: "0 6px 20px rgba(220,38,38,0.4)" },
            }}>
            Tolak Penugasan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}