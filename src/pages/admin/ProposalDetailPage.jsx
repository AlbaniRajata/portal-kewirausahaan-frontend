import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { Download } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import { getProposalDetailAdmin } from "../../api/admin";

export default function ProposalDetailPage() {
  const navigate = useNavigate();
  const { id_proposal } = useParams();
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState(null);
  const [alert, setAlert] = useState("");

  const fetchProposalDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getProposalDetailAdmin(id_proposal);
      setProposal(response.data);
    } catch (err) {
      console.error("Error fetching proposal detail:", err);
      setAlert("Gagal memuat detail proposal");
    } finally {
      setLoading(false);
    }
  }, [id_proposal]);

  useEffect(() => {
    fetchProposalDetail();
  }, [fetchProposalDetail]);

  const formatRupiah = (value) => {
    if (!value) return "Rp 0";
    return "Rp " + new Intl.NumberFormat("id-ID").format(value);
  };

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

  const getStatusLabel = (statusCode) => {
    const labels = {
      0: { text: "Draft", color: "default" },
      1: { text: "Diajukan", color: "info" },
      2: { text: "Ditugaskan ke Reviewer", color: "primary" },
      3: { text: "Tidak Lolos Desk", color: "error" },
      4: { text: "Lolos Desk", color: "success" },
      5: { text: "Wawancara Dijadwalkan", color: "warning" },
      6: { text: "Panel Wawancara", color: "primary" },
      7: { text: "Tidak Lolos Wawancara", color: "error" },
      8: { text: "Lolos Wawancara", color: "success" },
      9: { text: "Pembimbing Diajukan", color: "info" },
      10: { text: "Pembimbing Disetujui", color: "success" },
    };
    return labels[statusCode] || { text: "Unknown", color: "default" };
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={AdminSidebar}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }

  if (!proposal) {
    return (
      <BodyLayout Sidebar={AdminSidebar}>
        <Box>
          <Alert severity="error">Proposal tidak ditemukan</Alert>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              onClick={() => navigate("/admin/proposal")}
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

  const statusInfo = getStatusLabel(proposal.status);

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
            Detail Proposal
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#777" }}>
            Informasi lengkap proposal kewirausahaan
          </Typography>
        </Box>

        {alert && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAlert("")}>
            {alert}
          </Alert>
        )}

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
              value={proposal.judul}
              disabled
              multiline
              rows={2}
            />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Program
              </Typography>
              <TextField
                fullWidth
                value={proposal.keterangan}
                disabled
              />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Kategori Usaha
              </Typography>
              <TextField
                fullWidth
                value={proposal.nama_kategori}
                disabled
              />
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Modal Diajukan
              </Typography>
              <TextField
                fullWidth
                value={formatRupiah(proposal.modal_diajukan)}
                disabled
              />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Status
              </Typography>
              <Box sx={{ pt: 1 }}>
                <Chip
                  label={statusInfo.text}
                  color={statusInfo.color}
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Tanggal Submit
              </Typography>
              <TextField
                fullWidth
                value={formatDate(proposal.tanggal_submit)}
                disabled
              />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                File Proposal
              </Typography>
              {proposal.file_proposal ? (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Download />}
                  component="a"
                  href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/proposal/${proposal.file_proposal}`}
                  target="_blank"
                  sx={{ textTransform: "none", justifyContent: "flex-start" }}
                >
                  {proposal.file_proposal}
                </Button>
              ) : (
                <TextField
                  fullWidth
                  value="-"
                  disabled
                />
              )}
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>
            Informasi Tim
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              Nama Tim
            </Typography>
            <TextField
              fullWidth
              value={proposal.nama_tim}
              disabled
            />
          </Box>

          <Typography sx={{ fontWeight: 600, mb: 2 }}>
            Anggota Tim
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Nama</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>NIM</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Prodi</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Peran</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proposal.anggota_tim?.map((anggota, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500 }}>
                        {anggota.nama_lengkap}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14 }}>
                        {anggota.nim}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14 }}>
                        {anggota.email || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14 }}>
                        {anggota.nama_prodi || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={anggota.peran === 1 ? "Ketua" : "Anggota"}
                        color={anggota.peran === 1 ? "primary" : "default"}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            onClick={() => navigate("/admin/proposal")}
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