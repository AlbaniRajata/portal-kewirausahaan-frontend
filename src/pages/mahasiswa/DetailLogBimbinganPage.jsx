import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Button, Chip,
  CircularProgress, Alert, Divider, TextField,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import BodyLayout from "../../components/layouts/BodyLayout";
import SidebarMahasiswa from "../../components/layouts/MahasiswaSidebar";
import { getDetailBimbingan } from "../../api/mahasiswa";

const STATUS_BIMBINGAN = {
  0: { text: "Menunggu Konfirmasi", color: "warning" },
  1: { text: "Disetujui", color: "success" },
  2: { text: "Ditolak", color: "error" },
};

const METODE_LABEL = {
  1: "Online",
  2: "Offline",
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
      if (res.success) {
        setBimbingan(res.data);
      } else {
        setAlertMsg(res.message || "Gagal memuat detail bimbingan");
      }
    } catch (err) {
      console.error("Error fetching detail bimbingan:", err);
      setAlertMsg(err.response?.data?.message || "Gagal memuat detail bimbingan");
    } finally {
      setLoading(false);
    }
  }, [id_bimbingan]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

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
        <Alert severity="error">{alertMsg || "Data bimbingan tidak ditemukan"}</Alert>
      </BodyLayout>
    );
  }

  const statusInfo = STATUS_BIMBINGAN[bimbingan.status] || { text: "-", color: "default" };

  return (
    <BodyLayout Sidebar={SidebarMahasiswa}>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
            Detail Bimbingan
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography sx={{ fontSize: 14, color: "#777" }}>
              Diajukan pada {formatDate(bimbingan.created_at)}
            </Typography>
            <Chip
              label={statusInfo.text}
              color={statusInfo.color}
              size="small"
            />
          </Box>
        </Box>

        {alertMsg && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAlertMsg("")}>
            {alertMsg}
          </Alert>
        )}

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>
            Informasi Bimbingan
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
              Topik Bimbingan
            </Typography>
            <TextField
              fullWidth
              value={bimbingan.topik}
              disabled
              multiline
              rows={2}
            />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                Tanggal Bimbingan
              </Typography>
              <TextField
                fullWidth
                value={formatDate(bimbingan.tanggal_bimbingan)}
                disabled
              />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                Metode
              </Typography>
              <TextField
                fullWidth
                value={METODE_LABEL[bimbingan.metode] || bimbingan.metode}
                disabled
              />
            </Box>
          </Box>

          {bimbingan.deskripsi && (
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                Deskripsi
              </Typography>
              <TextField
                fullWidth
                value={bimbingan.deskripsi}
                disabled
                multiline
                rows={4}
              />
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
              Judul Proposal
            </Typography>
            <TextField
              fullWidth
              value={bimbingan.judul_proposal}
              disabled
              multiline
              rows={2}
            />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                Dosen Pembimbing
              </Typography>
              <TextField
                fullWidth
                value={bimbingan.nama_dosen}
                disabled
              />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                NIP
              </Typography>
              <TextField
                fullWidth
                value={bimbingan.nip || "-"}
                disabled
              />
            </Box>
          </Box>
        </Paper>

        {bimbingan.catatan_dosen && (
          <Paper sx={{ p: 4, mb: 3 }}>
            <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>
              Catatan Dosen
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <TextField
              fullWidth
              value={bimbingan.catatan_dosen}
              disabled
              multiline
              rows={4}
            />
          </Paper>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate("/mahasiswa/bimbingan")}
            sx={{
              textTransform: "none",
              px: 4,
              py: 1.2,
              backgroundColor: "#FDB022",
              "&:hover": { backgroundColor: "#e09a1a" },
              fontWeight: 600,
            }}
          >
            Kembali
          </Button>
        </Box>
      </Box>
    </BodyLayout>
  );
}