import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  TextField,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import { getDistribusiDetail } from "../../api/admin";

export default function DistribusiDetailPage() {
  const navigate = useNavigate();
  const { id_program, tahap, id_distribusi } = useParams();
  const [loading, setLoading] = useState(true);
  const [distribusi, setDistribusi] = useState(null);
  const [alert, setAlert] = useState("");

  const statusConfig = {
    0: { label: "Menunggu Response", color: "warning" },
    1: { label: "Disetujui", color: "success" },
    2: { label: "Ditolak", color: "error" },
    3: { label: "Draft Penilaian", color: "info" },
    4: { label: "Selesai Dinilai", color: "secondary" },
  };

  const fetchDistribusiDetail = useCallback (async () => {
    try {
      setLoading(true);
      const response = await getDistribusiDetail(
        id_program,
        tahap,
        id_distribusi,
      );

      if (response.data) {
        setDistribusi(response.data);
      } else {
        setAlert("Distribusi tidak ditemukan");
      }
    } catch (err) {
      console.error("Error fetching distribusi detail:", err);
      setAlert("Gagal memuat detail distribusi");
    } finally {
      setLoading(false);
    }
  }, [id_distribusi, id_program, tahap]);

  useEffect(() => {
    fetchDistribusiDetail();
  }, [fetchDistribusiDetail]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
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

  if (loading) {
    return (
      <BodyLayout Sidebar={AdminSidebar}>
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

  if (!distribusi) {
    return (
      <BodyLayout Sidebar={AdminSidebar}>
        <Box>
          <Alert severity="error">
            {alert || "Distribusi tidak ditemukan"}
          </Alert>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              onClick={() => navigate(-1)}
              sx={{
                textTransform: "none",
                px: 4,
                backgroundColor: "#FDB022",
                color: "#fff",
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

  const statusInfo = statusConfig[distribusi.status] || statusConfig[0];

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
            Detail Distribusi Proposal
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#777" }}>
            Informasi lengkap distribusi proposal
          </Typography>
        </Box>

        {alert && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAlert("")}>
            {alert}
          </Alert>
        )}

        {/* Informasi Proposal */}
        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>
            Informasi Proposal
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              Judul Proposal
            </Typography>
            <TextField
              fullWidth
              value={distribusi.judul}
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
              <TextField
                fullWidth
                value={distribusi.nama_tim}
                disabled
              />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                ID Proposal
              </Typography>
              <TextField
                fullWidth
                value={`#${distribusi.id_proposal}`}
                disabled
              />
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
            {distribusi.modal_diajukan && (
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>
                  Modal Diajukan
                </Typography>
                <TextField
                  fullWidth
                  value={formatRupiah(distribusi.modal_diajukan)}
                  disabled
                />
              </Box>
            )}

            {distribusi.nama_kategori && (
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>
                  Kategori Usaha
                </Typography>
                <TextField
                  fullWidth
                  value={distribusi.nama_kategori}
                  disabled
                />
              </Box>
            )}
          </Box>

          {distribusi.keterangan && (
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Program
              </Typography>
              <TextField
                fullWidth
                value={distribusi.keterangan}
                disabled
              />
            </Box>
          )}
        </Paper>

        {/* Informasi Reviewer */}
        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>
            Informasi Reviewer
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Nama Reviewer
              </Typography>
              <TextField
                fullWidth
                value={distribusi.nama_reviewer}
                disabled
              />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Institusi
              </Typography>
              <TextField
                fullWidth
                value={distribusi.institusi || "-"}
                disabled
              />
            </Box>
          </Box>

          {distribusi.bidang_keahlian && (
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Bidang Keahlian
              </Typography>
              <TextField
                fullWidth
                value={distribusi.bidang_keahlian}
                disabled
              />
            </Box>
          )}
        </Paper>

        {/* Status Distribusi */}
        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>
            Status Distribusi
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Status Penilaian
              </Typography>
              <Box sx={{ pt: 1 }}>
                <Chip label={statusInfo.label} color={statusInfo.color} />
              </Box>
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Tahap Penilaian
              </Typography>
              <TextField
                fullWidth
                value={distribusi.nama_tahap || `Tahap ${distribusi.tahap}`}
                disabled
              />
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Tanggal Assign
              </Typography>
              <TextField
                fullWidth
                value={formatDate(distribusi.assigned_at)}
                disabled
              />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Assigned By
              </Typography>
              <TextField
                fullWidth
                value={distribusi.admin_name}
                disabled
              />
            </Box>
          </Box>

          {distribusi.responded_at && (
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Tanggal Response
              </Typography>
              <TextField
                fullWidth
                value={formatDate(distribusi.responded_at)}
                disabled
              />
            </Box>
          )}

          {distribusi.catatan_reviewer && (
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Catatan Reviewer
              </Typography>
              <TextField
                fullWidth
                value={distribusi.catatan_reviewer}
                disabled
                multiline
                rows={4}
              />
            </Box>
          )}
        </Paper>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            onClick={() => navigate(-1)}
            sx={{
              textTransform: "none",
              px: 4,
              backgroundColor: "#FDB022",
              color: "#fff",
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