import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
} from "@mui/material";
import { Add, Visibility, Edit, Description } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BodyLayout from "../../components/layouts/BodyLayout";
import SidebarMahasiswa from "../../components/layouts/MahasiswaSidebar";
import { getProposalStatus } from "../../api/proposal";

export default function DaftarProposalPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [alert, setAlert] = useState("");

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await getProposalStatus();
      setStatus(response.data);
    } catch (err) {
      console.error("Error fetching status:", err);
      setAlert("Gagal memuat data proposal");
    } finally {
      setLoading(false);
    }
  };

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

  const handleCreateProposal = () => {
    navigate("/mahasiswa/proposal/form");
  };

  const handleViewProposal = () => {
    navigate("/mahasiswa/proposal/form");
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={SidebarMahasiswa}>
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
              Daftar Proposal
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#777" }}>
              Kelola proposal kewirausahaan Anda
            </Typography>
          </Box>
          
          {status?.isKetua && status?.data?.anggota?.all_accepted && !status?.data?.proposal && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateProposal}
              sx={{
                textTransform: "none",
                backgroundColor: "#0D59F2",
                "&:hover": { backgroundColor: "#0846c7" },
              }}
            >
              Buat Proposal
            </Button>
          )}
        </Box>

        {alert && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAlert("")}>
            {alert}
          </Alert>
        )}

        {!status?.hasTim && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Anda belum terdaftar dalam tim. Silakan ajukan anggota tim terlebih dahulu.
          </Alert>
        )}

        {status?.hasTim && !status?.isKetua && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Hanya ketua tim yang dapat mengajukan proposal.
          </Alert>
        )}

        {status?.hasTim && status?.isKetua && !status?.data?.anggota?.all_accepted && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Belum semua anggota menyetujui undangan. Pengajuan proposal hanya bisa dilakukan setelah semua anggota menyetujui undangan.
          </Alert>
        )}

        <Paper sx={{ overflow: "hidden" }}>
          {status?.data?.proposal ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Judul Proposal</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Program</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Kategori</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Anggaran</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tanggal Submit</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, maxWidth: 300 }}>
                        {status.data.proposal.judul}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14 }}>
                        {status.data.tim.keterangan}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14 }}>
                        {status.data.proposal.nama_kategori || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                        {formatRupiah(status.data.proposal.modal_diajukan)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(status.data.proposal.status).text}
                        color={getStatusLabel(status.data.proposal.status).color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14 }}>
                        {formatDate(status.data.proposal.tanggal_submit)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={status.data.proposal.status === 0 ? <Edit /> : <Visibility />}
                          onClick={handleViewProposal}
                          sx={{ textTransform: "none" }}
                        >
                          {status.data.proposal.status === 0 ? "Edit" : "Lihat"}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 8, textAlign: "center" }}>
              <Description sx={{ fontSize: 80, color: "#ddd", mb: 2 }} />
              <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#666", mb: 1 }}>
                Belum Ada Proposal
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#999", mb: 3 }}>
                {status?.isKetua && status?.data?.anggota?.all_accepted
                  ? "Mulai buat proposal kewirausahaan Anda"
                  : "Proposal akan muncul di sini setelah dibuat oleh ketua tim"}
              </Typography>
              {status?.isKetua && status?.data?.anggota?.all_accepted && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleCreateProposal}
                  sx={{
                    textTransform: "none",
                    backgroundColor: "#0D59F2",
                    "&:hover": { backgroundColor: "#0846c7" },
                  }}
                >
                  Buat Proposal
                </Button>
              )}
            </Box>
          )}
        </Paper>

        {status?.data?.tim && (
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 2 }}>
              Informasi Tim
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 12, color: "#777", mb: 0.5 }}>
                  Nama Tim
                </Typography>
                <Typography sx={{ fontWeight: 500 }}>
                  {status.data.tim.nama_tim}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: "#777", mb: 0.5 }}>
                  Program
                </Typography>
                <Typography sx={{ fontWeight: 500 }}>
                  {status.data.tim.keterangan}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: "#777", mb: 0.5 }}>
                  Jumlah Anggota
                </Typography>
                <Typography sx={{ fontWeight: 500 }}>
                  {status.data.anggota?.total || 0} orang
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: "#777", mb: 0.5 }}>
                  Status Tim
                </Typography>
                <Chip
                  label={status.data.anggota?.all_accepted ? "Lengkap" : "Menunggu Persetujuan"}
                  color={status.data.anggota?.all_accepted ? "success" : "warning"}
                  size="small"
                />
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
    </BodyLayout>
  );
}