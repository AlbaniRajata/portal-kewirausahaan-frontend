import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Button, Divider, TextField,
} from "@mui/material";
import { ArrowBack, MenuBook, Person } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import MahasiswaNavbar from "../../components/layouts/MahasiswaNavbar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getDetailBimbingan } from "../../api/mahasiswa";

const COLORS = {
  primary:      "#0D59F2",
  primaryLight: "#E0F2FE",
  primaryDark:  "#0369A1",
  primaryMuted: "#93C5FD",
  secondary:    "#2563EB",
  accent:       "#3B82F6",
  slate:        "#64748B",
  slateLight:   "#F1F5F9",
  warning:      "#D97706",
  warningLight: "#FFFBEB",
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

const METODE_PILL = {
  1: { label: "Online",  backgroundColor: "#1565c0" },
  2: { label: "Offline", backgroundColor: "#555" },
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
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

const ReadonlyField = ({ value }) => (
  <Box sx={{
    px: 2, py: 1.5, borderRadius: "12px",
    background: COLORS.slateLight,
    border: "1.5px dashed #CBD5E1",
    fontSize: 14, color: COLORS.slate, fontWeight: 500,
    minHeight: "44px", display: "flex", alignItems: "center",
  }}>
    {value || "—"}
  </Box>
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

export default function DetailLogBimbinganPage() {
  const navigate = useNavigate();
  const { id_bimbingan } = useParams();
  const [loading, setLoading]     = useState(true);
  const [bimbingan, setBimbingan] = useState(null);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDetailBimbingan(id_bimbingan);
      if (res.success) {
        setBimbingan(res.data);
      } else {
        await Swal.fire({ icon: "error", title: "Gagal Memuat", text: res.message || "Gagal memuat detail bimbingan", confirmButtonText: "OK" });
        navigate("/mahasiswa/bimbingan");
      }
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Gagal Memuat", text: err.response?.data?.message || "Gagal memuat detail bimbingan", confirmButtonText: "OK" });
      navigate("/mahasiswa/bimbingan");
    } finally {
      setLoading(false);
    }
  }, [id_bimbingan, navigate]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  if (loading) return (
    <BodyLayout Sidebar={MahasiswaNavbar}>
      <Box sx={{ position: "relative", minHeight: "60vh" }}>
        <LoadingScreen message="Memuat detail bimbingan..." overlay minHeight="60vh" />
      </Box>
    </BodyLayout>
  );

  if (!bimbingan) return null;

  const metodeInfo = METODE_PILL[bimbingan.metode];

  return (
    <BodyLayout Sidebar={MahasiswaNavbar}>
      <PageTransition>
        <Box>

          <Button
            onClick={() => navigate("/mahasiswa/bimbingan")}
            startIcon={<ArrowBack />}
            sx={{
              borderRadius: "50px", textTransform: "none",
              color: COLORS.primary, fontSize: 13, fontWeight: 500,
              p: 0, mb: 2, minWidth: 0,
              "&:hover": { backgroundColor: "transparent" },
            }}
          >
            Kembali ke Log Bimbingan
          </Button>

          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Detail Bimbingan
            </Typography>
            <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
              Diajukan pada {formatDate(bimbingan.created_at)}
            </Typography>
          </Box>

          <Paper elevation={0} sx={{ mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <SectionHeader
                icon={MenuBook}
                title="Informasi Bimbingan"
                subtitle="Detail sesi dan topik bimbingan"
                gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
              />

              <Box sx={{ mb: 3 }}>
                <FieldLabel>Topik Bimbingan</FieldLabel>
                <TextField fullWidth value={bimbingan.topik} disabled multiline rows={2} sx={roundedField} />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 3 }}>
                <Box>
                  <FieldLabel>Tanggal Bimbingan</FieldLabel>
                  <ReadonlyField value={formatDate(bimbingan.tanggal_bimbingan)} />
                </Box>
                <Box>
                  <FieldLabel>Metode</FieldLabel>
                  <Box sx={{ pt: 0.5 }}>
                    <StatusPill
                      label={metodeInfo?.label || bimbingan.metode}
                      backgroundColor={metodeInfo?.backgroundColor || "#666"}
                    />
                  </Box>
                </Box>
              </Box>

              {bimbingan.deskripsi && (
                <Box sx={{ mb: 3 }}>
                  <FieldLabel>Deskripsi</FieldLabel>
                  <TextField fullWidth value={bimbingan.deskripsi} disabled multiline rows={4} sx={roundedField} />
                </Box>
              )}

              <Box sx={{ mb: 3 }}>
                <FieldLabel>Judul Proposal</FieldLabel>
                <TextField fullWidth value={bimbingan.judul_proposal} disabled multiline rows={2} sx={roundedField} />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
                <Box>
                  <FieldLabel>Dosen Pembimbing</FieldLabel>
                  <ReadonlyField value={bimbingan.nama_dosen} />
                </Box>
                <Box>
                  <FieldLabel>NIP</FieldLabel>
                  <ReadonlyField value={bimbingan.nip} />
                </Box>
              </Box>
            </Box>
          </Paper>

          {bimbingan.catatan_dosen && (
            <Paper elevation={0} sx={{ mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
              <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.accent})` }} />
              <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
                <SectionHeader
                  icon={Person}
                  title="Catatan Dosen"
                  subtitle="Masukan dari dosen pembimbing"
                  gradient={`linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.accent} 100%)`}
                />
                <Box sx={{
                  p: 2.5, backgroundColor: COLORS.warningLight,
                  borderRadius: "12px", border: `1.5px solid #FDE68A`,
                  display: "flex", gap: 1.5, alignItems: "flex-start",
                }}>
                  <Box sx={{ width: 8, height: 8, mt: 0.6, borderRadius: "50%", background: COLORS.warning, flexShrink: 0 }} />
                  <Box>
                    <Typography sx={{ fontSize: 12, color: COLORS.warning, fontWeight: 700, mb: 0.5 }}>
                      Catatan
                    </Typography>
                    <Typography sx={{ fontSize: 13.5, color: "#92400E", lineHeight: 1.7 }}>
                      {bimbingan.catatan_dosen}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              onClick={() => navigate("/mahasiswa/bimbingan")}
              sx={{
                px: 4, py: 1.3, textTransform: "none", fontWeight: 700,
                borderRadius: "10px", fontSize: 14,
                backgroundColor: COLORS.warning, color: "#fff",
                "&:hover": { backgroundColor: "#B45309" },
              }}
            >
              Kembali
            </Button>
          </Box>

        </Box>
      </PageTransition>
    </BodyLayout>
  );
}