import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Button, Chip,
  CircularProgress, Alert, Divider,
} from "@mui/material";
import {
  ArrowBack, BookOutlined, Person, CalendarMonth, Devices,
} from "@mui/icons-material";
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
  1: { text: "Online", color: "info" },
  2: { text: "Offline", color: "default" },
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

  return (
    <BodyLayout Sidebar={SidebarMahasiswa}>
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/mahasiswa/bimbingan")}
            sx={{ textTransform: "none", color: "#555" }}
          >
            Kembali
          </Button>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography sx={{ fontSize: 24, fontWeight: 700 }}>
              Detail Bimbingan
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#777" }}>
              Diajukan pada {formatDate(bimbingan.created_at)}
            </Typography>
          </Box>
          <Box sx={{ ml: "auto" }}>
            <Chip
              label={STATUS_BIMBINGAN[bimbingan.status]?.text || "-"}
              color={STATUS_BIMBINGAN[bimbingan.status]?.color || "default"}
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
              <BookOutlined sx={{ color: "#0D59F2", fontSize: 20 }} />
              <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                Informasi Bimbingan
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Topik</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: 15 }}>
                  {bimbingan.topik}
                </Typography>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>
                    Tanggal Bimbingan
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <CalendarMonth sx={{ fontSize: 15, color: "#555" }} />
                    <Typography sx={{ fontSize: 13 }}>
                      {formatDate(bimbingan.tanggal_bimbingan)}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Metode</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Devices sx={{ fontSize: 15, color: "#555" }} />
                    <Chip
                      label={METODE_LABEL[bimbingan.metode]?.text || bimbingan.metode}
                      size="small"
                      variant="outlined"
                      color={METODE_LABEL[bimbingan.metode]?.color || "default"}
                    />
                  </Box>
                </Box>
              </Box>

              {bimbingan.deskripsi && (
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Deskripsi</Typography>
                  <Typography sx={{ fontSize: 14, color: "#444", lineHeight: 1.6 }}>
                    {bimbingan.deskripsi}
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Judul Proposal</Typography>
                <Typography sx={{ fontSize: 14 }}>
                  {bimbingan.judul_proposal}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
              <Person sx={{ color: "#0D59F2", fontSize: 20 }} />
              <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                Informasi Peserta
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Dosen Pembimbing</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: 15 }}>
                  {bimbingan.nama_dosen}
                </Typography>
                {bimbingan.nip && (
                  <Typography sx={{ fontSize: 13, color: "#666", fontFamily: "monospace" }}>
                    NIP: {bimbingan.nip}
                  </Typography>
                )}
                {bimbingan.bidang_keahlian && (
                  <Typography sx={{ fontSize: 13, color: "#666" }}>
                    {bimbingan.bidang_keahlian}
                  </Typography>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Diajukan Oleh</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                  {bimbingan.nama_pengaju}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {bimbingan.catatan_dosen && (
          <Paper sx={{
            p: 3,
            borderLeft: `4px solid ${bimbingan.status === 1 ? "#2e7d32" : "#ef5350"}`,
          }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1 }}>
              Catatan Dosen
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#444" }}>
              {bimbingan.catatan_dosen}
            </Typography>
          </Paper>
        )}
      </Box>
    </BodyLayout>
  );
}