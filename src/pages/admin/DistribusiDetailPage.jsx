import { useState, useEffect, useCallback } from "react";
import { Box, Paper, Typography, Button, Chip, CircularProgress, TextField } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import { getDistribusiDetail } from "../../api/admin";
import Swal from "sweetalert2";

const STATUS_CONFIG = {
  0: { label: "Menunggu Response", color: "warning" },
  1: { label: "Disetujui", color: "success" },
  2: { label: "Ditolak", color: "error" },
  3: { label: "Draft Penilaian", color: "info" },
  4: { label: "Selesai Dinilai", color: "secondary" },
};

const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const formatRupiah = (value) => {
  if (!value) return "Rp 0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
};

const InfoField = ({ label, value, multiline }) => (
  <Box>
    <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>{label}</Typography>
    <TextField fullWidth value={value || "-"} disabled multiline={multiline} rows={multiline ? 3 : undefined}
      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", backgroundColor: "#fafafa" } }} />
  </Box>
);

export default function DistribusiDetailPage() {
  const navigate = useNavigate();
  const { id_program, tahap, id_distribusi } = useParams();
  const [loading, setLoading] = useState(true);
  const [distribusi, setDistribusi] = useState(null);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDistribusiDetail(id_program, tahap, id_distribusi);
      setDistribusi(res.data || null);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat detail distribusi", confirmButtonColor: "#0D59F2" });
    } finally {
      setLoading(false);
    }
  }, [id_program, tahap, id_distribusi]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  if (loading) {
    return (
      <BodyLayout Sidebar={AdminSidebar}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }

  if (!distribusi) {
    return (
      <BodyLayout Sidebar={AdminSidebar}>
        <Box>
          <Box sx={{ p: 2, mb: 3, backgroundColor: "#fce4ec", borderRadius: "12px", border: "1px solid #ef9a9a" }}>
            <Typography sx={{ fontSize: 14, color: "#c62828" }}>Distribusi tidak ditemukan</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button variant="contained" startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
              onClick={() => navigate(-1)}
              sx={{ textTransform: "none", borderRadius: "50px", px: 4, py: 1.2, fontWeight: 600, backgroundColor: "#FDB022", "&:hover": { backgroundColor: "#e09a1a" } }}>
              Kembali
            </Button>
          </Box>
        </Box>
      </BodyLayout>
    );
  }

  const statusInfo = STATUS_CONFIG[distribusi.status] || STATUS_CONFIG[0];

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", mb: 0.5, gap: 1 }}>
            <Button size="small" startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
              onClick={() => navigate(-1)}
              sx={{ textTransform: "none", fontSize: 13, color: "#888", p: 0, minWidth: 0, "&:hover": { backgroundColor: "transparent", color: "#0D59F2" } }}>
              Kembali
            </Button>
          </Box>

          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Detail Distribusi Proposal</Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>Informasi lengkap distribusi proposal</Typography>

          <Paper sx={{ p: 4, mb: 3, borderRadius: 3 }}>
            <Typography sx={{ fontSize: 17, fontWeight: 700, mb: 3 }}>Informasi Proposal</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <InfoField label="Judul Proposal" value={distribusi.judul} multiline />
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5 }}>
                <InfoField label="Nama Tim" value={distribusi.nama_tim} />
                <InfoField label="ID Proposal" value={`#${distribusi.id_proposal}`} />
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5 }}>
                {distribusi.modal_diajukan && <InfoField label="Modal Diajukan" value={formatRupiah(distribusi.modal_diajukan)} />}
                {distribusi.nama_kategori && <InfoField label="Kategori Usaha" value={distribusi.nama_kategori} />}
              </Box>
              {distribusi.keterangan && <InfoField label="Program" value={distribusi.keterangan} />}
            </Box>
          </Paper>

          <Paper sx={{ p: 4, mb: 3, borderRadius: 3 }}>
            <Typography sx={{ fontSize: 17, fontWeight: 700, mb: 3 }}>Informasi Reviewer</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5 }}>
                <InfoField label="Nama Reviewer" value={distribusi.nama_reviewer} />
                <InfoField label="Institusi" value={distribusi.institusi} />
              </Box>
              {distribusi.bidang_keahlian && <InfoField label="Bidang Keahlian" value={distribusi.bidang_keahlian} />}
            </Box>
          </Paper>

          <Paper sx={{ p: 4, mb: 3, borderRadius: 3 }}>
            <Typography sx={{ fontSize: 17, fontWeight: 700, mb: 3 }}>Status Distribusi</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5 }}>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Status Penilaian</Typography>
                  <Box sx={{ pt: 0.5 }}>
                    <Chip label={statusInfo.label} color={statusInfo.color} />
                  </Box>
                </Box>
                <InfoField label="Tahap Penilaian" value={distribusi.nama_tahap || `Tahap ${distribusi.tahap}`} />
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5 }}>
                <InfoField label="Tanggal Assign" value={formatDate(distribusi.assigned_at)} />
                <InfoField label="Assigned By" value={distribusi.admin_name} />
              </Box>
              {distribusi.responded_at && <InfoField label="Tanggal Response" value={formatDate(distribusi.responded_at)} />}
              {distribusi.catatan_reviewer && <InfoField label="Catatan Reviewer" value={distribusi.catatan_reviewer} multiline />}
            </Box>
          </Paper>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button variant="contained" onClick={() => navigate(-1)}
              sx={{ textTransform: "none", borderRadius: "50px", px: 4, py: 1.2, fontWeight: 600, backgroundColor: "#FDB022", "&:hover": { backgroundColor: "#e09a1a" } }}>
              Kembali
            </Button>
          </Box>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}