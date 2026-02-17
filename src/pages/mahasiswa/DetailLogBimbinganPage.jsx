import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Button,
  CircularProgress, Alert, Divider, TextField,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import BodyLayout from "../../components/layouts/BodyLayout";
import SidebarMahasiswa from "../../components/layouts/MahasiswaSidebar";
import { getDetailBimbingan } from "../../api/mahasiswa";

const roundedField = {
  "& .MuiOutlinedInput-root": { borderRadius: "12px" },
};

const StatusPill = ({ label, bg, color }) => (
  <Box
    sx={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      px: 2.5,
      py: 0.8,
      borderRadius: "999px",
      backgroundColor: bg,
      color,
      fontSize: 14,
      fontWeight: 700,
      whiteSpace: "nowrap",
      minHeight: 32,
    }}
  >
    {label}
  </Box>
);


const METODE_PILL = {
  1: { label: "Online",  color: "#e3f2fd", bg: "#1565c0" },
  2: { label: "Offline", color: "#f5f5f5", bg: "#555" },
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function DetailLogBimbinganPage() {
  const navigate = useNavigate();
  const { id_bimbingan } = useParams();

  const [loading, setLoading] = useState(true);
  const [bimbingan, setBimbingan] = useState(null);
  const [alertMsg, setAlertMsg] = useState("");

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDetailBimbingan(id_bimbingan);
      if (res.success) setBimbingan(res.data);
      else setAlertMsg(res.message || "Gagal memuat detail bimbingan");
    } catch (err) {
      setAlertMsg(err.response?.data?.message || "Gagal memuat detail bimbingan");
    } finally {
      setLoading(false);
    }
  }, [id_bimbingan]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  if (loading) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }

  if (!bimbingan) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Alert severity="error" sx={{ borderRadius: "12px" }}>{alertMsg || "Data bimbingan tidak ditemukan"}</Alert>
      </BodyLayout>
    );
  }

  const metodeInfo = METODE_PILL[bimbingan.metode];

  return (
    <BodyLayout Sidebar={SidebarMahasiswa}>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Detail Bimbingan</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography sx={{ fontSize: 14, color: "#777" }}>
              Diajukan pada {formatDate(bimbingan.created_at)}
            </Typography>
            </Box>
        </Box>

        {alertMsg && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setAlertMsg("")}>
            {alertMsg}
          </Alert>
        )}

        <Paper sx={{ p: 4, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>Informasi Bimbingan</Typography>
          <Divider sx={{ mb: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Topik Bimbingan</Typography>
            <TextField fullWidth value={bimbingan.topik} disabled multiline rows={2} sx={roundedField} />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Tanggal Bimbingan</Typography>
              <TextField fullWidth value={formatDate(bimbingan.tanggal_bimbingan)} disabled sx={roundedField} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Metode</Typography>
                <StatusPill
                  label={metodeInfo?.label || bimbingan.metode}
                  bg={metodeInfo?.bg || "#f5f5f5"}
                  color={metodeInfo?.color || "#555"}
                />
            </Box>
          </Box>

          {bimbingan.deskripsi && (
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Deskripsi</Typography>
              <TextField fullWidth value={bimbingan.deskripsi} disabled multiline rows={4} sx={roundedField} />
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Judul Proposal</Typography>
            <TextField fullWidth value={bimbingan.judul_proposal} disabled multiline rows={2} sx={roundedField} />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Dosen Pembimbing</Typography>
              <TextField fullWidth value={bimbingan.nama_dosen} disabled sx={roundedField} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>NIP</Typography>
              <TextField fullWidth value={bimbingan.nip || "-"} disabled sx={roundedField} />
            </Box>
          </Box>
        </Paper>

        {bimbingan.catatan_dosen && (
          <Paper sx={{ p: 4, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>Catatan Dosen</Typography>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ p: 2.5, backgroundColor: "#fff8e1", borderRadius: "12px", border: "1px solid #ffe082" }}>
              <Typography sx={{ fontSize: 12, color: "#f57f17", fontWeight: 700, mb: 1 }}>Catatan</Typography>
              <Typography sx={{ fontSize: 14, lineHeight: 1.7 }}>{bimbingan.catatan_dosen}</Typography>
            </Box>
          </Paper>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate("/mahasiswa/bimbingan")}
            sx={{
              textTransform: "none",
              borderRadius: "50px",
              px: 4, py: 1.2, fontWeight: 600,
              backgroundColor: "#FDB022",
              "&:hover": { backgroundColor: "#e09a1a" },
            }}
          >
            Kembali
          </Button>
        </Box>
      </Box>
    </BodyLayout>
  );
}